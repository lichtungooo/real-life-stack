// Die Aufnahme der Mitschrift im Browser (Spec video, "Mitschrift").
//
// Hoert NUR das eigene Mikrofon. Der Waechter (@kreis/core) trennt Sprache
// von Stille; jeder Abschnitt geht als 16-kHz-Ton an den Mitschrift-Dienst
// (kreis-server/mitschrift), der Text kommt zurueck. Ton bleibt nirgends
// liegen, weder hier noch dort.
//
// Die Umrechnung auf 16 kHz stammt aus Antons Redekreis
// (github.com/antontranelis/talking-circle, public/pcm-worklet.js, MIT).

import { waechterNeu, waechterSchritt, type WaechterZustand } from "@kreis/core"

const RATE = 16000
const BLOCK = 2048 // 128 ms bei 16 kHz
const BLOCK_MS = (BLOCK / RATE) * 1000
const VORLAUF_BLOECKE = 3 // ~0,4 s vor dem Beginn, damit kein Satzanfang fehlt

// Der Worklet-Code als Text: so braucht er keine eigene Datei im Bau.
const WORKLET = `
const ZIEL_RATE = ${RATE};
const BLOCK = ${BLOCK};
class Umrechner {
  constructor(quellRate) { this.schritt = quellRate / ZIEL_RATE; this.pos = 1; this.letzter = 0; this.puffer = new Float32Array(BLOCK); this.fuell = 0; }
  fuettern(kanal, aus) {
    const wert = (i) => (i === 0 ? this.letzter : kanal[i - 1]);
    while (this.pos < kanal.length) {
      const i = Math.floor(this.pos); const t = this.pos - i; const a = wert(i);
      this.puffer[this.fuell++] = a + (wert(i + 1) - a) * t;
      this.pos += this.schritt;
      if (this.fuell === BLOCK) {
        let summe = 0; for (let k = 0; k < BLOCK; k++) summe += this.puffer[k] * this.puffer[k];
        aus(this.puffer.slice(), Math.sqrt(summe / BLOCK)); this.fuell = 0;
      }
    }
    this.pos -= kanal.length; this.letzter = kanal[kanal.length - 1];
  }
}
class KreisPcm extends AudioWorkletProcessor {
  constructor() { super(); this.umrechner = new Umrechner(sampleRate); }
  process(inputs) {
    const kanal = inputs[0] && inputs[0][0];
    if (kanal) this.umrechner.fuettern(kanal, (pcm, pegel) => this.port.postMessage({ pcm, pegel }, [pcm.buffer]));
    return true;
  }
}
registerProcessor("kreis-pcm", KreisPcm);
`

export interface MitschriftHoerer {
  /** Ein Abschnitt ist zu Ende und unterwegs; der Text folgt mit derselben Id. */
  abschnitt(id: string, beginn: number, ende: number): void
  /** Der Text eines Abschnitts. Leer, wenn nichts erkannt wurde. */
  text(id: string, text: string): void
  /** Der Dienst ist bereit (`true`) oder weg (`false`). */
  verbunden(an: boolean): void
  fehler(text: string): void
}

export interface MitschriftOptionen {
  url: string
  token: string
  sprache?: string
  /** Darf gerade gehoert werden? Ist das Mikrofon in der Konferenz aus, nicht. */
  darfHoeren: () => boolean
  hoerer: MitschriftHoerer
}

/** Float32 in Int16: halb so viel fuer die Leitung, fuer Sprache genau genug. */
export function alsInt16(teile: readonly Float32Array[]): Int16Array {
  const laenge = teile.reduce((s, t) => s + t.length, 0)
  const aus = new Int16Array(laenge)
  let o = 0
  for (const t of teile) for (let i = 0; i < t.length; i++) {
    const w = Math.max(-1, Math.min(1, t[i]))
    aus[o++] = w < 0 ? w * 32768 : w * 32767
  }
  return aus
}

/**
 * Nimmt Bloecke (16 kHz, je 128 ms) mit ihrem Pegel und schneidet daraus
 * Abschnitte. Ohne Browser testbar: `block` von aussen fuettern.
 */
export class AbschnittSchneider {
  private zustand: WaechterZustand = waechterNeu()
  private vorlauf: Float32Array[] = []
  private laufend: Float32Array[] = []
  private nr = 0

  constructor(private readonly fertig: (id: string, beginn: number, ende: number, ton: Int16Array) => void, private readonly praefix = "a") {}

  block(pcm: Float32Array, pegel: number, jetzt: number): void {
    const { zustand, ereignis } = waechterSchritt(this.zustand, pegel, BLOCK_MS, jetzt)
    this.zustand = zustand
    if (zustand.seit === null && !ereignis) {
      this.vorlauf.push(pcm)
      if (this.vorlauf.length > VORLAUF_BLOECKE + 2) this.vorlauf.shift()
      return
    }
    if (ereignis?.art === "beginn") {
      // Was schon laut war, bevor der Waechter sicher war, gehoert dazu.
      this.laufend = [...this.vorlauf, pcm]
      this.vorlauf = []
      return
    }
    if (ereignis?.art === "ende") {
      const ton = this.laufend
      this.laufend = ereignis.weiter ? [pcm] : []
      if (!ereignis.weiter) this.vorlauf = [pcm]
      if (ereignis.behalten) this.fertig(`${this.praefix}-${++this.nr}`, ereignis.beginn, ereignis.ende, alsInt16(ton))
      return
    }
    this.laufend.push(pcm)
  }

  /** Abbrechen, etwa wenn das Mikrofon ausgeht: Der laufende Abschnitt geht noch hinaus. */
  abschliessen(jetzt: number): void {
    if (this.zustand.seit !== null && this.laufend.length) {
      const beginn = this.zustand.seit
      if (jetzt - beginn >= 500) this.fertig(`${this.praefix}-${++this.nr}`, beginn, jetzt, alsInt16(this.laufend))
    }
    this.zustand = waechterNeu()
    this.laufend = []
    this.vorlauf = []
  }
}

/** Die Aufnahme: Mikrofon, Worklet, Schneider, Verbindung zum Dienst. */
export class MitschriftAufnahme {
  private kontext: AudioContext | null = null
  private strom: MediaStream | null = null
  private ws: WebSocket | null = null
  private bereit = false
  private gestoppt = false
  private versuche = 0
  private warteschlange: { id: string; ton: Int16Array }[] = []
  private schneider: AbschnittSchneider

  constructor(private readonly o: MitschriftOptionen) {
    this.schneider = new AbschnittSchneider((id, beginn, ende, ton) => {
      this.o.hoerer.abschnitt(id, beginn, ende)
      this.schicken(id, ton)
    }, `m${Date.now().toString(36)}`)
  }

  async starten(): Promise<void> {
    this.gestoppt = false
    // Echo- und Rauschunterdrueckung: Was aus den Lautsprechern kommt, ist
    // nicht meine Stimme und soll nicht unter meinem Namen stehen.
    this.strom = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
    })
    const kontext = new AudioContext()
    this.kontext = kontext
    const url = URL.createObjectURL(new Blob([WORKLET], { type: "text/javascript" }))
    try { await kontext.audioWorklet.addModule(url) } finally { URL.revokeObjectURL(url) }
    const quelle = kontext.createMediaStreamSource(this.strom)
    const knoten = new AudioWorkletNode(kontext, "kreis-pcm")
    let hoerteGerade = false
    knoten.port.onmessage = (e: MessageEvent<{ pcm: Float32Array; pegel: number }>) => {
      const jetzt = Date.now()
      if (!this.o.darfHoeren()) {
        if (hoerteGerade) this.schneider.abschliessen(jetzt)
        hoerteGerade = false
        return
      }
      hoerteGerade = true
      this.schneider.block(e.data.pcm, e.data.pegel, jetzt)
    }
    quelle.connect(knoten)
    // Ohne Ziel laeuft der Graph in manchen Browsern nicht; stumm geschaltet.
    const stumm = kontext.createGain()
    stumm.gain.value = 0
    knoten.connect(stumm).connect(kontext.destination)
    this.verbinden()
  }

  stoppen(): void {
    this.gestoppt = true
    this.schneider.abschliessen(Date.now())
    this.strom?.getTracks().forEach((t) => t.stop())
    this.strom = null
    void this.kontext?.close().catch(() => {})
    this.kontext = null
    // Wartende Abschnitte duerfen noch zu Ende erkannt werden; dann zu.
    const ws = this.ws
    this.ws = null
    if (ws) setTimeout(() => ws.close(), 15_000)
  }

  private verbinden(): void {
    if (this.gestoppt) return
    const ws = new WebSocket(this.o.url)
    ws.binaryType = "arraybuffer"
    this.ws = ws
    ws.onopen = () => ws.send(JSON.stringify({ typ: "hallo", token: this.o.token, sprache: this.o.sprache ?? "de-DE" }))
    ws.onmessage = (e) => {
      if (typeof e.data !== "string") return
      let n: { typ?: string; id?: string; text?: string; verworfen?: boolean; grund?: string }
      try { n = JSON.parse(e.data) } catch { return }
      if (n.typ === "bereit") {
        this.bereit = true
        this.versuche = 0
        this.o.hoerer.verbunden(true)
        for (const w of this.warteschlange.splice(0)) this.schicken(w.id, w.ton)
      } else if (n.typ === "text" && typeof n.id === "string") {
        this.o.hoerer.text(n.id, typeof n.text === "string" ? n.text : "")
        if (n.verworfen && n.grund === "voll") this.o.hoerer.fehler("Die Mitschrift kommt gerade nicht nach; ein Satz fehlt.")
      } else if (n.typ === "fehler" && typeof n.text === "string") {
        this.o.hoerer.fehler(n.text)
      }
    }
    ws.onclose = (e) => {
      if (this.ws !== ws) return
      this.bereit = false
      this.o.hoerer.verbunden(false)
      if (this.gestoppt) return
      if (e.code === 4403) { this.gestoppt = true; return }
      // Wieder verbinden, mit wachsender Pause, hoechstens acht Mal.
      if (++this.versuche > 8) { this.o.hoerer.fehler("Die Mitschrift ist nicht erreichbar."); return }
      setTimeout(() => this.verbinden(), Math.min(15_000, 500 * 2 ** this.versuche))
    }
  }

  private schicken(id: string, ton: Int16Array): void {
    const ws = this.ws
    if (!ws || !this.bereit || ws.readyState !== WebSocket.OPEN) {
      // Kurz halten, bis der Dienst wieder da ist; nicht ewig.
      this.warteschlange.push({ id, ton })
      if (this.warteschlange.length > 6) {
        const weg = this.warteschlange.shift()
        if (weg) this.o.hoerer.text(weg.id, "")
      }
      return
    }
    ws.send(JSON.stringify({ typ: "abschnitt", id }))
    ws.send(ton.buffer)
  }
}

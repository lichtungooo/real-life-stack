// Die Aufnahme der Mitschrift im Browser (Spec video, "Mitschrift").
//
// Hoert NUR das eigene Mikrofon. Der Waechter (@kreis/core) trennt Sprache
// von Stille. Spricht mein Mensch, geht der Ton laufend als 16-kHz-Bloecke an
// den Mitschrift-Dienst (kreis-server/mitschrift), und der Text kommt zurueck,
// waehrend gesprochen wird, wie in Antons Redekreis. Ton bleibt nirgends liegen.
//
// Die Umrechnung auf 16 kHz stammt aus Antons Redekreis
// (github.com/antontranelis/talking-circle, public/pcm-worklet.js, MIT).

import { waechterNeu, waechterSchritt, type WaechterZustand } from "@kreis/core"

const RATE = 16000
const BLOCK = 2048 // 128 ms bei 16 kHz
const BLOCK_MS = (BLOCK / RATE) * 1000
const VORLAUF_BLOECKE = 4 // ~0,5 s vor dem Beginn, damit kein Satzanfang fehlt

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
  /** Mein Mensch beginnt zu sprechen. */
  beginn(id: string, wann: number): void
  /** Der Text waechst: `text` steht fest, `vorlaeufig` kann sich noch aendern. */
  live(id: string, text: string, vorlaeufig: string): void
  /** Der Abschnitt ist erkannt. Leer, wenn nichts erkannt wurde; `behalten` falsch bei Huesteln und Klopfen. */
  fertig(id: string, text: string, beginn: number, ende: number, behalten: boolean): void
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

export interface SchneiderHoerer {
  /** Ein Abschnitt beginnt; `vorlauf` ist der Ton kurz davor samt dem ersten lauten Block. */
  beginn(id: string, wann: number, vorlauf: readonly Float32Array[]): void
  /** Ein weiterer Block des laufenden Abschnitts. */
  block(id: string, pcm: Float32Array): void
  /** Der Abschnitt endet. `behalten` falsch, wenn er zu kurz war. */
  ende(id: string, beginn: number, ende: number, behalten: boolean): void
}

/**
 * Nimmt Bloecke (16 kHz, je 128 ms) mit ihrem Pegel und meldet Abschnitte:
 * Beginn, jeden Block, Ende. Ohne Browser testbar.
 */
export class AbschnittSchneider {
  private zustand: WaechterZustand = waechterNeu()
  private vorlauf: Float32Array[] = []
  private offen: string | null = null
  private nr = 0

  constructor(private readonly h: SchneiderHoerer, private readonly praefix = "a") {}

  block(pcm: Float32Array, pegel: number, jetzt: number): void {
    const { zustand, ereignis } = waechterSchritt(this.zustand, pegel, BLOCK_MS, jetzt)
    this.zustand = zustand
    if (ereignis?.art === "beginn") {
      // Was schon laut war, bevor der Waechter sicher war, gehoert dazu.
      this.offen = `${this.praefix}-${++this.nr}`
      this.h.beginn(this.offen, ereignis.wann, [...this.vorlauf, pcm])
      this.vorlauf = []
      return
    }
    if (ereignis?.art === "ende" && this.offen) {
      // Die Stille am Ende geht noch mit; sie hilft dem Strom beim Abschliessen.
      this.h.block(this.offen, pcm)
      this.h.ende(this.offen, ereignis.beginn, ereignis.ende, ereignis.behalten)
      this.offen = null
      if (ereignis.weiter) {
        this.offen = `${this.praefix}-${++this.nr}`
        this.h.beginn(this.offen, ereignis.ende, [])
      }
      return
    }
    if (this.offen) { this.h.block(this.offen, pcm); return }
    this.vorlauf.push(pcm)
    if (this.vorlauf.length > VORLAUF_BLOECKE) this.vorlauf.shift()
  }

  /** Abbrechen, etwa wenn das Mikrofon ausgeht: Der laufende Abschnitt endet hier. */
  abschliessen(jetzt: number): void {
    if (this.offen && this.zustand.seit !== null) {
      const beginn = this.zustand.seit
      this.h.ende(this.offen, beginn, jetzt, jetzt - beginn >= 500)
    }
    this.offen = null
    this.zustand = waechterNeu()
    this.vorlauf = []
  }
}

type Post = string | ArrayBuffer

/** Die Aufnahme: Mikrofon, Worklet, Schneider, Verbindung zum Dienst. */
export class MitschriftAufnahme {
  private kontext: AudioContext | null = null
  private strom: MediaStream | null = null
  private ws: WebSocket | null = null
  private bereit = false
  private gestoppt = false
  private versuche = 0
  // Was hinaus soll, solange der Dienst (noch) nicht bereit ist; knapp eine Minute.
  private ausgang: Post[] = []
  private zeiten = new Map<string, { beginn: number; ende: number; behalten: boolean }>()
  private schneider: AbschnittSchneider

  constructor(private readonly o: MitschriftOptionen) {
    this.schneider = new AbschnittSchneider({
      beginn: (id, wann, vorlauf) => {
        this.o.hoerer.beginn(id, wann)
        this.post(JSON.stringify({ typ: "beginn", id }))
        for (const b of vorlauf) this.post(alsInt16([b]).buffer as ArrayBuffer)
      },
      block: (_id, pcm) => this.post(alsInt16([pcm]).buffer as ArrayBuffer),
      ende: (id, beginn, ende, behalten) => {
        this.zeiten.set(id, { beginn, ende, behalten })
        this.post(JSON.stringify({ typ: "ende", id }))
      },
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
    // Der letzte Abschnitt darf noch zu Ende erkannt werden; dann zu.
    const ws = this.ws
    if (ws) setTimeout(() => { if (this.ws === ws) this.ws = null; ws.close() }, 20_000)
  }

  private verbinden(): void {
    if (this.gestoppt) return
    const ws = new WebSocket(this.o.url)
    ws.binaryType = "arraybuffer"
    this.ws = ws
    ws.onopen = () => ws.send(JSON.stringify({ typ: "hallo", token: this.o.token, sprache: this.o.sprache ?? "de-DE" }))
    ws.onmessage = (e) => {
      if (typeof e.data !== "string") return
      let n: { typ?: string; id?: string; text?: string; vorlaeufig?: string; verworfen?: boolean; grund?: string }
      try { n = JSON.parse(e.data) } catch { return }
      if (n.typ === "bereit") {
        this.bereit = true
        this.versuche = 0
        this.o.hoerer.verbunden(true)
        for (const p of this.ausgang.splice(0)) ws.send(p)
      } else if (n.typ === "live" && typeof n.id === "string") {
        this.o.hoerer.live(n.id, n.text ?? "", n.vorlaeufig ?? "")
      } else if (n.typ === "text" && typeof n.id === "string") {
        const z = this.zeiten.get(n.id)
        this.zeiten.delete(n.id)
        if (z) this.o.hoerer.fertig(n.id, n.verworfen ? "" : n.text ?? "", z.beginn, z.ende, z.behalten)
        if (n.verworfen && n.grund === "voll") this.o.hoerer.fehler("Die Mitschrift kam nicht nach; ein Stück fehlt.")
      } else if (n.typ === "fehler" && typeof n.text === "string") {
        this.o.hoerer.fehler(n.text)
      }
    }
    ws.onclose = (e) => {
      if (this.ws !== ws) return
      this.bereit = false
      this.o.hoerer.verbunden(false)
      // Was unterwegs war, kommt nicht mehr: offene Zeilen schliessen.
      for (const [id, z] of this.zeiten) this.o.hoerer.fertig(id, "", z.beginn, z.ende, false)
      this.zeiten.clear()
      if (this.gestoppt) return
      if (e.code === 4403) { this.gestoppt = true; return }
      // Wieder verbinden, mit wachsender Pause, hoechstens acht Mal.
      if (++this.versuche > 8) { this.o.hoerer.fehler("Die Mitschrift ist nicht erreichbar."); return }
      setTimeout(() => this.verbinden(), Math.min(15_000, 500 * 2 ** this.versuche))
    }
  }

  private post(p: Post): void {
    const ws = this.ws
    if (ws && this.bereit && ws.readyState === WebSocket.OPEN) { ws.send(p); return }
    this.ausgang.push(p)
    if (this.ausgang.length > 450) this.ausgang.splice(0, this.ausgang.length - 450)
  }
}

// Was neben dem Sitzungszustand durch den Raum reist: Chat, Hand, Zeichen,
// Protokoll. Fluechtig, es endet mit der Sitzung.
//
// Es lebt im Provider, nicht in einer Flaeche: Wer im Kreis-Reiter sitzt,
// waehrend jemand im Video schreibt, findet die Zeile beim Wechsel vor.

import { useCallback, useEffect, useRef, useState } from "react"
import {
  LEERE_NOTIZ, eingangNeu, elementeEinmischen, inPakete, inStuecke, nachBase64, stueckDazu, istNotiz, istZeichenElement, istStimme, istStrich, istUmfrage, notizGilt, notizSchreiben,
  standEinmischen, stimmeDazu, strichDazu, umfrageEinmischen, umfrageNeu, umfrageSchliessen,
  type GeteilteNotiz, type Strich, type Umfrage, type ZeichenElement, type Eingang,
} from "@kreis/core"
import type { KreisVerbindung, NebenNachricht } from "./use-kreis"

export interface ChatZeile { id: string; wer: string; name: string; text: string; wann: number }
export interface ProtokollZeile extends ChatZeile { vorlaeufig: boolean }

/** Die Zeichen, die jemand in den Raum geben kann. */
export const ZEICHEN = {
  daumen: "👍",
  klatschen: "👏",
  herz: "💛",
  lachen: "😄",
  langsamer: "🐢",
} as const
export type ZeichenArt = keyof typeof ZEICHEN

/** So lange steht ein Zeichen ueber der Kachel. */
export const ZEICHEN_DAUER = 4000

// Die Web Speech API steht in keiner Standard-Typdefinition.
interface Erkennung {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0?: { transcript?: string } }> }) => void) | null
  onerror: ((e: { error?: string }) => void) | null
  onend: (() => void) | null
}

function erkennungBauen(): Erkennung | null {
  if (typeof window === "undefined") return null
  const w = window as unknown as { SpeechRecognition?: new () => Erkennung; webkitSpeechRecognition?: new () => Erkennung }
  const Bauplan = w.SpeechRecognition ?? w.webkitSpeechRecognition
  return Bauplan ? new Bauplan() : null
}

export function spracherkennungVorhanden(): boolean {
  if (typeof window === "undefined") return false
  const w = window as unknown as Record<string, unknown>
  return Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition)
}

export function useNebenHalten(v: KreisVerbindung, kennung: string | null = null) {
  const [chat, setChat] = useState<ChatZeile[]>([])
  const [haende, setHaende] = useState<ReadonlySet<string>>(new Set())
  const [zeichen, setZeichen] = useState<ReadonlyMap<string, { art: ZeichenArt; wann: number }>>(new Map())
  const [protokoll, setProtokoll] = useState<ProtokollZeile[]>([])
  const [protokollLaeuft, setProtokollLaeuft] = useState(false)
  const [protokollFehler, setProtokollFehler] = useState<string | null>(null)
  const [tafel, setTafel] = useState<readonly Strich[]>([])
  const [notiz, setNotiz] = useState<GeteilteNotiz>(LEERE_NOTIZ)
  const notizRef = useRef(notiz)
  notizRef.current = notiz
  const [umfrage, setUmfrage] = useState<Umfrage | null>(null)
  const umfrageRef = useRef(umfrage)
  umfrageRef.current = umfrage
  const tafelRef = useRef(tafel)
  tafelRef.current = tafel
  // Das Zeichenpad (Excalidraw): alle Elemente, auch geloeschte, bei allen.
  // Einigung wie bei Excalidraw selbst, siehe @kreis/core/zeichnung.
  // Je Folie eine eigene Zeichnung; die freie Flaeche heisst "frei".
  const [pad, setPad] = useState<Readonly<Record<string, readonly ZeichenElement[]>>>({})
  const padRef = useRef(pad)
  padRef.current = pad
  // Dateien im Raum (Folien als PDF), nur fuer diese Sitzung.
  const [dateien, setDateien] = useState<ReadonlyMap<string, { name: string; bytes: Uint8Array }>>(new Map())
  const dateienRef = useRef(dateien)
  dateienRef.current = dateien
  const eingaenge = useRef(new Map<string, Eingang>())
  // Wer ist wer: Teilnehmer im Raum -> Kennung in der App (DID). Jeder
  // stellt sich beim Betreten vor, und wer neu kommt, fragt nach.
  const [kennungen, setKennungen] = useState<ReadonlyMap<string, string>>(new Map())
  const kennungRef = useRef(kennung)
  kennungRef.current = kennung
  const erkennungRef = useRef<Erkennung | null>(null)
  const sollLaufenRef = useRef(false)

  const meinName = v.teilnehmer.find((t) => t.ichSelbst)?.name ?? "Gast"

  const protokollZeile = useCallback((z: ProtokollZeile) => {
    setProtokoll((vorher) => {
      // Von jeder Person gibt es hoechstens eine vorlaeufige Zeile.
      const ohne = vorher.filter((alt) => !(alt.wer === z.wer && alt.vorlaeufig))
      return z.text.trim() ? [...ohne, z].slice(-500) : ohne
    })
  }, [])

  const zeichenSetzen = useCallback((wer: string, art: ZeichenArt) => {
    const wann = Date.now()
    setZeichen((vorher) => new Map(vorher).set(wer, { art, wann }))
    setTimeout(() => {
      setZeichen((vorher) => {
        if (vorher.get(wer)?.wann !== wann) return vorher
        const neu = new Map(vorher)
        neu.delete(wer)
        return neu
      })
    }, ZEICHEN_DAUER)
  }, [])

  // Was von den anderen kommt.
  // Der Empfaenger meldet sich EINMAL an und liest die Verarbeitung aus
  // einem Ref. Frueher meldete er sich bei jedem Neuzeichnen ab und wieder an;
  // eine Antwort, die genau dazwischen kam (etwa eine Datei fuer einen
  // Nachzuegler), ging verloren.
  const verarbeiten = useRef<(n: NebenNachricht, von: string) => void>(() => {})
  useEffect(() => v.beiNeben((n, von) => verarbeiten.current(n, von)), [v.beiNeben])
  verarbeiten.current = (n, von) => {
    if (n.art === "vorstellen" && typeof n.kennung === "string" && von) {
      const k = n.kennung
      setKennungen((alt) => (alt.get(von) === k ? alt : new Map(alt).set(von, k)))
    } else if (n.art === "vorstellen-frage") {
      if (kennungRef.current) v.nebenSenden({ art: "vorstellen", kennung: kennungRef.current })
    } else if (n.art === "chat" && typeof n.text === "string") {
      setChat((c) => [...c, n as unknown as ChatZeile].slice(-300))
    } else if (n.art === "hand" && typeof n.wer === "string") {
      const wer = n.wer
      setHaende((h) => { const neu = new Set(h); if (n.oben) neu.add(wer); else neu.delete(wer); return neu })
    } else if (n.art === "zeichen" && typeof n.wer === "string" && typeof n.zeichen === "string" && n.zeichen in ZEICHEN) {
      zeichenSetzen(n.wer, n.zeichen as ZeichenArt)
    } else if (n.art === "transkript" && n.zeile && typeof n.zeile === "object") {
      protokollZeile(n.zeile as ProtokollZeile)
    } else if (n.art === "pad-elemente" && Array.isArray(n.elemente)) {
      const fremde = (n.elemente as unknown[]).filter(istZeichenElement)
      const schluessel = typeof n.schluessel === "string" ? n.schluessel : "frei"
      setPad((alt) => {
        const bisher = alt[schluessel] ?? []
        const neu = elementeEinmischen(bisher, fremde)
        return neu === bisher ? alt : { ...alt, [schluessel]: neu }
      })
    } else if (n.art === "pad-frage") {
      // Nur wer etwas hat, antwortet; in Paketen, damit nichts zu gross wird.
      for (const [schluessel, liste] of Object.entries(padRef.current)) {
        for (const paket of inPakete(liste)) v.nebenSenden({ art: "pad-elemente", schluessel, elemente: paket })
      }
    } else if (n.art === "datei-kopf" && typeof n.id === "string" && typeof n.name === "string" && typeof n.teile === "number") {
      if (!dateienRef.current.has(n.id) && !eingaenge.current.has(n.id)) eingaenge.current.set(n.id, eingangNeu(n.name, n.teile))
    } else if (n.art === "datei-teil" && typeof n.id === "string" && typeof n.nr === "number" && typeof n.d === "string") {
      const e = eingaenge.current.get(n.id)
      if (!e) return
      const fertig = stueckDazu(e, n.nr, n.d)
      if (fertig) {
        eingaenge.current.delete(n.id)
        const id = n.id
        setDateien((alt) => new Map(alt).set(id, { name: e.name, bytes: fertig }))
      }
    } else if (n.art === "datei-frage" && typeof n.id === "string") {
      const d = dateienRef.current.get(n.id)
      if (d) void dateiSenden(n.id, d.name, d.bytes)
    } else if (n.art === "tafel-strich" && istStrich(n.strich)) {
      const strich = n.strich
      setTafel((t) => strichDazu(t, strich))
    } else if (n.art === "tafel-leeren") {
      setTafel([])
    } else if (n.art === "tafel-frage") {
      // Nur wer etwas an der Tafel hat, antwortet.
      if (tafelRef.current.length > 0) v.nebenSenden({ art: "tafel-stand", striche: [...tafelRef.current] })
    } else if (n.art === "notiz" && istNotiz(n.notiz)) {
      const fremd = n.notiz
      setNotiz((eigen) => notizGilt(eigen, fremd))
    } else if (n.art === "umfrage" && istUmfrage(n.umfrage)) {
      const fremd = n.umfrage
      setUmfrage((eigen) => umfrageEinmischen(eigen, fremd))
    } else if (n.art === "stimme" && istStimme(n.stimme)) {
      const st = n.stimme
      setUmfrage((u) => (u ? stimmeDazu(u, st) : u))
    } else if (n.art === "werkzeug-frage") {
      // Wer spaeter kommt, bekommt Notiz und Umfrage, wenn es sie gibt.
      if (notizRef.current.v > 0) v.nebenSenden({ art: "notiz", notiz: notizRef.current })
      if (umfrageRef.current) v.nebenSenden({ art: "umfrage", umfrage: umfrageRef.current })
    } else if (n.art === "tafel-stand" && Array.isArray(n.striche)) {
      const stand = (n.striche as unknown[]).filter(istStrich)
      setTafel((t) => standEinmischen(t, stand))
    }
  }

  // Wer hereinkommt, fragt nach dem Stand der Tafel.
  useEffect(() => {
    if (v.zustand === "drin") {
      v.nebenSenden({ art: "tafel-frage" })
      v.nebenSenden({ art: "pad-frage" })
      eingaenge.current.clear()
      v.nebenSenden({ art: "werkzeug-frage" })
      if (kennungRef.current) v.nebenSenden({ art: "vorstellen", kennung: kennungRef.current })
      v.nebenSenden({ art: "vorstellen-frage" })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.zustand])

  // Wer geht, laesst Hand und Zeichen stehen? Nein: die Liste folgt den Anwesenden.
  const anwesend = v.teilnehmer.map((t) => t.id).join(",")
  useEffect(() => {
    const da = new Set(anwesend.split(","))
    setHaende((h) => { const neu = new Set([...h].filter((id) => da.has(id))); return neu.size === h.size ? h : neu })
    setKennungen((k) => { const neu = new Map([...k].filter(([id]) => da.has(id))); return neu.size === k.size ? k : neu })
  }, [anwesend])

  // Die Sitzung endet: alles Fluechtige mit ihr.
  useEffect(() => {
    if (v.zustand !== "draussen") return
    setKennungen(new Map())
    setChat([]); setHaende(new Set()); setZeichen(new Map()); setProtokoll([]); setTafel([]); setNotiz(LEERE_NOTIZ); setUmfrage(null); setPad({}); setDateien(new Map())
    sollLaufenRef.current = false
    erkennungRef.current?.abort()
    erkennungRef.current = null
    setProtokollLaeuft(false)
  }, [v.zustand])

  const chatSenden = useCallback((text: string) => {
    if (!v.ich || !text.trim()) return
    const zeile: ChatZeile = { id: `${v.ich}-${Date.now()}`, wer: v.ich, name: meinName, text: text.trim(), wann: Date.now() }
    setChat((c) => [...c, zeile].slice(-300))
    v.nebenSenden({ art: "chat", ...zeile } as unknown as NebenNachricht)
  }, [v, meinName])

  const handUmschalten = useCallback(() => {
    if (!v.ich) return
    const wer = v.ich
    const oben = !haende.has(wer)
    setHaende((h) => { const neu = new Set(h); if (oben) neu.add(wer); else neu.delete(wer); return neu })
    v.nebenSenden({ art: "hand", wer, oben })
  }, [v, haende])

  const zeichenGeben = useCallback((art: ZeichenArt) => {
    if (!v.ich) return
    zeichenSetzen(v.ich, art)
    v.nebenSenden({ art: "zeichen", wer: v.ich, zeichen: art })
  }, [v, zeichenSetzen])

  /**
   * Das Protokoll starten. Der Kniff: jeder schreibt sein EIGENES Mikrofon
   * mit und schickt die Zeilen in den Raum, darum stimmt die Zuordnung von
   * selbst. ⚠ Chrome schickt das Audio dafuer an Google; die Flaeche sagt das.
   */
  const protokollStarten = useCallback((sprache = "de-DE") => {
    if (!v.ich) return
    const erkennung = erkennungBauen()
    if (!erkennung) { setProtokollFehler("Dieser Browser kennt keine Spracherkennung. Chrome oder Edge tragen sie."); return }
    const ich = v.ich
    erkennung.lang = sprache
    erkennung.continuous = true
    erkennung.interimResults = true
    erkennung.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const ergebnis = e.results[i]
        const text = String(ergebnis[0]?.transcript ?? "").trim()
        if (!text) continue
        const zeile: ProtokollZeile = { id: `${ich}-${Date.now()}-${i}`, wer: ich, name: meinName, text, wann: Date.now(), vorlaeufig: !ergebnis.isFinal }
        protokollZeile(zeile)
        v.nebenSenden({ art: "transkript", zeile })
      }
    }
    erkennung.onerror = (e) => {
      const art = String(e?.error ?? "unbekannt")
      // "no-speech" und "aborted" sind Alltag, keine Stoerung.
      if (art === "no-speech" || art === "aborted") return
      if (art === "not-allowed" || art === "service-not-allowed") {
        setProtokollFehler("Das Mikrofon ist für die Spracherkennung gesperrt.")
        sollLaufenRef.current = false
        setProtokollLaeuft(false)
        return
      }
      setProtokollFehler(`Die Spracherkennung meldet: ${art}`)
    }
    // Chrome beendet die Erkennung nach einer Weile Stille von selbst.
    erkennung.onend = () => {
      if (!sollLaufenRef.current) { setProtokollLaeuft(false); return }
      try { erkennung.start() } catch { sollLaufenRef.current = false; setProtokollLaeuft(false) }
    }
    try {
      erkennung.start()
      erkennungRef.current = erkennung
      sollLaufenRef.current = true
      setProtokollLaeuft(true)
      setProtokollFehler(null)
    } catch (e) {
      setProtokollFehler(e instanceof Error ? e.message : "Die Spracherkennung startete nicht.")
    }
  }, [v, meinName, protokollZeile])

  const protokollHalten = useCallback(() => {
    sollLaufenRef.current = false
    erkennungRef.current?.stop()
    erkennungRef.current = null
    setProtokollLaeuft(false)
  }, [])

  const protokollAlsText = useCallback(() => protokoll
    .filter((z) => !z.vorlaeufig)
    .map((z) => `${new Date(z.wann).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} ${z.name}: ${z.text}`)
    .join("\n"), [protokoll])

  /** Eigene Aenderungen am Pad (einer Folie): einmischen und in Paketen an alle. */
  const padSenden = useCallback((schluessel: string, elemente: readonly ZeichenElement[]) => {
    if (elemente.length === 0) return
    setPad((alt) => ({ ...alt, [schluessel]: elementeEinmischen(alt[schluessel] ?? [], elemente) }))
    for (const paket of inPakete(elemente)) v.nebenSenden({ art: "pad-elemente", schluessel, elemente: paket })
  }, [v])

  /** Eine Datei an alle im Raum, in Stuecken. Zwischendurch Luft holen, damit Bild und Ton weiterlaufen. */
  const dateiSenden = useCallback(async (id: string, name: string, bytes: Uint8Array) => {
    const stuecke = inStuecke(nachBase64(bytes))
    v.nebenSenden({ art: "datei-kopf", id, name, teile: stuecke.length })
    for (let nr = 0; nr < stuecke.length; nr++) {
      v.nebenSenden({ art: "datei-teil", id, nr, d: stuecke[nr] })
      if (nr % 25 === 24) await new Promise((r) => setTimeout(r, 30))
    }
  }, [v])

  /** Eine eigene Datei in den Raum geben. */
  const dateiTeilen = useCallback((id: string, name: string, bytes: Uint8Array) => {
    setDateien((alt) => new Map(alt).set(id, { name, bytes }))
    void dateiSenden(id, name, bytes)
  }, [dateiSenden])

  /** Eine Datei erbitten, die hier fehlt (Nachzuegler). */
  const dateiAnfragen = useCallback((id: string) => {
    if (dateienRef.current.has(id)) return
    v.nebenSenden({ art: "datei-frage", id })
  }, [v])

  const tafelStrich = useCallback((strich: Strich) => {
    setTafel((t) => strichDazu(t, strich))
    v.nebenSenden({ art: "tafel-strich", strich })
  }, [v])
  const tafelLeeren = useCallback(() => {
    setTafel([])
    v.nebenSenden({ art: "tafel-leeren" })
  }, [v])

  const notizSetzen = useCallback((text: string) => {
    if (!v.ich) return
    const neu = notizSchreiben(notizRef.current, text, v.ich, meinName, Date.now())
    if (neu === notizRef.current) return
    notizRef.current = neu
    setNotiz(neu)
    v.nebenSenden({ art: "notiz", notiz: neu })
  }, [v, meinName])

  /** Eine Umfrage starten. Gibt false zurueck, wenn Frage oder Antworten fehlen. */
  const umfrageStarten = useCallback((frage: string, antworten: readonly string[]) => {
    if (!v.ich) return false
    const u = umfrageNeu(`${v.ich}-${Date.now()}`, frage, antworten, v.ich)
    if (!u) return false
    setUmfrage(u)
    v.nebenSenden({ art: "umfrage", umfrage: u })
    return true
  }, [v])

  const abstimmen = useCallback((wahl: number) => {
    const u = umfrageRef.current
    if (!u || !v.ich) return
    const stimme = { umfrage: u.id, wer: v.ich, wahl, wann: Date.now() }
    setUmfrage((alt) => (alt ? stimmeDazu(alt, stimme) : alt))
    v.nebenSenden({ art: "stimme", stimme })
  }, [v])

  const umfrageBeenden = useCallback(() => {
    const u = umfrageRef.current
    if (!u) return
    const zu = umfrageSchliessen(u)
    setUmfrage(zu)
    v.nebenSenden({ art: "umfrage", umfrage: zu })
  }, [v])

  const umfrageVerwerfen = useCallback(() => setUmfrage(null), [])

  /** Die Kennung eines Teilnehmers in der App, meine eingeschlossen. */
  const kennungVon = useCallback((teilnehmerId: string): string | undefined =>
    (teilnehmerId === v.ich && kennungRef.current) ? kennungRef.current : kennungen.get(teilnehmerId), [kennungen, v.ich])

  return {
    kennungVon,
    notiz, notizSetzen,
    umfrage, umfrageStarten, abstimmen, umfrageBeenden, umfrageVerwerfen,
    tafel, tafelStrich, tafelLeeren,
    pad, padSenden,
    dateien, dateiTeilen, dateiAnfragen,
    chat, chatSenden,
    haende, handUmschalten,
    zeichen, zeichenGeben,
    protokoll, protokollLaeuft, protokollFehler, protokollStarten, protokollHalten, protokollAlsText,
    protokollLeeren: () => setProtokoll([]),
  }
}

export type Neben = ReturnType<typeof useNebenHalten>

// Was neben dem Sitzungszustand durch den Raum reist: Chat, Hand, Zeichen,
// Protokoll. Fluechtig, es endet mit der Sitzung.
//
// Es lebt im Provider, nicht in einer Flaeche: Wer im Kreis-Reiter sitzt,
// waehrend jemand im Video schreibt, findet die Zeile beim Wechsel vor.

import { useCallback, useEffect, useRef, useState } from "react"
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

export function useNebenHalten(v: KreisVerbindung) {
  const [chat, setChat] = useState<ChatZeile[]>([])
  const [haende, setHaende] = useState<ReadonlySet<string>>(new Set())
  const [zeichen, setZeichen] = useState<ReadonlyMap<string, { art: ZeichenArt; wann: number }>>(new Map())
  const [protokoll, setProtokoll] = useState<ProtokollZeile[]>([])
  const [protokollLaeuft, setProtokollLaeuft] = useState(false)
  const [protokollFehler, setProtokollFehler] = useState<string | null>(null)
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
  useEffect(() => v.beiNeben((n) => {
    if (n.art === "chat" && typeof n.text === "string") {
      setChat((c) => [...c, n as unknown as ChatZeile].slice(-300))
    } else if (n.art === "hand" && typeof n.wer === "string") {
      const wer = n.wer
      setHaende((h) => { const neu = new Set(h); if (n.oben) neu.add(wer); else neu.delete(wer); return neu })
    } else if (n.art === "zeichen" && typeof n.wer === "string" && typeof n.zeichen === "string" && n.zeichen in ZEICHEN) {
      zeichenSetzen(n.wer, n.zeichen as ZeichenArt)
    } else if (n.art === "transkript" && n.zeile && typeof n.zeile === "object") {
      protokollZeile(n.zeile as ProtokollZeile)
    }
  }), [v, zeichenSetzen, protokollZeile])

  // Wer geht, laesst Hand und Zeichen stehen? Nein: die Liste folgt den Anwesenden.
  const anwesend = v.teilnehmer.map((t) => t.id).join(",")
  useEffect(() => {
    const da = new Set(anwesend.split(","))
    setHaende((h) => { const neu = new Set([...h].filter((id) => da.has(id))); return neu.size === h.size ? h : neu })
  }, [anwesend])

  // Die Sitzung endet: alles Fluechtige mit ihr.
  useEffect(() => {
    if (v.zustand !== "draussen") return
    setChat([]); setHaende(new Set()); setZeichen(new Map()); setProtokoll([])
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

  return {
    chat, chatSenden,
    haende, handUmschalten,
    zeichen, zeichenGeben,
    protokoll, protokollLaeuft, protokollFehler, protokollStarten, protokollHalten, protokollAlsText,
    protokollLeeren: () => setProtokoll([]),
  }
}

export type Neben = ReturnType<typeof useNebenHalten>

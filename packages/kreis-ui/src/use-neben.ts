// Was neben dem Sitzungszustand durch den Raum reist: Chat, Hand, Zeichen,
// Protokoll (Mitschrift). Fluechtig, es endet mit der Sitzung.
//
// Es lebt im Provider, nicht in einer Flaeche: Wer im Kreis-Reiter sitzt,
// waehrend jemand im Video schreibt, findet die Zeile beim Wechsel vor.

import { useCallback, useEffect, useRef, useState } from "react"
import {
  LEERE_NOTIZ, eingangNeu, elementeEinmischen, inPakete, inStuecke, nachBase64, stueckDazu, istNotiz, istZeichenElement, istStimme, istStrich, istUmfrage, notizGilt, notizSchreiben,
  protokollMarkdown, standEinmischen, stimmeDazu, strichDazu, umfrageEinmischen, umfrageNeu, umfrageSchliessen,
  type GeteilteNotiz, type Strich, type Umfrage, type ZeichenElement, type Eingang,
} from "@kreis/core"
import type { KreisVerbindung, NebenNachricht } from "./use-kreis"
import { MitschriftAufnahme } from "./mitschrift-aufnahme"
import { useVorlieben } from "./vorlieben"

/** Was im Meeting festgehalten wurde: eine Aufgabe oder ein Beschluss. */
export interface Ergebnis {
  id: string
  art: "aufgabe" | "beschluss"
  text: string
  /** Bei Aufgaben: wer sie uebernimmt, bis wann (Datum als Text). */
  wer?: string
  bis?: string
  /** Name dessen, der es festgehalten hat. */
  von: string
  wann: number
}

function istErgebnis(w: unknown): w is Ergebnis {
  if (!w || typeof w !== "object") return false
  const e = w as Record<string, unknown>
  return typeof e.id === "string" && (e.art === "aufgabe" || e.art === "beschluss") && typeof e.text === "string" && typeof e.von === "string" && typeof e.wann === "number"
}

export interface ChatZeile { id: string; wer: string; name: string; text: string; wann: number }
/** Eine Zeile der Mitschrift. `wann` ist der Beginn, `bis` das Ende des Gesagten. */
export interface ProtokollZeile extends ChatZeile { vorlaeufig: boolean; bis?: number }

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
  // Aufgaben und Beschluesse dieses Meetings, fuer alle.
  const [ergebnisse, setErgebnisse] = useState<readonly Ergebnis[]>([])
  // Warteraum: wen jemand aus der Gruppe hereingeholt hat (Kennungen).
  const [hereingeholt, setHereingeholt] = useState<ReadonlySet<string>>(new Set())
  const ergebnisseRef = useRef(ergebnisse)
  ergebnisseRef.current = ergebnisse
  // Wer ist wer: Teilnehmer im Raum -> Kennung in der App (DID). Jeder
  // stellt sich beim Betreten vor, und wer neu kommt, fragt nach.
  const [kennungen, setKennungen] = useState<ReadonlyMap<string, string>>(new Map())
  const kennungRef = useRef(kennung)
  kennungRef.current = kennung
  const aufnahmeRef = useRef<MitschriftAufnahme | null>(null)
  // Wer gerade mitgeschrieben wird (Raum-Ids), sichtbar fuer alle.
  const [mitschreibende, setMitschreibende] = useState<ReadonlySet<string>>(new Set())
  // In welcher Runde des Hebels ich mich ausgenommen habe (sein `seit`).
  const [ausgenommenSeit, setAusgenommenSeit] = useState<number | null>(null)

  const meinName = v.teilnehmer.find((t) => t.ichSelbst)?.name ?? "Gast"

  const protokollZeile = useCallback((z: ProtokollZeile) => {
    setProtokoll((vorher) => {
      // Eine Zeile kommt zweimal: erst vorlaeufig ("…"), dann mit Text. Leer
      // heisst: nichts erkannt, die Zeile faellt weg. Geordnet nach Beginn.
      const ohne = vorher.filter((alt) => alt.id !== z.id)
      if (!z.text.trim()) return ohne.length === vorher.length ? vorher : ohne
      return [...ohne, z].sort((a, b) => a.wann - b.wann).slice(-800)
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
    } else if (n.art === "mitschrift-an") {
      setMitschreibende((alt) => { const neu = new Set(alt); if (n.an) neu.add(von); else neu.delete(von); return neu })

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
    } else if (n.art === "alle-stumm") {
      // Moderation: alle stumm bis auf den, der praesentiert. Jedes Geraet tut es selbst.
      if (v.ich && n.ausser !== v.ich) void v.raum.mikro(false)
    } else if (n.art === "reaktionen-weg") {
      setHaende(new Set()); setZeichen(new Map())
    } else if (n.art === "hereinholen" && typeof n.kennung === "string") {
      const k = n.kennung
      setHereingeholt((alt) => new Set(alt).add(k))
    } else if (n.art === "ergebnis" && istErgebnis(n.ergebnis)) {
      const e = n.ergebnis
      setErgebnisse((alt) => (alt.some((x) => x.id === e.id) ? alt : [...alt, e]))
    } else if (n.art === "ergebnisse" && Array.isArray(n.liste)) {
      const neu = (n.liste as unknown[]).filter(istErgebnis)
      setErgebnisse((alt) => {
        const da = new Set(alt.map((x) => x.id))
        const dazu = neu.filter((x) => !da.has(x.id))
        return dazu.length ? [...alt, ...dazu].sort((a, b) => a.wann - b.wann) : alt
      })
    } else if (n.art === "werkzeug-frage") {
      if (ergebnisseRef.current.length > 0) v.nebenSenden({ art: "ergebnisse", liste: [...ergebnisseRef.current] })
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
    setMitschreibende((m) => { const neu = new Set([...m].filter((id) => da.has(id))); return neu.size === m.size ? m : neu })
    // Wer neu kommt, erfaehrt, dass ich mitgeschrieben werde.
    if (aufnahmeRef.current) v.nebenSenden({ art: "mitschrift-an", an: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anwesend])

  // Die Sitzung endet: alles Fluechtige mit ihr.
  useEffect(() => {
    if (v.zustand !== "draussen") return
    setKennungen(new Map())
    setChat([]); setHaende(new Set()); setZeichen(new Map()); setProtokoll([]); setTafel([]); setNotiz(LEERE_NOTIZ); setUmfrage(null); setPad({}); setDateien(new Map()); setErgebnisse([]); setHereingeholt(new Set())
    aufnahmeRef.current?.stoppen()
    aufnahmeRef.current = null
    setProtokollLaeuft(false)
    setMitschreibende(new Set())
    setAusgenommenSeit(null)
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

  // Ist mein Mikrofon in der Konferenz aus, hoert die Mitschrift nicht hin.
  const mikroAnRef = useRef(false)
  mikroAnRef.current = v.teilnehmer.find((t) => t.ichSelbst)?.mikroAn ?? false
  const meinNameRef = useRef(meinName)
  meinNameRef.current = meinName

  /** Ob es hier eine Mitschrift gibt: nur im Konferenzraum mit Dienst. */
  const mitschriftMoeglich = typeof v.raum.mitschriftZugang === "function"

  /**
   * Die Mitschrift einschalten (Spec video, "Mitschrift"). Der Kniff: jeder
   * schreibt sein EIGENES Mikrofon mit und schickt die Zeilen in den Raum,
   * darum stimmt der Name von selbst. Erkannt wird auf unserem Server
   * (Nemotron, kreis-server/mitschrift), quelloffen; Ton bleibt nirgends liegen.
   */
  const protokollStarten = useCallback((sprache = "de-DE") => {
    if (!v.ich || aufnahmeRef.current) return
    const zugang = v.raum.mitschriftZugang?.()
    if (!zugang) { setProtokollFehler("Die Mitschrift läuft nur in der Konferenz mit Server."); return }
    const ich = v.ich
    const zeile = (id: string, text: string, beginn: number, ende: number, vorlaeufig: boolean) => {
      const z: ProtokollZeile = { id: `${ich}-${id}`, wer: ich, name: meinNameRef.current, text, wann: beginn, bis: ende, vorlaeufig }
      protokollZeile(z)
      v.nebenSenden({ art: "transkript", zeile: z })
    }
    const zeiten = new Map<string, { beginn: number; ende: number }>()
    const aufnahme = new MitschriftAufnahme({
      url: zugang.url,
      token: zugang.token,
      sprache,
      darfHoeren: () => mikroAnRef.current,
      hoerer: {
        abschnitt: (id, beginn, ende) => { zeiten.set(id, { beginn, ende }); zeile(id, "…", beginn, ende, true) },
        text: (id, text) => {
          const t = zeiten.get(id)
          zeiten.delete(id)
          if (t) zeile(id, text, t.beginn, t.ende, false)
        },
        verbunden: (an) => { if (an) setProtokollFehler(null) },
        fehler: (text) => setProtokollFehler(text),
      },
    })
    aufnahmeRef.current = aufnahme
    setProtokollLaeuft(true)
    setProtokollFehler(null)
    v.nebenSenden({ art: "mitschrift-an", an: true })
    setMitschreibende((alt) => new Set(alt).add(ich))
    aufnahme.starten().catch((e: unknown) => {
      aufnahmeRef.current = null
      setProtokollLaeuft(false)
      v.nebenSenden({ art: "mitschrift-an", an: false })
      setMitschreibende((alt) => { const neu = new Set(alt); neu.delete(ich); return neu })
      const name = e instanceof Error ? e.name : ""
      setProtokollFehler(name === "NotAllowedError" ? "Das Mikrofon ist für die Mitschrift gesperrt." : "Die Mitschrift startete nicht.")
    })
  }, [v, protokollZeile])

  const protokollHalten = useCallback(() => {
    if (!aufnahmeRef.current) return
    aufnahmeRef.current.stoppen()
    aufnahmeRef.current = null
    setProtokollLaeuft(false)
    if (v.ich) {
      const ich = v.ich
      v.nebenSenden({ art: "mitschrift-an", an: false })
      setMitschreibende((alt) => { const neu = new Set(alt); neu.delete(ich); return neu })
    }
  }, [v])

  // Ich verlasse die Flaeche: die Aufnahme endet mit.
  useEffect(() => () => { aufnahmeRef.current?.stoppen(); aufnahmeRef.current = null }, [])

  // Der Hebel (Sitzung.mitschrift): Steht er auf an, schreibt jedes Geraet
  // sein eigenes Mikrofon mit, ausser man hat sich ausgenommen, fuer diese
  // Runde oder in den Einstellungen fuer immer. Geht er aus, endet alles.
  const vorlieben = useVorlieben()
  const hebel = v.sitzung.mitschrift?.an ? v.sitzung.mitschrift : null
  const mitschriftAusgenommen = Boolean(hebel) && (vorlieben.nieMitschreiben || ausgenommenSeit === hebel?.seit)
  const sollMitschreiben = v.zustand === "drin" && mitschriftMoeglich && Boolean(hebel) && !mitschriftAusgenommen
  useEffect(() => {
    if (sollMitschreiben) protokollStarten()
    else protokollHalten()
  }, [sollMitschreiben, protokollStarten, protokollHalten])

  const mitschriftAusnehmen = useCallback(() => { if (hebel) setAusgenommenSeit(hebel.seit) }, [hebel])
  const mitschriftWiederAufnehmen = useCallback(() => setAusgenommenSeit(null), [])

  /** Das Protokoll als Datei: Name, von bis, Dauer, Text, Redezeiten. */
  const protokollAlsMarkdown = useCallback((raum: string) =>
    protokollMarkdown(protokoll, { raum, teilnehmer: v.teilnehmer.map((t) => t.name) }), [protokoll, v.teilnehmer])

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

  /** Moderation: alle stumm schalten, bis auf `ausser`. */
  const alleStumm = useCallback((ausser: string | null) => {
    v.nebenSenden({ art: "alle-stumm", ausser })
    if (v.ich && ausser !== v.ich) void v.raum.mikro(false)
  }, [v])

  /** Moderation: alle Haende und Zeichen weg, bei allen. */
  const reaktionenLoeschen = useCallback(() => {
    setHaende(new Set()); setZeichen(new Map())
    v.nebenSenden({ art: "reaktionen-weg" })
  }, [v])

  /** Warteraum: jemanden hereinholen. */
  const hereinholen = useCallback((kennung: string) => {
    setHereingeholt((alt) => new Set(alt).add(kennung))
    v.nebenSenden({ art: "hereinholen", kennung })
  }, [v])

  /** Eine Aufgabe oder einen Beschluss fuer alle festhalten. */
  const ergebnisDazu = useCallback((e: Ergebnis) => {
    setErgebnisse((alt) => [...alt, e])
    v.nebenSenden({ art: "ergebnis", ergebnis: e })
  }, [v])

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
    ergebnisse, ergebnisDazu,
    alleStumm, reaktionenLoeschen, hereinholen, hereingeholt,
    chat, chatSenden,
    haende, handUmschalten,
    zeichen, zeichenGeben,
    protokoll, protokollLaeuft, protokollFehler, protokollStarten, protokollHalten, protokollAlsText, protokollAlsMarkdown,
    mitschriftMoeglich, mitschreibende, mitschriftHebel: hebel, mitschriftAusgenommen, mitschriftAusnehmen, mitschriftWiederAufnehmen,
    nieMitschreiben: vorlieben.nieMitschreiben,
    protokollLeeren: () => setProtokoll([]),
  }
}

export type Neben = ReturnType<typeof useNebenHalten>

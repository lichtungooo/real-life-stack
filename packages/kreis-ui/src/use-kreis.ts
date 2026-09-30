// Raum und Sitzung zusammenhalten.
//
// Die Verbindung gehoert der App, nicht einer Flaeche: Ein Mensch sitzt in
// EINEM Raum, und jede Flaeche, die ihn zeigt (der Kreis mit seinen
// Prozessen, das Video), liest dieselbe Verbindung. Darum lebt dieser Hook im
// `KreisRaumProvider`, und die Module holen sich die Verbindung mit
// `useKreisVerbindung()`.
//
// Handlungen laufen durch die reinen Funktionen aus `@kreis/core`, das
// Ergebnis geht an alle; was von aussen kommt, wird ueber `gilt` eingeordnet.

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  gilt,
  redezeitAblaufen,
  istSitzung,
  leereSitzung,
  prozessFinden,
  raumKennung,
  type KreisNachricht,
  type KreisRaum,
  type KreisTeilnehmer,
  type Prozess,
  type Sitzung,
} from "@kreis/core"
import { schaleAnschlagen } from "./klangschale"

export type KreisZustand = "draussen" | "verbindet" | "drin" | "fehler"
export type KreisRaumFabrik = () => KreisRaum

/** Nachrichten, die nicht zum Sitzungszustand gehoeren (Chat, Hand, Zeichen, Protokoll). */
export type NebenNachricht = { art: string } & Record<string, unknown>

export function useKreisVerbindungHalten(fabrik: KreisRaumFabrik, eigeneProzesse: readonly Prozess[] = []) {
  // Eine Verbindung fuer die ganze App. Die Fabrik wechselt nicht waehrend einer Sitzung.
  const raum: KreisRaum = useMemo(() => fabrik(), [fabrik])
  const [zustand, setZustand] = useState<KreisZustand>("draussen")
  const [fehler, setFehler] = useState<string | null>(null)
  // Der Schluessel des Raums (die Id der Gruppe) und sein Titel zum Anzeigen.
  // Getrennt, seit der Raum an der Id haengt: Ein Name laesst sich erraten,
  // eine Id nicht (Timo, 30.09.2026, Einladen per Link).
  const [raumName, setRaumName] = useState<string | null>(null)
  const [raumTitel, setRaumTitel] = useState<string | null>(null)
  const [teilnehmer, setTeilnehmer] = useState<readonly KreisTeilnehmer[]>([])
  const [sitzung, setSitzung] = useState<Sitzung>(() => leereSitzung(Date.now()))
  const [jetzt, setJetzt] = useState(() => Date.now())
  const sitzungRef = useRef(sitzung)
  sitzungRef.current = sitzung
  const nebenHoerer = useRef(new Set<(n: NebenNachricht, von: string) => void>())

  const ich = zustand === "drin" ? raum.ich() : null
  const prozess = prozessFinden(sitzung.prozessId, eigeneProzesse)

  useEffect(() => {
    if (zustand !== "drin") return
    const takt = setInterval(() => setJetzt(Date.now()), 1000)
    return () => clearInterval(takt)
  }, [zustand])

  const senden = useCallback((s: Sitzung) => {
    raum.senden({ art: "kreis-sitzung", sitzung: s } satisfies KreisNachricht)
  }, [raum])

  /** Eine Handlung. Kommt derselbe Stand zurueck, war sie nicht erlaubt. */
  const handle = useCallback((fn: (s: Sitzung, jetzt: number) => Sitzung) => {
    const vorher = sitzungRef.current
    const nachher = fn(vorher, Date.now())
    if (nachher === vorher) return false
    sitzungRef.current = nachher
    setSitzung(nachher)
    senden(nachher)
    setJetzt(Date.now())
    return true
  }, [senden])

  const betreten = useCallback(async (name: string, anzeigeName: string, titel?: string) => {
    setFehler(null)
    setZustand("verbindet")
    try {
      await raum.betreten(raumKennung(name), anzeigeName.trim() || "Gast")
      setRaumName(name)
      setRaumTitel(titel ?? name)
      setTeilnehmer(raum.teilnehmer())
      setZustand("drin")
      // Wer neu kommt, fragt nach dem Stand. Wer ihn kennt, antwortet.
      raum.senden({ art: "kreis-frage" } satisfies KreisNachricht)
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "Der Raum ließ sich nicht betreten.")
      setZustand("fehler")
    }
  }, [raum])

  const verlassen = useCallback(async () => {
    await raum.verlassen()
    setZustand("draussen")
    setRaumName(null)
    setRaumTitel(null)
    setTeilnehmer([])
    const leer = leereSitzung(Date.now())
    sitzungRef.current = leer
    setSitzung(leer)
  }, [raum])

  /** Eine Neben-Nachricht an alle: Chat, Hand, Zeichen. */
  const nebenSenden = useCallback((n: NebenNachricht) => { raum.senden(n) }, [raum])
  const beiNeben = useCallback((fn: (n: NebenNachricht, von: string) => void) => {
    nebenHoerer.current.add(fn)
    return () => { nebenHoerer.current.delete(fn) }
  }, [])

  useEffect(() => {
    const ab1 = raum.beiAenderung(() => setTeilnehmer(raum.teilnehmer()))
    const ab2 = raum.beiNachricht((roh, von) => {
      const n = roh as { art?: unknown } | null
      if (!n || typeof n !== "object" || typeof n.art !== "string") return
      if (n.art === "kreis-frage") {
        if (sitzungRef.current.v > 0) senden(sitzungRef.current)
        return
      }
      if (n.art === "kreis-sitzung") {
        const fremd = (n as { sitzung?: unknown }).sitzung
        if (!istSitzung(fremd)) return
        const neu = gilt(sitzungRef.current, fremd)
        if (neu !== sitzungRef.current) {
          sitzungRef.current = neu
          setSitzung(neu)
        }
        return
      }
      nebenHoerer.current.forEach((fn) => fn(n as NebenNachricht, von))
    })
    return () => { ab1(); ab2() }
  }, [raum, senden])

  useEffect(() => () => { void raum.verlassen() }, [raum])

  // Die Klangschale klingt bei jedem neuen Schlag, bei allen. Ein Schlag, der
  // beim Hereinkommen schon vorbei ist, klingt nicht nach.
  const gehoertRef = useRef(0)
  useEffect(() => {
    if (sitzung.schale.nr > gehoertRef.current) {
      gehoertRef.current = sitzung.schale.nr
      if (Date.now() < sitzung.schale.stilleBis) schaleAnschlagen()
    }
  }, [sitzung.schale.nr, sitzung.schale.stilleBis])

  // Der Gong am Ende einer Redezeit: bei allen einmal, tiefer als die Schale.
  const gongRef = useRef(0)
  useEffect(() => {
    const nr = sitzung.gong?.nr ?? 0
    if (nr > gongRef.current) {
      gongRef.current = nr
      if (Date.now() - (sitzung.gong?.wann ?? 0) < 10_000) schaleAnschlagen(131, 0.5)
    }
  }, [sitzung.gong?.nr, sitzung.gong?.wann])

  // Ist die Redezeit um, loest das Geraet dessen aus, der den Stab haelt:
  // so geschieht es genau einmal, und niemand aus der Runde muss eingreifen.
  useEffect(() => {
    if (!ich || sitzung.stab.halter !== ich) return
    handle((s, t) => redezeitAblaufen(s, teilnehmer.map((p) => ({ id: p.id, name: p.name })), ich, t))
  }, [jetzt, ich, sitzung.stab.halter, teilnehmer, handle])

  // Nur wer den Stab haelt, spricht. Der Stab regelt, er sperrt nicht.
  const halterRef = useRef<string | null>(null)
  useEffect(() => {
    const halter = sitzung.stab.halter
    const vorher = halterRef.current
    halterRef.current = halter
    if (!ich || !prozess?.nurStabSpricht || halter === vorher) return
    if (halter === ich) void raum.mikro(true)
    else if (vorher === ich || halter !== null) void raum.mikro(false)
  }, [sitzung.stab.halter, ich, prozess?.nurStabSpricht, raum])

  return {
    raum, zustand, fehler, raumName, raumTitel, teilnehmer, ich, sitzung, prozess, jetzt,
    betreten, verlassen, handle, nebenSenden, beiNeben,
  }
}

export type KreisVerbindung = ReturnType<typeof useKreisVerbindungHalten>

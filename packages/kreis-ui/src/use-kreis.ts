// Raum und Sitzung zusammenhalten.
//
// Der Hook verbindet den Raum-Adapter mit dem Sitzungszustand aus
// `@kreis/core`: Handlungen laufen durch die reinen Funktionen, das Ergebnis
// geht an alle; was von aussen kommt, wird ueber `gilt` eingeordnet.

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  gilt,
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
import type { KreisRaumFabrik } from "./raum-kontext"

export type KreisZustand = "draussen" | "verbindet" | "drin" | "fehler"

export interface UseKreisArgumente {
  fabrik: KreisRaumFabrik
  /** Der Name, aus dem die Raumkennung wird, meist der Space. */
  raumName: string
  /** Eigene Prozess-Vorlagen des Space. */
  eigeneProzesse?: readonly Prozess[]
}

export function useKreis({ fabrik, raumName, eigeneProzesse = [] }: UseKreisArgumente) {
  // Ein Raum je Flaeche. Die Fabrik wechselt nicht waehrend einer Sitzung.
  const raum: KreisRaum = useMemo(() => fabrik(), [fabrik])
  const [zustand, setZustand] = useState<KreisZustand>("draussen")
  const [fehler, setFehler] = useState<string | null>(null)
  const [teilnehmer, setTeilnehmer] = useState<readonly KreisTeilnehmer[]>([])
  const [sitzung, setSitzung] = useState<Sitzung>(() => leereSitzung(Date.now()))
  const [jetzt, setJetzt] = useState(() => Date.now())
  const sitzungRef = useRef(sitzung)
  sitzungRef.current = sitzung

  const ich = zustand === "drin" ? raum.ich() : null
  const prozess = prozessFinden(sitzung.prozessId, eigeneProzesse)

  // Die Uhr fuer Stille, Pause und die mitlaufende Zeit eines Schritts.
  useEffect(() => {
    if (zustand !== "drin") return
    const takt = setInterval(() => setJetzt(Date.now()), 1000)
    return () => clearInterval(takt)
  }, [zustand])

  const senden = useCallback((s: Sitzung) => {
    raum.senden({ art: "kreis-sitzung", sitzung: s } satisfies KreisNachricht)
  }, [raum])

  /**
   * Eine Handlung ausfuehren. Kommt derselbe Stand zurueck, war sie nicht
   * erlaubt, und es geht nichts hinaus.
   */
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

  const betreten = useCallback(async (name: string) => {
    setFehler(null)
    setZustand("verbindet")
    try {
      await raum.betreten(raumKennung(raumName), name.trim() || "Gast")
      setTeilnehmer(raum.teilnehmer())
      setZustand("drin")
      // Wer neu kommt, fragt nach dem Stand. Wer ihn kennt, antwortet.
      raum.senden({ art: "kreis-frage" } satisfies KreisNachricht)
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "Der Raum ließ sich nicht betreten.")
      setZustand("fehler")
    }
  }, [raum, raumName])

  const verlassen = useCallback(async () => {
    await raum.verlassen()
    setZustand("draussen")
    setTeilnehmer([])
    const leer = leereSitzung(Date.now())
    sitzungRef.current = leer
    setSitzung(leer)
  }, [raum])

  // Teilnehmer und Nachrichten.
  useEffect(() => {
    const ab1 = raum.beiAenderung(() => setTeilnehmer(raum.teilnehmer()))
    const ab2 = raum.beiNachricht((roh) => {
      const n = roh as Partial<KreisNachricht> | null
      if (!n || typeof n !== "object") return
      if (n.art === "kreis-frage") {
        // Nur wer einen Stand hat, antwortet.
        if (sitzungRef.current.v > 0) senden(sitzungRef.current)
        return
      }
      if (n.art === "kreis-sitzung" && istSitzung((n as { sitzung?: unknown }).sitzung)) {
        const fremd = (n as { sitzung: Sitzung }).sitzung
        const neu = gilt(sitzungRef.current, fremd)
        if (neu !== sitzungRef.current) {
          sitzungRef.current = neu
          setSitzung(neu)
        }
      }
    })
    return () => { ab1(); ab2() }
  }, [raum, senden])

  // Beim Abbauen der Flaeche den Raum sauber verlassen.
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

  // Nur wer den Stab haelt, spricht. Der Stab regelt, er sperrt nicht: Wer
  // danach sein Mikrofon selbst oeffnet, darf das.
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
    raum,
    zustand,
    fehler,
    teilnehmer,
    ich,
    sitzung,
    prozess,
    jetzt,
    betreten,
    verlassen,
    handle,
  }
}

export type KreisVerbindung = ReturnType<typeof useKreis>

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
  nurEinerSpricht,
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
  // Sitzt man in einem Gruppenraum, merkt sich die App den Hauptraum und das
  // Ende; zurueck geht es von selbst oder mit einem Klick.
  const [unterraum, setUnterraum] = useState<{ haupt: string; hauptTitel: string; bis: number; titel: string } | null>(null)
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

  // Womit zuletzt betreten wurde: fuer das Wiederverbinden nach einem Abriss.
  const zuletztRef = useRef<{ name: string; anzeigeName: string; titel?: string } | null>(null)
  // Jedes "gehen" zaehlt hoch. Ein Wiederverbinden, das unter einer aelteren
  // Zahl begann, hoert auf (Pruefkreis Kimi, zweite Runde: der Vergleich ueber
  // das Objekt brach die Leiter nach dem ersten Versuch ab).
  const gehenRef = useRef(0)

  const betreten = useCallback(async (name: string, anzeigeName: string, titel?: string) => {
    setFehler(null)
    setZustand("verbindet")
    zuletztRef.current = { name, anzeigeName, titel }
    const absicht = gehenRef.current
    try {
      await raum.betreten(raumKennung(name), anzeigeName.trim() || "Gast")
      // Inzwischen "gehen" gesagt, oder der Beitritt wurde abgebrochen: nicht
      // "drin" melden, wo niemand drin ist.
      if (gehenRef.current !== absicht || !raum.ich()) {
        setZustand("draussen")
        return
      }
      setRaumName(name)
      setRaumTitel(titel ?? name)
      setTeilnehmer(raum.teilnehmer())
      setZustand("drin")
      // Wer neu kommt, fragt nach dem Stand. Wer ihn kennt, antwortet.
      // Dreimal: Direkt nach dem Verbinden steht der Datenkanal nicht immer,
      // und eine verlorene Frage liesse den Nachzuegler ohne Stand
      // (Pruefkreis Kimi, 01.10.2026, Befund 5).
      raum.senden({ art: "kreis-frage" } satisfies KreisNachricht)
      for (const ms of [1500, 5000]) setTimeout(() => { if (raum.ich()) raum.senden({ art: "kreis-frage" } satisfies KreisNachricht) }, ms)
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "Der Raum ließ sich nicht betreten.")
      setZustand("fehler")
    }
  }, [raum])

  const verlassen = useCallback(async () => {
    zuletztRef.current = null
    gehenRef.current++
    await raum.verlassen()
    setZustand("draussen")
    setRaumName(null)
    setRaumTitel(null)
    setTeilnehmer([])
    const leer = leereSitzung(Date.now())
    sitzungRef.current = leer
    setSitzung(leer)
  }, [raum])

  /** In einen Gruppenraum wechseln: den Hauptraum verlassen, den Gruppenraum betreten. */
  const inUnterraum = useCallback(async (haupt: string, hauptTitel: string, unter: string, titel: string, bis: number, name: string) => {
    await verlassen()
    await betreten(unter, name, titel)
    setUnterraum({ haupt, hauptTitel, bis, titel })
  }, [verlassen, betreten])

  /** Zurueck in den Hauptraum. */
  const zurueckInHauptraum = useCallback(async (name: string) => {
    const u = unterraum
    if (!u) return
    setUnterraum(null)
    await verlassen()
    await betreten(u.haupt, name, u.hauptTitel)
  }, [unterraum, verlassen, betreten])

  /** Eine Neben-Nachricht an alle: Chat, Hand, Zeichen. */
  const nebenSenden = useCallback((n: NebenNachricht) => { raum.senden(n) }, [raum])
  const beiNeben = useCallback((fn: (n: NebenNachricht, von: string) => void) => {
    nebenHoerer.current.add(fn)
    return () => { nebenHoerer.current.delete(fn) }
  }, [])

  useEffect(() => {
    // Nur neu setzen, wenn sich wirklich etwas aendert: LiveKit meldet
    // "wer spricht" mehrmals je Sekunde, oft mit demselben Stand.
    const ab1 = raum.beiAenderung(() => setTeilnehmer((alt) => {
      const neu = raum.teilnehmer()
      return gleicheTeilnehmer(alt, neu) ? alt : neu
    }))
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

  // Abgerissen, ohne dass jemand ging: von selbst neu verbinden, mit
  // demselben Namen und Raum, bis zu dreimal (1 s, 3 s, 8 s). Danach steht
  // eine Meldung da statt eines stummen, leeren Raums.
  const verbindetNeuRef = useRef(false)
  const abgerissen = zustand === "drin" && !!raum.verbindungVerloren?.() && raum.ich() === null
  useEffect(() => {
    const z = zuletztRef.current
    if (!abgerissen || !z || verbindetNeuRef.current) return
    verbindetNeuRef.current = true
    const absicht = gehenRef.current
    void (async () => {
      for (const ms of [1000, 3000, 8000]) {
        await new Promise((r) => setTimeout(r, ms))
        // Wer inzwischen "gehen" sagte, will nicht zurueck.
        if (gehenRef.current !== absicht) { verbindetNeuRef.current = false; return }
        await betreten(z.name, z.anzeigeName, z.titel)
        if (raum.ich()) { verbindetNeuRef.current = false; return }
      }
      if (gehenRef.current !== absicht) { verbindetNeuRef.current = false; return }
      verbindetNeuRef.current = false
      setFehler("Die Verbindung ist abgerissen und kam nicht wieder. Bitte neu betreten.")
      setZustand("fehler")
    })()
  }, [abgerissen, raum, betreten])

  // Alle 15 Sekunden den eigenen Stand in den Raum: Ging eine Aenderung
  // verloren (etwa "Ein Wort zur Zeit: aus"), holt sie so jedes Geraet nach
  // (Pruefkreis Kimi, Befund 5 und 6).
  useEffect(() => {
    if (zustand !== "drin") return
    const t = setInterval(() => { if (sitzungRef.current.v > 0 && raum.ich()) senden(sitzungRef.current) }, 15_000)
    return () => clearInterval(t)
  }, [zustand, raum, senden])

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

  // Nur wer den Stab haelt, spricht: im Kreis-Prozess mit Redestab und mit
  // "Ein Wort zur Zeit" (Moderation). Der Stab regelt, er sperrt nicht.
  const nurEiner = nurEinerSpricht(sitzung, prozess)
  const halterRef = useRef<string | null>(null)
  useEffect(() => {
    const halter = sitzung.stab.halter
    const vorher = halterRef.current
    halterRef.current = halter
    if (!ich || !nurEiner || halter === vorher) return
    if (halter === ich) void raum.mikro(true)
    else if (vorher === ich || halter !== null) void raum.mikro(false)
  }, [sitzung.stab.halter, ich, nurEiner, raum])
  // Wird "Ein Wort zur Zeit" eingeschaltet, verstummt sofort, wer das Wort nicht haelt.
  useEffect(() => {
    if (ich && nurEiner && sitzung.stab.halter !== ich) void raum.mikro(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nurEiner, ich])

  return {
    raum, zustand, fehler, raumName, raumTitel, teilnehmer, ich, sitzung, prozess, jetzt,
    betreten, verlassen, handle, nebenSenden, beiNeben,
    unterraum, inUnterraum, zurueckInHauptraum,
  }
}

/** Gleiche Menschen mit gleichem Stand (Name, Sprechen, Mikro, Kamera, Bildschirm)? */
export function gleicheTeilnehmer(a: readonly KreisTeilnehmer[], b: readonly KreisTeilnehmer[]): boolean {
  if (a.length !== b.length) return false
  return a.every((x, i) => {
    const y = b[i]
    return x.id === y.id && x.name === y.name && x.ichSelbst === y.ichSelbst && x.spricht === y.spricht
      && x.mikroAn === y.mikroAn && x.kameraAn === y.kameraAn && !!x.teiltBildschirm === !!y.teiltBildschirm
  })
}

export type KreisVerbindung = ReturnType<typeof useKreisVerbindungHalten>

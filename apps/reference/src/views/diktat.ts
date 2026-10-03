// Reinsprechen im Begleiter (DEFINITION 13.9), die Bindung an die Mitschrift.
//
// Genau wie in Circeling (Timo: "genau das Modell, genau mit der
// Konfiguration"): derselbe Token-Dienst, dieselbe Mitschrift, derselbe
// Aufnahme-Code aus `@kreis/ui`. Der Begleiter holt ein Token für einen
// eigenen, privaten Raum, betritt ihn nie und schickt nur seine Sprache.
// Alles wird erst beim ersten Druck aufs Mikrofon nachgeladen.

import { useCallback, useEffect, useRef, useState } from "react"
import type { Diktat } from "@trustdonation/ui/begleiter"

type Aufnahme = { starten(): Promise<void>; stoppen(): void }

async function json<T>(adresse: string): Promise<T> {
  const r = await fetch(adresse)
  const k = (await r.json().catch(() => ({}))) as T & { fehler?: string }
  if (!r.ok) throw new Error(k.fehler || `Die Mitschrift ist gerade nicht erreichbar (${r.status}).`)
  return k
}

/** Ein Raum-Token für die Mitschrift, wie Circeling es holt (`kreis-livekit`). */
async function mitschriftToken(tokenUrl: string): Promise<string> {
  const raum = `begleiter-${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`
  const { gast } = await json<{ gast: string }>(`${tokenUrl}/raum?raum=${encodeURIComponent(raum)}`)
  const u = new URL(tokenUrl)
  u.searchParams.set("raum", raum)
  u.searchParams.set("name", "Begleitung")
  u.searchParams.set("zugang", gast)
  return (await json<{ token: string }>(u.toString())).token
}

export function useDiktat(): Diktat {
  const [zustand, setZustand] = useState<Diktat["zustand"]>("aus")
  const [live, setLive] = useState("")
  const [fehler, setFehler] = useState<string | null>(null)
  const aufnahme = useRef<Aufnahme | null>(null)
  const lauf = useRef(0)

  // Stabil: Die Fläche schließt damit beim Verlassen das Mikrofon.
  const stoppen = useCallback(() => {
    lauf.current++
    aufnahme.current?.stoppen()
    aufnahme.current = null
    setZustand("aus")
    setLive("")
  }, [])

  const starten = useCallback((fertig: (text: string) => void) => {
    const mein = ++lauf.current
    setFehler(null)
    setZustand("verbindet")
    void (async () => {
      try {
        const [{ MitschriftAufnahme }, { KREIS_WIR_OOO }] = await Promise.all([import("@kreis/ui"), import("@kreis/livekit")])
        const token = await mitschriftToken(KREIS_WIR_OOO.tokenUrl)
        if (mein !== lauf.current) return
        const a = new MitschriftAufnahme({
          url: KREIS_WIR_OOO.mitschriftUrl ?? "wss://kreis.wir.ooo/mitschrift",
          token,
          sprache: "de-DE",
          darfHoeren: () => mein === lauf.current,
          hoerer: {
            beginn: () => {},
            live: (_id, text, vorlaeufig) => setLive(`${text} ${vorlaeufig}`.trim()),
            fertig: (_id, text, _b, _e, behalten) => {
              setLive("")
              if (behalten && text.trim()) fertig(text.trim())
            },
            verbunden: (an) => { if (mein === lauf.current) setZustand(an ? "hoert" : "verbindet") },
            fehler: (t) => setFehler(t),
          },
        })
        aufnahme.current = a
        await a.starten()
        if (mein === lauf.current) setZustand("hoert")
      } catch (e) {
        if (mein !== lauf.current) return
        aufnahme.current?.stoppen()
        aufnahme.current = null
        setZustand("aus")
        setFehler(e instanceof Error && /Permission|NotAllowed/i.test(e.name + e.message)
          ? "Das Mikrofon ist nicht freigegeben. Bitte im Browser erlauben."
          : e instanceof Error ? e.message : "Die Mitschrift ließ sich nicht starten.")
      }
    })()
  }, [])

  useEffect(() => () => { lauf.current++; aufnahme.current?.stoppen() }, [])
  return { zustand, live, fehler, starten, stoppen }
}

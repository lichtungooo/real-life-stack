// Die Menschen im Kreis, Redestab und Klangschale in der Mitte.
//
// Alle sehen denselben Kreis in derselben Reihenfolge (nach Id sortiert),
// und jeder sieht sich selbst unten: so, wie man im echten Kreis sitzt, mit
// denselben Nachbarn links und rechts.

import { useEffect, useRef, useState, type ReactNode } from "react"
import { Mic, MicOff } from "lucide-react"
import type { KreisRaum, KreisTeilnehmer } from "@kreis/core"

/** Das Rund wird nie groesser als das, damit die Mitte markant bleibt. */
const RUND_HOECHSTENS = 460
const RUND_MINDESTENS = 260

/** Aus einem Namen eine ruhige, immer gleiche Farbe. */
const TOENE = ["#0e7490", "#047857", "#6d28d9", "#b45309", "#be123c", "#0f766e", "#4338ca", "#c2410c"]
function farbe(text: string): string {
  let summe = 0
  for (let i = 0; i < text.length; i++) summe = (summe + text.charCodeAt(i)) % 997
  return TOENE[summe % TOENE.length]
}

function kuerzel(name: string): string {
  return name.split(/\s+/).map((t) => t[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() || "?"
}

/** Die Plaetze auf dem Kreis, in Prozent der Flaeche. Ich sitze unten. */
export function plaetze(ids: readonly string[], ich: string | null): Map<string, { x: number; y: number }> {
  const kreis = [...ids].sort()
  const n = kreis.length
  const start = ich ? Math.max(0, kreis.indexOf(ich)) : 0
  const orte = new Map<string, { x: number; y: number }>()
  kreis.forEach((id, i) => {
    // Unten beginnen (90°), im Uhrzeigersinn weiter.
    const winkel = Math.PI / 2 + ((i - start) / Math.max(1, n)) * 2 * Math.PI
    orte.set(id, { x: 50 + 40 * Math.cos(winkel), y: 50 + 40 * Math.sin(winkel) })
  })
  return orte
}

function Platz({
  person, raum, haeltStab, gruppe, groesse,
}: {
  person: KreisTeilnehmer
  raum: KreisRaum
  haeltStab: boolean
  gruppe: number | null
  groesse: number
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const zeigtBild = raum.traegtMedien && person.kameraAn && !!raum.bildAnhaengen

  useEffect(() => {
    if (!zeigtBild || !videoRef.current || !raum.bildAnhaengen) return
    return raum.bildAnhaengen(person.id, videoRef.current)
  }, [zeigtBild, person.id, raum])

  // Kein Ton hier: Den spielt der Provider einmal fuer die ganze App ab
  // (raum-kontext.tsx, RaumTon). Sonst hoerte man jeden doppelt.

  return (
    <div className="flex flex-col items-center gap-1.5" style={{ width: groesse }}>
      <div
        className={`relative overflow-hidden rounded-full transition-shadow ${
          haeltStab
            ? "ring-4 ring-amber-400 ring-offset-2 ring-offset-background"
            : person.spricht
              ? "ring-4 ring-emerald-400"
              : "ring-0"
        }`}
        style={{ width: groesse, height: groesse, background: farbe(person.name) }}
      >
        {zeigtBild ? (
          <video ref={videoRef} autoPlay playsInline muted={person.ichSelbst} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-semibold text-white" style={{ fontSize: groesse * 0.34 }}>
            {kuerzel(person.name)}
          </span>
        )}
      </div>
      <div className="flex max-w-full items-center gap-1 text-xs">
        {raum.traegtMedien && (person.mikroAn
          ? <Mic className="h-3 w-3 shrink-0 text-muted-foreground" aria-label="Mikrofon an" />
          : <MicOff className="h-3 w-3 shrink-0 text-rose-500" aria-label="stumm" />)}
        <span className="truncate font-medium text-foreground">
          {person.name}{person.ichSelbst ? " (ich)" : ""}
        </span>
        {gruppe !== null && (
          <span className="shrink-0 rounded-full bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">G{gruppe}</span>
        )}
      </div>
    </div>
  )
}

export function KreisRund({
  teilnehmer, ich, raum, stabHalter, gruppen, mitte,
}: {
  teilnehmer: readonly KreisTeilnehmer[]
  ich: string | null
  raum: KreisRaum
  stabHalter: string | null
  gruppen: Readonly<Record<string, number>> | null
  mitte: ReactNode
}) {
  const orte = plaetze(teilnehmer.map((t) => t.id), ich)
  const n = teilnehmer.length
  // Das Rund misst seinen Platz und nimmt die kleinere Seite, hoechstens
  // RUND_HOECHSTENS. Die Huelle misst sich, ohne dass das Rund sie aufblaeht:
  // das Rund liegt absolut darin (Timo, 30.09.2026, mit Bild: der Kreis lief
  // ueber die ganze Buehne hinaus, "der kann viel, viel kleiner").
  const huelle = useRef<HTMLDivElement | null>(null)
  const [seite, setSeite] = useState(360)
  useEffect(() => {
    const el = huelle.current
    if (!el || typeof ResizeObserver === "undefined") return
    const messen = () => {
      const w = el.clientWidth, h = el.clientHeight
      const passend = Math.min(w, h > 0 ? h : w, RUND_HOECHSTENS)
      if (passend > 0) setSeite(Math.max(RUND_MINDESTENS, passend))
    }
    messen()
    const beobachter = new ResizeObserver(messen)
    beobachter.observe(el)
    return () => beobachter.disconnect()
  }, [])
  // Die Menschen wachsen mit dem Rund, und bei vielen werden sie kleiner.
  const anteil = n <= 8 ? 0.16 : n <= 14 ? 0.12 : n <= 20 ? 0.09 : 0.07
  const groesse = Math.round(Math.max(30, Math.min(72, seite * anteil)))

  return (
    <div ref={huelle} className="relative h-full min-h-[280px] w-full overflow-hidden">
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: seite, height: seite }}>
      {/* Der Kreis selbst: ein warmer Boden, auf dem die Menschen sitzen */}
      <div className="absolute inset-[10%] rounded-full border border-amber-300/70 dark:hidden" aria-hidden="true"
        style={{ background: "radial-gradient(circle, rgba(254,243,199,.95) 0%, rgba(255,251,235,.7) 55%, rgba(255,251,235,0) 76%)", boxShadow: "inset 0 0 40px rgba(253,230,138,.45)" }} />
      <div className="absolute inset-[10%] hidden rounded-full border border-amber-700/50 dark:block" aria-hidden="true"
        style={{ background: "radial-gradient(circle, rgba(120,53,15,.4) 0%, rgba(69,26,3,.22) 60%, rgba(69,26,3,0) 78%)" }} />
      {/* Die Mitte, in der Stab und Schale liegen */}
      <div className="absolute inset-[30%] rounded-full border border-dashed border-amber-400/50 dark:border-amber-600/40" aria-hidden="true" />

      <div className="absolute left-1/2 top-1/2 flex w-[52%] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5">
        {mitte}
      </div>

      {teilnehmer.map((person) => {
        const ort = orte.get(person.id)!
        return (
          <div
            key={person.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${ort.x}%`, top: `${ort.y}%` }}
          >
            <Platz
              person={person}
              raum={raum}
              haeltStab={stabHalter === person.id}
              gruppe={gruppen?.[person.id] ?? null}
              groesse={groesse}
            />
          </div>
        )
      })}
    </div>
    </div>
  )
}

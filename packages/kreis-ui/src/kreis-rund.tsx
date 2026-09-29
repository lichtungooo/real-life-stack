// Die Menschen im Kreis, Redestab und Klangschale in der Mitte.
//
// Alle sehen denselben Kreis in derselben Reihenfolge (nach Id sortiert),
// und jeder sieht sich selbst unten: so, wie man im echten Kreis sitzt, mit
// denselben Nachbarn links und rechts.

import { useEffect, useRef, type ReactNode } from "react"
import { Mic, MicOff } from "lucide-react"
import type { KreisRaum, KreisTeilnehmer } from "@kreis/core"

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
  const tonRef = useRef<HTMLAudioElement | null>(null)
  const zeigtBild = raum.traegtMedien && person.kameraAn && !!raum.bildAnhaengen

  useEffect(() => {
    if (!zeigtBild || !videoRef.current || !raum.bildAnhaengen) return
    return raum.bildAnhaengen(person.id, videoRef.current)
  }, [zeigtBild, person.id, raum])

  useEffect(() => {
    // Den eigenen Ton nie zurueckspielen, sonst pfeift es.
    if (person.ichSelbst || !person.mikroAn || !tonRef.current || !raum.tonAnhaengen) return
    return raum.tonAnhaengen(person.id, tonRef.current)
  }, [person.id, person.ichSelbst, person.mikroAn, raum])

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
        {!person.ichSelbst && raum.traegtMedien && <audio ref={tonRef} autoPlay />}
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
  // Bis zu acht Menschen gross, bis zwanzig kleiner, darueber klein.
  const groesse = n <= 8 ? 76 : n <= 20 ? 56 : 40

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[min(100%,640px)]">
      {/* Der Kreis selbst, ein ruhiger Ring */}
      <div className="absolute inset-[10%] rounded-full border-2 border-dashed border-border" aria-hidden="true" />

      <div className="absolute left-1/2 top-1/2 flex w-[46%] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3">
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
  )
}

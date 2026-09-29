// Eine Kachel auf der Buehne des Videos.
//
// Nach dem Muster, das Menschen aus Zoom kennen: Bild fuellt die Flaeche,
// der Name steht unten links, das Stumm-Zeichen daneben, wer spricht,
// bekommt einen Ring. Wer den Redestab haelt, einen goldenen. Ohne Kamera
// erscheinen die Anfangsbuchstaben. Kein Ton hier: den spielt der Provider.

import { useEffect, useRef } from "react"
import { MicOff, MonitorUp, Pin } from "lucide-react"
import type { KreisRaum, KreisTeilnehmer } from "@kreis/core"
import { ZEICHEN, type ZeichenArt } from "../use-neben"

const TOENE = ["#0369a1", "#047857", "#6d28d9", "#b45309", "#be123c", "#0f766e", "#4338ca", "#c2410c"]
function farbe(text: string): string {
  let summe = 0
  for (let i = 0; i < text.length; i++) summe = (summe + text.charCodeAt(i)) % 997
  return TOENE[summe % TOENE.length]
}
const kuerzel = (name: string) =>
  name.split(/\s+/).map((t) => t[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() || "?"

export function VideoKachel({
  person, raum, gross = false, bildschirm = false, handOben = false, zeichen = null,
  haeltStab = false, angeheftet = false, onAnheften,
}: {
  person: KreisTeilnehmer
  raum: KreisRaum
  gross?: boolean
  bildschirm?: boolean
  handOben?: boolean
  zeichen?: ZeichenArt | null
  haeltStab?: boolean
  angeheftet?: boolean
  onAnheften?: () => void
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const zeigtBild = bildschirm ? !!person.teiltBildschirm : person.kameraAn && raum.traegtMedien

  useEffect(() => {
    const el = videoRef.current
    if (!zeigtBild || !el) return
    const haken = bildschirm ? raum.bildschirmAnhaengen : raum.bildAnhaengen
    return haken?.(person.id, el)
  }, [zeigtBild, bildschirm, person.id, raum])

  return (
    <div
      className={`group relative overflow-hidden rounded-xl bg-slate-800 ${gross ? "h-full w-full" : "aspect-video"} ${
        haeltStab ? "ring-[3px] ring-amber-400" : person.spricht ? "ring-[3px] ring-emerald-400" : ""
      }`}
    >
      {zeigtBild ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full ${bildschirm ? "object-contain" : "object-cover"}`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div
            className={`flex items-center justify-center rounded-full font-semibold text-white ${gross ? "h-28 w-28 text-3xl" : "h-14 w-14 text-base"}`}
            style={{ background: farbe(person.name) }}
          >
            {kuerzel(person.name)}
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute left-2 top-2 flex gap-1.5">
        {handOben && <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400 text-sm shadow">✋</span>}
        {zeichen && (
          <span className="flex h-7 w-7 animate-bounce items-center justify-center rounded-lg bg-white/90 text-sm shadow motion-reduce:animate-none">
            {ZEICHEN[zeichen]}
          </span>
        )}
      </div>

      {onAnheften && !bildschirm && (
        <button
          type="button"
          onClick={onAnheften}
          title={angeheftet ? "Nicht mehr festhalten" : "Groß festhalten"}
          aria-label={angeheftet ? "Nicht mehr festhalten" : "Groß festhalten"}
          className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg backdrop-blur transition ${
            angeheftet ? "bg-white/90 text-slate-900" : "bg-black/40 text-white opacity-0 focus:opacity-100 group-hover:opacity-100"
          }`}
        >
          <Pin className="h-3.5 w-3.5" />
        </button>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-2.5 pb-2 pt-6">
        {raum.traegtMedien && !person.mikroAn && !bildschirm && (
          <span className="flex h-5 w-5 items-center justify-center rounded bg-rose-500">
            <MicOff className="h-3 w-3 text-white" />
          </span>
        )}
        {bildschirm && <MonitorUp className="h-3.5 w-3.5 shrink-0 text-white/90" />}
        <span className="truncate text-xs font-medium text-white drop-shadow">
          {person.name}
          {person.ichSelbst && !bildschirm && " (ich)"}
          {bildschirm && " teilt den Bildschirm"}
        </span>
      </div>
    </div>
  )
}

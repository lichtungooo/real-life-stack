// Die Konferenz im Kleinen (Spec video, "Mini-Konferenz").
//
// Anton, 01.10.2026 (ueber Timo): "wenn man vom Circeling auf die Map geht
// oder in den Kalender … so ein kleines Bild, dass man immer noch in der
// Konferenz im Kreis mit drin ist … dass man sieht, was abgeht, und dass der
// Ton weiterlaeuft."
//
// Ton und Verbindung laufen ohnehin weiter: Das Modul bleibt eingehaengt
// (`keepMounted`), Antons Host versteckt es nur. Versteckt heisst
// `display: none`; darum haengt dieses Fenster per Portal an der Seite selbst.

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { LogOut, Maximize2, Mic, MicOff, Users } from "lucide-react"
import { nurEinerSpricht, type KreisTeilnehmer } from "@kreis/core"
import { useKreisVerbindung } from "../raum-kontext"
import { VideoKachel } from "./video-kachel"

/** So lange bleibt ein Sprecher im Bild, auch wenn er kurz still ist. */
const HALTEN_MS = 2000

/**
 * Wen das kleine Bild zeigt: wer den Bildschirm teilt, sonst wer spricht
 * (nicht ich), sonst wer das Wort haelt, sonst der Vorige, solange er da ist,
 * sonst der erste andere Mensch, sonst ich. Ein Sprecher bleibt zwei Sekunden
 * stehen, damit das Bild nicht zuckt (Lehre aus dem Kreis-Modul, 21.09.2026).
 */
export function miniWahl(
  teilnehmer: readonly KreisTeilnehmer[],
  vorher: { id: string; seit: number } | null,
  halter: string | null,
  jetzt: number,
): { id: string; seit: number } | null {
  const andere = teilnehmer.filter((t) => !t.ichSelbst)
  const da = (id: string | null | undefined) => !!id && teilnehmer.some((t) => t.id === id)
  const teilt = teilnehmer.find((t) => t.teiltBildschirm)
  if (teilt) return vorher?.id === teilt.id ? vorher : { id: teilt.id, seit: jetzt }
  const spricht = andere.find((t) => t.spricht)
  if (spricht && spricht.id !== vorher?.id && (!vorher || !da(vorher.id) || jetzt - vorher.seit >= HALTEN_MS)) return { id: spricht.id, seit: jetzt }
  if (spricht && spricht.id === vorher?.id) return { id: spricht.id, seit: jetzt }
  if (vorher && da(vorher.id)) return vorher
  if (halter && da(halter)) return { id: halter, seit: jetzt }
  const erster = andere[0] ?? teilnehmer[0]
  return erster ? { id: erster.id, seit: jetzt } : null
}

export function MiniKonferenz({ onZurueck }: { onZurueck: (gruppe: string) => void }) {
  const kreis = useKreisVerbindung()
  const [wahl, setWahl] = useState<{ id: string; seit: number } | null>(null)
  const [ort, setOrt] = useState<{ rechts: number; unten: number }>({ rechts: 16, unten: 16 })
  const ziehen = useRef<{ x: number; y: number; rechts: number; unten: number } | null>(null)

  const drin = kreis?.zustand === "drin"
  const teilnehmer = kreis?.teilnehmer ?? []
  const halter = kreis?.sitzung.stab.halter ?? null
  useEffect(() => {
    if (!drin) return
    setWahl((vorher) => {
      const neu = miniWahl(teilnehmer, vorher, halter, Date.now())
      return neu?.id === vorher?.id && neu?.seit === vorher?.seit ? vorher : neu
    })
  }, [drin, teilnehmer, halter])

  if (!kreis || !drin || typeof document === "undefined") return null
  const person = teilnehmer.find((t) => t.id === wahl?.id) ?? teilnehmer[0]
  const mich = teilnehmer.find((t) => t.ichSelbst)
  // Zurueck in den Raum der Gruppe; aus einem Gruppenraum in dessen Hauptraum.
  const gruppe = kreis.unterraum?.haupt ?? kreis.raumName ?? ""
  const titel = kreis.unterraum?.titel ?? kreis.raumTitel ?? "Circeling"
  const wortGilt = nurEinerSpricht(kreis.sitzung, kreis.prozess)
  const mikroGesperrt = wortGilt && !!mich && !mich.mikroAn && halter !== mich.id

  const runter = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return
    ziehen.current = { x: e.clientX, y: e.clientY, ...ort }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const bewegen = (e: React.PointerEvent) => {
    const z = ziehen.current
    if (!z) return
    const rechts = Math.max(8, Math.min(window.innerWidth - 120, z.rechts - (e.clientX - z.x)))
    const unten = Math.max(8, Math.min(window.innerHeight - 80, z.unten - (e.clientY - z.y)))
    setOrt({ rechts, unten })
  }

  return createPortal(
    <div role="region" aria-label="Laufende Konferenz"
      onPointerDown={runter} onPointerMove={bewegen} onPointerUp={() => { ziehen.current = null }}
      style={{ right: ort.rechts, bottom: ort.unten }}
      className="fixed z-[70] w-72 cursor-grab touch-none select-none overflow-hidden rounded-2xl bg-slate-900 text-white shadow-2xl ring-1 ring-white/10 active:cursor-grabbing">
      <div className="relative aspect-video bg-slate-800">
        {person && <VideoKachel person={person} raum={kreis.raum} gross haeltStab={halter === person.id} />}
        <button type="button" onClick={() => onZurueck(gruppe)} title="Zurück zur Runde" aria-label="Zurück zur Runde"
          className="absolute right-2 top-2 rounded-lg bg-black/50 p-1.5 text-white hover:bg-black/70">
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{titel}</p>
          <p className="flex items-center gap-1 text-[11px] text-slate-400"><Users className="h-3 w-3" /> {teilnehmer.length} · {person?.name ?? ""}</p>
        </div>
        {kreis.raum.traegtMedien && mich && (
          <button type="button" disabled={mikroGesperrt} onClick={() => void kreis.raum.mikro(!mich.mikroAn)}
            title={mikroGesperrt ? "Erst wenn das Wort frei ist" : mich.mikroAn ? "Stummschalten" : "Stummschaltung aufheben"}
            aria-label={mich.mikroAn ? "Stummschalten" : "Stummschaltung aufheben"}
            className={`flex h-8 w-8 items-center justify-center rounded-full disabled:opacity-40 ${mich.mikroAn ? "bg-white/10 hover:bg-white/20" : "bg-rose-600 hover:bg-rose-700"}`}>
            {mich.mikroAn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </button>
        )}
        <button type="button" onClick={() => void kreis.verlassen()} title="Die Konferenz verlassen" aria-label="Konferenz verlassen"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-600/80 hover:bg-rose-600">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>,
    document.body,
  )
}

// Die Konferenz fuer jemanden, der noch nicht zur Gruppe gehoert.
//
// Er kam ueber einen Einladungslink, hat seinen Zugang angelegt (zwoelf
// Woerter) und sitzt jetzt im selben Raum wie die Gruppe. Die Runde sieht
// ihn als "neu" und nimmt ihn mit einem Klick auf; dann kommt bei ihm die
// Einladung in die Gruppe an, und die App wechselt in die richtige
// Konferenz. Die Verbindung bleibt dabei stehen, denn der Raum ist derselbe.
//
// Toolkit-frei: Sie braucht nur den Raum, keine Daten der Gruppe.

import { useEffect } from "react"
import { X } from "lucide-react"
import { moderationVon } from "@kreis/core"
import { useKreisVerbindung } from "../raum-kontext"
import { VideoRaumFlaeche } from "./video-raum-flaeche"

export function BeitrittsKonferenz({ raumId, raumName, onSchliessen }: {
  /** Die Id der Gruppe, zugleich der Schluessel des Raums. */
  raumId: string
  raumName: string
  onSchliessen?: () => void
}) {
  // Warteraum: Ist er an, wartet, wer neu ist, bis ihn jemand hereinholt; so
  // lange bleiben Mikrofon und Kamera aus. Jedes Geraet haelt sich selbst daran.
  const kreis = useKreisVerbindung()
  const ich = kreis?.ich ?? null
  const kennung = ich ? kreis?.neben.kennungVon(ich) : undefined
  const wartet = !!kreis && kreis.zustand === "drin" && moderationVon(kreis.sitzung).warteraum && (!kennung || !kreis.neben.hereingeholt.has(kennung))
  useEffect(() => {
    if (!kreis) return
    kreis.setTonAus(wartet)
    if (!wartet) return
    void kreis.raum.mikro(false)
    void kreis.raum.kamera(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wartet])
  // Wer geht, laesst den Ton nicht ausgeschaltet zurueck.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => kreis?.setTonAus(false), [])

  if (wartet) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-slate-950 p-6 text-center text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">Warteraum</p>
        <h2 className="text-2xl font-semibold">„{raumName}“</h2>
        <p className="max-w-md text-sm text-slate-300">Du bist da. Gleich holt dich jemand aus der Runde herein. Mikrofon, Kamera und Ton bleiben so lange aus.</p>
        {onSchliessen && <button type="button" onClick={onSchliessen} className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20">Doch nicht</button>}
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div role="status" className="flex shrink-0 items-center gap-3 bg-amber-400 px-4 py-2 text-sm text-slate-900">
        <span className="min-w-0 flex-1">
          <span className="font-semibold">Willkommen in „{raumName}“.</span>{" "}
          Du bist neu in dieser Gruppe. Sobald dich jemand aus der Runde aufnimmt, kommt die Einladung bei dir an. Nimm sie an, dann gehörst du dazu.
        </span>
        {onSchliessen && (
          <button type="button" onClick={onSchliessen} aria-label="Beitritt schließen" className="rounded-full p-1 hover:bg-black/10">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1">
        <VideoRaumFlaeche raumId={raumId} raumName={raumName} />
      </div>
    </div>
  )
}

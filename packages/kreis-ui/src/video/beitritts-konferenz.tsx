// Die Konferenz fuer jemanden, der noch nicht zur Gruppe gehoert.
//
// Er kam ueber einen Einladungslink, hat seinen Zugang angelegt (zwoelf
// Woerter) und sitzt jetzt im selben Raum wie die Gruppe. Die Runde sieht
// ihn als "neu" und nimmt ihn mit einem Klick auf; dann kommt bei ihm die
// Einladung in die Gruppe an, und die App wechselt in die richtige
// Konferenz. Die Verbindung bleibt dabei stehen, denn der Raum ist derselbe.
//
// Toolkit-frei: Sie braucht nur den Raum, keine Daten der Gruppe.

import { X } from "lucide-react"
import { VideoRaumFlaeche } from "./video-raum-flaeche"

export function BeitrittsKonferenz({ raumId, raumName, onSchliessen }: {
  /** Die Id der Gruppe, zugleich der Schluessel des Raums. */
  raumId: string
  raumName: string
  onSchliessen?: () => void
}) {
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

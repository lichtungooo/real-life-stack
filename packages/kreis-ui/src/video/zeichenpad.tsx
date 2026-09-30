// Das Zeichenpad in der Mitte der Konferenz (Spec video, "Zeichenpad").
//
// Timo, 30.09.2026, mit Bildern aus Big Blue Button: zum Mitmalen,
// Aufzeichnen und Erklaeren. Wer es in die Mitte legt, praesentiert und
// zeichnet; ueber "Mehrere Benutzer" gibt er es fuer alle frei. Unten die
// Leiste wie bei BBB. Die Zeichenflaeche (Excalidraw, MIT) laedt erst,
// wenn jemand das Pad oeffnet.

import { lazy, Suspense, useState } from "react"
import { MoveHorizontal, Users } from "lucide-react"
import { darfZeichnen, padFreigeben, padUebernehmen } from "@kreis/core"
import type { KreisKontext } from "../raum-kontext"
import type { ZeichenpadSteuerung } from "./zeichenpad-flaeche"

const Flaeche = lazy(() => import("./zeichenpad-flaeche"))

export function ZeichenPad({ kreis }: { kreis: KreisKontext }) {
  const { sitzung, ich, handle, teilnehmer, neben } = kreis
  const wer = ich ?? ""
  const pad = sitzung.pad ?? null
  const darf = darfZeichnen(sitzung, wer)
  const ichPraesentiere = !!pad && pad.praesentiert === wer
  const praesentierender = teilnehmer.find((t) => t.id === pad?.praesentiert)
  const [steuerung, setSteuerung] = useState<ZeichenpadSteuerung | null>(null)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative min-h-0 flex-1">
        <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Das Zeichenpad lädt …</div>}>
          <Flaeche elemente={neben.pad} onAenderung={neben.padSenden} nurLesen={!darf} onSteuerung={setSteuerung} />
        </Suspense>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border px-3 py-2 text-sm">
        <span className="min-w-0 flex-1 truncate text-muted-foreground">
          {!pad ? "Alle zeichnen"
            : ichPraesentiere ? (pad.alle ? "Du präsentierst, alle zeichnen mit" : "Du präsentierst")
            : praesentierender ? `${praesentierender.name} präsentiert${pad.alle ? ", alle zeichnen mit" : ""}`
            : "Niemand präsentiert gerade"}
        </span>
        {ichPraesentiere && pad && (
          <button type="button" aria-pressed={pad.alle} title="Mehrere Benutzer: alle dürfen zeichnen"
            onClick={() => handle((s) => padFreigeben(s, !pad.alle, wer))}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${pad.alle ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}>
            <Users className="h-4 w-4" /> Mehrere Benutzer
          </button>
        )}
        {pad && !ichPraesentiere && !praesentierender && (
          <button type="button" onClick={() => handle((s) => padUebernehmen(s, wer, teilnehmer.map((t) => t.id)))}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">
            Präsentation übernehmen
          </button>
        )}
        <button type="button" onClick={() => steuerung?.anBreiteAnpassen()} disabled={!steuerung} title="An Breite anpassen" aria-label="An Breite anpassen"
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40">
          <MoveHorizontal className="h-4 w-4" />
        </button>
      </footer>
    </div>
  )
}

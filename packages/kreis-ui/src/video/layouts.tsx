// Die Layouts der Konferenz, wie in Big Blue Button (Timo, 30.09.2026, mit
// Bildschirmfoto): vier Ansichten als kleine Bilder, dazu "Fuer alle
// uebernehmen". Ohne den Schalter gilt die Wahl nur fuer mich.

import { useState } from "react"
import { Check, X } from "lucide-react"
import { LAYOUTS, type LayoutArt } from "../vorlieben"
import { Schalter } from "./einstellungen-dialog"

export const LAYOUT_NAMEN: Record<LayoutArt, string> = {
  oben: "Bilder oben",
  rechts: "Bilder rechts",
  praesentation: "Präsentation im Zentrum",
  video: "Video im Zentrum",
}

/** Ein kleines Bild der Aufteilung: dunkel die Leiste, grau die Mitte, hell die Menschen. */
function Skizze({ art }: { art: LayoutArt }) {
  const mensch = (x: number, y: number, b = 14, h = 10) => <rect key={`${x}-${y}`} x={x} y={y} width={b} height={h} rx="1.5" fill="#fff" />
  const leiste = <rect x="0" y="0" width="20" height="70" fill="#dbe1e8" />
  const buehne = (x: number, y: number, b: number, h: number) => (
    <g>
      <rect x={x} y={y} width={b} height={h} rx="2" fill="#374151" />
      <rect x={x + b / 2 - 7} y={y + h / 2 - 5} width="14" height="9" rx="1" fill="none" stroke="#fff" strokeWidth="1.2" />
    </g>
  )
  return (
    <svg viewBox="0 0 120 70" className="h-auto w-full rounded-md bg-slate-600" aria-hidden="true">
      {leiste}
      {art === "oben" && <>{[26, 45, 64, 83].map((x) => mensch(x, 4))}{buehne(24, 18, 92, 48)}</>}
      {art === "rechts" && <>{buehne(24, 4, 72, 62)}{[4, 19, 34, 49].map((y) => mensch(100, y, 16, 12))}</>}
      {art === "praesentation" && <>{buehne(24, 4, 92, 62)}{mensch(26, 54, 10, 7)}{mensch(38, 54, 10, 7)}</>}
      {art === "video" && <>{[[26, 6], [72, 6], [26, 36], [72, 36]].map(([x, y]) => mensch(x, y, 42, 26))}<rect x="22" y="56" width="16" height="11" rx="1.5" fill="#374151" /></>}
    </svg>
  )
}

export function LayoutDialog({ aktuell, onUebernehmen, onZu }: {
  aktuell: LayoutArt
  onUebernehmen: (art: LayoutArt, fuerAlle: boolean) => void
  onZu: () => void
}) {
  const [wahl, setWahl] = useState<LayoutArt>(aktuell)
  const [fuerAlle, setFuerAlle] = useState(false)
  return (
    <div role="dialog" aria-modal="true" aria-label="Layouts" className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onZu}>
      <div className="w-full max-w-2xl rounded-2xl bg-card p-6 text-foreground shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center">
          <h3 className="flex-1 text-center text-xl font-semibold">Layouts</h3>
          <button type="button" onClick={onZu} aria-label="Schließen" className="rounded-lg p-1.5 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-5">
          {LAYOUTS.map((art) => (
            <button key={art} type="button" onClick={() => setWahl(art)} aria-pressed={wahl === art}
              className={`relative flex flex-col items-center gap-2 rounded-xl p-2 text-sm ${wahl === art ? "ring-4 ring-primary" : "hover:bg-muted"}`}>
              <Skizze art={art} />
              {LAYOUT_NAMEN[art]}
              {wahl === art && <span className="absolute right-1 top-1 rounded bg-primary p-0.5 text-primary-foreground"><Check className="h-4 w-4" /></span>}
            </button>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-4">
          <span className="text-sm">Für alle übernehmen</span>
          <Schalter name="Für alle übernehmen" an={fuerAlle} onWechsel={setFuerAlle} />
          <button type="button" onClick={() => { onUebernehmen(wahl, fuerAlle); onZu() }}
            className="ml-auto rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            Übernehmen
          </button>
        </div>
      </div>
    </div>
  )
}

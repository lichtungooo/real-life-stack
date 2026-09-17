// Die Arten eines Netzwerks bearbeiten.
//
// Ein Netzwerk trägt die Arten, in denen seine Spaces geführt werden:
// Stiftung und Projekt, Ort und Gruppe, Marker und Gruppe. Hier werden sie
// angelegt, benannt, eingefärbt und entfernt.
//
// Die Komponente hält keinen eigenen Zustand. Sie bekommt die Zeilen und
// meldet drei Dinge: eine Aenderung während des Tippens (`onChange`), eine
// abgeschlossene Aenderung (`onCommit`, beim Verlassen eines Feldes) und das
// Entfernen einer Zeile. Wer sie einsetzt, entscheidet, wann geschrieben wird.
import { Input, Button } from "@real-life-stack/toolkit"
import { X, Plus } from "lucide-react"
import type { SpaceKind } from "@real-life-stack/toolkit"

export type ArtZeile = SpaceKind

export interface ArtenEditorProps {
  rows: ArtZeile[]
  onChange: (rows: ArtZeile[]) => void
  onCommit: (rows: ArtZeile[]) => void
  onRemove: (rows: ArtZeile[], index: number) => void
}

/** Grau, wenn eine Art keine Farbe traegt. Sie ist keine Aussage. */
const OHNE_FARBE = "#6b7280"

export function ArtenEditor({ rows, onChange, onCommit, onRemove }: ArtenEditorProps) {
  const update = (i: number, patch: Partial<ArtZeile>) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)))

  return (
    <div className="mt-2 space-y-1.5">
      {rows.map((row, i) => (
        // Eine neue Zeile hat noch keine Id. Der Platzhalter hält sie
        // auseinander, bis sie beim Schreiben einen Schlüssel bekommt.
        <div key={row.id || `neu-${i}`} className="flex items-center gap-1.5">
          <input
            type="color"
            aria-label="Farbe"
            value={row.color ?? OHNE_FARBE}
            onChange={(e) => update(i, { color: e.target.value })}
            onBlur={() => onCommit(rows)}
            className="h-8 w-8 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0.5"
          />
          <Input
            value={row.label}
            placeholder="Einzahl, z.B. Stiftung"
            aria-label="Einzahl"
            className="h-8 text-sm"
            onChange={(e) => update(i, { label: e.target.value })}
            onBlur={() => onCommit(rows)}
          />
          <Input
            value={row.labelPlural}
            placeholder="Mehrzahl"
            aria-label="Mehrzahl"
            className="h-8 text-sm"
            onChange={(e) => update(i, { labelPlural: e.target.value })}
            onBlur={() => onCommit(rows)}
          />
          <button
            type="button"
            aria-label={`${row.label || "Art"} entfernen`}
            onClick={() => onRemove(rows, i)}
            className="rounded p-1 text-muted-foreground hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...rows, { id: "", label: "", labelPlural: "" }])}
        className="flex items-center gap-1.5 rounded-full border border-dashed px-2.5 py-1 text-xs text-muted-foreground hover:border-primary hover:text-foreground"
      >
        <Plus className="h-3 w-3" /> Art hinzufügen
      </button>
    </div>
  )
}

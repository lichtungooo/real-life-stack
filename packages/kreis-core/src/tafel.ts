// Die Tafel in der Mitte der Konferenz, als reine Daten.
//
// Ein Strich ist eine Liste von Punkten in Anteilen der Flaeche (0 bis 1),
// damit er auf jedem Bildschirm an derselben Stelle liegt, gleich wie gross
// das Fenster ist. Striche reisen einzeln durch den Raum; wer spaeter kommt,
// fragt nach dem ganzen Stand. Fluechtig: Die Tafel endet mit der Sitzung.

export interface Strich {
  /** Eindeutig, damit ein doppelt empfangener Strich nur einmal steht. */
  id: string
  von: string
  farbe: string
  /** Strichbreite in Anteilen der Flaechenbreite. */
  breite: number
  punkte: readonly (readonly [number, number])[]
}

/** So viele Striche haelt die Tafel hoechstens; die aeltesten gehen zuerst. */
export const TAFEL_GRENZE = 2000

export const TAFEL_FARBEN = ["#1e293b", "#dc2626", "#2563eb", "#16a34a", "#d97706", "#9333ea"] as const

/** Einen Strich hinzufuegen. Einen, den es schon gibt, nicht noch einmal. */
export function strichDazu(striche: readonly Strich[], strich: Strich): readonly Strich[] {
  if (striche.some((s) => s.id === strich.id)) return striche
  const neu = [...striche, strich]
  return neu.length > TAFEL_GRENZE ? neu.slice(neu.length - TAFEL_GRENZE) : neu
}

/** Einen ganzen Stand einmischen (fuer Nachzuegler): Vereinigung nach Id, Reihenfolge bleibt. */
export function standEinmischen(striche: readonly Strich[], stand: readonly Strich[]): readonly Strich[] {
  let ergebnis = striche
  for (const s of stand) ergebnis = strichDazu(ergebnis, s)
  return ergebnis
}

/** Punkte auf zwei Nachkommastellen je Promille runden, damit Nachrichten klein bleiben. */
export function punktRunden(x: number, y: number): [number, number] {
  const r = (n: number) => Math.round(Math.min(1, Math.max(0, n)) * 1000) / 1000
  return [r(x), r(y)]
}

export function istStrich(wert: unknown): wert is Strich {
  if (!wert || typeof wert !== "object") return false
  const s = wert as Record<string, unknown>
  return typeof s.id === "string" && typeof s.farbe === "string" && typeof s.breite === "number" &&
    Array.isArray(s.punkte) && s.punkte.every((p) => Array.isArray(p) && p.length === 2 && p.every((z) => typeof z === "number"))
}

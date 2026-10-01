// Die Erweiterungen (DEFINITION Teil 8): was ein Space dazunehmen kann.
//
// Welche Module es gibt, sagt allein Antons Modul-Register. Dieses
// Verzeichnis zaehlt keine Module auf; es ergaenzt sie um Beschreibung,
// Erbauer und Reife, verschluesselt ueber die Modul-Id. Wuensche an Anton:
// `description` und `author` im Register, dann bleibt hier nur die Reife.

/** Geprueft: durch das grosse Testing und freigegeben. Beta: laeuft, noch nicht freigegeben. Keine Bewertung. */
export type Reife = "geprueft" | "beta"

/** Module, Komponenten (fertige Darstellungen, etwa ein ganzes Profil); Themes kommen. */
export type ErweiterungsArt = "modul" | "komponente" | "theme"

export interface ErweiterungsEintrag {
  /** Die Modul-Id aus Antons Register, bei einer Komponente ihre eigene Id. */
  id: string
  art: ErweiterungsArt
  /** Bei einer Komponente: ihr Name. Ein Modul traegt ihn in Antons Register. */
  name?: string
  /** Bei einer Komponente: der Typ, den sie darstellt (DEFINITION Teil 8). */
  fuerTyp?: string
  beschreibung: string
  erbauer: string
  reife: Reife
}

const ANTON = "Anton Tranelis · Real Life Stack"

/** Die Id der ersten Komponente. */
export const PROJEKT_PROFIL = "projekt-profil"

/** Das Verzeichnis. Eintraege ohne Modul im Register erscheinen nicht (Regel 3). */
export const ERWEITERUNGEN: readonly ErweiterungsEintrag[] = [
  { id: "feed", art: "modul", erbauer: ANTON, reife: "geprueft", beschreibung: "Beiträge des Space untereinander, das Neueste oben. Für Neuigkeiten, Fragen und Protokolle." },
  { id: "kanban", art: "modul", erbauer: ANTON, reife: "geprueft", beschreibung: "Aufgaben als Karten in Spalten nach ihrem Stand. Was offen ist, was läuft, was fertig ist." },
  { id: "calendar", art: "modul", erbauer: ANTON, reife: "geprueft", beschreibung: "Termine des Space in Monat, Woche, Tag oder als Liste." },
  { id: "map", art: "modul", erbauer: ANTON, reife: "geprueft", beschreibung: "Orte und alles mit einem Ort auf der Karte." },
  { id: "resonance", art: "modul", erbauer: ANTON, reife: "geprueft", beschreibung: "Aussagen, zu denen die Gruppe ihre Resonanz zeigt." },
  { id: "collection", art: "modul", erbauer: ANTON, reife: "geprueft", beschreibung: "Alle Einträge als Liste, zum Durchsehen und Sortieren." },
  { id: "graph", art: "modul", erbauer: ANTON, reife: "geprueft", beschreibung: "Wie Einträge miteinander verbunden sind, als Netz." },
  { id: "video", art: "modul", erbauer: "Timo Martin und Eli · Real Life Network", reife: "beta", beschreibung: "Treffen mit Bild und Ton, Kreis mit Redestab, Zeichenpad, Gruppenräume und Mitschrift auf dem eigenen Server." },
  { id: PROJEKT_PROFIL, art: "komponente", name: "Project Profile", fuerTyp: "project", erbauer: "Timo Martin und Eli · trustdonation", reife: "beta", beschreibung: "Die Seite, mit der sich ein Projekt zeigt: Titelbild, was fehlt, was sich ändert, wohin das Geld geht, Schritte, Team, Kontakt und Spenden über Open Collective." },
  { id: "companion", art: "modul", erbauer: "Eli · trustdonation", reife: "beta", beschreibung: "Eine Begleitung, die die Einträge des Space liest und beim nächsten Schritt hilft." },
]

/** Eine Erweiterung, wie die Uebersicht sie zeigt: Antons Eintrag plus unsere Angaben. */
export interface Erweiterung<M extends { id: string; label: string } = { id: string; label: string }> {
  id: string
  name: string
  art: ErweiterungsArt
  /** `null`, wenn das Verzeichnis die Erweiterung nicht kennt. */
  beschreibung: string | null
  erbauer: string | null
  reife: Reife
  /** Kennt das Verzeichnis sie? Sonst faellt sie sichtbar zurueck (Regel 2). */
  bekannt: boolean
  /** Der Eintrag aus Antons Register, unveraendert (Symbol und mehr). */
  modul: M
}

/**
 * Die Erweiterungen aus Antons Register (die eine Quelle) und unserem
 * Verzeichnis. Reihenfolge des Registers. Unbekanntes faellt als Beta ohne
 * Beschreibung zurueck; Verzeichniseintraege ohne Modul erscheinen nicht.
 */
export function erweiterungenAus<M extends { id: string; label: string }>(
  module: readonly M[],
  verzeichnis: readonly ErweiterungsEintrag[] = ERWEITERUNGEN,
): Erweiterung<M>[] {
  const je = new Map(verzeichnis.map((e) => [e.id, e]))
  return module.map((m) => {
    const e = je.get(m.id)
    return {
      id: m.id,
      name: m.label,
      art: e?.art ?? "modul",
      beschreibung: e?.beschreibung ?? null,
      erbauer: e?.erbauer ?? null,
      reife: e?.reife ?? "beta",
      bekannt: Boolean(e),
      modul: m,
    }
  })
}

/**
 * Ein Modul in die Liste eines Space nehmen oder herausnehmen. Gearbeitet
 * wird auf der gespeicherten Liste (oder den Vorgaben, wenn der Space keine
 * hat): Ids, die diese Instanz nicht kennt, bleiben stehen (Regel 4).
 * Gibt dieselbe Liste zurueck, wenn sich nichts aendert.
 */
export function modulSchalten(
  gespeichert: readonly string[] | undefined,
  vorgaben: readonly string[],
  id: string,
  an: boolean,
): readonly string[] {
  const basis = gespeichert ?? vorgaben
  const drin = basis.includes(id)
  if (an === drin) return basis
  return an ? [...basis, id] : basis.filter((m) => m !== id)
}

/**
 * Die Komponenten aus dem Verzeichnis. Sie stehen nicht in Antons
 * Modul-Register; ihre Quelle ist allein dieses Verzeichnis.
 */
export function komponentenAus(
  verzeichnis: readonly ErweiterungsEintrag[] = ERWEITERUNGEN,
): Erweiterung<{ id: string; label: string }>[] {
  return verzeichnis
    .filter((e) => e.art === "komponente")
    .map((e) => ({
      id: e.id,
      name: e.name ?? e.id,
      art: e.art,
      beschreibung: e.beschreibung,
      erbauer: e.erbauer,
      reife: e.reife,
      bekannt: true,
      modul: { id: e.id, label: e.name ?? e.id },
    }))
}

/** Die Komponenten, die ein Space gewaehlt hat (`Group.data.komponenten`). */
export function komponentenImSpace(daten: Record<string, unknown> | null | undefined): readonly string[] {
  const roh = daten?.komponenten
  return Array.isArray(roh) ? roh.filter((k): k is string => typeof k === "string") : []
}

/** Hat der Space diese Komponente gewaehlt? */
export function komponenteAktiv(daten: Record<string, unknown> | null | undefined, id: string): boolean {
  return komponentenImSpace(daten).includes(id)
}

// Der Raum-Adapter (Spec: docs/spec/modules/kreis.md, "Der Raum-Adapter").
//
// Wie die Karte ihren Karten-Library-Adapter hat, hat der Kreis einen
// Raum-Adapter. Das Modul kennt keinen Server und keine Bibliothek; es
// spricht mit diesem Vertrag. Der lokale Adapter (mehrere Tabs, ohne Server)
// liegt daneben, der LiveKit-Adapter kommt von der App.

export interface KreisTeilnehmer {
  id: string
  name: string
  ichSelbst: boolean
  spricht: boolean
  mikroAn: boolean
  kameraAn: boolean
  /** Teilt gerade den Bildschirm. Nur Adapter mit Medien kennen das. */
  teiltBildschirm?: boolean
}

export interface KreisRaum {
  /** Ob dieser Adapter Bild und Ton traegt. Der lokale tut es nicht. */
  readonly traegtMedien: boolean
  betreten(raum: string, name: string): Promise<void>
  verlassen(): Promise<void>
  /** Meine Id im Raum, `null` solange ich draussen bin. */
  ich(): string | null
  teilnehmer(): readonly KreisTeilnehmer[]
  /** Teilnehmer, Tracks oder Sprechen haben sich geaendert. Gibt das Abmelden zurueck. */
  beiAenderung(fn: () => void): () => void
  /** An alle anderen, verlaesslich, in Reihenfolge. */
  senden(nachricht: unknown): void
  beiNachricht(fn: (nachricht: unknown, von: string) => void): () => void
  mikro(an: boolean): Promise<void>
  kamera(an: boolean): Promise<void>
  /** Optional: das Bild eines Teilnehmers an ein Element haengen. Gibt das Loesen zurueck. */
  bildAnhaengen?(id: string, element: HTMLVideoElement): () => void
  /** Optional: den Ton eines Teilnehmers an ein Element haengen. */
  tonAnhaengen?(id: string, element: HTMLAudioElement): () => void
  /** Optional: den eigenen Bildschirm teilen oder das Teilen beenden. */
  bildschirm?(an: boolean): Promise<void>
  /** Optional: den geteilten Bildschirm eines Teilnehmers an ein Element haengen. */
  bildschirmAnhaengen?(id: string, element: HTMLVideoElement): () => void
}

/** Macht aus einem Namen eine Raumkennung: klein, ASCII, Strich statt Leerzeichen. */
export function raumKennung(roh: string | null | undefined): string {
  const sauber = (roh ?? "")
    .toLowerCase()
    .replace(/[äöüß]/g, (z) => ({ "ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss" })[z] ?? z)
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "")
  return sauber.length >= 3 ? sauber : `kreis-${sauber || "offen"}`
}

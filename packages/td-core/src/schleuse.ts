// Die Schleuse für Profile: was aus fremden Daten auf eine Seite darf.
//
// Project Profile und Stiftungsprofil lesen Daten, die jeder im Netzwerk
// schreiben kann. Beide gehen durch dieselben Prüfungen: Texte ohne
// Leerstellen, Zahlen ab null, Adressen nur, wenn ein Browser sie gefahrlos
// öffnet. Eine Prüfung, eine Stelle (Muster 1).

export type Roh = Record<string, unknown>

export const text = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null)
export const zahl = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null)
export const objekt = (v: unknown): Roh | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Roh) : null)
export const liste = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
export const texte = (v: unknown): string[] => liste(v).map(text).filter((t): t is string => t !== null)
/** `true`, `false` oder unbekannt. `false` ist eine Antwort und wird gezeigt. */
export const janein = (v: unknown): boolean | null => (typeof v === "boolean" ? v : null)

/** Nur Adressen, die ein Browser gefahrlos öffnet. */
export function sichereUrl(v: unknown): string | null {
  const t = text(v)
  if (!t) return null
  if (/^https?:\/\//i.test(t)) return t
  // Ohne Schema: als Webadresse lesen, solange es nach einer aussieht.
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(t)) return `https://${t}`
  return null
}

/** Bildquellen: Webadressen, Pfade der eigenen Instanz und eingebettete Bilder. */
export function sichererBildPfad(v: unknown): string | null {
  const t = text(v)
  if (!t) return null
  if (/^https?:\/\//i.test(t) || /^data:image\//i.test(t)) return t
  if (/^[\w./-]+\.(svg|png|jpe?g|webp|gif|avif)$/i.test(t) && !t.includes("..")) return t
  return null
}

/** Eine Mail-Adresse, wenn sie wie eine aussieht. */
export function sichereMail(v: unknown): string | null {
  const t = text(v)
  return t && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ? t : null
}

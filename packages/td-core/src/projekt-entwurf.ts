// Profil-Entwürfe über den eigenen Agenten (DEFINITION 13.6).
//
// Der Agent eines Menschen (Claude, Kimi, ein offenes Modell) entwirft ein
// Projektprofil über den MCP-Server `td-mcp`. Er speichert nichts: Er gibt
// einen Link, der den geprüften Entwurf im Fragment trägt, und der Mensch
// legt ihn in der App mit seiner eigenen Identität an.
//
// Hier steht die eine Feldliste (`PROJEKT_PROFIL_FELDER`), die Prüfung und
// das Kodieren. Vorgabe, MCP-Server, App und Tests leiten sich daraus ab.
// Was gültig ist, entscheidet dieselbe Schleuse wie beim Anzeigen:
// `projektProfil()`.

import { projektProfil } from "./projekt-profil.js"

export type EntwurfForm = "text" | "longtext" | "tags" | "list" | "objekt" | "ort" | "zeitraum"

export interface EntwurfFeld {
  id: string
  /** Die Frage, die der Agent dem Menschen stellt oder aus dem Text beantwortet. */
  frage: string
  form: EntwurfForm
  /** Ohne dieses Feld ist das Profil nicht fertig (DEFINITION Teil 8 und td-profil). */
  kern?: boolean
  /** Wie die Antwort aussieht. */
  hinweis: string
}

/** Die Felder eines Projektprofils, in der Reihenfolge, in der man fragt. */
export const PROJEKT_PROFIL_FELDER: readonly EntwurfFeld[] = /* @__PURE__ */ Object.freeze([
  { id: "title", frage: "Wie heißt das Projekt?", form: "text", kern: true, hinweis: "Name, kurz" },
  { id: "kurz", frage: "Was soll entstehen, in einem Satz, den ein Fremder versteht?", form: "text", kern: true, hinweis: "ein Satz, kein Titel" },
  { id: "beduerfnis", frage: "Was fehlt, wenn es dieses Projekt nicht gibt?", form: "longtext", kern: true, hinweis: "eine Lücke, kein Selbstbild: „Vierzig Bäche bleiben unbetreut“, nicht „wir sind ein Verein“" },
  { id: "description", frage: "Worum geht es, was passiert da genau?", form: "longtext", hinweis: "zwei bis drei Absätze, Leerzeile zwischen Absätzen" },
  { id: "address", frage: "Wo findet es statt?", form: "text", kern: true, hinweis: "echte Anschrift: Straße Nummer, PLZ Ort" },
  { id: "position", frage: "Wo genau auf der Karte?", form: "ort", hinweis: "{ lat, lng }; der Server kann es aus der Anschrift ergänzen" },
  { id: "zeitraum", frage: "Wann läuft es?", form: "zeitraum", hinweis: "{ von, bis } als Text, etwa „März 2027“" },
  { id: "tags", frage: "Welche Themen?", form: "tags", hinweis: "drei bis sechs Schlagworte, ohne #" },
  { id: "bilder", frage: "Welche Bilder gibt es?", form: "list", hinweis: "Adressen (https://…); das erste wird Titelbild. Keine eingebetteten Bilder" },
  { id: "kennzahlen", frage: "Welche Zahlen zeigen die Größe?", form: "list", hinweis: "höchstens vier { wert, was }, etwa { wert: \"120\", was: \"Kinder jede Woche\" }" },
  { id: "wirkung", frage: "Was ändert sich, wenn es gelingt?", form: "list", hinweis: "kurze Sätze, je eine Wirkung" },
  { id: "bedarfe", frage: "Wofür wird Geld gebraucht?", form: "list", hinweis: "{ wofuer, betrag } mit Betrag in Euro als Zahl" },
  { id: "schritte", frage: "Welche Schritte, was ist schon geschafft?", form: "list", hinweis: "{ titel, wann, erledigt }" },
  { id: "team", frage: "Wer steht dahinter?", form: "list", hinweis: "{ name, rolle }; nur Menschen, die zugestimmt haben" },
  { id: "kontakt", frage: "An wen wendet man sich?", form: "objekt", hinweis: "{ person, rolle, mail, telefon, website }" },
  { id: "spende", frage: "Wie viel wird gesammelt, und wo?", form: "objekt", hinweis: "{ ziel, gesammelt, unterstuetzende, opencollective, beispiel, stufen: [{ betrag, bewirkt }] }" },
] satisfies EntwurfFeld[])

/** Die Regeln, die der Agent beim Entwerfen befolgt. */
export const PROJEKT_ENTWURF_REGELN: readonly string[] = /* @__PURE__ */ Object.freeze([
  "Nichts erfinden. Was der Text des Menschen nicht hergibt, bleibt weg oder wird erfragt.",
  "Das Bedürfnis beschreibt eine Lücke in der Welt, nicht das Projekt.",
  "Eigene Worte, kein kopierter Text aus fremden Satzungen.",
  "Namen von Menschen nur, wenn sie zugestimmt haben; sonst die Rolle.",
  "Zahlen, die nicht stimmen, sind Beispiele: dann spende.beispiel = true.",
  "Bilder als Adressen (https://…), nie eingebettet.",
  "Klare Sprache: kurze Sätze, aktive Verben, keine Werbesprache.",
])

/** Größte Länge eines Entwurfs als JSON in Bytes (UTF-8), DEFINITION 13.6, Regel 5. */
export const ENTWURF_HOECHSTENS = 48_000

export interface ProjektEntwurf {
  /** Was in `Item.data` gespeichert wird: gültige Felder plus unbekannte. */
  daten: Record<string, unknown>
  /** Schlagworte für `Item.tags`. */
  tags: string[]
}

export interface EntwurfBericht {
  entwurf: ProjektEntwurf
  /** Welche Abschnitte das Profil zeigen wird. */
  zeigt: string[]
  /** Kernfelder, die fehlen; ohne sie ist das Profil nicht fertig. */
  fehlt: { id: string; frage: string }[]
  /** Was verworfen wurde, mit Grund. */
  verworfen: string[]
  /** Felder, die die Liste nicht kennt: bleiben liegen, erscheinen nicht. */
  unbekannt: string[]
}

type Roh = Record<string, unknown>
const objekt = (v: unknown): Roh | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Roh) : null)
const liste = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const text = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null)
// Rein markiert: Wer nur die Feldliste braucht, zieht die Prüfung nicht in seinen Hauptteil (Budget).
// Schlüssel, die ein Objekt verbiegen statt Daten zu tragen (Kimi, 02.10.2026).
const GEFAEHRLICH = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"])
const BEKANNT = /* @__PURE__ */ new Set([...PROJEKT_PROFIL_FELDER.map((f) => f.id), "muster", "color", "icon"])

/** Ort aus `{ lat, lng }` oder GeoJSON-Punkt, als GeoJSON wie bei den Stiftungen. */
export function ortAus(v: unknown): { type: "Point"; coordinates: [number, number] } | null {
  const o = objekt(v)
  if (!o) return null
  let lat: unknown, lng: unknown
  if (o.type === "Point" && Array.isArray(o.coordinates)) [lng, lat] = o.coordinates
  else ({ lat, lng } = o)
  if (typeof lat !== "number" || typeof lng !== "number") return null
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  return { type: "Point", coordinates: [lng, lat] }
}

function zaehlen(v: unknown) {
  return liste(v).length
}

/**
 * Einen Entwurf prüfen: was erscheint, was fehlt, was verworfen wird, und
 * was gespeichert würde. Wirft nie; ein kaputter Entwurf ergibt einen
 * leeren mit Bericht.
 */
export function projektEntwurfPruefen(roh: unknown): EntwurfBericht {
  const d = objekt(roh) ?? {}
  const verworfen: string[] = []
  if (!objekt(roh)) verworfen.push("Der Entwurf ist kein Objekt mit Feldern.")

  const tagsRoh = liste(d.tags)
  const tags = [...new Set(tagsRoh.map(text).filter((t): t is string => t !== null).map((t) => t.replace(/^#/, "")))]
  const p = projektProfil(d, [])

  const daten: Roh = {}
  for (const [k, v] of Object.entries(d)) if (!BEKANNT.has(k) && k !== "tags" && !GEFAEHRLICH.has(k)) daten[k] = v
  const unbekannt = Object.keys(d).filter((k) => !BEKANNT.has(k) && !GEFAEHRLICH.has(k))
  for (const k of Object.keys(d)) if (GEFAEHRLICH.has(k)) verworfen.push(`${k}: kein zulässiger Feldname`)

  if (text(d.title)) daten.title = text(d.title)
  for (const k of ["kurz", "beduerfnis", "description", "address"] as const) {
    if (text(d[k])) daten[k] = text(d[k])
    else if (d[k] !== undefined) verworfen.push(`${k}: kein Text`)
  }
  if (d.position !== undefined) {
    const ort = ortAus(d.position)
    if (ort) daten.position = ort
    else verworfen.push("position: weder { lat, lng } noch ein gültiger Punkt")
  }
  if (p.zeitraum) daten.zeitraum = d.zeitraum
  else if (d.zeitraum !== undefined) verworfen.push("zeitraum: weder Text noch { von, bis }")

  const bilder = [p.titelbild, ...p.galerie].filter((b): b is string => b !== null)
  for (const b of liste(d.bilder)) if (!bilder.includes(String(b).trim())) verworfen.push(`bilder: „${String(b).slice(0, 60)}“ ist keine sichere Adresse`)
  if (bilder.length) daten.bilder = bilder

  if (p.kennzahlen.length) daten.kennzahlen = p.kennzahlen
  if (zaehlen(d.kennzahlen) > p.kennzahlen.length) verworfen.push(`kennzahlen: ${zaehlen(d.kennzahlen) - p.kennzahlen.length} unvollständig oder über vier`)
  if (p.wirkung.length) daten.wirkung = p.wirkung
  if (zaehlen(d.wirkung) > p.wirkung.length) verworfen.push("wirkung: leere Einträge")
  if (p.bedarfe.length) daten.bedarfe = p.bedarfe.map((b) => (b.betrag === null ? { wofuer: b.wofuer } : { wofuer: b.wofuer, betrag: b.betrag }))
  if (zaehlen(d.bedarfe) > p.bedarfe.length) verworfen.push("bedarfe: Einträge ohne „wofuer“")
  if (p.schritte.length) daten.schritte = p.schritte.map((s) => ({ titel: s.titel, ...(s.wann ? { wann: s.wann } : {}), ...(s.erledigt ? { erledigt: true } : {}) }))
  if (zaehlen(d.schritte) > p.schritte.length) verworfen.push("schritte: Einträge ohne „titel“")
  if (p.team.length) daten.team = p.team.map((m) => (m.rolle ? { name: m.name, rolle: m.rolle } : { name: m.name }))
  if (zaehlen(d.team) > p.team.length) verworfen.push("team: Einträge ohne „name“")

  const kRoh = objekt(d.kontakt)
  if (p.kontakt) {
    const { adresse: _ort, ...k } = p.kontakt
    const ohneLeer = Object.fromEntries(Object.entries(k).filter(([, v]) => v !== null))
    if (Object.keys(ohneLeer).length) daten.kontakt = ohneLeer
  }
  if (kRoh?.mail !== undefined && !p.kontakt?.mail) verworfen.push("kontakt.mail: keine gültige Adresse")
  if (kRoh?.website !== undefined && !p.kontakt?.website) verworfen.push("kontakt.website: keine sichere Adresse")

  const sRoh = objekt(d.spende)
  if (p.spende) {
    const s = p.spende
    daten.spende = Object.fromEntries(Object.entries({
      ziel: s.ziel, gesammelt: s.gesammelt, unterstuetzende: s.unterstuetzende,
      opencollective: s.opencollective, beispiel: s.beispiel || null,
      stufen: s.stufen.length ? s.stufen.map((x) => (x.bewirkt ? x : { betrag: x.betrag })) : null,
    }).filter(([, v]) => v !== null))
  } else if (sRoh) verworfen.push("spende: weder Ziel, Betrag noch Open-Collective-Seite")
  if (sRoh?.opencollective !== undefined && !p.spende?.opencollective) verworfen.push("spende.opencollective: keine sichere Adresse")
  if (d.muster === true) daten.muster = true

  const fehlt = PROJEKT_PROFIL_FELDER.filter((f) => f.kern && daten[f.id] === undefined).map((f) => ({ id: f.id, frage: f.frage }))

  const zeigt: string[] = []
  const q = projektProfil(daten, tags)
  if (q.titelbild || q.kurz) zeigt.push("Kopf")
  if (q.kennzahlen.length) zeigt.push("Kennzahlen")
  if (q.spende) zeigt.push("Unterstützen")
  if (q.beduerfnis) zeigt.push("Was fehlt")
  if (q.beschreibung) zeigt.push("Worum es geht")
  if (q.wirkung.length) zeigt.push("Was sich ändert")
  if (q.bedarfe.length) zeigt.push("Wohin das Geld geht")
  if (q.schritte.length) zeigt.push("Schritte")
  if (q.team.length) zeigt.push("Wer dahinter steht")
  if (q.kontakt) zeigt.push("Kontakt")
  if (q.galerie.length) zeigt.push("Bilder")

  return { entwurf: { daten, tags }, zeigt, fehlt, verworfen, unbekannt }
}

// ── Der Entwurf im Fragment des Links ──────────────────────────────────────

const PRAEFIX = "projekt-entwurf="

function base64urlAus(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ""
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function textAusBase64url(kette: string): string {
  const b64 = kette.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((kette.length + 3) % 4)
  const bin = atob(b64)
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}

/** Den Entwurf als Fragment (ohne `#`). Wirft, wenn er zu groß ist. */
export function entwurfKodieren(entwurf: ProjektEntwurf): string {
  const json = JSON.stringify({ v: 1, ...entwurf })
  // In Bytes gemessen, wie beim Lesen: Umlaute und Typografie zählen doppelt.
  const bytes = new TextEncoder().encode(json).length
  if (bytes > ENTWURF_HOECHSTENS) throw new Error(`Der Entwurf ist zu groß (${bytes} Bytes, höchstens ${ENTWURF_HOECHSTENS}). Bilder als Adressen, Texte kürzen.`)
  return PRAEFIX + base64urlAus(json)
}

/**
 * Einen Entwurf aus dem Fragment lesen (mit oder ohne `#`). `null`, wenn das
 * Fragment keinen trägt; sonst der Bericht derselben Prüfung wie beim Agenten.
 */
export function entwurfLesen(fragment: string): EntwurfBericht | null {
  const f = fragment.replace(/^#/, "")
  if (!f.startsWith(PRAEFIX)) return null
  const kette = f.slice(PRAEFIX.length)
  // Base64 macht aus drei Bytes vier Zeichen: dieselbe Grenze wie beim Schreiben.
  if (kette.length > Math.ceil((ENTWURF_HOECHSTENS * 4) / 3) + 4) return null
  try {
    const roh = JSON.parse(textAusBase64url(kette)) as Roh
    if (!objekt(roh) || roh.v !== 1) return null
    return projektEntwurfPruefen({ ...objekt(roh.daten), tags: roh.tags })
  } catch {
    return null
  }
}

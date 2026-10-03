// Profile aus dem Gespräch (DEFINITION 13.8, Stufe 1 freigegeben von Timo am
// 03.10.2026): Stiftung und Einrichtung neben dem Projekt (13.6).
//
// Timo: *"Ich kann den einfach vollquatschen … wir sind der und der Verein …
// und bau das mal ein Profil auf, bitte."*
//
// Der eigene Agent eines Menschen holt über den MCP-Server die Vorgabe einer
// Art, prüft seinen Entwurf und gibt einen Link. Hier stehen die Feldliste
// der Einrichtung, eine Prüfung für jede Feldliste und das Kodieren für alle
// drei Arten. Geprüft wird mit denselben Hinweisen und derselben Bereinigung
// wie beim Bearbeiten (`feldHinweise`, `bereinigt`): Was der Agent abgibt,
// sieht so aus, als hätte ein Mensch es im Formular gespeichert.

import { STIFTUNGS_PROFIL_FELDER, bereinigt, feldHinweise, schlagworte, type EingabeFeld } from "./profil-felder.js"
import { ENTWURF_HOECHSTENS, PROJEKT_PROFIL_FELDER, projektEntwurfPruefen, ortAus, type EntwurfBericht } from "./projekt-entwurf.js"
import { stiftungsProfil } from "./stiftungs-profil.js"
import { PERSON_PROFIL_FELDER, SICHTBARKEITEN, personProfil, type Sichtbarkeit } from "./person-profil.js"

/** Die drei Arten eines Profils. */
export type ProfilArt = "projekt" | "stiftung" | "einrichtung" | "person"

export const PROFIL_ARTEN: readonly ProfilArt[] = ["projekt", "stiftung", "einrichtung", "person"]

/**
 * Woran der Agent erkennt, welche Art entsteht. Er fragt nach, wenn das
 * Erzählte es nicht sagt.
 */
export const PROFIL_ART_REGELN: Readonly<Record<ProfilArt, string>> = /* @__PURE__ */ Object.freeze({
  projekt: "Ein Vorhaben, das Unterstützung sucht: etwas soll entstehen, es braucht Geld, Hände oder Material. Wird ein Eintrag im Space, mit Spendenkarte.",
  stiftung: "Wer fördert: eine Stiftung, ein Förderprogramm, ein Unternehmen, das Geld für Projekte gibt. Wird ein Eintrag auf der Karte, für Projekte auf Fördersuche.",
  einrichtung: "Ein Verein, eine Initiative oder Gemeinschaft stellt sich als Ganzes vor, mit eigenem Space. Wird das Profil dieses Space; speichern kann nur, wer ihn verwaltet.",
  person: "Ein Mensch stellt sich selbst vor: wer er ist, was er kann, anbietet und sucht. Wird sein eigenes Profil; je Angabe entscheidet er, wer sie sieht (öffentlich, Kontakte, nur ich). Schlag für jede Angabe eine Stufe vor, Telefon nie öffentlich.",
})

/**
 * Das Profil einer Einrichtung, gespeichert in den Daten ihres Space
 * (DEFINITION Teil 9). Dieselben Felder wie der Bauplan `BAUPLAN_PROJEKT`,
 * den die Profil-Collage zeigt; Listen sind Texte.
 */
export const EINRICHTUNGS_PROFIL_FELDER: readonly EingabeFeld[] = /* @__PURE__ */ Object.freeze([
  { id: "kurz", name: "In einem Satz", frage: "Was macht ihr, in einem Satz, den ein Fremder versteht?", form: "text", kern: true, hinweis: "ein Satz" },
  { id: "beduerfnis", name: "Was ohne euch fehlt", frage: "Was fehlt, wenn es euch nicht gibt?", form: "longtext", kern: true, hinweis: "eine Lücke in der Welt, kein Selbstbild" },
  { id: "region", name: "Wo ihr wirkt", frage: "Wo wirkt ihr?", form: "tags", hinweis: "Orte oder Regionen als Liste" },
  { id: "themen", name: "Themen", frage: "Um welche Themen geht es?", form: "tags", hinweis: "drei bis sechs Themen als Liste" },
  { id: "zielgruppen", name: "Für wen", frage: "Für wen seid ihr da?", form: "tags", hinweis: "Liste" },
  { id: "wirkung", name: "Was sich ändert", frage: "Was ändert sich durch euch?", form: "list", hinweis: "kurze Sätze als Liste" },
  { id: "bedarfe", name: "Was ihr braucht", frage: "Was braucht ihr gerade?", form: "list", hinweis: "kurze Sätze als Liste, etwa „Werkzeug für die Fahrradwerkstatt, rund 800 €“" },
  { id: "vorhandenes", name: "Was schon da ist", frage: "Was habt ihr schon?", form: "list", hinweis: "Liste" },
  { id: "schritte", name: "Nächste Schritte", frage: "Was sind eure nächsten Schritte?", form: "list", hinweis: "Liste in der Reihenfolge" },
  { id: "gegruendet", name: "Gegründet", frage: "Seit wann gibt es euch?", form: "text", hinweis: "Jahr, etwa „2019“" },
  { id: "meilensteine", name: "Meilensteine", frage: "Was waren wichtige Stationen?", form: "list", hinweis: "Liste wie „2019: Gegründet von zwölf Nachbarinnen“" },
  { id: "mitwirkende", name: "Menschen", frage: "Wer macht mit?", form: "list", hinweis: "Namen nur mit Zustimmung, sonst Rollen" },
  { id: "address", name: "Anschrift", frage: "Wo findet man euch?", form: "text", hinweis: "Straße Nummer, PLZ Ort" },
  { id: "position", name: "Punkt auf der Karte", anschrift: "address", frage: "Wo genau auf der Karte?", form: "ort", hinweis: "{ lat, lng }; der Server kann es aus der Anschrift ergänzen" },
  { id: "image", name: "Bild", pruefung: "bild", frage: "Gibt es ein Bild oder Logo?", form: "text", hinweis: "Adresse (https://…), nie eingebettet" },
  { id: "website", name: "Website", pruefung: "url", frage: "Habt ihr eine Website?", form: "text", hinweis: "https://…" },
  { id: "mail", name: "Mail", pruefung: "mail", frage: "Unter welcher Mail erreicht man euch?", form: "text", hinweis: "eine Adresse" },
  { id: "telefon", name: "Telefon", frage: "Unter welcher Nummer?", form: "text", hinweis: "nur, wenn sie öffentlich sein soll" },
  { id: "rechtsform", name: "Rechtsform", frage: "Welche Rechtsform habt ihr?", form: "text", hinweis: "etwa „eingetragener Verein“" },
  { id: "register", name: "Register", frage: "Wo seid ihr eingetragen?", form: "text", hinweis: "etwa „VR 1234, Amtsgericht Kassel“" },
  { id: "gemeinnuetzig", name: "Gemeinnützig", frage: "Seid ihr als gemeinnützig anerkannt?", form: "janein", hinweis: "true oder false" },
] satisfies EingabeFeld[])

/** Die Regeln für Stiftung und Einrichtung; sie gelten wie beim Projekt. */
export const PROFIL_ENTWURF_REGELN: readonly string[] = /* @__PURE__ */ Object.freeze([
  "Nichts erfinden. Was der Mensch nicht erzählt, bleibt weg oder wird erfragt.",
  "Eigene Worte, keine kopierten Texte aus Satzungen oder fremden Websites.",
  "Namen von Menschen nur, wenn sie zugestimmt haben; sonst die Rolle.",
  "Zahlen nur, wenn sie stimmen.",
  "Bilder und Logos als Adressen (https://…), nie eingebettet.",
  "Klare Sprache: kurze Sätze, aktive Verben, keine Werbesprache.",
])

const GEFAEHRLICH = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"])
type Roh = Record<string, unknown>
const objekt = (v: unknown): Roh | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Roh) : null)

/** Die Feldliste einer Art. */
export function felderFuer(art: ProfilArt): readonly EingabeFeld[] {
  return art === "projekt" ? PROJEKT_PROFIL_FELDER : art === "stiftung" ? STIFTUNGS_PROFIL_FELDER : art === "person" ? PERSON_PROFIL_FELDER : EINRICHTUNGS_PROFIL_FELDER
}

/**
 * Ein Entwurf entlang einer Feldliste: bereinigt wie beim Speichern, mit den
 * Hinweisen des Formulars. Unbekannte Felder bleiben liegen und erscheinen nicht.
 */
function nachFeldliste(felder: readonly EingabeFeld[], roh: unknown, extra: readonly string[]): Omit<EntwurfBericht, "zeigt"> {
  const d = objekt(roh) ?? {}
  const verworfen: string[] = []
  if (!objekt(roh)) verworfen.push("Der Entwurf ist kein Objekt mit Feldern.")
  const bekannt = new Set([...felder.map((f) => f.id), ...extra])
  const daten: Roh = {}
  let tags: string[] = []
  for (const k of Object.keys(d)) if (GEFAEHRLICH.has(k)) verworfen.push(`${k}: kein zulässiger Feldname`)
  const unbekannt = Object.keys(d).filter((k) => !bekannt.has(k) && !GEFAEHRLICH.has(k))
  for (const k of unbekannt) daten[k] = d[k]
  for (const k of extra) if (d[k] !== undefined && k !== "tags") daten[k] = d[k]
  for (const f of felder) {
    const v = d[f.id]
    if (v === undefined) continue
    verworfen.push(...feldHinweise(f, v))
    if (f.form === "ort") {
      const ort = ortAus(v)
      if (ort) daten[f.id] = ort
      else verworfen.push(`${f.name ?? f.id}: weder { lat, lng } noch ein gültiger Punkt`)
      continue
    }
    const b = f.form === "tags" ? schlagworte(v) : bereinigt(v)
    if (f.amEintrag) tags = Array.isArray(b) ? (b as string[]) : []
    else if (b !== undefined && !(Array.isArray(b) && b.length === 0)) daten[f.id] = b
  }
  if (extra.includes("tags") && d.tags !== undefined) tags = schlagworte(d.tags)
  const fehlt = felder.filter((f) => f.kern && daten[f.id] === undefined).map((f) => ({ id: f.id, frage: f.frage }))
  return { entwurf: { daten, tags }, fehlt, verworfen, unbekannt }
}

/** Einen Stiftungsentwurf prüfen; erscheint mit dem Stiftungsprofil. */
export function stiftungEntwurfPruefen(roh: unknown): EntwurfBericht {
  const b = nachFeldliste(STIFTUNGS_PROFIL_FELDER, roh, ["tags"])
  const p = stiftungsProfil(b.entwurf.daten)
  const zeigt: string[] = []
  if (p.kurz) zeigt.push("Kopf")
  if (p.kennzahlen.length || p.summe || p.volumenJahr) zeigt.push("Zahlen")
  if (p.schwerpunkte.length || p.foerderbereiche.length) zeigt.push("Was sie fördert")
  if (p.beispiele.length) zeigt.push("Beispiele")
  if (p.herkunft) zeigt.push("Woher sie kommt")
  if (p.zielgruppen.length || p.hinweis) zeigt.push("Für wen")
  if (p.kontakt) zeigt.push("Kontakt")
  return { ...b, zeigt }
}

/** Einen Entwurf für das Profil einer Einrichtung prüfen; erscheint als Profil ihres Space. */
export function einrichtungEntwurfPruefen(roh: unknown): EntwurfBericht {
  const b = nachFeldliste(EINRICHTUNGS_PROFIL_FELDER, roh, [])
  // Die Collage wählt ihren Bauplan über `kind` (profil.ts, bauplanFuer).
  b.entwurf.daten.kind = "projekt"
  const d = b.entwurf.daten
  const zeigt: string[] = []
  if (d.kurz || d.region) zeigt.push("Kopf")
  if (d.beduerfnis || d.themen || d.wirkung || d.bedarfe || d.schritte) zeigt.push("Worum es geht")
  if (d.gegruendet || d.meilensteine) zeigt.push("Geschichte")
  if (d.position) zeigt.push("Wo")
  if (d.mitwirkende) zeigt.push("Mitwirkende")
  if (d.website || d.mail || d.telefon) zeigt.push("Kontakt")
  if (d.rechtsform || d.register || d.gemeinnuetzig !== undefined) zeigt.push("Rechtliches")
  return { ...b, zeigt }
}

/**
 * Einen Entwurf für das Profil eines Menschen prüfen (DEFINITION 9.1). Die
 * vorgeschlagenen Stufen (`sichtbar`) bleiben, soweit sie gültig sind.
 */
export function personEntwurfPruefen(roh: unknown): EntwurfBericht {
  const b = nachFeldliste(PERSON_PROFIL_FELDER, roh, ["sichtbar"])
  const d = b.entwurf.daten
  const vorschlag = objekt(d.sichtbar) ?? {}
  const sichtbar: Record<string, Sichtbarkeit> = {}
  for (const f of PERSON_PROFIL_FELDER) {
    const s = vorschlag[f.id]
    if (typeof s === "string" && (SICHTBARKEITEN as readonly string[]).includes(s)) sichtbar[f.id] = f.id === "telefon" && s === "oeffentlich" ? "kontakte" : (s as Sichtbarkeit)
  }
  if (Object.keys(vorschlag).some((k) => !(k in sichtbar))) b.verworfen.push("sichtbar: unbekannte Felder oder Stufen weggelassen (Stufen: oeffentlich, kontakte, privat)")
  if (Object.keys(sichtbar).length) d.sichtbar = sichtbar
  else delete d.sichtbar
  const p = personProfil(d)
  const zeigt: string[] = []
  if (p.kurz || p.bild) zeigt.push("Kopf")
  if (p.ueber) zeigt.push("Über mich")
  if (p.kann.length) zeigt.push("Was ich kann")
  if (p.bietet.length) zeigt.push("Was ich anbiete")
  if (p.sucht.length) zeigt.push("Was ich suche")
  if (p.mitmachen.length) zeigt.push("Wo ich mitmache")
  if (p.ort) zeigt.push("Wo ich wirke")
  if (p.kontakt.website || p.kontakt.mail || p.kontakt.telefon || p.kontakt.links.length) zeigt.push("Kontakt")
  return { ...b, zeigt }
}

/** Die Prüfung einer Art. */
export function profilEntwurfPruefen(art: ProfilArt, roh: unknown): EntwurfBericht {
  return art === "projekt" ? projektEntwurfPruefen(roh) : art === "stiftung" ? stiftungEntwurfPruefen(roh) : art === "person" ? personEntwurfPruefen(roh) : einrichtungEntwurfPruefen(roh)
}

// ── Im Fragment des Links ──────────────────────────────────────────────────

const praefix = (art: ProfilArt) => `${art}-entwurf=`

function base64urlAus(t: string): string {
  let bin = ""
  for (const b of new TextEncoder().encode(t)) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function textAusBase64url(kette: string): string {
  const b64 = kette.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((kette.length + 3) % 4)
  return new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)))
}

/** Einen geprüften Entwurf einer Art als Fragment (ohne `#`). Wirft, wenn er zu groß ist. */
export function profilEntwurfKodieren(art: ProfilArt, entwurf: EntwurfBericht["entwurf"]): string {
  const json = JSON.stringify({ v: 1, ...entwurf })
  const bytes = new TextEncoder().encode(json).length
  if (bytes > ENTWURF_HOECHSTENS) throw new Error(`Der Entwurf ist zu groß (${bytes} Bytes, höchstens ${ENTWURF_HOECHSTENS}). Bilder als Adressen, Texte kürzen.`)
  return praefix(art) + base64urlAus(json)
}

/**
 * Einen Entwurf aus dem Fragment lesen (mit oder ohne `#`), gleich welcher
 * Art. `null`, wenn das Fragment keinen trägt; sonst Art und der Bericht
 * derselben Prüfung wie beim Agenten.
 */
export function profilEntwurfLesen(fragment: string): { art: ProfilArt; bericht: EntwurfBericht } | null {
  const f = fragment.replace(/^#/, "")
  const art = PROFIL_ARTEN.find((a) => f.startsWith(praefix(a)))
  if (!art) return null
  const kette = f.slice(praefix(art).length)
  if (kette.length > Math.ceil((ENTWURF_HOECHSTENS * 4) / 3) + 4) return null
  try {
    const roh = JSON.parse(textAusBase64url(kette)) as Roh
    if (!objekt(roh) || roh.v !== 1) return null
    return { art, bericht: profilEntwurfPruefen(art, { ...objekt(roh.daten), tags: roh.tags }) }
  } catch {
    return null
  }
}

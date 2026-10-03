// Das Profil eines Menschen (DEFINITION 9.1, freigegeben von Timo am 03.10.2026).
//
// Timo: *"Bei meinem Profil ist es sehr, sehr wichtig, was ich wirklich
// freigeben will. Was will ich von mir eintragen, und was soll die
// Öffentlichkeit sehen, wenn sie auf mein Profil klicken?"*
//
// Ein `person`-Eintrag nach Antons Spec 12 (`id = DID`, persönlicher Space).
// Jede Angabe trägt eine Stufe in `data.sichtbar`. Was eine Stufe heute
// technisch bewirkt, sagt `werSiehtHeute`: Öffentlich erreicht nur, was
// Antons Profil-Server trägt (Name, Über mich, Bild); das Teilen mit
// Kontakten baut Anton noch (Wunsch in NAEHTE.md).

import type { EingabeFeld } from "./profil-felder.js"
import { liste, objekt, sichereMail, sichererBildPfad, sichereUrl, text, texte, type Roh } from "./schleuse.js"

export type Sichtbarkeit = "oeffentlich" | "kontakte" | "privat"
export const SICHTBARKEITEN: readonly Sichtbarkeit[] = ["oeffentlich", "kontakte", "privat"]

export const SICHTBARKEIT_NAME: Readonly<Record<Sichtbarkeit, string>> = { oeffentlich: "Öffentlich", kontakte: "Kontakte und meine Spaces", privat: "Nur ich" }

/** Die Angaben eines Menschen, in der Reihenfolge, in der man fragt. */
export const PERSON_PROFIL_FELDER: readonly EingabeFeld[] = /* @__PURE__ */ Object.freeze([
  { id: "displayName", name: "Name", abschnitt: "kopf", frage: "Wie heißt du, oder wie nennt man dich?", form: "text", kern: true, hinweis: "Name, wie er erscheinen soll" },
  { id: "kurz", name: "In einem Satz", abschnitt: "kopf", frage: "Was machst du, in einem Satz?", form: "text", kern: true, hinweis: "ein Satz, etwa „Ich baue Netzwerke für Menschen, die etwas bewegen“" },
  { id: "avatarUrl", name: "Bild", abschnitt: "kopf", pruefung: "bild", frage: "Gibt es ein Bild von dir?", form: "text", hinweis: "Adresse (https://…), nie eingebettet" },
  { id: "bio", name: "Über mich", abschnitt: "ueber", frage: "Erzähl etwas über dich: woher du kommst, was dich antreibt.", form: "longtext", hinweis: "zwei, drei Absätze in eigenen Worten" },
  { id: "kann", name: "Was ich kann", abschnitt: "kann", frage: "Was kannst du gut?", form: "tags", hinweis: "Fähigkeiten als Liste, etwa Holzbau, Moderation" },
  { id: "bietet", name: "Was ich anbiete", abschnitt: "bietet", frage: "Was bietest du anderen an?", form: "list", hinweis: "kurze Sätze, je ein Angebot" },
  { id: "sucht", name: "Was ich suche", abschnitt: "sucht", frage: "Was suchst du gerade?", form: "list", hinweis: "kurze Sätze, je ein Wunsch" },
  { id: "mitmachen", name: "Wo ich mitmache", abschnitt: "mitmachen", frage: "Bei welchen Projekten, Vereinen oder Netzwerken machst du mit?", form: "list", hinweis: "Liste" },
  { id: "locationName", name: "Wo ich wirke", abschnitt: "ort", frage: "Wo bist du zu Hause, wo wirkst du?", form: "text", hinweis: "Ort oder Region, keine Anschrift" },
  { id: "website", name: "Website", abschnitt: "kontakt", pruefung: "url", frage: "Hast du eine Website?", form: "text", hinweis: "https://…" },
  { id: "mail", name: "Mail", abschnitt: "kontakt", pruefung: "mail", frage: "Unter welcher Mail erreicht man dich?", form: "text", hinweis: "eine Adresse" },
  { id: "telefon", name: "Telefon", abschnitt: "kontakt", frage: "Unter welcher Nummer?", form: "text", hinweis: "nie öffentlich" },
  { id: "links", name: "Links", abschnitt: "kontakt", pruefung: "url", frage: "Welche Links gehören zu dir (Netzwerke, Projekte)?", form: "list", hinweis: "Adressen (https://…)" },
] satisfies EingabeFeld[])

/** Was Antons Profil-Server heute trägt: nur das erreicht wirklich alle. */
export const HEUTE_OEFFENTLICH: readonly string[] = ["displayName", "bio", "avatarUrl"]
/** Was nie öffentlich wird (DEFINITION 9.1). */
export const NIE_OEFFENTLICH: readonly string[] = ["telefon"]

const IDS = new Set(PERSON_PROFIL_FELDER.map((f) => f.id))
const istStufe = (v: unknown): v is Sichtbarkeit => v === "oeffentlich" || v === "kontakte" || v === "privat"

/** Die Stufe einer Angabe. Vorgabe: der Name öffentlich, alles andere nur für mich. */
export function sichtbarkeit(daten: Roh | null | undefined, feld: string): Sichtbarkeit {
  const s = objekt(daten?.sichtbar)?.[feld]
  const stufe: Sichtbarkeit = istStufe(s) ? s : feld === "displayName" ? "oeffentlich" : "privat"
  return stufe === "oeffentlich" && NIE_OEFFENTLICH.includes(feld) ? "kontakte" : stufe
}

/** Eine Stufe setzen; gibt die ganzen Daten zurück (jeder Connector ersetzt `data`). */
export function sichtbarkeitSetzen(daten: Roh | null | undefined, feld: string, stufe: Sichtbarkeit): Roh {
  const aus: Roh = { ...(daten ?? {}) }
  if (!IDS.has(feld)) return aus
  const neu = stufe === "oeffentlich" && NIE_OEFFENTLICH.includes(feld) ? "kontakte" : stufe
  aus.sichtbar = { ...(objekt(daten?.sichtbar) ?? {}), [feld]: neu }
  return aus
}

/** Wer eine Angabe heute wirklich sieht, ehrlich: „alle“ oder „nur du“. */
export function werSiehtHeute(feld: string, stufe: Sichtbarkeit): "alle" | "nur du" {
  return stufe === "oeffentlich" && HEUTE_OEFFENTLICH.includes(feld) ? "alle" : "nur du"
}

export interface PersonProfil {
  name: string
  kurz: string | null
  bild: string | null
  ueber: string | null
  kann: string[]
  bietet: string[]
  sucht: string[]
  mitmachen: string[]
  ort: string | null
  kontakt: { website: string | null; mail: string | null; telefon: string | null; links: string[] }
  kennung: string | null
}

/**
 * Das Profil für die Anzeige. `fuer: "oeffentlich"` zeigt nur, was auf
 * „Öffentlich“ steht, so wie andere es sehen sollen.
 */
export function personProfil(daten: Roh | null | undefined, fuer: "ich" | "oeffentlich" = "ich"): PersonProfil {
  const d = daten ?? {}
  const zeigt = (feld: string) => fuer === "ich" || sichtbarkeit(d, feld) === "oeffentlich"
  const nur = <T>(feld: string, wert: T, leer: T): T => (zeigt(feld) ? wert : leer)
  return {
    name: text(d.displayName) ?? text(d.title) ?? "Ohne Namen",
    kurz: nur("kurz", text(d.kurz), null),
    bild: nur("avatarUrl", sichererBildPfad(d.avatarUrl), null),
    ueber: nur("bio", text(d.bio), null),
    kann: nur("kann", texte(d.kann).map((t) => t.replace(/^#+/, "")), []),
    bietet: nur("bietet", texte(d.bietet), []),
    sucht: nur("sucht", texte(d.sucht), []),
    mitmachen: nur("mitmachen", texte(d.mitmachen), []),
    ort: nur("locationName", text(d.locationName), null),
    kontakt: {
      website: nur("website", sichereUrl(d.website), null),
      mail: nur("mail", sichereMail(d.mail), null),
      telefon: nur("telefon", text(d.telefon), null),
      links: nur("links", liste(d.links).map(sichereUrl).filter((x): x is string => !!x), []),
    },
    kennung: text(d.did),
  }
}

/**
 * Was über Antons `updateMyProfile` an Kopfzeile, Kontakte und Profil-Server
 * geht: der Name immer, Über mich und Bild nur, wenn sie öffentlich sind.
 */
export function oeffentlichesProfil(daten: Roh | null | undefined): { name: string; bio: string; avatar?: string } {
  const p = personProfil(daten, "oeffentlich")
  return { name: p.name, bio: p.ueber ?? "", ...(p.bild ? { avatar: p.bild } : {}) }
}

/** Ein Musterprofil für die Beispielwelt (dort hat der Connector kein Profil). */
export const MUSTER_PERSON: Roh = /* @__PURE__ */ Object.freeze({
  displayName: "Mira Beispiel",
  kurz: "Ich baue Werkstätten, in denen Jugendliche ein Handwerk lernen.",
  bio: "Gelernte Tischlerin, seit zehn Jahren in der offenen Jugendarbeit.\n\nMich treibt an, dass Hände und Köpfe zusammen wachsen.",
  kann: ["Holzbau", "Moderation", "Förderanträge"],
  bietet: ["Werkstattführungen für Schulklassen", "Beratung beim Aufbau einer offenen Werkstatt"],
  sucht: ["Werkzeugspenden", "Menschen, die einmal im Monat mitschrauben"],
  mitmachen: ["Radwerkstatt Nord", "Netzwerk offene Werkstätten"],
  locationName: "Kassel",
  website: "https://example.org",
  sichtbar: { displayName: "oeffentlich", kurz: "oeffentlich", bio: "oeffentlich", kann: "oeffentlich", bietet: "kontakte", sucht: "kontakte", mitmachen: "oeffentlich", locationName: "oeffentlich", website: "oeffentlich" },
  muster: true,
})

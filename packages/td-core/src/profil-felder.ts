// Profile bearbeiten (DEFINITION Teil 8, „Profile bearbeiten“): die
// Feldlisten und was beim Speichern geschieht.
//
// Eine Feldliste je Profil. Aus ihr lesen das Formular in der App, die
// Begleitung über den MCP-Server und die Prüfung. Jedes Feld nennt seinen
// Abschnitt (wo der Stift sitzt), seine Form (welche Eingabe) und bei
// Listen von Objekten seine Teile.
//
// Gespeichert wird je Abschnitt und immer mit den ganzen Daten: Alle
// Connectoren ersetzen `data` (Kimi, 02.10.2026). Felder, die das Formular
// nicht kennt, bleiben stehen. Was die Schleuse beim Anzeigen verwerfen
// würde, sagt `feldHinweise` vorher am Feld.

import { text, zahl, objekt, liste, sichereUrl, sichererBildPfad, sichereMail, type Roh } from "./schleuse.js"

export type EingabeForm = "text" | "longtext" | "tags" | "list" | "objekt" | "ort" | "zeitraum" | "geld" | "zahl" | "janein"

/** Welche Prüfung der Schleuse ein Text besteht, bevor er erscheint. */
export type EingabePruefung = "url" | "bild" | "mail" | "farbe"

export interface EingabeTeil {
  id: string
  /** Die Beschriftung im Formular. */
  name: string
  form: EingabeForm
  pruefung?: EingabePruefung
  /** Ohne diesen Teil fällt der Eintrag beim Anzeigen weg. */
  pflicht?: boolean
  /** Teile eines Objekts oder der Einträge einer Liste. */
  teile?: readonly EingabeTeil[]
}

export interface EingabeFeld {
  id: string
  /** Die Frage, die der Agent dem Menschen stellt oder aus dem Text beantwortet. */
  frage: string
  form: EingabeForm
  /** Ohne dieses Feld ist das Profil nicht fertig (DEFINITION Teil 8 und td-profil). */
  kern?: boolean
  /** Wie die Antwort aussieht (für den Agenten, mit der Form der Daten). */
  hinweis: string
  /** Wie die Antwort aussieht, für Menschen im Formular; sonst `hinweis`. Leer: keiner. */
  hilfe?: string
  /** Die Beschriftung im Formular; sonst die Frage. */
  name?: string
  /** Der Abschnitt der Seite, dessen Stift dieses Feld öffnet. */
  abschnitt?: string
  pruefung?: EingabePruefung
  /** Teile eines Objekts oder der Einträge einer Liste. */
  teile?: readonly EingabeTeil[]
  /** Wie viele Einträge die Seite zeigt. */
  hoechstens?: number
  /** Steht am Eintrag selbst (`Item.tags`), nicht in `data`. */
  amEintrag?: boolean
  /** Beim Ort: das Feld, in das die gefundene Anschrift geht. */
  anschrift?: string
}

/** Die Felder eines Stiftungsprofils, in der Reihenfolge der Seite. */
export const STIFTUNGS_PROFIL_FELDER: readonly EingabeFeld[] = /* @__PURE__ */ Object.freeze([
  { id: "title", name: "Name", frage: "Wie heißt die Stiftung?", form: "text", kern: true, abschnitt: "kopf", hinweis: "voller Name, wie im Register" },
  { id: "foerdererart", name: "Art", frage: "Was für ein Förderer ist sie?", form: "text", kern: true, abschnitt: "kopf", hinweis: "Stiftung, Förderverein, Bürgerstiftung" },
  { id: "art", name: "Arbeitsweise", frage: "Fördert sie oder arbeitet sie selbst?", form: "text", abschnitt: "kopf", hinweis: "fördernd, operativ oder beides" },
  { id: "sitz", name: "Sitz", frage: "Wo hat sie ihren Sitz?", form: "text", abschnitt: "kopf", hinweis: "Ort" },
  { id: "reichweite", name: "Reichweite", frage: "Wo fördert sie?", form: "tags", abschnitt: "kopf", hinweis: "regional, Hessen, bundesweit" },
  { id: "bild", name: "Logo", frage: "Gibt es ein Logo?", form: "text", pruefung: "bild", abschnitt: "kopf", hinweis: "Adresse des Bildes (https://…)" },
  { id: "hausfarbe", name: "Hausfarbe", frage: "Welche Farbe trägt sie?", form: "text", pruefung: "farbe", abschnitt: "kopf", hinweis: "#990000" },
  { id: "antragsweg", name: "So läuft der Antrag", frage: "Wie kommt ein Projekt zur Förderung?", form: "longtext", abschnitt: "antrag", hinweis: "zwei, drei Sätze: erst anfragen, dann Antrag, wer entscheidet" },
  { id: "antragsportal", name: "Antragsportal", frage: "Gibt es ein eigenes Portal für Anträge?", form: "text", pruefung: "url", abschnitt: "antrag", hinweis: "https://…" },
  { id: "fristen", name: "Fristen", frage: "Welche Fristen gelten?", form: "list", abschnitt: "antrag", hinweis: "je Frist eine Zeile" },
  { id: "unterlagen", name: "Was man einreicht", frage: "Welche Unterlagen braucht ein Antrag?", form: "list", abschnitt: "antrag", hinweis: "je Unterlage eine Zeile" },
  { id: "summeVon", name: "Förderung ab", frage: "Ab welcher Summe fördert sie?", form: "geld", abschnitt: "antrag", hinweis: "Euro" },
  { id: "summeBis", name: "Förderung bis", frage: "Bis zu welcher Summe?", form: "geld", abschnitt: "antrag", hinweis: "Euro" },
  { id: "volumenJahr", name: "Fördervolumen im Jahr", frage: "Wie viel vergibt sie im Jahr?", form: "geld", abschnitt: "antrag", hinweis: "Euro" },
  { id: "zweck", name: "Zweck", frage: "Wofür ist sie da?", form: "longtext", abschnitt: "foerderung", hinweis: "in eigenen Worten, kein Satzungstext" },
  { id: "foerderbereiche", name: "Förderbereiche", frage: "Welche Bereiche fördert sie?", form: "tags", abschnitt: "foerderung", hinweis: "Bildung, Kinder, Umwelt" },
  { id: "zielgruppen", name: "Für wen", frage: "Für wen fördert sie?", form: "tags", abschnitt: "foerderung", hinweis: "Jugendliche, Familien" },
  { id: "hinweis", name: "Woran man erkennt, dass man passt", frage: "Woran erkennt ein Projekt, dass es passt?", form: "longtext", abschnitt: "hinweis", hinweis: "ein, zwei Sätze" },
  { id: "bisherGefoerdert", name: "Schon gefördert", frage: "Was hat sie schon gefördert?", form: "list", abschnitt: "bisher", hinweis: "je Projekt eine Zeile" },
  { id: "zustiftung", name: "Zustiftung möglich", frage: "Nimmt sie Zustiftungen an?", form: "janein", abschnitt: "geben", hinweis: "ja, nein oder keine Angabe" },
  { id: "spende", name: "Spenden willkommen", frage: "Nimmt sie Spenden an?", form: "janein", abschnitt: "geben", hinweis: "ja, nein oder keine Angabe" },
  { id: "treuhand", name: "Treuhandstiftung unter ihrem Dach", frage: "Kann man unter ihrem Dach eine Treuhandstiftung gründen?", form: "janein", abschnitt: "geben", hinweis: "ja, nein oder keine Angabe" },
  { id: "ansprache", name: "Ansprechperson", frage: "Wen spricht man an?", form: "text", abschnitt: "kontakt", hinweis: "Name oder Rolle" },
  { id: "address", name: "Anschrift", frage: "Wie lautet die Anschrift?", form: "text", abschnitt: "kontakt", hinweis: "Straße Nummer, PLZ Ort" },
  { id: "position", name: "Punkt auf der Karte", frage: "Wo genau auf der Karte?", form: "ort", anschrift: "address", abschnitt: "kontakt", hinweis: "{ lat, lng } oder GeoJSON-Punkt", hilfe: "aus der Anschrift gesucht" },
  { id: "anschriftQuelle", name: "Quelle der Anschrift", frage: "Woher stammt die Anschrift?", form: "text", pruefung: "url", abschnitt: "kontakt", hinweis: "Impressum oder Register, https://…" },
  { id: "mail", name: "Mail", frage: "Unter welcher Mail-Adresse?", form: "text", pruefung: "mail", abschnitt: "kontakt", hinweis: "name@stiftung.de" },
  { id: "website", name: "Website", frage: "Wie heißt die Website?", form: "text", pruefung: "url", abschnitt: "kontakt", hinweis: "https://…" },
] satisfies EingabeFeld[])

/** Die Felder eines Abschnitts, in der Reihenfolge der Liste. */
export function felderIm(felder: readonly EingabeFeld[], abschnitt: string): EingabeFeld[] {
  return felder.filter((f) => f.abschnitt === abschnitt)
}

// ── Was die Schleuse weglassen würde ───────────────────────────────────────

const PRUEFUNG: Record<EingabePruefung, { besteht: (v: unknown) => boolean; grund: string }> = {
  url: { besteht: (v) => sichereUrl(v) !== null, grund: "ist keine sichere Adresse" },
  bild: { besteht: (v) => sichererBildPfad(v) !== null, grund: "ist keine sichere Bildadresse" },
  mail: { besteht: (v) => sichereMail(v) !== null, grund: "ist keine Mail-Adresse" },
  farbe: { besteht: (v) => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v.trim()), grund: "ist keine Farbe wie #194294" },
}

const kurz = (v: unknown) => {
  const t = String(v).trim()
  return t.length > 40 ? `${t.slice(0, 40)}…` : t
}

function leer(v: unknown): boolean {
  if (v === undefined || v === null) return true
  if (typeof v === "string") return !v.trim()
  if (Array.isArray(v)) return v.every(leer)
  const o = objekt(v)
  if (o) return Object.values(o).every(leer)
  return false
}

function teilHinweise(name: string, t: Pick<EingabeTeil, "form" | "pruefung" | "teile">, wert: unknown, aus: string[], hoechstens?: number): void {
  if (leer(wert)) return
  if (t.pruefung && (t.form === "text" || t.form === "longtext")) {
    if (!PRUEFUNG[t.pruefung].besteht(wert)) aus.push(`${name}: „${kurz(wert)}“ ${PRUEFUNG[t.pruefung].grund} und wird weggelassen.`)
    return
  }
  if (t.form === "geld" || t.form === "zahl") {
    if (zahl(wert) === null) aus.push(`${name}: nur Zahlen ab null erscheinen.`)
    return
  }
  if (t.form === "list") {
    const eintraege = liste(wert).filter((e) => !leer(e))
    let gueltig = eintraege.length
    if (t.teile) {
      const pflicht = t.teile.filter((x) => x.pflicht)
      for (const p of pflicht) {
        const ohne = eintraege.filter((e) => leer(objekt(e)?.[p.id])).length
        if (ohne) aus.push(`${name}: ${ohne === 1 ? "ein Eintrag" : `${ohne} Einträge`} ohne „${p.name}“ ${ohne === 1 ? "wird" : "werden"} weggelassen.`)
      }
      gueltig = eintraege.filter((e) => pflicht.every((p) => !leer(objekt(e)?.[p.id]))).length
      for (const [i, e] of eintraege.entries()) {
        for (const x of t.teile) if (!x.pflicht || !leer(objekt(e)?.[x.id])) teilHinweise(`${name} ${i + 1}, ${x.name}`, x, objekt(e)?.[x.id], aus)
      }
    } else if (t.pruefung) {
      for (const e of eintraege) teilHinweise(name, { form: "text", pruefung: t.pruefung }, e, aus)
    }
    if (hoechstens && gueltig > hoechstens) aus.push(`${name}: Die Seite zeigt die ersten ${hoechstens}.`)
    return
  }
  if (t.form === "objekt" && t.teile) {
    const o = objekt(wert) ?? {}
    for (const x of t.teile) teilHinweise(x.name, x, o[x.id], aus)
  }
}

/** Was an diesem Feld beim Anzeigen wegfallen würde, in Sätzen für das Formular. */
export function feldHinweise(feld: EingabeFeld, wert: unknown): string[] {
  const aus: string[] = []
  teilHinweise(feld.name ?? feld.id, feld, wert, aus, feld.hoechstens)
  return aus
}

// ── Speichern ──────────────────────────────────────────────────────────────

const GEFAEHRLICH = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"])

/**
 * Ein Wert so, wie er gespeichert wird: Texte ohne Rand, leere Einträge und
 * leere Teile fort. `false` und `0` sind Antworten und bleiben.
 */
export function bereinigt(v: unknown): unknown {
  if (v === null || v === undefined) return undefined
  if (typeof v === "string") return v.trim() || undefined
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined
  if (typeof v === "boolean") return v
  if (Array.isArray(v)) {
    const l = v.map(bereinigt).filter((x) => x !== undefined)
    return l.length ? l : undefined
  }
  const o = objekt(v)
  if (o) {
    const rein: Roh = {}
    for (const [k, x] of Object.entries(o)) {
      if (GEFAEHRLICH.has(k)) continue
      const b = bereinigt(x)
      if (b !== undefined) rein[k] = b
    }
    return Object.keys(rein).length ? rein : undefined
  }
  return undefined
}

export interface AbschnittGespeichert {
  /** Die ganzen Daten für `updateItem(id, { data })`. */
  data: Roh
  /** Was am Eintrag selbst steht, etwa `tags`; leer, wenn der Abschnitt nichts davon trägt. */
  eintrag: Roh
}

/**
 * Einen Abschnitt speichern: seine Felder aus der Arbeitskopie in die
 * aktuellen Daten. Alles andere bleibt, wie es ist, auch Felder, die keine
 * Liste kennt. Ein geleertes Feld verschwindet aus den Daten.
 *
 * Die Arbeitskopie trägt Felder am Eintrag (`tags`) neben denen in `data`;
 * `arbeitskopie` baut sie.
 */
export function abschnittSpeichern(felder: readonly EingabeFeld[], abschnitt: string, daten: Roh | null | undefined, arbeit: Roh): AbschnittGespeichert {
  const data: Roh = {}
  for (const [k, v] of Object.entries(daten ?? {})) if (!GEFAEHRLICH.has(k)) data[k] = v
  const eintrag: Roh = {}
  for (const f of felderIm(felder, abschnitt)) {
    if (GEFAEHRLICH.has(f.id)) continue
    const b = bereinigt(arbeit[f.id])
    if (f.amEintrag) {
      eintrag[f.id] = b ?? (f.form === "tags" || f.form === "list" ? [] : null)
      // Alte Schlagworte in `data` ziehen an den Eintrag um; sonst ließen sie sich nie entfernen.
      delete data[f.id]
    } else if (b === undefined) delete data[f.id]
    else data[f.id] = b
  }
  return { data, eintrag }
}

/** Die Arbeitskopie zum Bearbeiten: die Daten plus die Felder am Eintrag. */
export function arbeitskopie(felder: readonly EingabeFeld[], daten: Roh | null | undefined, eintrag: Roh = {}): Roh {
  const arbeit: Roh = {}
  for (const [k, v] of Object.entries(daten ?? {})) if (!GEFAEHRLICH.has(k)) arbeit[k] = v
  for (const f of felder) {
    if (!f.amEintrag) continue
    arbeit[f.id] = f.form === "tags" ? schlagworte([...liste(eintrag[f.id]), ...liste(arbeit[f.id])]) : eintrag[f.id]
  }
  return arbeit
}

/** Schlagworte wie bei `Item.tags`: ohne Raute, ohne Doppelte. */
export function schlagworte(v: unknown): string[] {
  return [...new Set(liste(v).map(text).filter((t): t is string => t !== null).map((t) => t.replace(/^#/, "")).filter(Boolean))]
}

// Das Profil einer Einrichtung, als Abschnitte.
//
// Die Regel steht in `docs/13-profil.md` des Instanz-Repos: Ein Projekt, das
// eine Stiftung ansieht, stellt sechs Fragen in einer festen Reihenfolge, und
// die Abschnitte antworten darauf.
//
// **Diese Datei kennt keine Oberfläche.** Sie beantwortet allein: Welche
// Abschnitte hat dieses Profil, und welche Felder stehen darin? Die
// Darstellung liegt in `td-ui`, die Bindung in der App. So lässt sich die
// Regel prüfen, ohne einen Browser zu starten (ARCHITEKTUR Teil 3, Regel 2).
//
// **Die wichtigste Regel:** Ein leeres Feld erscheint nicht, ein leerer
// Abschnitt auch nicht. Das ist Antons Muster 4, Feld-Präsenz statt
// Typ-Verzweigung. Eine Karte mit zwanzig Strichen wirkt leerer als eine mit
// sechs Angaben.

/** Die Form eines Feldes, so wie das Feld-Register sie führt. */
export type FeldForm =
  | "text"
  | "longtext"
  | "number"
  | "money"
  | "select"
  | "tags"
  | "bool"
  | "url"
  | "email"
  | "list"
  | "position"
  | "ref"
  | "date"
  | "daterange"

/** Ein Feld im Profil, mit dem Wert, den dieser Space trägt. */
export interface ProfilFeld {
  id: string
  label: string
  form: FeldForm
  wert: unknown
}

/** Ein Abschnitt der Profilkarte. */
export interface ProfilAbschnitt {
  id: string
  titel: string
  /** Die Frage, auf die dieser Abschnitt antwortet. */
  frage: string
  felder: ProfilFeld[]
}

/** Was in welchem Abschnitt steht, und wie es heißt. */
interface Bauplan {
  id: string
  titel: string
  frage: string
  felder: { id: string; label: string; form: FeldForm }[]
}

/**
 * Der Bauplan für einen Förderer. Sechs Abschnitte, 26 Felder.
 *
 * Die Reihenfolge ist die der Fragen, nicht die der Wichtigkeit einzelner
 * Felder: Wer ist das, was fördert ihr, wie viel, wie beantrage ich, wie
 * erreiche ich euch, was kann ich geben.
 */
export const BAUPLAN_FOERDERER: readonly Bauplan[] = Object.freeze([
  {
    id: "wer",
    titel: "Wer ist das",
    frage: "Mit wem habe ich es zu tun?",
    felder: [
      { id: "foerdererart", label: "Art", form: "select" },
      { id: "art", label: "Fördernd oder operativ", form: "select" },
      { id: "sitz", label: "Sitz", form: "text" },
      { id: "website", label: "Im Netz", form: "url" },
    ],
  },
  {
    id: "was",
    titel: "Was gefördert wird",
    frage: "Passt mein Vorhaben dazu?",
    felder: [
      { id: "zweck", label: "Zweck", form: "longtext" },
      { id: "foerderbereiche", label: "Förderbereiche", form: "tags" },
      { id: "zielgruppen", label: "Zielgruppen", form: "tags" },
      { id: "reichweite", label: "Reichweite", form: "tags" },
      // Das wertvollste Feld der ganzen Karte: Es steht nirgends sonst und
      // beantwortet die Frage, die jedes Projekt wirklich hat.
      { id: "hinweis", label: "Woran Sie erkennen, dass Sie passen", form: "longtext" },
      { id: "bisherGefoerdert", label: "Bisher gefördert", form: "tags" },
    ],
  },
  {
    id: "wieviel",
    titel: "Wie viel",
    frage: "Reicht das für mein Vorhaben?",
    felder: [
      { id: "summeVon", label: "Förderung ab", form: "money" },
      { id: "summeBis", label: "Förderung bis", form: "money" },
      { id: "volumenJahr", label: "Im Jahr insgesamt", form: "money" },
      { id: "eigenmittel", label: "Eigenmittel", form: "text" },
    ],
  },
  {
    id: "antrag",
    titel: "Wie beantragt wird",
    frage: "Was muss ich tun?",
    felder: [
      { id: "antragstellung", label: "Anträge möglich", form: "select" },
      { id: "antragsweg", label: "Antragsweg", form: "select" },
      { id: "fristen", label: "Fristen", form: "text" },
      { id: "unterlagen", label: "Unterlagen", form: "list" },
      { id: "antragsportal", label: "Antragsportal", form: "url" },
    ],
  },
  {
    id: "kontakt",
    titel: "Wie man Kontakt aufnimmt",
    frage: "An wen wende ich mich?",
    felder: [
      { id: "ansprache", label: "Ansprache", form: "text" },
      { id: "mail", label: "Mail", form: "email" },
    ],
  },
  {
    id: "geben",
    titel: "Was man geben kann",
    frage: "Und wenn ich etwas beitragen will?",
    felder: [
      { id: "zustiftung", label: "Zustiftung", form: "bool" },
      { id: "spende", label: "Spende", form: "bool" },
      { id: "treuhand", label: "Treuhandstiftung", form: "bool" },
    ],
  },
])

/**
 * Der Bauplan für ein Projekt. Dieselben sechs Fragen, andere Antworten.
 */
export const BAUPLAN_PROJEKT: readonly Bauplan[] = Object.freeze([
  {
    id: "wer",
    titel: "Wer ist das",
    frage: "Wer steht dahinter?",
    felder: [
      { id: "kurz", label: "In einem Satz", form: "text" },
      { id: "region", label: "Wo es wirkt", form: "tags" },
      { id: "anstifter", label: "Angestoßen von", form: "ref" },
      { id: "gruppe", label: "Getragen von", form: "ref" },
    ],
  },
  {
    id: "warum",
    titel: "Warum es das braucht",
    frage: "Was fehlt hier ohne dieses Projekt?",
    felder: [
      // Der Satz, der den Rest trägt. Er beschreibt eine Lücke, kein Projekt.
      { id: "beduerfnis", label: "Was fehlt", form: "longtext" },
      { id: "themen", label: "Themen", form: "tags" },
      { id: "zielgruppen", label: "Für wen", form: "tags" },
    ],
  },
  {
    id: "kosten",
    titel: "Was es kostet",
    frage: "Wie weit ist es, und was fehlt?",
    felder: [
      { id: "bedarfe", label: "Bedarfe", form: "list" },
      { id: "bedarfGesamt", label: "Insgesamt", form: "money" },
      { id: "eigenmittel", label: "Eigenmittel", form: "money" },
      { id: "luecke", label: "Offen", form: "money" },
    ],
  },
  {
    id: "steht",
    titel: "Was schon steht",
    frage: "Worauf baut es auf?",
    felder: [
      { id: "vorhandenes", label: "Vorhanden", form: "list" },
      { id: "foerderer", label: "Förderer", form: "ref" },
      { id: "zustifter", label: "Zustifter", form: "ref" },
    ],
  },
  {
    id: "wann",
    titel: "Wann",
    frage: "In welchem Zeitraum?",
    felder: [
      { id: "zeitraum", label: "Zeitraum", form: "daterange" },
      { id: "termine", label: "Termine", form: "date" },
      { id: "schritte", label: "Schritte", form: "list" },
    ],
  },
  {
    id: "wirkung",
    titel: "Was sich ändert",
    frage: "Was ist danach anders?",
    felder: [{ id: "wirkung", label: "Wirkung", form: "list" }],
  },
])

/**
 * Trägt dieses Feld etwas?
 *
 * Die Frage klingt einfach und hat fünf Fälle: `undefined`, `null`, der leere
 * Text, die leere Liste und `false`. Der letzte ist der heikle: Bei einem
 * Ja-Nein-Feld ist `false` eine **Antwort**, keine Leere. „Zustiftung: nein"
 * gehört auf die Karte, denn es erspart jemandem eine Anfrage.
 */
export function feldTraegt(wert: unknown, form: FeldForm): boolean {
  if (wert === undefined || wert === null) return false
  // Ein Ja-Nein-Wert trägt allein dort, wo ein Ja-Nein-Feld steht. Ein `false`
  // in einem Textfeld ist ein Fehler in den Daten, keine Angabe.
  if (typeof wert === "boolean") return form === "bool"
  if (typeof wert === "string") return wert.trim().length > 0
  if (Array.isArray(wert)) return wert.length > 0
  if (typeof wert === "number") return Number.isFinite(wert)
  if (typeof wert === "object") return Object.keys(wert as object).length > 0
  return true
}

/**
 * Baut die Abschnitte eines Profils aus dem, was der Space trägt.
 *
 * Leere Felder fallen weg, leere Abschnitte auch. Was übrig bleibt, steht in
 * der Reihenfolge des Bauplans: Sie folgt den Fragen eines Besuchers, und die
 * ändern sich nicht nach Datenlage.
 */
export function profilAbschnitte(
  daten: Record<string, unknown> | null | undefined,
  bauplan: readonly Bauplan[] = BAUPLAN_FOERDERER,
): ProfilAbschnitt[] {
  const d = daten ?? {}
  const abschnitte: ProfilAbschnitt[] = []

  for (const plan of bauplan) {
    const felder: ProfilFeld[] = []
    for (const f of plan.felder) {
      const wert = d[f.id]
      if (feldTraegt(wert, f.form)) {
        felder.push({ id: f.id, label: f.label, form: f.form, wert })
      }
    }
    if (felder.length > 0) {
      abschnitte.push({ id: plan.id, titel: plan.titel, frage: plan.frage, felder })
    }
  }

  return abschnitte
}

/**
 * Wie voll ist dieses Profil?
 *
 * Eine ehrliche Zahl, keine Note: Sie sagt, wie viele der vorgesehenen Felder
 * eine Angabe tragen. Wer sie als Bewertung zeigt, verletzt den ersten
 * Grundsatz; wer sie einer Einrichtung zeigt, die ihren Eintrag pflegt, hilft
 * ihr.
 */
export function profilStand(
  daten: Record<string, unknown> | null | undefined,
  bauplan: readonly Bauplan[] = BAUPLAN_FOERDERER,
): { gefuellt: number; gesamt: number } {
  const d = daten ?? {}
  let gefuellt = 0
  let gesamt = 0
  for (const plan of bauplan) {
    for (const f of plan.felder) {
      gesamt++
      if (feldTraegt(d[f.id], f.form)) gefuellt++
    }
  }
  return { gefuellt, gesamt }
}

/**
 * Welcher Bauplan gilt für diese Angaben?
 *
 * Die Frage entscheidet mehr als die Darstellung: **Wer keinen Bauplan hat,
 * hat kein Profil.** Ein Netzwerk ist weder Förderer noch Projekt. Timo am
 * 20.09.2026, nach dem ersten Blick auf die Runde: *"manche profile zeigt er
 * garnicht an"* — vier von sechs Spaces zeigten "trägt noch keine Angaben",
 * weil ein Förderer-Bauplan auf ein Netzwerk gelegt wurde. Eine leere Karte
 * ist schlechter als keine.
 *
 * Erkannt wird an drei Stellen, in dieser Reihenfolge:
 *
 * 1. `kind` — die Art, die ein Netzwerk seinen Spaces gibt
 * 2. `foerdererart` — das Feld, das jede recherchierte Stiftung trägt
 * 3. `beduerfnis` — das Feld, ohne das ein Projektprofil unfertig bleibt
 *
 * Damit gilt dieselbe Regel für einen Space und für ein recherchiertes Item:
 * Beide werden von denselben Feldern getragen, und keiner braucht eine
 * eigene Verzweigung (Antons Muster 4, Feld-Präsenz statt Typ-Verzweigung).
 */
export function bauplanFuer(
  daten: Record<string, unknown> | null | undefined,
): readonly Bauplan[] | null {
  const d = daten ?? {}

  const art = typeof d.kind === "string" ? d.kind.toLowerCase() : ""
  if (art === "projekt") return BAUPLAN_PROJEKT
  if (art === "stiftung" || art === "foerderer") return BAUPLAN_FOERDERER

  // Ein recherchierter Eintrag trägt keine Art, wohl aber seine Felder.
  if (typeof d.foerdererart === "string" && d.foerdererart.trim().length > 0) {
    return BAUPLAN_FOERDERER
  }
  if (typeof d.beduerfnis === "string" && d.beduerfnis.trim().length > 0) {
    return BAUPLAN_PROJEKT
  }

  return null
}

/**
 * Trägt dieses Ding ein Profil, das sich zu öffnen lohnt?
 *
 * Zwei Bedingungen zusammen: Ein Bauplan greift, **und** mindestens ein Feld
 * daraus hat eine Angabe. Eine Stiftung, deren Eintrag nur aus ihrem Namen
 * besteht, bekommt damit keine Taste, die auf eine leere Fläche führt.
 */
export function traegtProfil(daten: Record<string, unknown> | null | undefined): boolean {
  const bauplan = bauplanFuer(daten)
  if (!bauplan) return false
  return profilStand(daten, bauplan).gefuellt > 0
}

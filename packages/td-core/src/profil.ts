// Das Profil einer Einrichtung.
//
// Die Anatomie steht in `docs/13-profil.md` des Instanz-Repos: **Kopf,
// Kennzahlen, Reiter, Inhalt.** Sie folgt dem, was ein Mensch in den ersten
// zehn Sekunden sucht, und sie folgt dem Vorbild, das die Software
// AG-Stiftung auf ihrer eigenen Seite gibt (fünf Reiter, keine Frage).
//
// **Die Fragen sind das Raster, nicht die Oberfläche.** Jeder Reiter trägt
// hier seine `frage`, damit klar bleibt, welche Felder hineingehören. Auf den
// Bildschirm kommt sie nie: Wer sie anzeigt, macht aus einem Profil einen
// Fragebogen. Das war die erste Fassung, und Timo dazu am 20.09.2026: *"Das
// ist ja jetzt wirklich dumm Design."*
//
// **Diese Datei kennt keine Oberfläche.** Sie beantwortet allein: Was steht im
// Kopf, welche Kennzahlen trägt dieses Profil, welche Reiter hat es, und
// welche Felder stehen darin? Die Darstellung liegt in `td-ui`, die Bindung in
// der App. So lässt sich die Regel prüfen, ohne einen Browser zu starten
// (ARCHITEKTUR Teil 3, Regel 2).
//
// **Die wichtigste Regel:** Ein leeres Feld erscheint nicht, ein leerer Reiter
// auch nicht. Das ist Antons Muster 4, Feld-Präsenz statt Typ-Verzweigung.

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

/** Ein Feld im Profil, mit dem Wert, den dieser Träger hat. */
export interface ProfilFeld {
  id: string
  label: string
  form: FeldForm
  wert: unknown
}

/**
 * Eine Zahl, die über dem Inhalt steht.
 *
 * Sie beantwortet die Frage, die ein Projekt zuerst hat: Lohnt sich das
 * Weiterlesen? Darum steht sie groß und vor den Reitern.
 */
export interface Kennzahl {
  id: string
  label: string
  form: FeldForm
  wert: unknown
  /** Die Obergrenze einer Spanne, etwa bei einem Förderrahmen. */
  bis?: unknown
}

/** Ein Reiter im Profil. */
export interface ProfilReiter {
  id: string
  titel: string
  felder: ProfilFeld[]
}

/** Ein fertiges Profil, bereit zum Anzeigen. */
export interface Profil {
  /** Die Meta-Zeile unter dem Namen: Art · fördernd · Sitz. */
  kopf: ProfilFeld[]
  /** Die Netzadresse, als eigene Aktion neben dem Namen. */
  website?: string
  /** Die Mailadresse, als eigene Aktion neben dem Namen. */
  mail?: string
  /** Höchstens drei Zahlen, groß gesetzt. */
  kennzahlen: Kennzahl[]
  /** Der Zweck, als Aussage ohne Beschriftung. */
  zweck?: string
  /** Woran ein Projekt erkennt, dass es passt. Der wertvollste Satz. */
  hinweis?: { label: string; text: string }
  /** Die Reiter. Ein leerer Reiter fehlt. */
  reiter: ProfilReiter[]
  /** Wie viele der vorgesehenen Felder eine Angabe tragen. */
  stand: { gefuellt: number; gesamt: number }
}

/** Ein Feld, wie der Bauplan es führt. */
interface BauFeld {
  id: string
  label: string
  form: FeldForm
}

/**
 * Was ein Profil dieser Art trägt.
 *
 * Ein Feld steht an genau einer Stelle. Ein Wert, der im Kopf steht, steht
 * nicht noch einmal in einem Reiter: Doppelt gesagt ist halb geglaubt.
 */
export interface Bauplan {
  /** Die Meta-Zeile unter dem Namen. Kurze Angaben, keine Sätze. */
  kopf: BauFeld[]
  /** Das Feld mit der Netzadresse, falls es eines gibt. */
  websiteFeld?: string
  /** Das Feld mit der Mailadresse, falls es eines gibt. */
  mailFeld?: string
  /** Die Zahlen über dem Inhalt. Höchstens drei. */
  kennzahlen: (BauFeld & { bisFeld?: string })[]
  /** Das Feld, das die Stimme trägt. Steht als Aussage, ohne Beschriftung. */
  zweckFeld?: string
  /** Das Feld, an dem ein Projekt erkennt, ob es passt. */
  hinweisFeld?: BauFeld
  /** Die Reiter, jeder mit seiner Frage als Raster und seinen Feldern. */
  reiter: { id: string; titel: string; frage: string; felder: BauFeld[] }[]
}

/**
 * Der Bauplan für einen Förderer.
 *
 * Drei Felder im Kopf, zwei Aktionen, drei Kennzahlen, drei Reiter. Jedes
 * Feld steht genau einmal.
 */
export const BAUPLAN_FOERDERER: Bauplan = Object.freeze<Bauplan>({
  kopf: [
    { id: "foerdererart", label: "Art", form: "select" },
    { id: "art", label: "Fördernd oder operativ", form: "select" },
    { id: "sitz", label: "Sitz", form: "text" },
    // Die Reichweite ordnet ein, sie misst nicht. Als Kennzahl neben zwei
    // Geldbeträgen stünde sie da wie eine Zahl, die keine ist.
    { id: "reichweite", label: "Reichweite", form: "tags" },
  ],
  websiteFeld: "website",
  mailFeld: "mail",
  kennzahlen: [
    // Eine Spanne in einer Zahl: "20.000 bis 500.000". Zwei Kennzahlen
    // nebeneinander wären zwei Aussagen für eine Sache.
    { id: "summeVon", label: "Förderung", form: "money", bisFeld: "summeBis" },
    { id: "volumenJahr", label: "Im Jahr", form: "money" },
  ],
  zweckFeld: "zweck",
  // Das wertvollste Feld der ganzen Karte: Es steht nirgends sonst und
  // beantwortet die Frage, die jedes Projekt wirklich hat.
  hinweisFeld: {
    id: "hinweis",
    label: "Woran Sie erkennen, dass Sie passen",
    form: "longtext",
  },
  reiter: [
    {
      id: "ueberblick",
      titel: "Überblick",
      frage: "Passt mein Vorhaben dazu?",
      felder: [
        { id: "foerderbereiche", label: "Förderbereiche", form: "tags" },
        { id: "zielgruppen", label: "Zielgruppen", form: "tags" },
        { id: "bisherGefoerdert", label: "Bisher gefördert", form: "tags" },
      ],
    },
    {
      id: "antrag",
      titel: "Antrag",
      frage: "Was muss ich tun, und an wen wende ich mich?",
      felder: [
        { id: "antragstellung", label: "Anträge möglich", form: "select" },
        { id: "antragsweg", label: "Antragsweg", form: "select" },
        { id: "fristen", label: "Fristen", form: "text" },
        { id: "unterlagen", label: "Unterlagen", form: "list" },
        { id: "eigenmittel", label: "Eigenmittel", form: "text" },
        { id: "antragsportal", label: "Antragsportal", form: "url" },
        { id: "ansprache", label: "Ansprache", form: "text" },
      ],
    },
    {
      id: "geben",
      titel: "Geben",
      frage: "Und wenn ich etwas beitragen will?",
      felder: [
        { id: "zustiftung", label: "Zustiftung", form: "bool" },
        { id: "spende", label: "Spende", form: "bool" },
        { id: "treuhand", label: "Treuhandstiftung", form: "bool" },
      ],
    },
  ],
})

/** Der Bauplan für ein Projekt. Dieselbe Anatomie, andere Felder. */
export const BAUPLAN_PROJEKT: Bauplan = Object.freeze<Bauplan>({
  kopf: [
    { id: "kurz", label: "In einem Satz", form: "text" },
    { id: "region", label: "Wo es wirkt", form: "tags" },
  ],
  kennzahlen: [
    { id: "bedarfGesamt", label: "Bedarf", form: "money" },
    { id: "luecke", label: "Noch offen", form: "money" },
    { id: "zeitraum", label: "Zeitraum", form: "daterange" },
  ],
  // Beim Projekt trägt das Bedürfnis die Stimme. Es beschreibt eine Lücke,
  // kein Projekt: "Vierzig Bäche bleiben unbetreut" zieht, "wir sind ein
  // Verein für Umweltbildung" nicht.
  hinweisFeld: {
    id: "beduerfnis",
    label: "Was ohne dieses Vorhaben fehlt",
    form: "longtext",
  },
  reiter: [
    {
      id: "ueberblick",
      titel: "Überblick",
      frage: "Worum geht es, und für wen?",
      felder: [
        { id: "themen", label: "Themen", form: "tags" },
        { id: "zielgruppen", label: "Für wen", form: "tags" },
        { id: "wirkung", label: "Was sich ändert", form: "list" },
      ],
    },
    {
      id: "vorhaben",
      titel: "Vorhaben",
      frage: "Wie weit ist es, und was fehlt?",
      felder: [
        { id: "bedarfe", label: "Bedarfe", form: "list" },
        { id: "eigenmittel", label: "Eigenmittel", form: "money" },
        { id: "vorhandenes", label: "Vorhanden", form: "list" },
        { id: "schritte", label: "Schritte", form: "list" },
        { id: "termine", label: "Termine", form: "date" },
      ],
    },
    {
      id: "beteiligte",
      titel: "Beteiligte",
      frage: "Wer steht dahinter?",
      felder: [
        { id: "anstifter", label: "Angestoßen von", form: "ref" },
        { id: "gruppe", label: "Getragen von", form: "ref" },
        { id: "foerderer", label: "Förderer", form: "ref" },
        { id: "zustifter", label: "Zustifter", form: "ref" },
      ],
    },
  ],
})

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
 * Ein Profil aufbauen: Kopf, Kennzahlen, Reiter, Inhalt.
 *
 * Die eine Funktion, die aus Rohdaten eine fertige Darstellung macht. Sie
 * lässt weg, was leer ist, auf jeder Ebene:
 *
 * - ein Feld ohne Angabe fehlt
 * - eine Kennzahl ohne Angabe fehlt
 * - ein Reiter ohne gefüllte Felder fehlt
 *
 * Der `stand` zählt über den **ganzen** Bauplan, auch über das, was
 * weggelassen wurde. Er ist eine ehrliche Zahl für den, der pflegt: "20 von
 * 24" sagt, dass vier Angaben offen sind.
 */
export function profilAufbauen(
  daten: Record<string, unknown> | null | undefined,
  bauplan: Bauplan = BAUPLAN_FOERDERER,
): Profil {
  const d = daten ?? {}

  const nehmen = (f: BauFeld): ProfilFeld | null =>
    feldTraegt(d[f.id], f.form) ? { ...f, wert: d[f.id] } : null

  const kopf = bauplan.kopf.map(nehmen).filter((f): f is ProfilFeld => f !== null)

  const kennzahlen: Kennzahl[] = []
  for (const k of bauplan.kennzahlen) {
    const hatWert = feldTraegt(d[k.id], k.form)
    const bis = k.bisFeld ? d[k.bisFeld] : undefined
    const hatBis = k.bisFeld ? feldTraegt(bis, k.form) : false
    // Eine Spanne trägt auch, wenn allein die Obergrenze dasteht: Sechs der
    // 234 Stiftungen nennen "bis 5.000 Euro" ohne Untergrenze.
    if (hatWert || hatBis) {
      kennzahlen.push({
        id: k.id,
        label: k.label,
        form: k.form,
        wert: hatWert ? d[k.id] : undefined,
        ...(hatBis ? { bis } : {}),
      })
    }
  }

  const zweckWert = bauplan.zweckFeld ? d[bauplan.zweckFeld] : undefined
  const zweck =
    typeof zweckWert === "string" && zweckWert.trim().length > 0
      ? zweckWert.trim()
      : undefined

  const hinweisFeld = bauplan.hinweisFeld
  const hinweisWert = hinweisFeld ? d[hinweisFeld.id] : undefined
  const hinweis =
    hinweisFeld && typeof hinweisWert === "string" && hinweisWert.trim().length > 0
      ? { label: hinweisFeld.label, text: hinweisWert.trim() }
      : undefined

  const reiter: ProfilReiter[] = []
  for (const r of bauplan.reiter) {
    const felder = r.felder.map(nehmen).filter((f): f is ProfilFeld => f !== null)
    if (felder.length > 0) {
      reiter.push({ id: r.id, titel: r.titel, felder })
    }
  }

  return {
    kopf,
    ...(bauplan.websiteFeld && typeof d[bauplan.websiteFeld] === "string"
      ? { website: d[bauplan.websiteFeld] as string }
      : {}),
    ...(bauplan.mailFeld && typeof d[bauplan.mailFeld] === "string"
      ? { mail: d[bauplan.mailFeld] as string }
      : {}),
    kennzahlen,
    ...(zweck ? { zweck } : {}),
    ...(hinweis ? { hinweis } : {}),
    reiter,
    stand: profilStand(d, bauplan),
  }
}

/**
 * Alle Felder eines Bauplans, in einer Liste.
 *
 * Gebraucht vom Stand und von den Tests: Ein Feld darf an genau einer Stelle
 * stehen, und diese Liste zeigt jede doppelte Kennung.
 */
export function alleFelder(bauplan: Bauplan): BauFeld[] {
  const felder: BauFeld[] = [...bauplan.kopf]
  for (const k of bauplan.kennzahlen) {
    felder.push({ id: k.id, label: k.label, form: k.form })
    if (k.bisFeld) felder.push({ id: k.bisFeld, label: k.label, form: k.form })
  }
  if (bauplan.websiteFeld) {
    felder.push({ id: bauplan.websiteFeld, label: "Im Netz", form: "url" })
  }
  if (bauplan.mailFeld) {
    felder.push({ id: bauplan.mailFeld, label: "Mail", form: "email" })
  }
  if (bauplan.zweckFeld) {
    felder.push({ id: bauplan.zweckFeld, label: "Zweck", form: "longtext" })
  }
  if (bauplan.hinweisFeld) felder.push(bauplan.hinweisFeld)
  for (const r of bauplan.reiter) felder.push(...r.felder)
  return felder
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
  bauplan: Bauplan = BAUPLAN_FOERDERER,
): { gefuellt: number; gesamt: number } {
  const d = daten ?? {}
  let gefuellt = 0
  let gesamt = 0
  for (const f of alleFelder(bauplan)) {
    gesamt++
    if (feldTraegt(d[f.id], f.form)) gefuellt++
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
): Bauplan | null {
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

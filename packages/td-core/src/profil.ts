// Das Profil einer Einrichtung.
//
// Timo am 20.09.2026, nach zwei Fehlversuchen: *"Guck dir mal richtig gute
// Profile an, wie die sein müssen ... es geht ja nicht darum, eine Stiftung
// darzustellen und dann ein spezielles Profil daraus zu bauen, sondern wie
// allgemein Profile sind, wie sie sich erklären."*
//
// **Nachgesehen bei Instagram, LinkedIn, GitHub und Facebook.** Die Anatomie
// ist überall dieselbe, und sie hat acht Teile:
//
//     Cover       ein Band, das Stimmung setzt
//     Identität   Bild, Name, eine Einordnungszeile
//     Bio         kurz, in eigener Stimme
//     Aktionen    was man als Nächstes tut
//     Zahlen      drei Signale, teils gezählt
//     Themen      runde Kacheln (Instagram nennt sie Highlights)
//     Reiter      wenige, klar benannt
//     Das Werk    ein Raster von Karten
//
// **Das Werk ist das Herz.** Ein GitHub-Profil ohne Repositories wäre
// sinnlos, ein Instagram-Profil ohne Raster auch. Die ersten zwei Fassungen
// zeigten ein Formular und versteckten das Werk als Stichwort-Chips. Bei
// einer Stiftung ist das Werk das, was sie gefördert hat.
//
// **Die Fragen sind das Raster beim Bauen, nicht die Oberfläche.** Jeder
// Reiter trägt hier seine `frage`; auf den Bildschirm kommt sie nie.
//
// **Diese Datei kennt keine Oberfläche.** Sie rechnet aus, was ein Profil
// trägt. Die Darstellung liegt in `td-ui` (ARCHITEKTUR Teil 3, Regel 2).

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
 * Was man als Nächstes tut.
 *
 * Instagram hat "Folgen" und "Nachricht", GitHub "Follow" und "Sponsor",
 * LinkedIn "Folgen" und "Website". Immer wenige, immer sichtbar, immer in
 * Daumenreichweite.
 */
export interface Aktion {
  id: string
  label: string
  art: "url" | "email"
  ziel: string
  /** Die wichtigste steht hervorgehoben, die anderen daneben. */
  stark?: boolean
}

/**
 * Eine Zahl als Signal.
 *
 * "1.234 Beiträge · 45,6 Tsd. Follower" bei Instagram, "87,1k followers" bei
 * GitHub. Manche Zahlen stehen in den Daten, andere werden **gezählt**: Wie
 * viele Förderbereiche, wie viele geförderte Vorhaben. Eine gezählte Zahl ist
 * immer wahr und immer aktuell.
 */
export interface Zahl {
  id: string
  label: string
  wert: number | string
  /** Die Obergrenze einer Spanne, etwa bei einem Förderrahmen. */
  bis?: number
  form: "anzahl" | "geld" | "text"
}

/** Eine Karte im Werk: was diese Einrichtung getan hat. */
export interface WerkStueck {
  titel: string
}

/** Ein Reiter im Profil. */
export interface ProfilReiter {
  id: string
  titel: string
  /** Das Werk als Karten. Steht im ersten Reiter, wo es hingehört. */
  karten?: WerkStueck[]
  /** Die übrigen Angaben dieses Reiters. */
  felder: ProfilFeld[]
}

/** Ein fertiges Profil, bereit zum Anzeigen. */
export interface Profil {
  /** Die Zeile unter dem Namen: Stiftung · fördernd · Darmstadt. */
  einordnung: string[]
  /** Die Bio: die Stimme der Einrichtung, kurz. */
  bio?: string
  /** Der Satz, der zieht. Abgesetzt, mit eigener Überschrift. */
  hervorhebung?: { label: string; text: string }
  /** Was man als Nächstes tut. Höchstens drei. */
  aktionen: Aktion[]
  /** Die Signale. Höchstens drei. */
  zahlen: Zahl[]
  /** Themen als runde Kacheln. */
  themen: string[]
  /** Die Reiter. Ein leerer fehlt. */
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

/** Was ein Profil dieser Art trägt. Jedes Feld steht an genau einer Stelle. */
export interface Bauplan {
  /** Die Felder der Einordnungszeile, in dieser Reihenfolge. */
  einordnung: BauFeld[]
  /** Das Feld, das die Stimme trägt. */
  bioFeld?: string
  /** Das Feld, an dem jemand erkennt, ob es passt. */
  hervorhebungFeld?: BauFeld
  /** Die Aktionen, jede an ein Feld gebunden. */
  aktionen: { id: string; label: string; feld: string; art: "url" | "email"; stark?: boolean }[]
  /**
   * Die Zahlen. Eine mit `feld` steht in den Daten, eine mit `zaehle` wird
   * aus der Länge einer Liste gezählt.
   */
  zahlen: {
    id: string
    label: string
    /** Bei einer angegebenen Zahl: das Feld. */
    feld?: string
    /** Bei einer Spanne: das Feld der Obergrenze. */
    bisFeld?: string
    /** Bei einer gezählten Zahl: das Listenfeld. */
    zaehle?: string
    /** Die Einzahl des Labels, wenn genau eines gezählt wurde. */
    einzahl?: string
    form: "anzahl" | "geld" | "text"
  }[]
  /** Das Listenfeld, aus dem die runden Kacheln werden. */
  themenFeld?: string
  /** Das Werk: welcher Reiter es trägt und aus welchem Feld es kommt. */
  werk?: { reiter: string; feld: string }
  /** Die Reiter, jeder mit seiner Frage als Raster. */
  reiter: { id: string; titel: string; frage: string; felder: BauFeld[] }[]
}

/**
 * Der Bauplan für einen Förderer.
 *
 * Die Zahlen sind bewusst gemischt: zwei gezählte und eine angegebene. Eine
 * gezählte Zahl ist immer wahr, und sie füllt die Leiste auch bei einem
 * Eintrag, der sonst wenig trägt.
 */
export const BAUPLAN_FOERDERER: Bauplan = Object.freeze<Bauplan>({
  einordnung: [
    { id: "foerdererart", label: "Art", form: "select" },
    { id: "art", label: "Fördernd oder operativ", form: "select" },
    { id: "sitz", label: "Sitz", form: "text" },
    { id: "reichweite", label: "Reichweite", form: "tags" },
  ],
  bioFeld: "zweck",
  // Das wertvollste Feld der ganzen Karte: Es steht nirgends sonst und
  // beantwortet die Frage, die jedes Projekt wirklich hat.
  hervorhebungFeld: {
    id: "hinweis",
    label: "Woran Sie erkennen, dass Sie passen",
    form: "longtext",
  },
  aktionen: [
    { id: "website", label: "Website", feld: "website", art: "url", stark: true },
    { id: "antrag", label: "Antrag stellen", feld: "antragsportal", art: "url" },
    { id: "mail", label: "Schreiben", feld: "mail", art: "email" },
  ],
  zahlen: [
    {
      id: "foerderung",
      label: "Förderung",
      feld: "summeVon",
      bisFeld: "summeBis",
      form: "geld",
    },
    {
      id: "bereiche",
      label: "Förderbereiche",
      zaehle: "foerderbereiche",
      einzahl: "Förderbereich",
      form: "anzahl",
    },
    {
      id: "gefoerdert",
      label: "Vorhaben gefördert",
      zaehle: "bisherGefoerdert",
      einzahl: "Vorhaben gefördert",
      form: "anzahl",
    },
  ],
  themenFeld: "foerderbereiche",
  werk: { reiter: "gefoerdert", feld: "bisherGefoerdert" },
  reiter: [
    {
      id: "gefoerdert",
      titel: "Gefördert",
      frage: "Was habt ihr bisher getan?",
      felder: [{ id: "zielgruppen", label: "Für wen", form: "tags" }],
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
        { id: "volumenJahr", label: "Im Jahr insgesamt", form: "money" },
      ],
    },
  ],
})

/** Der Bauplan für ein Projekt. Dieselbe Anatomie, andere Felder. */
export const BAUPLAN_PROJEKT: Bauplan = Object.freeze<Bauplan>({
  einordnung: [
    { id: "kurz", label: "In einem Satz", form: "text" },
    { id: "region", label: "Wo es wirkt", form: "tags" },
  ],
  // Beim Projekt trägt das Bedürfnis die Stimme. Es beschreibt eine Lücke,
  // kein Projekt: "Vierzig Bäche bleiben unbetreut" zieht, "wir sind ein
  // Verein für Umweltbildung" nicht.
  hervorhebungFeld: {
    id: "beduerfnis",
    label: "Was ohne dieses Vorhaben fehlt",
    form: "longtext",
  },
  aktionen: [],
  zahlen: [
    { id: "bedarf", label: "Bedarf", feld: "bedarfGesamt", form: "geld" },
    { id: "offen", label: "Noch offen", feld: "luecke", form: "geld" },
    { id: "schritte", label: "Schritte", zaehle: "schritte", einzahl: "Schritt", form: "anzahl" },
  ],
  themenFeld: "themen",
  werk: { reiter: "vorhaben", feld: "wirkung" },
  reiter: [
    {
      id: "vorhaben",
      titel: "Vorhaben",
      frage: "Was soll geschehen, und was ändert sich dadurch?",
      felder: [
        { id: "zielgruppen", label: "Für wen", form: "tags" },
        { id: "schritte", label: "Schritte", form: "list" },
        { id: "termine", label: "Termine", form: "date" },
        { id: "zeitraum", label: "Zeitraum", form: "daterange" },
      ],
    },
    {
      id: "mittel",
      titel: "Mittel",
      frage: "Wie weit ist es, und was fehlt?",
      felder: [
        { id: "bedarfe", label: "Bedarfe", form: "list" },
        { id: "eigenmittel", label: "Eigenmittel", form: "money" },
        { id: "vorhandenes", label: "Vorhanden", form: "list" },
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
  // Ein Ja-Nein-Wert trägt allein dort, wo ein Ja-Nein-Feld steht.
  if (typeof wert === "boolean") return form === "bool"
  if (typeof wert === "string") return wert.trim().length > 0
  if (Array.isArray(wert)) return wert.length > 0
  if (typeof wert === "number") return Number.isFinite(wert)
  if (typeof wert === "object") return Object.keys(wert as object).length > 0
  return true
}

/** Eine Liste aus einem Feld, oder nichts. */
function liste(wert: unknown): string[] {
  if (Array.isArray(wert)) return wert.map((w) => String(w)).filter((w) => w.trim().length > 0)
  if (typeof wert === "string" && wert.trim().length > 0) return [wert.trim()]
  return []
}

/** Ein Text aus einem Feld, oder nichts. */
function text(wert: unknown): string | undefined {
  if (typeof wert === "string" && wert.trim().length > 0) return wert.trim()
  return undefined
}

/**
 * Ein Profil aufbauen.
 *
 * Die eine Funktion, die aus Rohdaten einen fertigen Auftritt macht. Sie
 * lässt weg, was leer ist, auf jeder Ebene: ein Feld ohne Angabe, eine Zahl
 * ohne Angabe, ein Reiter ohne Inhalt.
 *
 * Der `stand` zählt über den **ganzen** Bauplan, auch über das Weggelassene.
 * Er ist eine ehrliche Zahl für den, der pflegt.
 */
export function profilAufbauen(
  daten: Record<string, unknown> | null | undefined,
  bauplan: Bauplan = BAUPLAN_FOERDERER,
): Profil {
  const d = daten ?? {}

  const nehmen = (f: BauFeld): ProfilFeld | null =>
    feldTraegt(d[f.id], f.form) ? { ...f, wert: d[f.id] } : null

  // --- Die Einordnungszeile
  const einordnung: string[] = []
  for (const f of bauplan.einordnung) {
    if (!feldTraegt(d[f.id], f.form)) continue
    const w = d[f.id]
    einordnung.push(Array.isArray(w) ? w.join(", ") : String(w))
  }

  // --- Die Bio
  const bio = bauplan.bioFeld ? text(d[bauplan.bioFeld]) : undefined

  // --- Der Satz, der zieht
  const hf = bauplan.hervorhebungFeld
  const hText = hf ? text(d[hf.id]) : undefined
  const hervorhebung = hf && hText ? { label: hf.label, text: hText } : undefined

  // --- Die Aktionen
  const aktionen: Aktion[] = []
  for (const a of bauplan.aktionen) {
    const ziel = text(d[a.feld])
    if (ziel) aktionen.push({ id: a.id, label: a.label, art: a.art, ziel, stark: a.stark })
  }
  // Steht die starke Aktion nicht zur Verfügung, wird die erste vorhandene
  // stark: Ein Profil ohne hervorgehobene Aktion wirkt tot.
  if (aktionen.length > 0 && !aktionen.some((a) => a.stark)) aktionen[0].stark = true

  // --- Die Zahlen
  const zahlen: Zahl[] = []
  for (const z of bauplan.zahlen) {
    if (z.zaehle) {
      const anzahl = liste(d[z.zaehle]).length
      if (anzahl > 0) {
        zahlen.push({
          id: z.id,
          label: anzahl === 1 && z.einzahl ? z.einzahl : z.label,
          wert: anzahl,
          form: "anzahl",
        })
      }
      continue
    }
    if (!z.feld) continue
    const wert = d[z.feld]
    const bis = z.bisFeld ? d[z.bisFeld] : undefined
    const hatWert = typeof wert === "number" && Number.isFinite(wert)
    const hatBis = typeof bis === "number" && Number.isFinite(bis)
    // Eine Spanne trägt auch, wenn allein die Obergrenze dasteht: Sechs der
    // 234 Stiftungen nennen "bis 5.000 Euro" ohne Untergrenze.
    if (hatWert || hatBis) {
      zahlen.push({
        id: z.id,
        label: z.label,
        wert: hatWert ? (wert as number) : "",
        ...(hatBis ? { bis: bis as number } : {}),
        form: z.form,
      })
    }
  }

  // --- Die Themen als runde Kacheln
  const themen = bauplan.themenFeld ? liste(d[bauplan.themenFeld]) : []

  // --- Die Reiter, der erste mit dem Werk
  const werkStuecke = bauplan.werk ? liste(d[bauplan.werk.feld]) : []
  const reiter: ProfilReiter[] = []
  for (const r of bauplan.reiter) {
    const felder = r.felder.map(nehmen).filter((f): f is ProfilFeld => f !== null)
    const karten =
      bauplan.werk?.reiter === r.id && werkStuecke.length > 0
        ? werkStuecke.map((titel) => ({ titel }))
        : undefined
    if (felder.length > 0 || karten) {
      reiter.push({ id: r.id, titel: r.titel, ...(karten ? { karten } : {}), felder })
    }
  }

  return {
    einordnung,
    ...(bio ? { bio } : {}),
    ...(hervorhebung ? { hervorhebung } : {}),
    aktionen,
    zahlen,
    themen,
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
  const felder: BauFeld[] = [...bauplan.einordnung]
  if (bauplan.bioFeld) felder.push({ id: bauplan.bioFeld, label: "Zweck", form: "longtext" })
  if (bauplan.hervorhebungFeld) felder.push(bauplan.hervorhebungFeld)
  for (const a of bauplan.aktionen) {
    felder.push({ id: a.feld, label: a.label, form: a.art === "email" ? "email" : "url" })
  }
  for (const z of bauplan.zahlen) {
    // Eine gezählte Zahl bringt kein eigenes Feld mit: Sie zählt ein Feld,
    // das schon woanders steht (Themen oder Werk).
    if (z.zaehle) continue
    if (z.feld) felder.push({ id: z.feld, label: z.label, form: "money" })
    if (z.bisFeld) felder.push({ id: z.bisFeld, label: z.label, form: "money" })
  }
  if (bauplan.themenFeld) felder.push({ id: bauplan.themenFeld, label: "Themen", form: "tags" })
  if (bauplan.werk) felder.push({ id: bauplan.werk.feld, label: "Werk", form: "tags" })
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
 * 20.09.2026: *"manche profile zeigt er garnicht an"* — vier von sechs Spaces
 * zeigten "trägt noch keine Angaben", weil ein Förderer-Bauplan auf ein
 * Netzwerk gelegt wurde. Eine leere Karte ist schlechter als keine.
 *
 * Erkannt wird an drei Stellen, in dieser Reihenfolge:
 *
 * 1. `kind` — die Art, die ein Netzwerk seinen Spaces gibt
 * 2. `foerdererart` — das Feld, das jede recherchierte Stiftung trägt
 * 3. `beduerfnis` — das Feld, ohne das ein Projektprofil unfertig bleibt
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

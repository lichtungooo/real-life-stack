// Das Profil einer Einrichtung, als Collage aus Kacheln.
//
// **Die Vorgabe stammt von Janosch** (UX im Kernteam), 21.09.2026:
//
//   "Es gibt ein Bild. Wenn kein Bild vorhanden ist, dann ist dort ein
//    Platzhalterbild, sodass man das Bild manuell ergänzen kann. Es gibt einen
//    Namen. Es gibt Mitwirkende. Es gibt eine Liste relevanter Details, die
//    sich aus den Texten ergibt. Es gibt eine Hashtag-Funktion für wesentliche
//    Inhalte: Themen, Name, Gründer. Hashtags können vorgeschlagen werden und
//    manuell ergänzt. Es gibt ein Datum, wann die Stiftung gegründet wurde,
//    und eine Zusammenfassung wesentlicher Meilensteine. Es gibt eine Karte.
//    Es gibt ein Feld für Stiftungsdetails rechtlicher Art und ein Textfeld,
//    um Details selbstständig zu ergänzen. Dann ein Kontaktfeld mit Website,
//    Adresse, Telefon, E-Mail. Das Profil ist so angeordnet, dass die
//    wichtigen Informationen ganz oben stehen und je mehr es ins Detail geht,
//    weiter unten. In einer Art Collage. Diese Collage kann man manuell
//    abändern, sodass man Informationen per Drag and Drop nach oben ziehen
//    kann und umgekehrt."
//
// **Der Kopf bleibt oben.** Bild, Name und Einordnung sind die Identität; sie
// stehen fest. Alles darunter ist die Collage und lässt sich verschieben.
//
// **Eine Kachel ohne Inhalt erscheint nicht.** Feld-Präsenz statt
// Typ-Verzweigung (Antons Muster 4). Ausnahme ist das Bild: Fehlt es, steht
// dort ein Platzhalter, damit jemand es ergänzen kann.
//
// **Diese Datei kennt keine Oberfläche.** Sie rechnet aus, welche Kacheln ein
// Profil hat und was darin steht. Die Darstellung liegt in `td-ui`
// (ARCHITEKTUR Teil 3, Regel 2).

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
  | "tel"
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

/** Welche Art von Kachel. Die Oberfläche zeichnet jede anders. */
export type KachelArt =
  | "hashtags"
  | "details"
  | "geschichte"
  | "karte"
  | "mitwirkende"
  | "kontakt"
  | "rechtliches"
  | "notiz"

/** Ein Punkt auf dem Zeitstrahl: wann, und was geschah. */
export interface Meilenstein {
  /** Das Jahr oder Datum, wie es dasteht. */
  wann: string
  was: string
}

/** Ein Ort auf der Karte. */
export interface Ort {
  laenge: number
  breite: number
  /** Die Anschrift, falls sie dasteht. */
  anschrift?: string
}

/** Eine Kachel der Collage. */
export interface Kachel {
  id: KachelArt
  titel: string
  /**
   * Wie breit die Kachel im Raster steht.
   *
   * Eine Karte und ein Zeitstrahl brauchen Platz, eine Kontaktliste nicht.
   * Die Oberfläche darf davon abweichen, wenn der Kasten zu eng ist.
   */
  breite: "schmal" | "breit"
  /** Die Felder dieser Kachel. Leer bei Kacheln mit eigener Form. */
  felder: ProfilFeld[]
  /** Bei `hashtags`: die Schlagworte. */
  hashtags?: string[]
  /** Bei `geschichte`: der Zeitstrahl. */
  meilensteine?: Meilenstein[]
  /** Bei `karte`: der Ort. */
  ort?: Ort
  /** Bei `notiz`: der freie Text. */
  text?: string
}

/** Ein fertiges Profil, bereit zum Anzeigen. */
export interface Profil {
  /** Das Bild, falls eines dasteht. Sonst zeigt die Fläche einen Platzhalter. */
  bild?: string
  /** Die Zeile unter dem Namen: Stiftung · fördernd · Darmstadt. */
  einordnung: string[]
  /** Die Kacheln der Collage, in der Rangfolge wichtig nach detailliert. */
  kacheln: Kachel[]
  /** Wie viele der vorgesehenen Felder eine Angabe tragen. */
  stand: { gefuellt: number; gesamt: number }
}

/** Ein Feld, wie der Bauplan es führt. */
interface BauFeld {
  id: string
  label: string
  form: FeldForm
}

/** Was eine Kachel trägt. */
interface BauKachel {
  id: KachelArt
  titel: string
  breite: "schmal" | "breit"
  /** Die Felder, die in dieser Kachel stehen. */
  felder: BauFeld[]
}

/**
 * Was ein Profil dieser Art trägt.
 *
 * **Die Reihenfolge der Kacheln ist die Rangfolge:** wichtig oben,
 * detailliert unten (Janosch). Wer die Collage umsortiert, verschiebt gegen
 * diese Voreinstellung.
 */
export interface Bauplan {
  /** Das Feld mit dem Bild. */
  bildFeld?: string
  /** Die Felder der Einordnungszeile, in dieser Reihenfolge. */
  einordnung: BauFeld[]
  /** Woraus Hashtags vorgeschlagen werden. */
  hashtagQuellen: string[]
  /** Das Feld mit den von Hand ergänzten Hashtags. */
  hashtagFeld?: string
  /** Das Feld mit dem Gründungsdatum. */
  gegruendetFeld?: string
  /** Das Feld mit den Meilensteinen. */
  meilensteineFeld?: string
  /** Das Feld mit der Position. */
  ortFeld?: string
  /** Das Feld mit der Anschrift, die zur Position gehört. */
  anschriftFeld?: string
  /** Das Feld mit dem freien Text. */
  notizFeld?: string
  /** Die Kacheln, in der Rangfolge wichtig nach detailliert. */
  kacheln: BauKachel[]
}

/**
 * Der Bauplan für einen Förderer.
 *
 * Die Reihenfolge folgt Janoschs Regel: Worum es geht (Hashtags), was man
 * wissen muss (Details), woher es kommt (Geschichte), wo es ist (Karte), wer
 * dahintersteht (Mitwirkende), wie man erreicht (Kontakt), und zuletzt das
 * Rechtliche und die eigene Notiz.
 */
export const BAUPLAN_FOERDERER: Bauplan = Object.freeze<Bauplan>({
  bildFeld: "image",
  einordnung: [
    { id: "foerdererart", label: "Art", form: "select" },
    { id: "art", label: "Fördernd oder operativ", form: "select" },
    { id: "sitz", label: "Sitz", form: "text" },
    { id: "reichweite", label: "Reichweite", form: "tags" },
  ],
  // Janosch: "Themen, der Name, der Gründer. Solche Beispiele können als
  // Hashtags verwendet werden." Vorgeschlagen wird aus dem, was dasteht.
  hashtagQuellen: ["foerderbereiche", "zielgruppen", "themen", "gruender", "sitz"],
  hashtagFeld: "hashtags",
  gegruendetFeld: "gegruendet",
  meilensteineFeld: "meilensteine",
  ortFeld: "position",
  anschriftFeld: "address",
  notizFeld: "notiz",
  kacheln: [
    {
      id: "details",
      titel: "Was Sie wissen sollten",
      breite: "breit",
      felder: [
        // Der Satz, an dem ein Projekt erkennt, ob es passt. Er steht zuerst,
        // weil er nirgends sonst steht.
        { id: "hinweis", label: "Woran Sie erkennen, dass Sie passen", form: "longtext" },
        { id: "zweck", label: "Zweck", form: "longtext" },
        { id: "foerderbereiche", label: "Förderbereiche", form: "tags" },
        { id: "zielgruppen", label: "Zielgruppen", form: "tags" },
        { id: "summeVon", label: "Förderung ab", form: "money" },
        { id: "summeBis", label: "Förderung bis", form: "money" },
        { id: "volumenJahr", label: "Im Jahr insgesamt", form: "money" },
        { id: "antragstellung", label: "Anträge möglich", form: "select" },
        { id: "antragsweg", label: "Antragsweg", form: "select" },
        { id: "fristen", label: "Fristen", form: "text" },
        { id: "unterlagen", label: "Unterlagen", form: "list" },
        { id: "eigenmittel", label: "Eigenmittel", form: "text" },
        { id: "antragsportal", label: "Antragsportal", form: "url" },
        { id: "bisherGefoerdert", label: "Bisher gefördert", form: "tags" },
        { id: "zustiftung", label: "Zustiftung", form: "bool" },
        { id: "spende", label: "Spende", form: "bool" },
        { id: "treuhand", label: "Treuhandstiftung", form: "bool" },
      ],
    },
    { id: "geschichte", titel: "Geschichte", breite: "breit", felder: [] },
    { id: "karte", titel: "Wo", breite: "breit", felder: [] },
    {
      id: "mitwirkende",
      titel: "Mitwirkende",
      breite: "schmal",
      felder: [
        { id: "mitwirkende", label: "Menschen", form: "list" },
        { id: "gruender", label: "Gegründet von", form: "text" },
      ],
    },
    {
      id: "kontakt",
      titel: "Kontakt",
      breite: "schmal",
      felder: [
        { id: "website", label: "Website", form: "url" },
        { id: "mail", label: "Mail", form: "email" },
        { id: "telefon", label: "Telefon", form: "tel" },
        { id: "ansprache", label: "Ansprache", form: "text" },
      ],
    },
    {
      id: "rechtliches",
      titel: "Rechtliches",
      breite: "schmal",
      felder: [
        { id: "rechtsform", label: "Rechtsform", form: "text" },
        { id: "register", label: "Register", form: "text" },
        { id: "aufsicht", label: "Stiftungsaufsicht", form: "text" },
        { id: "gemeinnuetzig", label: "Gemeinnützig", form: "bool" },
        { id: "steuernummer", label: "Steuernummer", form: "text" },
      ],
    },
    { id: "notiz", titel: "Eigene Notiz", breite: "breit", felder: [] },
  ],
})

/** Der Bauplan für ein Projekt. Dieselbe Collage, andere Felder. */
export const BAUPLAN_PROJEKT: Bauplan = Object.freeze<Bauplan>({
  bildFeld: "image",
  einordnung: [
    { id: "kurz", label: "In einem Satz", form: "text" },
    { id: "region", label: "Wo es wirkt", form: "tags" },
  ],
  hashtagQuellen: ["themen", "zielgruppen", "region"],
  hashtagFeld: "hashtags",
  gegruendetFeld: "gegruendet",
  meilensteineFeld: "meilensteine",
  ortFeld: "position",
  anschriftFeld: "address",
  notizFeld: "notiz",
  kacheln: [
    {
      id: "details",
      titel: "Worum es geht",
      breite: "breit",
      felder: [
        // Es beschreibt eine Lücke, kein Projekt: "Vierzig Bäche bleiben
        // unbetreut" zieht, "wir sind ein Verein für Umweltbildung" nicht.
        { id: "beduerfnis", label: "Was ohne dieses Vorhaben fehlt", form: "longtext" },
        { id: "themen", label: "Themen", form: "tags" },
        { id: "zielgruppen", label: "Für wen", form: "tags" },
        { id: "wirkung", label: "Was sich ändert", form: "list" },
        { id: "bedarfe", label: "Bedarfe", form: "list" },
        { id: "bedarfGesamt", label: "Bedarf insgesamt", form: "money" },
        { id: "eigenmittel", label: "Eigenmittel", form: "money" },
        { id: "luecke", label: "Noch offen", form: "money" },
        { id: "vorhandenes", label: "Vorhanden", form: "list" },
        { id: "schritte", label: "Schritte", form: "list" },
        { id: "zeitraum", label: "Zeitraum", form: "daterange" },
      ],
    },
    { id: "geschichte", titel: "Geschichte", breite: "breit", felder: [] },
    { id: "karte", titel: "Wo", breite: "breit", felder: [] },
    {
      id: "mitwirkende",
      titel: "Mitwirkende",
      breite: "schmal",
      felder: [
        { id: "anstifter", label: "Angestoßen von", form: "ref" },
        { id: "gruppe", label: "Getragen von", form: "ref" },
        { id: "foerderer", label: "Förderer", form: "ref" },
        { id: "zustifter", label: "Zustifter", form: "ref" },
        { id: "mitwirkende", label: "Menschen", form: "list" },
      ],
    },
    {
      id: "kontakt",
      titel: "Kontakt",
      breite: "schmal",
      felder: [
        { id: "website", label: "Website", form: "url" },
        { id: "mail", label: "Mail", form: "email" },
        { id: "telefon", label: "Telefon", form: "tel" },
      ],
    },
    {
      id: "rechtliches",
      titel: "Rechtliches",
      breite: "schmal",
      felder: [
        { id: "rechtsform", label: "Rechtsform", form: "text" },
        { id: "register", label: "Register", form: "text" },
        { id: "gemeinnuetzig", label: "Gemeinnützig", form: "bool" },
      ],
    },
    { id: "notiz", titel: "Eigene Notiz", breite: "breit", felder: [] },
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
 * Aus einem Wort wird ein Schlagwort.
 *
 * Ein Hashtag trägt keine Leerzeichen und keine Satzzeichen: Aus "Kinder und
 * Jugend" wird `KinderUndJugend`, aus "Alten- und Behindertenhilfe"
 * `AltenUndBehindertenhilfe`. Umlaute bleiben, denn sie sind Teil des Wortes.
 */
export function alsHashtag(roh: string): string {
  const woerter = roh
    .trim()
    .split(/[\s\-_/,.]+/)
    .filter((w) => w.length > 0)
  if (woerter.length === 0) return ""
  if (woerter.length === 1) {
    // Ein einzelnes Wort behält seine Schreibweise, bis auf den ersten
    // Buchstaben: "umwelt" wird "Umwelt", "SAGST" bleibt "SAGST".
    const w = woerter[0]
    return w[0].toUpperCase() + w.slice(1)
  }
  return woerter.map((w) => w[0].toUpperCase() + w.slice(1)).join("")
}

/**
 * Welche Hashtags schlägt dieses Profil von selbst vor?
 *
 * Janosch: *"Hashtags können vorgeschlagen werden von Anfang an und manuell
 * ergänzt werden."* Vorgeschlagen wird aus dem, was dasteht: Themen,
 * Zielgruppen, Gründer, Ort. Von Hand ergänzte stehen **vorn**, denn wer
 * etwas selbst hinzufügt, meint es.
 *
 * Doppelte fallen weg, auch wenn sie unterschiedlich geschrieben sind.
 */
export function hashtagsFuer(
  daten: Record<string, unknown> | null | undefined,
  bauplan: Bauplan = BAUPLAN_FOERDERER,
): string[] {
  const d = daten ?? {}
  const gesehen = new Set<string>()
  const raus: string[] = []

  const dazu = (roh: string) => {
    const tag = alsHashtag(roh)
    if (tag.length === 0) return
    const schluessel = tag.toLowerCase()
    if (gesehen.has(schluessel)) return
    gesehen.add(schluessel)
    raus.push(tag)
  }

  // Von Hand ergänzte zuerst.
  if (bauplan.hashtagFeld) for (const t of liste(d[bauplan.hashtagFeld])) dazu(t)
  for (const quelle of bauplan.hashtagQuellen) for (const t of liste(d[quelle])) dazu(t)

  return raus
}

/** Die Meilensteine als Zeitstrahl, sortiert. */
function meilensteineAus(wert: unknown): Meilenstein[] {
  if (!Array.isArray(wert)) return []
  const raus: Meilenstein[] = []
  for (const m of wert) {
    if (typeof m === "string") {
      // "1992: Gegründet von Peter Schnell" oder "1992 Gegründet"
      const treffer = m.match(/^\s*(\d{4}(?:[-/.]\d{1,2})?)\s*[:–-]?\s*(.+)$/)
      if (treffer) raus.push({ wann: treffer[1], was: treffer[2].trim() })
      continue
    }
    if (m && typeof m === "object") {
      const o = m as Record<string, unknown>
      const wann = text(o.wann) ?? text(o.jahr) ?? text(o.datum)
      const was = text(o.was) ?? text(o.text) ?? text(o.titel)
      if (wann && was) raus.push({ wann, was })
    }
  }
  // Ältestes zuerst: Eine Geschichte liest sich von vorn.
  return raus.sort((a, b) => a.wann.localeCompare(b.wann))
}

/** Der Ort, falls eine Position dasteht. */
function ortAus(position: unknown, anschrift: unknown): Ort | undefined {
  if (!position || typeof position !== "object") return undefined
  const p = position as { coordinates?: unknown }
  if (!Array.isArray(p.coordinates) || p.coordinates.length < 2) return undefined
  const [laenge, breite] = p.coordinates
  if (typeof laenge !== "number" || typeof breite !== "number") return undefined
  if (!Number.isFinite(laenge) || !Number.isFinite(breite)) return undefined
  const adr = text(anschrift)
  return { laenge, breite, ...(adr ? { anschrift: adr } : {}) }
}

/**
 * Ein Profil aufbauen: Bild, Einordnung, Kacheln.
 *
 * Eine Kachel ohne Inhalt erscheint nicht. Die Reihenfolge ist die
 * Rangfolge des Bauplans; wer die Collage umsortiert, verschiebt gegen sie.
 */
export function profilAufbauen(
  daten: Record<string, unknown> | null | undefined,
  bauplan: Bauplan = BAUPLAN_FOERDERER,
): Profil {
  const d = daten ?? {}

  const nehmen = (f: BauFeld): ProfilFeld | null =>
    feldTraegt(d[f.id], f.form) ? { ...f, wert: d[f.id] } : null

  const bild = bauplan.bildFeld ? text(d[bauplan.bildFeld]) : undefined

  const einordnung: string[] = []
  for (const f of bauplan.einordnung) {
    if (!feldTraegt(d[f.id], f.form)) continue
    const w = d[f.id]
    einordnung.push(Array.isArray(w) ? w.join(", ") : String(w))
  }

  const hashtags = hashtagsFuer(d, bauplan)
  const gegruendet = bauplan.gegruendetFeld ? text(d[bauplan.gegruendetFeld]) : undefined
  const meilensteine = bauplan.meilensteineFeld
    ? meilensteineAus(d[bauplan.meilensteineFeld])
    : []
  const ort = bauplan.ortFeld
    ? ortAus(d[bauplan.ortFeld], bauplan.anschriftFeld ? d[bauplan.anschriftFeld] : undefined)
    : undefined
  const notiz = bauplan.notizFeld ? text(d[bauplan.notizFeld]) : undefined

  const kacheln: Kachel[] = []

  // Die Hashtag-Kachel steht ganz oben: Sie sagt in einer Zeile, worum es
  // geht. Sie erscheint auch ohne eigenes Feld, weil sie vorschlägt.
  if (hashtags.length > 0) {
    kacheln.push({ id: "hashtags", titel: "Schlagworte", breite: "breit", felder: [], hashtags })
  }

  for (const k of bauplan.kacheln) {
    const felder = k.felder.map(nehmen).filter((f): f is ProfilFeld => f !== null)

    if (k.id === "geschichte") {
      // Ein Gründungsdatum allein ist schon eine Geschichte.
      if (!gegruendet && meilensteine.length === 0) continue
      kacheln.push({
        id: k.id,
        titel: k.titel,
        breite: k.breite,
        felder: gegruendet
          ? [{ id: "gegruendet", label: "Gegründet", form: "text", wert: gegruendet }]
          : [],
        meilensteine,
      })
      continue
    }

    if (k.id === "karte") {
      if (!ort) continue
      kacheln.push({ id: k.id, titel: k.titel, breite: k.breite, felder: [], ort })
      continue
    }

    if (k.id === "notiz") {
      if (!notiz) continue
      kacheln.push({ id: k.id, titel: k.titel, breite: k.breite, felder: [], text: notiz })
      continue
    }

    if (felder.length === 0) continue
    kacheln.push({ id: k.id, titel: k.titel, breite: k.breite, felder })
  }

  return { ...(bild ? { bild } : {}), einordnung, kacheln, stand: profilStand(d, bauplan) }
}

/**
 * Die Kacheln in der Reihenfolge, die jemand gewählt hat.
 *
 * Janosch: *"Diese Collage kann man manuell abändern, sodass man
 * Informationen von unten per Drag and Drop nach oben ziehen kann und
 * umgekehrt."*
 *
 * Eine gespeicherte Reihenfolge ist eine **Wunschliste, kein Bestand**: Sie
 * nennt Kacheln, die es inzwischen nicht mehr gibt, und sie kennt neue nicht.
 * Darum: Was genannt ist und existiert, kommt in der genannten Reihenfolge;
 * alles Übrige folgt in der Rangfolge des Bauplans.
 */
export function kachelnOrdnen(kacheln: Kachel[], ordnung: readonly string[] | null | undefined): Kachel[] {
  if (!ordnung || ordnung.length === 0) return kacheln
  const nachId = new Map(kacheln.map((k) => [k.id as string, k]))
  const raus: Kachel[] = []
  for (const id of ordnung) {
    const k = nachId.get(id)
    if (k) {
      raus.push(k)
      nachId.delete(id)
    }
  }
  for (const k of kacheln) if (nachId.has(k.id as string)) raus.push(k)
  return raus
}

/**
 * Alle Felder eines Bauplans, in einer Liste.
 *
 * Gebraucht vom Stand und von den Tests: Ein Feld darf an genau einer Stelle
 * stehen, und diese Liste zeigt jede doppelte Kennung.
 */
export function alleFelder(bauplan: Bauplan): BauFeld[] {
  const felder: BauFeld[] = [...bauplan.einordnung]
  if (bauplan.bildFeld) felder.push({ id: bauplan.bildFeld, label: "Bild", form: "url" })
  if (bauplan.hashtagFeld) {
    felder.push({ id: bauplan.hashtagFeld, label: "Schlagworte", form: "tags" })
  }
  if (bauplan.gegruendetFeld) {
    felder.push({ id: bauplan.gegruendetFeld, label: "Gegründet", form: "text" })
  }
  if (bauplan.meilensteineFeld) {
    felder.push({ id: bauplan.meilensteineFeld, label: "Meilensteine", form: "list" })
  }
  if (bauplan.ortFeld) felder.push({ id: bauplan.ortFeld, label: "Ort", form: "position" })
  if (bauplan.anschriftFeld) {
    felder.push({ id: bauplan.anschriftFeld, label: "Anschrift", form: "text" })
  }
  if (bauplan.notizFeld) felder.push({ id: bauplan.notizFeld, label: "Notiz", form: "longtext" })
  for (const k of bauplan.kacheln) felder.push(...k.felder)
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
 * **Wer keinen Bauplan hat, hat kein Profil.** Ein Netzwerk ist weder
 * Förderer noch Projekt. Erkannt wird an drei Stellen, in dieser Reihenfolge:
 * `kind`, `foerdererart`, `beduerfnis`.
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
 * daraus hat eine Angabe.
 */
export function traegtProfil(daten: Record<string, unknown> | null | undefined): boolean {
  const bauplan = bauplanFuer(daten)
  if (!bauplan) return false
  return profilStand(daten, bauplan).gefuellt > 0
}

/** Eine Kartenkachel und wo sie im Kasten liegt. */
export interface Kartenkachel {
  z: number
  x: number
  y: number
  /** Abstand vom linken Rand des Kastens, in Pixeln. */
  links: number
  /** Abstand vom oberen Rand des Kastens, in Pixeln. */
  oben: number
}

/** Ein Kartenausschnitt: welche Kacheln, und wo die Nadel steht. */
export interface Kartenausschnitt {
  kacheln: Kartenkachel[]
  nadel: { links: number; oben: number }
  zoom: number
}

/** Die Kantenlänge einer Kartenkachel, wie jeder Kachelserver sie liefert. */
const KACHEL = 256

/**
 * Welche Kartenkacheln decken diesen Ausschnitt, und wo steht die Nadel?
 *
 * **Warum das hier steht und nicht in der Oberfläche:** Es ist Rechnung, kein
 * Aussehen, und eine Rechnung lässt sich ohne Browser prüfen. Die Oberfläche
 * legt danach nur noch Bilder an die genannten Stellen.
 *
 * **Warum Kacheln und kein Kartenwerkzeug:** Eine Kartenbibliothek wiegt rund
 * ein Megabyte. Für einen Ausschnitt in einer Kachel des Profils lohnt das
 * nicht; vier bis neun Bilder tun dasselbe. Ein fremder Rahmen (iframe) fällt
 * auch aus: Die App läuft mit COEP, und das blockiert jeden, der keine
 * passenden Kopfzeilen mitschickt (gemessen am 21.09.2026).
 *
 * Die Umrechnung ist die von Web-Mercator, wie sie jeder Kachelserver nutzt.
 */
export function kartenAusschnitt(
  ort: Ort,
  breite: number,
  hoehe: number,
  zoom = 14,
): Kartenausschnitt {
  const z = Math.max(0, Math.min(19, Math.round(zoom)))
  const n = 2 ** z

  // Von Längen- und Breitengrad zu Weltpixeln.
  const breitenRad = (Math.max(-85.05112878, Math.min(85.05112878, ort.breite)) * Math.PI) / 180
  const xWelt = ((ort.laenge + 180) / 360) * n * KACHEL
  const yWelt =
    ((1 - Math.asinh(Math.tan(breitenRad)) / Math.PI) / 2) * n * KACHEL

  // Der Kasten liegt mittig um den Punkt.
  const linkeKante = xWelt - breite / 2
  const obereKante = yWelt - hoehe / 2

  const vonX = Math.floor(linkeKante / KACHEL)
  const bisX = Math.floor((linkeKante + breite) / KACHEL)
  const vonY = Math.floor(obereKante / KACHEL)
  const bisY = Math.floor((obereKante + hoehe) / KACHEL)

  const kacheln: Kartenkachel[] = []
  for (let y = vonY; y <= bisY; y++) {
    // Über den Polen gibt es keine Kacheln. Unten und oben bleibt es leer,
    // statt eine Kachel zu fordern, die es nicht gibt.
    if (y < 0 || y >= n) continue
    for (let x = vonX; x <= bisX; x++) {
      // Um die Datumsgrenze läuft die Welt weiter: Kachel -1 ist n-1.
      const gewickelt = ((x % n) + n) % n
      kacheln.push({
        z,
        x: gewickelt,
        y,
        links: x * KACHEL - linkeKante,
        oben: y * KACHEL - obereKante,
      })
    }
  }

  return { kacheln, nadel: { links: breite / 2, oben: hoehe / 2 }, zoom: z }
}

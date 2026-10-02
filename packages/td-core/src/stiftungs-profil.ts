// Das Stiftungsprofil (DEFINITION Teil 8), der Kern: aus den Daten einer
// Stiftung das, was ein Projekt auf der Suche nach Förderung lesen will.
//
// Die Vorlage wächst mit: Die 193 recherchierten Stiftungen tragen meist nur
// Name, Anschrift mit Quelle, Website, Förderbereiche und einen Antragsweg.
// Übernimmt eine Stiftung ihr Profil, erscheinen weitere Abschnitte von
// selbst. Was fehlt, fällt weg; keine Bewertung, keine Passungszahl.

import { text, zahl, objekt, liste, texte, janein, sichereUrl, sichererBildPfad, sichereMail, type Roh } from "./schleuse.js"
import { euro } from "./projekt-profil.js"

/** Die gezeichneten Bildmotive (td-ui `stiftungs-motive`), eins je Förderbereich. */
export const STIFTUNGS_MOTIVE = /* @__PURE__ */ Object.freeze([
  "bildung", "umwelt", "kinder", "kultur", "musik", "gesundheit", "soziales", "wissenschaft",
  "international", "demokratie", "sport", "inklusion", "kirche", "handwerk", "denkmal", "klima", "allgemein",
] as const)
export type StiftungsMotiv = (typeof STIFTUNGS_MOTIVE)[number]

export interface StiftungsSchwerpunkt {
  titel: string
  text: string | null
  motiv: StiftungsMotiv
}

// Welches Motiv zu einem Wort passt; das erste passende gewinnt.
const MOTIV_WOERTER: [StiftungsMotiv, RegExp][] = [
  ["musik", /musik|orchester|chor|konzert/i],
  ["denkmal", /denkmal|baukultur|heimatpflege|kirchenbau|baudenkm/i],
  ["kirche", /kirche|glaube|religi|seelsorge|diakon|caritas|pastoral/i],
  ["klima", /klima|energie|erneuerbar/i],
  ["umwelt", /umwelt|natur|arten|tier|landwirt|ernährung|wasser|wald|garten|nachhaltig/i],
  ["kinder", /kind|kita|familie/i],
  ["bildung", /bildung|schul|lern|lese|ausbildung|stipend|begab|studi|pädagog|medien/i],
  ["wissenschaft", /wissenschaft|forschung|technik|mint|innovation|digital/i],
  ["kultur", /kultur|kunst|theater|literatur|film|museum/i],
  ["gesundheit", /gesundheit|medizin|pflege|krank|hospiz/i],
  ["inklusion", /inklusion|behinder|teilhabe|barriere/i],
  ["international", /international|entwicklung|europa|global|lateinamerika|afrika|frieden|migration|flucht|integration/i],
  ["demokratie", /demokratie|gesellschaft|politi|bürger|engagement|ehrenamt|gemeinwesen|zivil|menschenrecht/i],
  ["sport", /sport|bewegung/i],
  ["handwerk", /handwerk|beruf|arbeit|wirtschaft|meister|gründ/i],
  ["soziales", /sozial|armut|wohn|alter|senior|jugend|hilfe/i],
]

/** Das Bildmotiv zu einem Förderbereich oder Schwerpunkt. */
export function motivFuer(wort: string): StiftungsMotiv {
  for (const [motiv, muster] of MOTIV_WOERTER) if (muster.test(wort)) return motiv
  return "allgemein"
}

const motivAus = (v: unknown, titel: string): StiftungsMotiv =>
  typeof v === "string" && (STIFTUNGS_MOTIVE as readonly string[]).includes(v) ? (v as StiftungsMotiv) : motivFuer(titel)

export interface StiftungsProfil {
  titel: string
  /** Logo oder Bild; sonst zeigt die Seite das Monogramm. */
  bild: string | null
  /** Das Logo ist hell (für dunklen Grund gemacht): Es steht auf den Hausfarben statt auf Weiß. */
  bildHell: boolean
  /** Zwei Buchstaben für den Platzhalter, ohne „Stiftung“ und Füllwörter. */
  monogramm: string
  /** Hausfarbe (`hausfarbe`), sonst `color`, sonst das Blau der Stiftungen. */
  farbe: string
  /** Die zweite Farbe des Auftritts (`akzent`), sonst eine dunklere Hausfarbe. */
  akzent: string
  /** Text auf dem Verlauf aus Haus- und Akzentfarbe: hell oder dunkel, je nach Kontrast. */
  textAufFarbe: string
  /** Die Hausfarbe als Schrift auf hellem Grund, so weit abgedunkelt, dass sie lesbar ist (4,5 zu 1). */
  farbeText: string
  /** Ein, zwei Sätze, was die Stiftung tut. */
  kurz: string | null
  /** „Stiftung · fördernd“ */
  art: string[]
  sitz: string | null
  reichweite: string[]
  antrag: {
    weg: string | null
    fristen: string[]
    unterlagen: string[]
    /** Die Seite für den Antrag, sonst die Website. */
    ziel: string | null
    /** Ist `ziel` ein eigenes Antragsportal (sonst nur die Website)? */
    portal: boolean
  } | null
  /** „2.000 € bis 25.000 €“, „bis 500.000 €“, „ab 10.000 €“ */
  summe: string | null
  volumenJahr: string | null
  foerderbereiche: string[]
  zielgruppen: string[]
  zweck: string | null
  hinweis: string | null
  bisherGefoerdert: string[]
  /** Was sie in einem Bereich konkret fördert, höchstens sechs, jeweils mit Bildmotiv. */
  schwerpunkte: StiftungsSchwerpunkt[]
  /** Geförderte Projekte mit Namen, höchstens sechs (dazu `bisherGefoerdert` als Titel). */
  beispiele: { titel: string; text: string | null; ort: string | null; jahr: string | null }[]
  /** Zahlen für den Kopf: eigene Zahlen, dann Summe, Volumen, Reichweite; höchstens vier. */
  kennzahlen: { wert: string; was: string }[]
  /** Wie sie entstanden ist und wer dahinter steht. */
  herkunft: string | null
  kontakt: {
    website: string | null
    anschrift: string | null
    /** Woher die Anschrift stammt (Impressum, Register). */
    anschriftQuelle: string | null
    mail: string | null
    ansprache: string | null
  } | null
  geben: { zustiftung: boolean | null; spende: boolean | null; treuhand: boolean | null } | null
  /** Woher die Angaben stammen, solange die Stiftung sie nicht selbst pflegt. */
  quelle: string | null
  /** Woher Logo, Farben und Texte stammen, und von wann. */
  auftritt: { quelle: string | null; stand: string | null } | null
  muster: boolean
}

const BLAU = "#194294"
const FUELLWOERTER = new Set(["stiftung", "foundation", "der", "die", "das", "für", "fuer", "und", "von", "zur", "zum", "e.v.", "gemeinnützige", "gemeinnuetzige"])

const farbeAus = (v: unknown): string | null => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v.trim()) ? v.trim().toLowerCase() : null)

function rgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
}

/** Relative Leuchtdichte nach WCAG. */
function leuchte(hex: string): number {
  const [r, g, b] = rgb(hex).map((c) => {
    const x = c / 255
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Kontrast zweier Farben nach WCAG, 1 bis 21. */
export function kontrast(a: string, b: string): number {
  const [x, y] = [leuchte(a), leuchte(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

const HELL = "#ffffff"
const DUNKEL = "#111827"

/** Hell oder dunkel: was auf allen genannten Farben am schlechtesten noch am besten lesbar ist. */
export function lesbarAuf(...farben: string[]): string {
  const min = (t: string) => Math.min(...farben.map((f) => kontrast(t, f)))
  return min(HELL) >= min(DUNKEL) ? HELL : DUNKEL
}

/** Die Farbe, so weit abgedunkelt, dass sie auf hellem Grund lesbar ist. */
export function lesbarAufHell(hex: string, ziel = 4.5): string {
  let f = hex
  for (let i = 0; i < 12 && kontrast(f, "#f8f8f8") < ziel; i++) f = dunkler(f, 0.12)
  return f
}

/** Dieselbe Farbe, um einen Anteil zu Schwarz gemischt. */
export function dunkler(hex: string, anteil = 0.3): string {
  return "#" + rgb(hex).map((c) => Math.round(c * (1 - anteil)).toString(16).padStart(2, "0")).join("")
}

function monogramm(titel: string): string {
  const woerter = titel.split(/[\s-]+/).filter((w) => w && !FUELLWOERTER.has(w.toLowerCase()))
  const quelle = woerter.length ? woerter : titel.split(/\s+/)
  const zwei = quelle.length > 1 ? quelle[0][0] + quelle[1][0] : quelle[0].slice(0, 2)
  return zwei.toUpperCase()
}

/** Ein Feld als Liste, auch wenn es als Satz kam („Stichtage im März und September“). */
function liste_oder_satz(v: unknown): string[] {
  const l = texte(v)
  if (l.length) return l
  const t = text(v)
  return t ? [t] : []
}

/** Förderbereiche wie „kinder“ als „Kinder“ zeigen. */
function gross(w: string): string {
  return w.charAt(0).toUpperCase() + w.slice(1)
}

function summeAus(d: Roh): string | null {
  const von = zahl(d.summeVon)
  const bis = zahl(d.summeBis)
  if (von !== null && bis !== null) return von === bis ? euro(von) : `${euro(von)} bis ${euro(bis)}`
  if (bis !== null) return `bis ${euro(bis)}`
  if (von !== null) return `ab ${euro(von)}`
  return null
}

/** Eigene Zahlen zuerst, dann Summe, Volumen und Reichweite; höchstens vier. */
function kennzahlenAus(d: Roh): { wert: string; was: string }[] {
  const aus: { wert: string; was: string }[] = []
  for (const x of liste(d.zahlen)) {
    const o = objekt(x)
    const wert = o ? (typeof o.wert === "number" ? String(o.wert) : text(o.wert)) : null
    const was = o ? text(o.was) : null
    if (wert && was) aus.push({ wert, was })
  }
  const summe = summeAus(d)
  if (summe) aus.push({ wert: summe, was: "je Vorhaben" })
  const volumen = zahl(d.volumenJahr)
  if (volumen !== null) aus.push({ wert: euro(volumen), was: "Fördervolumen im Jahr" })
  const reichweite = texte(d.reichweite).map(gross)
  if (reichweite.length) aus.push({ wert: reichweite.join(", "), was: "Reichweite" })
  return aus.slice(0, 4)
}

export { traegtStiftungsProfil } from "./stiftungs-erkennung.js"

export function stiftungsProfil(daten: Roh | null | undefined): StiftungsProfil {
  const d = daten ?? {}
  const titel = text(d.title) ?? "Stiftung"
  const website = sichereUrl(d.website)
  const portal = sichereUrl(d.antragsportal)
  const weg = text(d.antragsweg)
  const fristen = liste_oder_satz(d.fristen)
  const unterlagen = liste_oder_satz(d.unterlagen)
  const antrag = weg || fristen.length || unterlagen.length || portal
    ? { weg, fristen, unterlagen, ziel: portal ?? website, portal: Boolean(portal) }
    : null

  const kontakt = {
    website,
    anschrift: text(d.address),
    anschriftQuelle: sichereUrl(d.anschriftQuelle),
    mail: sichereMail(d.mail),
    ansprache: text(d.ansprache),
  }
  const geben = { zustiftung: janein(d.zustiftung), spende: janein(d.spende), treuhand: janein(d.treuhand) }
  const farbe = farbeAus(d.hausfarbe) ?? farbeAus(d.color) ?? BLAU
  const akzent = farbeAus(d.akzent) ?? dunkler(farbe)
  const auftritt = { quelle: sichereUrl(d.auftrittQuelle), stand: text(d.auftrittStand) }

  return {
    titel,
    bild: sichererBildPfad(d.bild) ?? sichererBildPfad(d.image) ?? sichererBildPfad(d.logo),
    bildHell: d.bildHell === true,
    monogramm: monogramm(titel),
    // Die Hausfarbe färbt das Profil; `color` bleibt das Blau der Stiftungen auf der Karte.
    farbe,
    akzent,
    textAufFarbe: lesbarAuf(farbe, akzent),
    farbeText: lesbarAufHell(farbe),
    kurz: text(d.kurz),
    art: [text(d.foerdererart), text(d.art)].filter((x): x is string => x !== null),
    sitz: text(d.sitz),
    reichweite: texte(d.reichweite).map(gross),
    antrag,
    summe: summeAus(d),
    volumenJahr: zahl(d.volumenJahr) !== null ? `${euro(zahl(d.volumenJahr)!)} im Jahr` : text(d.volumenJahr),
    foerderbereiche: texte(d.foerderbereiche).map(gross),
    zielgruppen: texte(d.zielgruppen).map(gross),
    zweck: text(d.zweck),
    hinweis: text(d.hinweis),
    bisherGefoerdert: texte(d.bisherGefoerdert),
    schwerpunkte: liste(d.schwerpunkte)
      .map((x) => {
        const o = objekt(x)
        const titel = o ? text(o.titel) : text(x)
        return titel ? { titel, text: o ? text(o.text) : null, motiv: motivAus(o?.motiv, titel) } : null
      })
      .filter((x): x is StiftungsSchwerpunkt => x !== null)
      .slice(0, 6),
    beispiele: [
      ...liste(d.beispiele).map((x) => {
        const o = objekt(x)
        const titel = o ? text(o.titel) : text(x)
        const jahr = o ? (typeof o.jahr === "number" ? String(o.jahr) : text(o.jahr)) : null
        return titel ? { titel, text: o ? text(o.text) : null, ort: o ? text(o.ort) : null, jahr } : null
      }),
      ...texte(d.bisherGefoerdert).map((titel) => ({ titel, text: null, ort: null, jahr: null })),
    ].filter((x): x is { titel: string; text: string | null; ort: string | null; jahr: string | null } => x !== null).slice(0, 6),
    kennzahlen: kennzahlenAus(d),
    herkunft: text(d.herkunft),
    kontakt: Object.values(kontakt).some((v) => v !== null) ? kontakt : null,
    geben: Object.values(geben).some((v) => v !== null) ? geben : null,
    quelle: text(d.quelle),
    auftritt: auftritt.quelle || auftritt.stand ? auftritt : null,
    muster: d.muster === true,
  }
}


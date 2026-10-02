// Das Stiftungsprofil (DEFINITION Teil 8), der Kern: aus den Daten einer
// Stiftung das, was ein Projekt auf der Suche nach Förderung lesen will.
//
// Die Vorlage wächst mit: Die 193 recherchierten Stiftungen tragen meist nur
// Name, Anschrift mit Quelle, Website, Förderbereiche und einen Antragsweg.
// Übernimmt eine Stiftung ihr Profil, erscheinen weitere Abschnitte von
// selbst. Was fehlt, fällt weg; keine Bewertung, keine Passungszahl.

import { text, zahl, texte, janein, sichereUrl, sichererBildPfad, sichereMail, type Roh } from "./schleuse.js"
import { euro } from "./projekt-profil.js"

export interface StiftungsProfil {
  titel: string
  /** Logo oder Bild; sonst zeigt die Seite das Monogramm. */
  bild: string | null
  /** Zwei Buchstaben für den Platzhalter, ohne „Stiftung“ und Füllwörter. */
  monogramm: string
  /** Hausfarbe (`hausfarbe`), sonst `color`, sonst das Blau der Stiftungen. */
  farbe: string
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
  muster: boolean
}

const BLAU = "#194294"
const FUELLWOERTER = new Set(["stiftung", "foundation", "der", "die", "das", "für", "fuer", "und", "von", "zur", "zum", "e.v.", "gemeinnützige", "gemeinnuetzige"])

const farbeAus = (v: unknown): string | null => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v : null)

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

/** Trägt dieser Eintrag ein Stiftungsprofil? Er sagt, dass er ein Förderer ist. */
export function traegtStiftungsProfil(daten: Roh | null | undefined): boolean {
  return Boolean(daten && text(daten.title) && text(daten.foerdererart))
}

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

  return {
    titel,
    bild: sichererBildPfad(d.bild) ?? sichererBildPfad(d.image) ?? sichererBildPfad(d.logo),
    monogramm: monogramm(titel),
    // Die Hausfarbe färbt das Profil; `color` bleibt das Blau der Stiftungen auf der Karte.
    farbe: farbeAus(d.hausfarbe) ?? farbeAus(d.color) ?? BLAU,
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
    kontakt: Object.values(kontakt).some((v) => v !== null) ? kontakt : null,
    geben: Object.values(geben).some((v) => v !== null) ? geben : null,
    quelle: text(d.quelle),
    muster: d.muster === true,
  }
}


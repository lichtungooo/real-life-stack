// Das Project Profile (DEFINITION Teil 8, „Was eine Komponente ist“), der
// Kern: aus den Daten eines Projekt-Eintrags das, was die Seite zeigt.
//
// Ohne Browser und geprueft. Was fehlt oder die falsche Form hat, faellt weg
// (Teil 9: kein Strich, kein „unbekannt“). Die Darstellung in td-ui rechnet
// nichts mehr aus.

import { text, zahl, objekt, liste, texte, sichereUrl, sichererBildPfad, type Roh } from "./schleuse.js"

export interface ProjektSpende {
  /** Zielbetrag in Euro. */
  ziel: number | null
  gesammelt: number | null
  unterstuetzende: number | null
  /** Die Seite bei Open Collective. Ohne sie steht der Knopf still. */
  opencollective: string | null
  /** Gesammelt im Verhaeltnis zum Ziel, 0 bis 1. Nur mit beiden Zahlen. */
  anteil: number | null
  /** Was noch fehlt, nie unter null. */
  offen: number | null
  /** Die Zahlen sind Beispiele, sichtbar so gekennzeichnet. */
  beispiel: boolean
  /** Vorgeschlagene Betraege mit ihrer Wirkung, aufsteigend. */
  stufen: { betrag: number; bewirkt: string | null }[]
}

export interface ProjektKennzahl {
  wert: string
  was: string
}

export interface ProjektBedarf {
  wofuer: string
  betrag: number | null
  /** Anteil an der Summe aller Bedarfe mit Betrag, 0 bis 1. */
  anteil: number | null
}

export interface ProjektSchritt {
  titel: string
  wann: string | null
  erledigt: boolean
}

export interface ProjektMensch {
  name: string
  rolle: string | null
  /** Zwei Buchstaben fuer das Bild, solange keines da ist. */
  kuerzel: string
}

export interface ProjektKontakt {
  person: string | null
  rolle: string | null
  mail: string | null
  telefon: string | null
  website: string | null
  adresse: string | null
}

export interface ProjektProfil {
  titel: string
  kurz: string | null
  muster: boolean
  titelbild: string | null
  /** Hoechstens vier, wie ein Besucher sie auf einen Blick liest. */
  kennzahlen: ProjektKennzahl[]
  /** Die Bilder nach dem Titelbild. */
  galerie: string[]
  tags: string[]
  ort: string | null
  zeitraum: string | null
  beduerfnis: string | null
  beschreibung: string | null
  wirkung: string[]
  bedarfe: ProjektBedarf[]
  /** Summe der Bedarfe mit Betrag, sonst null. */
  bedarfSumme: number | null
  schritte: ProjektSchritt[]
  /** Der erste Schritt, der noch nicht erledigt ist. */
  naechsterSchritt: number | null
  team: ProjektMensch[]
  kontakt: ProjektKontakt | null
  spende: ProjektSpende | null
}

function kuerzel(name: string): string {
  const teile = name.split(/\s+/).filter(Boolean)
  const k = teile.length > 1 ? teile[0][0] + teile[teile.length - 1][0] : name.slice(0, 2)
  return k.toUpperCase()
}

/** Ein Zeitraum aus `{ von, bis }` oder als Text. */
function zeitraumAus(v: unknown): string | null {
  const t = text(v)
  if (t) return t
  const o = objekt(v)
  if (!o) return null
  const von = text(o.von)
  const bis = text(o.bis)
  if (von && bis) return `${von} bis ${bis}`
  if (von) return `ab ${von}`
  if (bis) return `bis ${bis}`
  return null
}

function spendeAus(v: unknown): ProjektSpende | null {
  const o = objekt(v)
  if (!o) return null
  const ziel = zahl(o.ziel)
  const gesammelt = zahl(o.gesammelt)
  const unterstuetzende = zahl(o.unterstuetzende)
  const opencollective = sichereUrl(o.opencollective)
  const stufen = liste(o.stufen)
    .map((x) => {
      const st = objekt(x)
      const betrag = st ? zahl(st.betrag) : zahl(x)
      return betrag ? { betrag, bewirkt: st ? text(st.bewirkt) : null } : null
    })
    .filter((x): x is { betrag: number; bewirkt: string | null } => x !== null)
    .sort((a, b) => a.betrag - b.betrag)
  if (ziel === null && gesammelt === null && opencollective === null) return null
  const anteil = ziel && gesammelt !== null ? Math.min(1, gesammelt / ziel) : null
  const offen = ziel !== null && gesammelt !== null ? Math.max(0, ziel - gesammelt) : null
  return { ziel, gesammelt, unterstuetzende, opencollective, anteil, offen, beispiel: o.beispiel === true, stufen }
}

function kontaktAus(v: unknown, adresse: string | null): ProjektKontakt | null {
  const o = objekt(v) ?? {}
  const mailRoh = text(o.mail)
  const k: ProjektKontakt = {
    person: text(o.person),
    rolle: text(o.rolle),
    mail: mailRoh && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mailRoh) ? mailRoh : null,
    telefon: text(o.telefon),
    website: sichereUrl(o.website),
    adresse,
  }
  return Object.values(k).some((x) => x !== null) ? k : null
}

/** Traegt dieser Eintrag genug fuer ein Projektprofil? Das Beduerfnis oder Bilder oder eine Spende. */
export function traegtProjektProfil(daten: Roh | null | undefined): boolean {
  if (!daten) return false
  // Bilder durch dieselbe Schleuse wie beim Anzeigen (Kimi, 02.10.2026).
  const bilder = liste(daten.bilder).map(sichererBildPfad).filter(Boolean)
  return Boolean(text(daten.beduerfnis) || text(daten.kurz) || bilder.length || spendeAus(daten.spende))
}

/** Aus den Daten eines Projekts, was die Seite zeigt. */
export function projektProfil(daten: Roh | null | undefined, tags: readonly string[] = []): ProjektProfil {
  const d = daten ?? {}
  const bilder = liste(d.bilder).map(sichererBildPfad).filter((b): b is string => b !== null)

  const bedarfeRoh = liste(d.bedarfe)
    .map((b) => {
      const o = objekt(b)
      const wofuer = o ? text(o.wofuer) : text(b)
      return wofuer ? { wofuer, betrag: o ? zahl(o.betrag) : null } : null
    })
    .filter((b): b is { wofuer: string; betrag: number | null } => b !== null)
  const mitBetrag = bedarfeRoh.filter((b) => b.betrag !== null)
  const bedarfSumme = mitBetrag.length ? mitBetrag.reduce((s, b) => s + (b.betrag ?? 0), 0) : null
  const bedarfe = bedarfeRoh.map((b) => ({
    ...b,
    anteil: b.betrag !== null && bedarfSumme ? b.betrag / bedarfSumme : null,
  }))

  const schritte = liste(d.schritte)
    .map((s) => {
      const o = objekt(s)
      const titel = o ? text(o.titel) : text(s)
      return titel ? { titel, wann: o ? text(o.wann) : null, erledigt: o?.erledigt === true } : null
    })
    .filter((s): s is ProjektSchritt => s !== null)
  const offen = schritte.findIndex((s) => !s.erledigt)

  const team = liste(d.team)
    .map((m) => {
      const o = objekt(m)
      const name = o ? text(o.name) : text(m)
      return name ? { name, rolle: o ? text(o.rolle) : null, kuerzel: kuerzel(name) } : null
    })
    .filter((m): m is ProjektMensch => m !== null)

  const ort = text(d.address)
  const eigeneTags = texte(d.tags)
  return {
    titel: text(d.title) ?? "Projekt",
    kurz: text(d.kurz),
    muster: d.muster === true,
    titelbild: bilder[0] ?? null,
    kennzahlen: liste(d.kennzahlen)
      .map((x) => {
        const o = objekt(x)
        const wert = o ? (typeof o.wert === "number" ? String(o.wert) : text(o.wert)) : null
        const was = o ? text(o.was) : null
        return wert && was ? { wert, was } : null
      })
      .filter((x): x is ProjektKennzahl => x !== null)
      .slice(0, 4),
    galerie: bilder.slice(1),
    tags: [...new Set([...tags, ...eigeneTags].map((t) => t.trim()).filter(Boolean))],
    ort,
    zeitraum: zeitraumAus(d.zeitraum),
    beduerfnis: text(d.beduerfnis),
    beschreibung: text(d.description),
    wirkung: texte(d.wirkung),
    bedarfe,
    bedarfSumme,
    schritte,
    naechsterSchritt: offen >= 0 ? offen : null,
    team,
    kontakt: kontaktAus(d.kontakt, ort),
    spende: spendeAus(d.spende),
  }
}

/** Ein Betrag in Euro, deutsch geschrieben, ohne Nachkommastellen. */
export function euro(betrag: number): string {
  return `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 }).format(betrag)} €`
}

/**
 * Die Spendenseite bei Open Collective, mit Betrag, wenn einer gewaehlt ist.
 * Ohne Seite `null`: Der Knopf steht dann still.
 */
export function spendenLink(opencollective: string | null, betrag?: number | null): string | null {
  if (!opencollective) return null
  if (!betrag) return opencollective
  // Über URL gebaut: Eine Seite mit Query (`?ref=web`) bleibt heil (Kimi, 02.10.2026).
  try {
    const u = new URL(opencollective)
    const pfad = u.pathname.replace(/\/+$/, "")
    u.pathname = /\/donate$/.test(pfad) ? pfad : `${pfad}/donate`
    u.searchParams.set("amount", String(Math.round(betrag)))
    return u.toString()
  } catch {
    return opencollective
  }
}

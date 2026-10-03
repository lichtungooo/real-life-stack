// Der Baustein Open Collective (DEFINITION Teil 8, „Modul Open Collective,
// überall einbindbar“, freigegeben von Timo am 03.10.2026), der Kern.
//
// Eine Quelle für alle Größen (knapp, Widget, ganz) und alle Träger
// (Projekt, Person, Space, Netzwerk): Aus der Antwort der öffentlichen
// Schnittstelle von Open Collective wird hier ein geprüfter Stand. Der Dienst
// `trustdonation.org/oc/<name>` rechnet damit, die App prüft damit nach.
// Nur, was Open Collective öffentlich zeigt; bei Eingängen keine Namen.

import { text, zahl, objekt, liste, sichererBildPfad, type Roh } from "./schleuse.js"
import type { ProjektSpende } from "./projekt-profil.js"

export interface OcAusgabe {
  was: string
  betrag: number
  wann: string
}

export interface OcEingang {
  betrag: number
  wann: string
}

export interface OcStand {
  /** Der Name der Seite in der Adresse, etwa `real-life`. */
  name: string
  titel: string
  beschreibung: string | null
  bild: string | null
  /** Die Seite bei Open Collective. */
  adresse: string
  /** ISO-Kürzel, etwa `EUR`. */
  waehrung: string
  kontostand: number | null
  eingegangen: number | null
  ausgegeben: number | null
  unterstuetzende: number | null
  /** Zuletzt bezahlte Ausgaben, neueste zuerst. */
  ausgaben: OcAusgabe[]
  /** Letzte Eingänge, nur Betrag und Datum (Timo, 03.10.2026). */
  eingaenge: OcEingang[]
  /** Wann abgerufen (ISO). */
  stand: string
}

const NAME = /^[a-z0-9][a-z0-9-]{0,62}$/

/** Der Name einer Seite aus ihrer Adresse: `https://opencollective.com/real-life` → `real-life`. */
export function ocName(adresse: unknown): string | null {
  const t = text(adresse)
  if (!t) return null
  let u: URL
  try {
    u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`)
  } catch {
    return null
  }
  if (!/(^|\.)opencollective\.com$/i.test(u.hostname)) return null
  const name = u.pathname.split("/").filter(Boolean)[0]?.toLowerCase() ?? ""
  return NAME.test(name) ? name : null
}

/** Die Abfrage an die öffentliche Schnittstelle (GraphQL v2), mit Variable `$slug`. */
export const OC_ABFRAGE = `query ($slug: String!) {
  account(slug: $slug) {
    slug name description imageUrl currency
    stats {
      totalAmountReceived { valueInCents }
      totalAmountSpent { valueInCents }
      balance { valueInCents }
      contributorsCount
    }
  }
  expenses(account: { slug: $slug }, limit: 6, status: PAID, orderBy: { field: CREATED_AT, direction: DESC }) {
    nodes { description amount createdAt }
  }
  transactions(account: { slug: $slug }, limit: 6, type: CREDIT, orderBy: { field: CREATED_AT, direction: DESC }) {
    nodes { amount { valueInCents } createdAt }
  }
}`

const cent = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.abs(v) / 100 : null)
const datum = (v: unknown): string | null => {
  const t = text(v)
  return t && !Number.isNaN(Date.parse(t)) ? new Date(t).toISOString() : null
}

/** Aus der rohen Antwort von Open Collective ein geprüfter Stand, sonst `null`. */
export function ocStandAusAntwort(antwort: unknown, name: string, jetzt = new Date()): OcStand | null {
  const daten = objekt(objekt(antwort)?.data)
  const konto = objekt(daten?.account)
  if (!konto) return null
  const stats = objekt(konto.stats) ?? {}
  const waehrung = text(konto.currency)?.toUpperCase() ?? "EUR"
  const ausgaben = liste(objekt(daten?.expenses)?.nodes)
    .map((x) => {
      const o = objekt(x)
      const was = o ? text(o.description) : null
      const betrag = o ? cent(o.amount) : null
      const wann = o ? datum(o.createdAt) : null
      return was && betrag !== null && wann ? { was: was.slice(0, 200), betrag, wann } : null
    })
    .filter((x): x is OcAusgabe => x !== null)
  const eingaenge = liste(objekt(daten?.transactions)?.nodes)
    .map((x) => {
      const o = objekt(x)
      const betrag = o ? cent(objekt(o.amount)?.valueInCents) : null
      const wann = o ? datum(o.createdAt) : null
      return betrag !== null && wann ? { betrag, wann } : null
    })
    .filter((x): x is OcEingang => x !== null)
  return {
    name,
    titel: text(konto.name) ?? name,
    beschreibung: text(konto.description),
    bild: sichererBildPfad(konto.imageUrl),
    adresse: `https://opencollective.com/${name}`,
    waehrung: /^[A-Z]{3}$/.test(waehrung) ? waehrung : "EUR",
    kontostand: cent(objekt(stats.balance)?.valueInCents),
    eingegangen: cent(objekt(stats.totalAmountReceived)?.valueInCents),
    ausgegeben: cent(objekt(stats.totalAmountSpent)?.valueInCents),
    unterstuetzende: zahl(stats.contributorsCount),
    ausgaben,
    eingaenge,
    stand: jetzt.toISOString(),
  }
}

/** Einen Stand vom Dienst nachprüfen (fremde Daten gehen durch die Schleuse). */
export function ocStandAus(json: unknown): OcStand | null {
  const o = objekt(json) as Roh | null
  const name = o ? text(o.name) : null
  if (!o || !name || !NAME.test(name)) return null
  const zahlOderNull = (v: unknown) => zahl(v)
  return {
    name,
    titel: text(o.titel) ?? name,
    beschreibung: text(o.beschreibung),
    bild: sichererBildPfad(o.bild),
    adresse: `https://opencollective.com/${name}`,
    waehrung: typeof o.waehrung === "string" && /^[A-Z]{3}$/.test(o.waehrung) ? o.waehrung : "EUR",
    kontostand: zahlOderNull(o.kontostand),
    eingegangen: zahlOderNull(o.eingegangen),
    ausgegeben: zahlOderNull(o.ausgegeben),
    unterstuetzende: zahlOderNull(o.unterstuetzende),
    ausgaben: liste(o.ausgaben).map(objekt).filter((x): x is Roh => !!x && !!text(x.was) && zahl(x.betrag) !== null && !!datum(x.wann))
      .map((x) => ({ was: text(x.was)!, betrag: zahl(x.betrag)!, wann: datum(x.wann)! })).slice(0, 6),
    eingaenge: liste(o.eingaenge).map(objekt).filter((x): x is Roh => !!x && zahl(x.betrag) !== null && !!datum(x.wann))
      .map((x) => ({ betrag: zahl(x.betrag)!, wann: datum(x.wann)! })).slice(0, 6),
    stand: datum(o.stand) ?? new Date(0).toISOString(),
  }
}

/** Ein Betrag in seiner Währung, deutsch geschrieben, ohne Nachkommastellen. */
export function ocBetrag(betrag: number, waehrung = "EUR"): string {
  try {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: waehrung, maximumFractionDigits: 0 }).format(betrag)
  } catch {
    return `${Math.round(betrag)} ${waehrung}`
  }
}

/** Anteil am Ziel (0 bis 1) und was noch fehlt; nur mit Ziel und Zahl. */
export function ocZiel(stand: Pick<OcStand, "eingegangen">, ziel: number | null | undefined): { anteil: number; offen: number } | null {
  if (!ziel || ziel <= 0 || stand.eingegangen === null) return null
  return { anteil: Math.min(1, stand.eingegangen / ziel), offen: Math.max(0, ziel - stand.eingegangen) }
}

/**
 * Die Spendenkarte eines Projekts mit dem Live-Stand: gesammelt und
 * Unterstützende von Open Collective, Ziel und Beträge aus dem Eintrag.
 * Live geht vor Eintrag; `beispiel` gilt dann nicht (DEFINITION Teil 8).
 */
export function ocSpende(spende: ProjektSpende, stand: OcStand | null): ProjektSpende & { waehrung: string; live: string | null } {
  if (!stand) return { ...spende, waehrung: "EUR", live: null }
  const gesammelt = stand.eingegangen ?? spende.gesammelt
  // Das Ziel im Eintrag ist in Euro; rechnet die Seite in anderer Währung, kein Vergleich.
  const ziel = stand.waehrung === "EUR" ? spende.ziel : null
  const z = ocZiel({ eingegangen: gesammelt }, ziel)
  return {
    ...spende,
    ziel,
    gesammelt,
    unterstuetzende: stand.unterstuetzende ?? spende.unterstuetzende,
    anteil: z ? z.anteil : null,
    offen: z ? z.offen : null,
    beispiel: false,
    waehrung: stand.waehrung,
    live: stand.stand,
  }
}

/** Spenden eines Space oder Netzwerks (DEFINITION Teil 8, „Nächster Träger“). */
export interface SpaceSpenden {
  /** Die Seite bei Open Collective, geprüft; sonst `null`. */
  adresse: string | null
  /** Ziel in Euro, sonst `null`. */
  ziel: number | null
}

/** Aus `Group.data`: `opencollective` und `spendenziel`, geprüft. */
export function spaceSpenden(daten: Roh | null | undefined): SpaceSpenden {
  const name = ocName(daten?.opencollective)
  const ziel = zahl(daten?.spendenziel)
  return { adresse: name ? `https://opencollective.com/${name}` : null, ziel: ziel !== null && ziel > 0 ? ziel : null }
}

/**
 * Die Eingabe aus dem Abschnitt „Spenden“ als Änderung für Antons
 * `patchData`. Leere Adresse entfernt die Spenden; eine Adresse, die nicht
 * zu Open Collective führt, gibt einen Fehler zurück statt zu speichern.
 */
export function spaceSpendenAenderung(eingabe: { adresse: string; ziel: string }): { aenderung: Roh } | { fehler: string } {
  const roh = eingabe.adresse.trim()
  if (!roh) return { aenderung: { opencollective: null, spendenziel: null } }
  const name = ocName(roh)
  if (!name) return { fehler: "Bitte die Adresse einer Seite bei Open Collective eingeben, etwa https://opencollective.com/euer-name." }
  const zielText = eingabe.ziel.trim().replace(/\./g, "").replace(",", ".")
  const ziel = zielText ? Number(zielText) : null
  if (ziel !== null && !(Number.isFinite(ziel) && ziel > 0)) return { fehler: "Das Ziel ist ein Betrag in Euro, etwa 5000." }
  return { aenderung: { opencollective: `https://opencollective.com/${name}`, spendenziel: ziel === null ? null : Math.round(ziel) } }
}

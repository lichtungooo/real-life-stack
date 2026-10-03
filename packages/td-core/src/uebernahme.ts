// Profil übernehmen (DEFINITION Teil 8, freigegeben von Timo am 03.10.2026).
//
// Eine Stiftung nimmt ihr recherchiertes Profil selbst in die Hand: Ein
// Mitglied fragt an, wer den Space verwaltet, prüft außerhalb der App (Anruf
// oder Mail an die Adresse aus dem Impressum) und bestätigt. Danach pflegt
// die Stiftung ihr Profil; kein Import überschreibt es mehr (über `quelle`).
//
// Alles rein: Jeder Schritt bekommt die ganzen Daten und gibt die ganzen
// Daten zurück, denn alle Connectoren ersetzen `data` (Kimi, 02.10.2026).

import { text, objekt, sichereMail, type Roh } from "./schleuse.js"

/** Die Herkunft einer übernommenen Stiftung. */
export const GEPFLEGT_VON_DER_STIFTUNG = "Gepflegt von der Stiftung"

export interface UebernahmeAnfrage {
  /** Kennung des Menschen, der anfragt. */
  von: string
  name: string
  rolle: string | null
  mail: string | null
  /** Wann angefragt (ISO). */
  wann: string
}

export interface Gepflegt {
  von: string
  seit: string
}

const GEFAEHRLICH = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"])
const kopie = (daten: Roh | null | undefined): Roh => {
  const aus: Roh = {}
  for (const [k, v] of Object.entries(daten ?? {})) if (!GEFAEHRLICH.has(k)) aus[k] = v
  return aus
}
const iso = (v: unknown) => {
  const t = text(v)
  return t && !Number.isNaN(Date.parse(t)) ? new Date(t).toISOString() : null
}

/** Die offene Anfrage am Eintrag, sonst `null`. */
export function uebernahmeAus(daten: Roh | null | undefined): UebernahmeAnfrage | null {
  const u = objekt(daten?.uebernahme)
  if (!u || u.stand !== "angefragt") return null
  const von = text(u.von)
  const name = text(u.name)
  const wann = iso(u.wann)
  if (!von || !name || !wann) return null
  return { von, name, rolle: text(u.rolle), mail: sichereMail(u.mail), wann }
}

/** Wer die Stiftung pflegt, seit sie übernommen ist, sonst `null`. */
export function gepflegtAus(daten: Roh | null | undefined): Gepflegt | null {
  if (text(daten?.quelle) !== GEPFLEGT_VON_DER_STIFTUNG) return null
  const von = text(daten?.gepflegtVon)
  const seit = iso(daten?.gepflegtSeit)
  return von && seit ? { von, seit } : null
}

/** Eine Anfrage stellen. Ohne Namen oder bei schon übernommener Stiftung: `null`. */
export function uebernahmeAnfragen(
  daten: Roh | null | undefined,
  anfrage: { von: string; name: string; rolle?: string | null; mail?: string | null },
  jetzt = new Date(),
): Roh | null {
  const von = text(anfrage.von)
  const name = text(anfrage.name)
  if (!von || !name || gepflegtAus(daten)) return null
  const aus = kopie(daten)
  aus.uebernahme = {
    von,
    name: name.slice(0, 120),
    ...(text(anfrage.rolle) ? { rolle: text(anfrage.rolle)!.slice(0, 120) } : {}),
    ...(sichereMail(anfrage.mail) ? { mail: sichereMail(anfrage.mail) } : {}),
    wann: jetzt.toISOString(),
    stand: "angefragt",
  }
  return aus
}

/** Die Anfrage bestätigen: Die Stiftung pflegt ihr Profil ab jetzt selbst. */
export function uebernahmeBestaetigen(daten: Roh | null | undefined, jetzt = new Date()): Roh | null {
  const anfrage = uebernahmeAus(daten)
  if (!anfrage) return null
  const aus = kopie(daten)
  delete aus.uebernahme
  aus.quelle = GEPFLEGT_VON_DER_STIFTUNG
  aus.gepflegtVon = anfrage.von
  aus.gepflegtSeit = jetzt.toISOString()
  return aus
}

/** Die Anfrage ablehnen: Sie verschwindet, der Eintrag bleibt Recherche. */
export function uebernahmeAblehnen(daten: Roh | null | undefined): Roh | null {
  if (!objekt(daten?.uebernahme)) return null
  const aus = kopie(daten)
  delete aus.uebernahme
  return aus
}

/**
 * Wem die Oberfläche das Bearbeiten zeigt (geschrieben wird mit Antons
 * Rechten): einer übernommenen Stiftung nur den Pflegenden und den
 * Verwaltenden, sonst allen, die Antons Regel lässt.
 */
export function darfStiftungBearbeiten(daten: Roh | null | undefined, ich: string | null | undefined, istAdmin: boolean): boolean {
  const g = gepflegtAus(daten)
  if (!g) return true
  return istAdmin || (!!ich && ich === g.von)
}

/**
 * Verwaltet `ich` den Space? Dieselbe Regel wie Antons `resolveAdminView`
 * (toolkit `lib/group-admin-view.ts`, nicht exportiert): Trägt ein Mitglied
 * die Angabe `isAdmin`, gilt sie; kennt der Connector keine (lokal, Muster),
 * verwaltet das erste Mitglied.
 */
export function verwaltetSpace(mitglieder: readonly { id: string; isAdmin?: boolean }[], ich: string | null | undefined): boolean {
  if (!ich) return false
  const angegeben = mitglieder.some((m) => m.isAdmin !== undefined)
  return mitglieder.some((m, i) => m.id === ich && (angegeben ? m.isAdmin === true : i === 0))
}

// Die Tagesordnung eines Meetings, fuer alle (Spec video, "Tagesordnung").
//
// Punkte mit Titel und Zeit, einer laeuft gerade, erledigte sind abgehakt.
// Sie liegt im Sitzungszustand, damit alle dieselbe sehen und wer spaeter
// kommt, sie bekommt. Jeder darf sie pflegen (Augenhoehe).

import type { Sitzung } from "./typen"

export interface TagesordnungsPunkt {
  id: string
  titel: string
  /** Geplante Zeit in Minuten; 0 heisst ohne Zeit. */
  minuten: number
  erledigt: boolean
}

export interface Tagesordnung {
  punkte: readonly TagesordnungsPunkt[]
  /** Der Punkt, der gerade dran ist. */
  aktiv: string | null
  /** Seit wann er dran ist (ms). */
  seit: number | null
}

const LEER: Tagesordnung = { punkte: [], aktiv: null, seit: null }

export const tagesordnungVon = (s: Sitzung): Tagesordnung => s.tagesordnung ?? LEER

function mit(s: Sitzung, t: Tagesordnung, wer: string): Sitzung {
  return { ...s, tagesordnung: t, v: s.v + 1, von: wer }
}

export function punktDazu(s: Sitzung, titel: string, minuten: number, wer: string, id: string): Sitzung {
  const sauber = titel.trim()
  if (!sauber) return s
  const t = tagesordnungVon(s)
  return mit(s, { ...t, punkte: [...t.punkte, { id, titel: sauber.slice(0, 200), minuten: Math.max(0, Math.round(minuten)), erledigt: false }] }, wer)
}

export function punktWeg(s: Sitzung, id: string, wer: string): Sitzung {
  const t = tagesordnungVon(s)
  if (!t.punkte.some((p) => p.id === id)) return s
  return mit(s, { punkte: t.punkte.filter((p) => p.id !== id), aktiv: t.aktiv === id ? null : t.aktiv, seit: t.aktiv === id ? null : t.seit }, wer)
}

/** Einen Punkt aufrufen. Der bisher laufende gilt dann als erledigt. `null` beendet ohne neuen. */
export function punktAufrufen(s: Sitzung, id: string | null, wer: string, jetzt: number): Sitzung {
  const t = tagesordnungVon(s)
  if (id !== null && !t.punkte.some((p) => p.id === id)) return s
  if (t.aktiv === id) return s
  const punkte = t.punkte.map((p) => (p.id === t.aktiv ? { ...p, erledigt: true } : p.id === id ? { ...p, erledigt: false } : p))
  return mit(s, { punkte, aktiv: id, seit: id ? jetzt : null }, wer)
}

export function punktAbhaken(s: Sitzung, id: string, erledigt: boolean, wer: string): Sitzung {
  const t = tagesordnungVon(s)
  const p = t.punkte.find((x) => x.id === id)
  if (!p || p.erledigt === erledigt) return s
  return mit(s, { ...t, punkte: t.punkte.map((x) => (x.id === id ? { ...x, erledigt } : x)) }, wer)
}

/** Einen Punkt nach oben (-1) oder unten (+1) schieben. */
export function punktVerschieben(s: Sitzung, id: string, richtung: -1 | 1, wer: string): Sitzung {
  const t = tagesordnungVon(s)
  const i = t.punkte.findIndex((p) => p.id === id)
  const j = i + richtung
  if (i < 0 || j < 0 || j >= t.punkte.length) return s
  const punkte = [...t.punkte]
  ;[punkte[i], punkte[j]] = [punkte[j], punkte[i]]
  return mit(s, { ...t, punkte }, wer)
}

/** Restzeit des laufenden Punkts in ms, negativ wenn ueberzogen; `null` ohne Punkt oder ohne Zeit. */
export function punktRest(s: Sitzung, jetzt: number): number | null {
  const t = tagesordnungVon(s)
  const p = t.punkte.find((x) => x.id === t.aktiv)
  if (!p || !p.minuten || t.seit === null) return null
  return t.seit + p.minuten * 60_000 - jetzt
}

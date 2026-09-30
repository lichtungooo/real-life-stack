// Gruppenraeume, wie in Big Blue Button (Timo, 30.09.2026, mit Bildschirm-
// foto): mehrere kleine Raeume fuer eine Zeit, danach zurueck. Jeder
// Gruppenraum ist ein eigener Raum im Adapter, mit dem Schluessel des
// Hauptraums und einer Nummer. Wer eingeteilt ist, wechselt selbst hinueber
// und kommt zur verabredeten Zeit selbst zurueck: Es gibt keinen Server, der
// Menschen verschiebt.

import type { Sitzung } from "./typen"

export interface Gruppenraum {
  name: string
  /** Teilnehmer-Ids im Hauptraum. */
  mitglieder: readonly string[]
}

export interface Gruppenraeume {
  /** Zaehlt jeden Start, damit jeder ihn einmal befolgt. */
  nr: number
  raeume: readonly Gruppenraum[]
  /** Wann alle zurueckkommen (ms). */
  bis: number
  /** Die Teilnehmenden suchen sich ihren Raum selbst aus. */
  selbstWaehlen: boolean
  von: string
}

/** Der Schluessel eines Gruppenraums: Hauptraum und Nummer (passt zum Muster des Token-Dienstes). */
export const unterraumSchluessel = (haupt: string, nr: number) => `${haupt}-gr${nr}`

/** Gehoert dieser Schluessel zu einem Gruppenraum dieses Hauptraums? */
export const istUnterraumVon = (schluessel: string | null, haupt: string) => !!schluessel && /-gr\d+$/.test(schluessel) && schluessel.replace(/-gr\d+$/, "") === haupt

export type RaeumeFehler = "zu-wenige-raeume" | "raum-leer" | "dauer"

/** Pruefen, bevor es losgeht: wenigstens zwei Raeume, jeder mit einem Menschen (ausser man waehlt selbst). */
export function raeumePruefen(raeume: readonly Gruppenraum[], minuten: number, selbstWaehlen: boolean): RaeumeFehler | null {
  if (raeume.length < 2) return "zu-wenige-raeume"
  if (!(minuten >= 1 && minuten <= 240)) return "dauer"
  if (!selbstWaehlen && raeume.some((r) => r.mitglieder.length === 0)) return "raum-leer"
  return null
}

export function gruppenraeumeStarten(
  s: Sitzung, raeume: readonly Gruppenraum[], minuten: number, selbstWaehlen: boolean, wer: string, jetzt: number,
): Sitzung {
  if (raeumePruefen(raeume, minuten, selbstWaehlen)) return s
  const g: Gruppenraeume = {
    nr: (s.gruppenraeume?.nr ?? 0) + 1,
    raeume: raeume.map((r) => ({ name: r.name, mitglieder: [...r.mitglieder] })),
    bis: jetzt + minuten * 60_000,
    selbstWaehlen,
    von: wer,
  }
  return { ...s, gruppenraeume: g, v: s.v + 1, von: wer }
}

export function gruppenraeumeBeenden(s: Sitzung, wer: string): Sitzung {
  if (!s.gruppenraeume) return s
  return { ...s, gruppenraeume: null, v: s.v + 1, von: wer }
}

/** Welcher Raum (ab 1) ist meiner? `null`: keiner, ich bleibe im Hauptraum. */
export function meinGruppenraum(g: Gruppenraeume | null | undefined, ich: string): number | null {
  if (!g) return null
  const i = g.raeume.findIndex((r) => r.mitglieder.includes(ich))
  return i === -1 ? null : i + 1
}

/** Zufaellig und gleichmaessig verteilen. `zufall` ersetzbar fuer Tests. */
export function zufaelligVerteilen(ids: readonly string[], anzahl: number, zufall: () => number = Math.random): string[][] {
  const gemischt = [...ids]
  for (let i = gemischt.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1))
    ;[gemischt[i], gemischt[j]] = [gemischt[j], gemischt[i]]
  }
  const raeume: string[][] = Array.from({ length: Math.max(1, anzahl) }, () => [])
  gemischt.forEach((id, i) => raeume[i % raeume.length].push(id))
  return raeume
}

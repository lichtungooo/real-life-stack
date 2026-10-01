// Die Moderation eines Meetings, wie im Zahnrad bei "Teilnehmer" in Big Blue
// Button (Timo, 30.09.2026). Auf Augenhoehe: Jeder darf sie bedienen, und
// jedes Geraet haelt sich selbst an sie. Es gibt keinen Server, der fuer
// andere entscheidet; wer die Regeln umgehen will, kann es, und das ist in
// einem Kreis von Menschen, die einander vertrauen, gewollt.

import type { Sitzung } from "./typen"

export interface Moderation {
  /** Wer neu dazukommt, ist erst stumm. */
  neueStumm: boolean
  /** Rechte der Zuschauenden: schreiben im Chat, in den geteilten Notizen, den Bildschirm teilen. */
  chat: boolean
  notizen: boolean
  bildschirm: boolean
  /** Warteraum: Wer ueber einen Link kommt und nicht zur Gruppe gehoert, wartet, bis ihn jemand hereinholt. */
  warteraum: boolean
  /**
   * Ein Wort zur Zeit (Timo, 01.10.2026: "erst sprechen, wenn der andere, der
   * gerade spricht, es wieder freigegeben hat"). Das Mikrofon hat nur, wer das
   * Wort haelt (den Redestab); die anderen warten, bis er es freigibt. So
   * spricht immer nur einer, und die Mitschrift bekommt jeden Beitrag sauber.
   */
  einWort: boolean
}

export const OFFENE_MODERATION: Moderation = { neueStumm: false, chat: true, notizen: true, bildschirm: true, warteraum: false, einWort: false }

/** Spricht gerade nur, wer das Wort haelt? Im Kreis-Prozess mit Redestab oder mit "Ein Wort zur Zeit". */
export const nurEinerSpricht = (s: Sitzung, prozess: { nurStabSpricht: boolean } | null): boolean =>
  Boolean(prozess?.nurStabSpricht) || moderationVon(s).einWort

export const moderationVon = (s: Sitzung): Moderation => ({ ...OFFENE_MODERATION, ...(s.moderation ?? {}) })

export function moderationSetzen(s: Sitzung, teil: Partial<Moderation>, wer: string): Sitzung {
  const alt = moderationVon(s)
  const neu = { ...alt, ...teil }
  if ((Object.keys(neu) as (keyof Moderation)[]).every((k) => neu[k] === alt[k])) return s
  return { ...s, moderation: neu, v: s.v + 1, von: wer }
}

/** Die Namen der Anwesenden als Text, zum Speichern (wie "Teilnehmernamen speichern" in BBB). */
export function namensliste(raum: string, namen: readonly string[], jetzt: number): string {
  const zeit = new Date(jetzt).toLocaleString("de-DE")
  return [`Teilnehmende im Meeting „${raum}“, ${zeit}`, "", ...[...namen].sort((a, b) => a.localeCompare(b, "de")).map((n) => `- ${n}`), ""].join("\n")
}

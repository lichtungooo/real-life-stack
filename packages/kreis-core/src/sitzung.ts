// Der Zustand einer Sitzung, als reine Funktionen.
//
// Jede Handlung nimmt einen Stand und gibt einen neuen zurueck. Ist sie nicht
// erlaubt, kommt DERSELBE Stand zurueck (gleiche Referenz): so erkennt der
// Aufrufer ohne Fehlerpfad, dass nichts zu senden ist.
//
// Die Zeit kommt immer von aussen (`jetzt`), damit alles ohne Uhr pruefbar ist.

import { STANDARD_REGELN, type Prozess, type Regeln, type Schritt, type Sitzung } from "./typen"

export function leereSitzung(jetzt = 0): Sitzung {
  return {
    v: 0,
    von: "",
    prozessId: null,
    schritt: 0,
    schrittSeit: jetzt,
    stab: { halter: null, name: null, seit: jetzt },
    schale: { nr: 0, von: null, stilleBis: 0 },
    pause: null,
    gruppen: null,
    mitte: null,
  }
}

/**
 * Welcher Stand gilt, wenn zwei aufeinandertreffen: die hoehere Fassung, bei
 * gleicher Fassung der groessere Absender. Damit einigen sich alle ohne
 * Server auf denselben Stand, auch wenn zwei im selben Augenblick handeln.
 */
export function gilt(eigene: Sitzung, fremde: Sitzung): Sitzung {
  if (fremde.v > eigene.v) return fremde
  if (fremde.v === eigene.v && fremde.von > eigene.von) return fremde
  return eigene
}

function weiter(s: Sitzung, wer: string, aenderung: Partial<Sitzung>): Sitzung {
  return { ...s, ...aenderung, v: s.v + 1, von: wer }
}

export const stilleLaeuft = (s: Sitzung, jetzt: number) => jetzt < s.schale.stilleBis
export const pauseLaeuft = (s: Sitzung, jetzt: number) => s.pause !== null && jetzt < s.pause.bis

/** Der Schritt, der gerade laeuft, oder `null` ohne Prozess. */
export function aktuellerSchritt(s: Sitzung, prozess: Prozess | null): Schritt | null {
  if (!prozess || s.prozessId !== prozess.id) return null
  return prozess.schritte[s.schritt] ?? null
}

/**
 * Wie der Redestab in diesem Schritt wandert. Eine unbekannte Art aus einer
 * fremden Vorlage gilt als `offen` (Unbekanntes bleibt erhalten, wird aber
 * zu etwas, das der Kreis kennt).
 */
export function stabArt(schritt: Schritt | null): "offen" | "reihum" {
  return schritt?.art === "reihum" ? "reihum" : "offen"
}

// --- Prozess und Schritte ---------------------------------------------------

export function prozessWaehlen(s: Sitzung, prozess: Prozess, wer: string, jetzt: number): Sitzung {
  return weiter(s, wer, {
    prozessId: prozess.id,
    schritt: 0,
    schrittSeit: jetzt,
    stab: { halter: null, name: null, seit: jetzt },
    pause: null,
    gruppen: null,
  })
}

export function prozessBeenden(s: Sitzung, wer: string, jetzt: number): Sitzung {
  if (s.prozessId === null) return s
  return weiter(s, wer, {
    prozessId: null,
    schritt: 0,
    schrittSeit: jetzt,
    stab: { halter: null, name: null, seit: jetzt },
    pause: null,
    gruppen: null,
  })
}

/** Einen Schritt vor (`+1`) oder zurueck (`-1`). Am Rand bleibt alles, wie es ist. */
export function schrittGehen(s: Sitzung, prozess: Prozess, richtung: 1 | -1, wer: string, jetzt: number): Sitzung {
  if (s.prozessId !== prozess.id) return s
  const ziel = s.schritt + richtung
  if (ziel < 0 || ziel >= prozess.schritte.length) return s
  const zielSchritt = prozess.schritte[ziel]
  return weiter(s, wer, {
    schritt: ziel,
    schrittSeit: jetzt,
    // Ein neuer Schritt beginnt mit dem Stab in der Mitte.
    stab: { halter: null, name: null, seit: jetzt },
    // Eine Pause-Art startet ihre Pause gleich mit.
    pause: zielSchritt.art === "pause" ? { bis: jetzt + zielSchritt.minuten * 60_000 } : null,
    // Die Einteilung bleibt stehen, solange Kleingruppen laufen oder gerade
    // vorbei sind: wer zurueckkommt, soll sehen, wer mit wem war.
    gruppen: s.gruppen,
  })
}

// --- Redestab ---------------------------------------------------------------

/**
 * Den Redestab nehmen.
 *
 * Erlaubt, wenn er in der Mitte liegt oder bei jemandem, der nicht mehr im
 * Raum ist (`anwesend`), und weder Stille noch Pause laufen. Wer ihn schon
 * haelt, nimmt ihn nicht noch einmal.
 */
export function stabNehmen(
  s: Sitzung,
  wer: string,
  name: string,
  anwesend: readonly string[],
  jetzt: number,
): Sitzung {
  if (stilleLaeuft(s, jetzt) || pauseLaeuft(s, jetzt)) return s
  const halter = s.stab.halter
  if (halter === wer) return s
  if (halter !== null && anwesend.includes(halter)) return s
  return weiter(s, wer, { stab: { halter: wer, name, seit: jetzt } })
}

/** Den Redestab zuruecklegen. Nur wer ihn haelt. */
export function stabZuruecklegen(s: Sitzung, wer: string, jetzt: number): Sitzung {
  if (s.stab.halter !== wer) return s
  return weiter(s, wer, { stab: { halter: null, name: null, seit: jetzt } })
}

/**
 * Wer im Kreis als Naechster kommt. Die Reihenfolge ist fuer alle dieselbe:
 * nach Id sortiert, damit jeder Bildschirm denselben Kreis zeigt.
 */
export function naechsterImKreis(anwesend: readonly string[], nach: string): string | null {
  const kreis = [...anwesend].sort()
  if (kreis.length === 0) return null
  const i = kreis.indexOf(nach)
  return kreis[(i + 1) % kreis.length] ?? null
}

/** Den Stab an den Naechsten im Kreis weitergeben. Nur wer ihn haelt. */
export function stabWeitergeben(
  s: Sitzung,
  wer: string,
  anwesend: readonly { id: string; name: string }[],
  jetzt: number,
): Sitzung {
  if (s.stab.halter !== wer) return s
  const naechste = naechsterImKreis(anwesend.map((t) => t.id), wer)
  if (!naechste || naechste === wer) return stabZuruecklegen(s, wer, jetzt)
  const name = anwesend.find((t) => t.id === naechste)?.name ?? null
  return weiter(s, wer, { stab: { halter: naechste, name, seit: jetzt } })
}

// --- Klangschale und Pause -----------------------------------------------------

/**
 * Die Klangschale schlagen. Jeder darf es, jederzeit. Der Stab kehrt in die
 * Mitte zurueck, und fuer `stilleSekunden` bleibt der Raum still.
 */
export function schaleSchlagen(s: Sitzung, wer: string, stilleSekunden: number, jetzt: number): Sitzung {
  return weiter(s, wer, {
    schale: { nr: s.schale.nr + 1, von: wer, stilleBis: jetzt + stilleSekunden * 1000 },
    stab: { halter: null, name: null, seit: jetzt },
  })
}

export function pauseBeginnen(s: Sitzung, minuten: number, wer: string, jetzt: number): Sitzung {
  if (minuten <= 0) return s
  return weiter(s, wer, {
    pause: { bis: jetzt + minuten * 60_000 },
    stab: { halter: null, name: null, seit: jetzt },
  })
}

export function pauseBeenden(s: Sitzung, wer: string): Sitzung {
  if (s.pause === null) return s
  return weiter(s, wer, { pause: null })
}

// --- Die Mitte der Konferenz ------------------------------------------------

/** Etwas in die Mitte legen, fuer alle: `null` (die Menschen), `"tafel"` oder eine Modul-Id. */
export function mitteSetzen(s: Sitzung, mitte: string | null, wer: string): Sitzung {
  if ((s.mitte ?? null) === mitte) return s
  return weiter(s, wer, { mitte })
}

// --- Zeichenpad ------------------------------------------------------------------

/** Das Zeichenpad in die Mitte legen. Wer es hineinlegt, praesentiert. */
export function padOeffnen(s: Sitzung, id: string, wer: string): Sitzung {
  return weiter(s, wer, { mitte: id, pad: { praesentiert: wer, alle: s.pad?.alle ?? false } })
}

/** "Mehrere Benutzer": nur wer praesentiert, gibt frei oder nimmt zurueck. */
export function padFreigeben(s: Sitzung, alle: boolean, wer: string): Sitzung {
  if (!s.pad || s.pad.praesentiert !== wer || s.pad.alle === alle) return s
  return weiter(s, wer, { pad: { ...s.pad, alle } })
}

/** Die Praesentation uebernehmen, wenn der bisherige Praesentierende nicht mehr da ist oder sie abgibt. */
export function padUebernehmen(s: Sitzung, wer: string, anwesend: readonly string[]): Sitzung {
  if (!s.pad || s.pad.praesentiert === wer) return s
  if (anwesend.includes(s.pad.praesentiert)) return s
  return weiter(s, wer, { pad: { ...s.pad, praesentiert: wer } })
}

/** Folien aus einer PDF auflegen oder wieder abnehmen. Nur wer praesentiert. */
export function padFolienSetzen(
  s: Sitzung,
  folien: { datei: string; name: string; seiten: number } | null,
  wer: string,
): Sitzung {
  if (!s.pad || s.pad.praesentiert !== wer) return s
  if (folien && folien.seiten < 1) return s
  return weiter(s, wer, { pad: { ...s.pad, folien, seite: folien ? 1 : undefined } })
}

/** Blaettern. Nur wer praesentiert; die Seite bleibt zwischen 1 und der letzten. */
export function padBlaettern(s: Sitzung, seite: number, wer: string): Sitzung {
  const f = s.pad?.folien
  if (!s.pad || !f || s.pad.praesentiert !== wer) return s
  const neu = Math.min(f.seiten, Math.max(1, Math.round(seite)))
  if (neu === (s.pad.seite ?? 1)) return s
  return weiter(s, wer, { pad: { ...s.pad, seite: neu } })
}

/**
 * Unter welchem Schluessel die Zeichnung der aktuellen Seite liegt: jede
 * Folie hat ihre eigene, die freie Flaeche heisst "frei".
 */
export function padSchluessel(s: Sitzung): string {
  const f = s.pad?.folien
  return f ? `${f.datei}:${s.pad?.seite ?? 1}` : "frei"
}

/** Welches Dokument-Item in der Mitte liegt; `null` legt ein neues bereit. */
export function dokumentSetzen(s: Sitzung, item: string | null, wer: string): Sitzung {
  if ((s.dokument?.item ?? null) === item) return s
  return weiter(s, wer, { dokument: item ? { item } : null })
}

/** Ein Layout fuer alle uebernehmen. */
export function layoutFuerAlle(s: Sitzung, art: string, wer: string): Sitzung {
  return weiter(s, wer, { layout: { art, nr: (s.layout?.nr ?? 0) + 1 } })
}

/** Darf dieser Mensch auf dem Pad zeichnen? */
export function darfZeichnen(s: Sitzung, wer: string): boolean {
  return !s.pad || s.pad.alle || s.pad.praesentiert === wer
}

// --- Regeln und Redezeit ---------------------------------------------------------

export function regelnVon(s: Sitzung): Regeln {
  return s.regeln ?? STANDARD_REGELN
}

/**
 * Die Regeln fuer alle setzen. Wird die Sitzungsdauer neu festgelegt, laeuft
 * sie ab `jetzt`; bleibt sie gleich, laeuft sie weiter wie bisher.
 */
export function regelnSetzen(s: Sitzung, regeln: Regeln, wer: string, jetzt = Date.now()): Sitzung {
  const alt = regelnVon(s)
  const dauer = Math.max(0, regeln.sitzungsdauer ?? 0)
  const gleich = alt.redezeit === regeln.redezeit && alt.danach === regeln.danach &&
    (alt.stille ?? null) === (regeln.stille ?? null) && (alt.sitzungsdauer ?? 0) === dauer
  if (gleich) return s
  const seit = dauer > 0 ? ((alt.sitzungsdauer ?? 0) === dauer && alt.sitzungSeit ? alt.sitzungSeit : jetzt) : undefined
  return weiter(s, wer, {
    regeln: {
      redezeit: Math.max(0, regeln.redezeit),
      danach: regeln.danach,
      ...(regeln.stille !== undefined ? { stille: Math.max(1, regeln.stille) } : {}),
      ...(dauer > 0 ? { sitzungsdauer: dauer, sitzungSeit: seit } : {}),
    },
  })
}

/** Wie lange die Stille nach der Klangschale dauert: die Regel des Raums, sonst die des Prozesses, sonst 20 Sekunden. */
export function stilleSekundenVon(s: Sitzung, prozess: Prozess | null): number {
  return s.regeln?.stille ?? prozess?.stilleSekunden ?? 20
}

/** Wie viel Zeit das Treffen noch hat, in Millisekunden. `null`: keine Sitzungsdauer festgelegt. */
export function sitzungRest(s: Sitzung, jetzt: number): number | null {
  const r = s.regeln
  if (!r?.sitzungsdauer || !r.sitzungSeit) return null
  return r.sitzungSeit + r.sitzungsdauer * 60_000 - jetzt
}

/** Wie viel Redezeit bleibt dem, der den Stab haelt, in Millisekunden. `null`: keine Redezeit oder niemand haelt ihn. */
export function redezeitRest(s: Sitzung, jetzt: number): number | null {
  const { redezeit } = regelnVon(s)
  if (redezeit <= 0 || s.stab.halter === null) return null
  return s.stab.seit + redezeit * 60_000 - jetzt
}

/**
 * Die Redezeit ist um: Gong fuer alle, und der Stab wandert nach der Regel.
 *
 * Ausfuehren soll es das Geraet dessen, der den Stab haelt (`wer`), damit es
 * nur einmal geschieht. Vor dem Ablauf, oder wenn `wer` den Stab nicht haelt,
 * bleibt alles, wie es ist.
 */
export function redezeitAblaufen(
  s: Sitzung,
  anwesend: readonly { id: string; name: string }[],
  wer: string,
  jetzt: number,
): Sitzung {
  const rest = redezeitRest(s, jetzt)
  if (rest === null || rest > 0 || s.stab.halter !== wer) return s
  const gong = { nr: (s.gong?.nr ?? 0) + 1, wann: jetzt }
  const danach = regelnVon(s).danach
  const naechste = danach === "weiter" ? naechsterImKreis(anwesend.map((t) => t.id), wer) : null
  const stab = naechste && naechste !== wer
    ? { halter: naechste, name: anwesend.find((t) => t.id === naechste)?.name ?? null, seit: jetzt }
    : { halter: null, name: null, seit: jetzt }
  return weiter(s, wer, { gong, stab })
}

// --- Kurzzeitwecker und Los ----------------------------------------------------

/** Den Kurzzeitwecker stellen, fuer alle. */
export function weckerStellen(s: Sitzung, minuten: number, wer: string, jetzt: number): Sitzung {
  if (minuten <= 0) return s
  return weiter(s, wer, { wecker: { bis: jetzt + minuten * 60_000, minuten, von: wer } })
}

export function weckerAus(s: Sitzung, wer: string): Sitzung {
  if (!s.wecker) return s
  return weiter(s, wer, { wecker: null })
}

/**
 * Ein Los ziehen: einen der Anwesenden zufaellig waehlen, fuer alle sichtbar.
 * `zufall` kommt von aussen, damit es pruefbar ist. Niemand da: kein Los.
 */
export function losZiehen(
  s: Sitzung,
  anwesend: readonly { id: string; name: string }[],
  wer: string,
  jetzt: number,
  zufall: () => number = Math.random,
): Sitzung {
  if (anwesend.length === 0) return s
  const gezogen = anwesend[Math.min(anwesend.length - 1, Math.floor(zufall() * anwesend.length))]
  return weiter(s, wer, { los: { nr: (s.los?.nr ?? 0) + 1, id: gezogen.id, name: gezogen.name, wann: jetzt } })
}

// --- Kleingruppen ----------------------------------------------------------

/**
 * Die Anwesenden in Gruppen von etwa `groesse` Menschen teilen.
 *
 * `zufall` kommt von aussen (Standard `Math.random`), damit die Einteilung
 * pruefbar ist. Der Rest verteilt sich reihum, niemand bleibt allein, sobald
 * mehr als ein Mensch da ist.
 */
export function gruppenEinteilen(
  s: Sitzung,
  anwesend: readonly string[],
  groesse: number,
  wer: string,
  zufall: () => number = Math.random,
): Sitzung {
  if (anwesend.length === 0) return s
  const gemischt = [...anwesend]
  for (let i = gemischt.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1))
    ;[gemischt[i], gemischt[j]] = [gemischt[j], gemischt[i]]
  }
  const anzahl = Math.max(1, Math.round(gemischt.length / Math.max(2, groesse)))
  const gruppen: Record<string, number> = {}
  gemischt.forEach((id, i) => { gruppen[id] = (i % anzahl) + 1 })
  return weiter(s, wer, { gruppen })
}

export function gruppenAufloesen(s: Sitzung, wer: string): Sitzung {
  if (s.gruppen === null) return s
  return weiter(s, wer, { gruppen: null })
}

/** Die Gruppen als Liste: Nummer → Ids, aufsteigend. */
export function gruppenListe(gruppen: Readonly<Record<string, number>> | null): { nr: number; ids: string[] }[] {
  if (!gruppen) return []
  const nachNr = new Map<number, string[]>()
  for (const [id, nr] of Object.entries(gruppen)) {
    nachNr.set(nr, [...(nachNr.get(nr) ?? []), id])
  }
  return [...nachNr.entries()].sort((a, b) => a[0] - b[0]).map(([nr, ids]) => ({ nr, ids: ids.sort() }))
}

/** Ist das eine Sitzung, wie sie ueber den Daten-Kanal kommt? Fremde Nachrichten brechen nichts. */
export function istSitzung(wert: unknown): wert is Sitzung {
  if (!wert || typeof wert !== "object") return false
  const s = wert as Record<string, unknown>
  return (
    typeof s.v === "number" &&
    typeof s.von === "string" &&
    (s.prozessId === null || typeof s.prozessId === "string") &&
    typeof s.schritt === "number" &&
    !!s.stab && typeof s.stab === "object" &&
    !!s.schale && typeof s.schale === "object"
  )
}

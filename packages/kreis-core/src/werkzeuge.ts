// Die kleinen Werkzeuge der Konferenz, als reine Daten und Funktionen:
// geteilte Notizen und Umfrage. Kurzzeitwecker und Los liegen im
// Sitzungszustand (sitzung.ts), weil dort immer nur einer handelt.
//
// Warum die Umfrage NICHT im Sitzungszustand liegt: Dort gilt bei gleicher
// Fassung einer von zwei Staenden. Stimmen zwei Menschen im selben Augenblick
// ab, ginge eine Stimme verloren. Darum reist jede Stimme einzeln und wird
// eingemischt: je Mensch zaehlt seine juengste.

// --- Geteilte Notizen ---------------------------------------------------------

export interface GeteilteNotiz {
  text: string
  /** Fassung. Jede Aenderung zaehlt sie hoch. */
  v: number
  von: string
  name: string
  wann: number
}

export const LEERE_NOTIZ: GeteilteNotiz = { text: "", v: 0, von: "", name: "", wann: 0 }

/** Den Text neu schreiben. Derselbe Text aendert nichts. */
export function notizSchreiben(alt: GeteilteNotiz, text: string, wer: string, name: string, jetzt: number): GeteilteNotiz {
  if (alt.text === text) return alt
  return { text, v: alt.v + 1, von: wer, name, wann: jetzt }
}

/** Welche Fassung gilt: die hoehere, bei Gleichstand der groessere Absender (wie beim Redestab). */
export function notizGilt(eigene: GeteilteNotiz, fremde: GeteilteNotiz): GeteilteNotiz {
  if (fremde.v > eigene.v) return fremde
  if (fremde.v === eigene.v && fremde.von > eigene.von) return fremde
  return eigene
}

export function istNotiz(wert: unknown): wert is GeteilteNotiz {
  if (!wert || typeof wert !== "object") return false
  const n = wert as Record<string, unknown>
  return typeof n.text === "string" && typeof n.v === "number" && typeof n.von === "string"
}

// --- Umfrage ------------------------------------------------------------------

export interface Stimme {
  umfrage: string
  wer: string
  /** Index der gewaehlten Antwort. */
  wahl: number
  wann: number
}

export interface Umfrage {
  id: string
  frage: string
  antworten: readonly string[]
  von: string
  offen: boolean
  /** Je Mensch seine juengste Stimme. */
  stimmen: Readonly<Record<string, { wahl: number; wann: number }>>
}

export function umfrageNeu(id: string, frage: string, antworten: readonly string[], von: string): Umfrage | null {
  const sauber = antworten.map((a) => a.trim()).filter(Boolean)
  if (!frage.trim() || sauber.length < 2) return null
  return { id, frage: frage.trim(), antworten: sauber, von, offen: true, stimmen: {} }
}

/** Eine Stimme einmischen. Zaehlt nur fuer diese Umfrage, nur solange sie offen ist, je Mensch die juengste. */
export function stimmeDazu(u: Umfrage, s: Stimme): Umfrage {
  if (s.umfrage !== u.id || !u.offen) return u
  if (s.wahl < 0 || s.wahl >= u.antworten.length) return u
  const bisher = u.stimmen[s.wer]
  if (bisher && bisher.wann >= s.wann) return u
  return { ...u, stimmen: { ...u.stimmen, [s.wer]: { wahl: s.wahl, wann: s.wann } } }
}

export function umfrageSchliessen(u: Umfrage): Umfrage {
  return u.offen ? { ...u, offen: false } : u
}

/** Stimmen je Antwort, in der Reihenfolge der Antworten. */
export function ergebnis(u: Umfrage): number[] {
  const zahlen = u.antworten.map(() => 0)
  for (const { wahl } of Object.values(u.stimmen)) zahlen[wahl] += 1
  return zahlen
}

/** Einen ganzen Stand einmischen (Nachzuegler): Stimmen vereinigen, geschlossen bleibt geschlossen. */
export function umfrageEinmischen(eigene: Umfrage | null, fremde: Umfrage): Umfrage {
  if (!eigene || eigene.id !== fremde.id) return fremde
  let u: Umfrage = { ...eigene, offen: eigene.offen && fremde.offen }
  for (const [wer, st] of Object.entries(fremde.stimmen)) {
    const bisher = u.stimmen[wer]
    if (!bisher || bisher.wann < st.wann) u = { ...u, stimmen: { ...u.stimmen, [wer]: st } }
  }
  return u
}

export function istUmfrage(wert: unknown): wert is Umfrage {
  if (!wert || typeof wert !== "object") return false
  const u = wert as Record<string, unknown>
  return typeof u.id === "string" && typeof u.frage === "string" && Array.isArray(u.antworten) &&
    typeof u.offen === "boolean" && !!u.stimmen && typeof u.stimmen === "object"
}

export function istStimme(wert: unknown): wert is Stimme {
  if (!wert || typeof wert !== "object") return false
  const s = wert as Record<string, unknown>
  return typeof s.umfrage === "string" && typeof s.wer === "string" && typeof s.wahl === "number" && typeof s.wann === "number"
}

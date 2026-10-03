// Das Real Life Game (DEFINITION Teil 14, freigegeben von Timo am 03.10.2026),
// das Modell und die XP-Rechnung.
//
// Timo: *"Wir brauchen eine Experience-Point-Logik, damit wir das auf Level
// münzen können … verschiedenste Bereiche oder Gewerke, etwa für Macher-Map
// oder Macher-Network."*
//
// Grundsatz nach Anton (real-life-game, RLNP): XP werden nie gespeichert,
// sondern aus bestätigten Teilnahmen gerechnet. Die Seite behauptet nicht
// mehr, als die Bestätigungen tragen. Keine Rangliste.

import { liste, objekt, text, texte, zahl, type Roh } from "./schleuse.js"

// ── Das Spielpaket eines Netzwerks ─────────────────────────────────────────

/** Ein Bereich (Gewerk) im Baum, etwa Holz → Möbelbau. */
export interface Bereich {
  id: string
  name: string
  /** Der Oberbereich; ohne ist es eine Wurzel. */
  eltern?: string
  /** Ein Symbol (lucide-Name). */
  symbol?: string
}

/** Ein Attribut des Charakters, gespeist aus Bereichen (Rollenspiel-Logik). */
export interface Attribut {
  id: string
  name: string
  /** Die Wurzel-Bereiche, deren XP es trägt. */
  aus: readonly string[]
}

export interface Spielpaket {
  id: string
  name: string
  bereiche: readonly Bereich[]
  attribute: readonly Attribut[]
}

/** Das Spielpaket der Macher (Macher-Map, Macher-Network), ein Vorschlag zum Weiterbauen. */
export const SPIELPAKET_MACHER: Spielpaket = /* @__PURE__ */ Object.freeze({
  id: "macher",
  name: "Macher",
  bereiche: Object.freeze([
    { id: "holz", name: "Holz", symbol: "trees" },
    { id: "holz-moebelbau", name: "Möbelbau", eltern: "holz" },
    { id: "holz-reparatur", name: "Reparatur", eltern: "holz" },
    { id: "metall", name: "Metall", symbol: "anvil" },
    { id: "metall-schweissen", name: "Schweißen", eltern: "metall" },
    { id: "elektro", name: "Elektro", symbol: "zap" },
    { id: "elektro-installation", name: "Installation", eltern: "elektro" },
    { id: "garten", name: "Garten", symbol: "sprout" },
    { id: "garten-gemuese", name: "Gemüsebau", eltern: "garten" },
    { id: "textil", name: "Textil", symbol: "scissors" },
    { id: "digital", name: "Digital", symbol: "cpu" },
    { id: "digital-programmieren", name: "Programmieren", eltern: "digital" },
    { id: "gemeinschaft", name: "Gemeinschaft", symbol: "users" },
    { id: "gemeinschaft-lehren", name: "Lehren", eltern: "gemeinschaft" },
    { id: "gemeinschaft-moderation", name: "Moderation", eltern: "gemeinschaft" },
  ]),
  attribute: Object.freeze([
    { id: "handwerk", name: "Handwerk", aus: ["holz", "metall", "elektro", "textil"] },
    { id: "natur", name: "Natur", aus: ["garten"] },
    { id: "wissen", name: "Wissen", aus: ["digital"] },
    { id: "gemeinschaft", name: "Gemeinschaft", aus: ["gemeinschaft"] },
  ]),
})

/** Feste XP-Größen für eine Quest, damit Quests vergleichbar bleiben. */
export const XP_GROESSEN = Object.freeze({ klein: 10, mittel: 25, gross: 50 })

/** Wer eine Teilnahme bestätigen darf (RLNP §10, vereinfacht). */
export type BestaetigtVon = "gastgeber" | "mentor" | "dabei"

/** Die Wurzel eines Bereichs und alle Oberbereiche, von unten nach oben. */
export function bereichsKette(paket: Spielpaket, id: string): string[] {
  const je = new Map(paket.bereiche.map((b) => [b.id, b]))
  const kette: string[] = []
  let jetzt = je.get(id)
  while (jetzt && !kette.includes(jetzt.id)) {
    kette.push(jetzt.id)
    jetzt = jetzt.eltern ? je.get(jetzt.eltern) : undefined
  }
  return kette
}

// ── Stufe aus XP ───────────────────────────────────────────────────────────

/** Die Kurve aus unserem rln-Bestand: Stufe n beginnt bei 100 · (n−1)^1,5 XP. */
export function xpFuerStufe(stufe: number): number {
  return stufe <= 1 ? 0 : Math.ceil(100 * Math.pow(stufe - 1, 1.5))
}

export interface StufenStand {
  xp: number
  stufe: number
  /** XP seit Beginn der Stufe. */
  inStufe: number
  /** XP von Beginn dieser bis zur nächsten Stufe. */
  stufeBreite: number
  /** Anteil 0 bis 1 bis zur nächsten Stufe. */
  anteil: number
}

export function stufeAus(xp: number): StufenStand {
  const x = Number.isFinite(xp) && xp > 0 ? Math.floor(xp) : 0
  const stufe = x <= 0 ? 1 : Math.floor(Math.pow(x / 100, 1 / 1.5)) + 1
  const beginn = xpFuerStufe(stufe)
  const breite = xpFuerStufe(stufe + 1) - beginn
  return { xp: x, stufe, inStufe: x - beginn, stufeBreite: breite, anteil: breite > 0 ? (x - beginn) / breite : 0 }
}

// ── Quest und Teilnahme ────────────────────────────────────────────────────

export interface Quest {
  id: string
  titel: string
  beschreibung: string | null
  /** Was die Quest bringt, je Bereich. */
  belohnung: { bereich: string; xp: number }[]
  /** Was man in der Realität gewinnt: Wissen, Werkzeug, Essen, Kontakt. */
  lohn: string[]
  bestaetigtVon: BestaetigtVon
  plaetze: number | null
  ort: string | null
  zeit: string | null
}

/** Eine Quest aus rohen Daten; Bereiche, die das Paket nicht kennt, fallen weg. */
export function questAus(id: string, daten: Roh | null | undefined, paket: Spielpaket = SPIELPAKET_MACHER): Quest | null {
  const d = daten ?? {}
  const titel = text(d.title) ?? text(d.titel)
  if (!titel) return null
  const bekannt = new Set(paket.bereiche.map((b) => b.id))
  const belohnung = liste(d.belohnung)
    .map((x) => objekt(x))
    .map((o) => ({ bereich: text(o?.bereich) ?? "", xp: zahl(o?.xp) ?? 0 }))
    .filter((b) => bekannt.has(b.bereich) && b.xp > 0)
    .map((b) => ({ ...b, xp: Math.min(Math.round(b.xp), 500) }))
  const von = text(d.bestaetigtVon)
  return {
    id,
    titel,
    beschreibung: text(d.description) ?? text(d.beschreibung),
    belohnung,
    lohn: texte(d.lohn),
    bestaetigtVon: von === "mentor" || von === "dabei" ? von : "gastgeber",
    plaetze: zahl(d.plaetze),
    ort: text(d.ort) ?? text(d.address),
    zeit: text(d.zeit) ?? text(d.start),
  }
}

export type TeilnahmeStand = "angenommen" | "gemeldet"

export interface Teilnahme {
  id: string
  quest: string
  person: string
  stand: TeilnahmeStand
}

export function teilnahmeAus(id: string, daten: Roh | null | undefined): Teilnahme | null {
  const d = daten ?? {}
  const quest = text(d.quest)
  const person = text(d.person)
  if (!quest || !person) return null
  return { id, quest, person, stand: d.stand === "gemeldet" ? "gemeldet" : "angenommen" }
}

// ── Bestätigungen ──────────────────────────────────────────────────────────

/** Was von Antons `ConfirmationView` hier gebraucht wird. */
export interface Bestaetigung {
  subjectId: string
  issuerId?: string
  relations?: readonly { predicate: string; target: string }[]
  trustLevel: "demo" | "local" | "server-confirmed" | "signed-attested"
}

/** Welche Vertrauensstufen zählen; in der Beispielwelt auch die Demo, gekennzeichnet. */
export function zaehlt(b: Bestaetigung, beispielwelt: boolean): boolean {
  if (b.trustLevel === "signed-attested" || b.trustLevel === "server-confirmed") return true
  return beispielwelt
}

/** Bezeugt diese Bestätigung die Teilnahme? Niemand bestätigt sich selbst. */
export function bezeugt(b: Bestaetigung, t: Teilnahme): boolean {
  if (b.issuerId && b.issuerId === t.person) return false
  return b.subjectId === t.id || Boolean(b.relations?.some((r) => r.predicate === "attests" && r.target === t.id))
}

// ── Der Spielstand eines Menschen ──────────────────────────────────────────

export interface QuestEintrag {
  quest: Quest
  teilnahme: Teilnahme
  /** „bestaetigt“ nur mit einer zählenden Bestätigung. */
  stand: TeilnahmeStand | "bestaetigt"
}

export interface Spielstand {
  gesamt: StufenStand
  bereiche: Record<string, StufenStand>
  attribute: { id: string; name: string; stand: StufenStand }[]
  quests: QuestEintrag[]
  /** Gemeldet, aber noch nicht bestätigt: zählt nicht als XP. */
  wartend: number
}

/**
 * Der Spielstand eines Menschen aus Quests, Teilnahmen und Bestätigungen.
 * XP einer bestätigten Teilnahme zählen in ihrem Bereich und allen
 * Oberbereichen; die Gesamtstufe zählt jede XP einmal.
 */
export function spielstand(a: {
  person: string
  quests: readonly Quest[]
  teilnahmen: readonly Teilnahme[]
  bestaetigungen: readonly Bestaetigung[]
  paket?: Spielpaket
  beispielwelt?: boolean
}): Spielstand {
  const paket = a.paket ?? SPIELPAKET_MACHER
  const questJe = new Map(a.quests.map((q) => [q.id, q]))
  const xpJe = new Map<string, number>()
  let gesamt = 0
  let wartend = 0
  const quests: QuestEintrag[] = []
  const gezaehlt = new Set<string>()
  for (const t of a.teilnahmen) {
    if (t.person !== a.person) continue
    const q = questJe.get(t.quest)
    if (!q) continue
    const bestaetigt = a.bestaetigungen.some((b) => zaehlt(b, Boolean(a.beispielwelt)) && bezeugt(b, t))
    quests.push({ quest: q, teilnahme: t, stand: bestaetigt ? "bestaetigt" : t.stand })
    if (!bestaetigt) {
      if (t.stand === "gemeldet") wartend++
      continue
    }
    // Eine Quest zählt für einen Menschen einmal, auch bei mehreren Teilnahmen.
    if (gezaehlt.has(q.id)) continue
    gezaehlt.add(q.id)
    for (const b of q.belohnung) {
      gesamt += b.xp
      for (const id of bereichsKette(paket, b.bereich)) xpJe.set(id, (xpJe.get(id) ?? 0) + b.xp)
    }
  }
  const bereiche: Record<string, StufenStand> = {}
  for (const b of paket.bereiche) bereiche[b.id] = stufeAus(xpJe.get(b.id) ?? 0)
  const attribute = paket.attribute.map((at) => ({
    id: at.id,
    name: at.name,
    stand: stufeAus(at.aus.reduce((s, id) => s + (xpJe.get(id) ?? 0), 0)),
  }))
  return { gesamt: stufeAus(gesamt), bereiche, attribute, quests, wartend }
}

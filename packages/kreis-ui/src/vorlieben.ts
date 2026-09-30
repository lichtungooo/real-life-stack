// Was jeder Mensch fuer sich einstellt, wie in Big Blue Button unter
// "Einstellungen" (Timo, 30.09.2026, mit Bildschirmfotos): Anwendung,
// Benachrichtigungen, Datensparmodus.
//
// Nur fuer dieses Geraet: Es sind Vorlieben, keine Regeln des Raums. Sie
// liegen im Browser; fehlt der Speicher (privates Fenster), gelten die
// Vorgaben, und die Konferenz laeuft trotzdem.

import { useSyncExternalStore } from "react"

export type HinweisArt = "chat" | "beitritt" | "gehen" | "hand"

/**
 * Die Layouts wie in Big Blue Button: Bilder oben (unser Standard), Bilder
 * rechts, Praesentation im Zentrum (Bilder klein unten), Video im Zentrum
 * (das Tool klein unten).
 */
export const LAYOUTS = ["oben", "rechts", "praesentation", "video"] as const
export type LayoutArt = (typeof LAYOUTS)[number]
export const istLayout = (w: unknown): w is LayoutArt => (LAYOUTS as readonly unknown[]).includes(w)

export interface Vorlieben {
  /** Bewegungen und Uebergaenge. */
  animationen: boolean
  /** Rausch- und Echounterdrueckung, automatische Lautstaerke des Mikrofons. */
  audiofilter: boolean
  /** Leertaste halten, um zu sprechen. */
  pushToTalk: boolean
  /** Das eigene Bild bei den anderen Bildern zeigen. */
  selbstansicht: boolean
  /** Die Leiste der Zeichen schliesst sich nach der Wahl. */
  reaktionenSchliessen: boolean
  /** Schriftgroesse der Konferenz in Prozent. */
  schrift: number
  /** Je Anlass ein Ton und ein Hinweis. */
  hinweise: Record<HinweisArt, { ton: boolean; popup: boolean }>
  /** Datensparmodus: die Kameras der anderen zeigen. */
  kamerasAnderer: boolean
  /** Datensparmodus: den geteilten Bildschirm der anderen zeigen. */
  bildschirmAnderer: boolean
  /** Wie die Konferenz aufgeteilt ist. */
  layout: LayoutArt
}

// Die Vorgaben folgen Big Blue Button: Hinweise nur beim Handheben.
export const VORGABEN: Vorlieben = {
  animationen: true,
  audiofilter: true,
  pushToTalk: true,
  selbstansicht: true,
  reaktionenSchliessen: true,
  schrift: 100,
  hinweise: {
    chat: { ton: false, popup: false },
    beitritt: { ton: false, popup: false },
    gehen: { ton: false, popup: false },
    hand: { ton: true, popup: true },
  },
  kamerasAnderer: true,
  bildschirmAnderer: true,
  layout: "oben",
}

export const SCHRIFT_STUFEN = [80, 90, 100, 110, 120, 130] as const

const SCHLUESSEL = "kreis-vorlieben"

/** Liest gespeicherte Vorlieben und fuellt Luecken mit den Vorgaben. Unlesbares zaehlt nicht. */
export function vorliebenLesen(roh: string | null): Vorlieben {
  if (!roh) return VORGABEN
  try {
    const g = JSON.parse(roh) as Partial<Vorlieben>
    const hinweise = { ...VORGABEN.hinweise }
    for (const art of Object.keys(hinweise) as HinweisArt[]) {
      const h = g.hinweise?.[art]
      if (h && typeof h.ton === "boolean" && typeof h.popup === "boolean") hinweise[art] = { ton: h.ton, popup: h.popup }
    }
    const bool = (k: keyof Vorlieben) => (typeof g[k] === "boolean" ? (g[k] as boolean) : (VORGABEN[k] as boolean))
    return {
      animationen: bool("animationen"),
      audiofilter: bool("audiofilter"),
      pushToTalk: bool("pushToTalk"),
      selbstansicht: bool("selbstansicht"),
      reaktionenSchliessen: bool("reaktionenSchliessen"),
      schrift: (SCHRIFT_STUFEN as readonly number[]).includes(g.schrift as number) ? (g.schrift as number) : VORGABEN.schrift,
      hinweise,
      kamerasAnderer: bool("kamerasAnderer"),
      bildschirmAnderer: bool("bildschirmAnderer"),
      layout: istLayout(g.layout) ? g.layout : VORGABEN.layout,
    }
  } catch {
    return VORGABEN
  }
}

let aktuell: Vorlieben | null = null
const hoerer = new Set<() => void>()

function laden(): Vorlieben {
  if (aktuell) return aktuell
  let roh: string | null = null
  try { roh = localStorage.getItem(SCHLUESSEL) } catch { /* kein Speicher */ }
  aktuell = vorliebenLesen(roh)
  return aktuell
}

/** Neue Vorlieben setzen, merken und allen Flaechen melden. */
export function vorliebenSetzen(neu: Vorlieben): void {
  aktuell = neu
  try { localStorage.setItem(SCHLUESSEL, JSON.stringify(neu)) } catch { /* bleibt fuer diese Sitzung */ }
  hoerer.forEach((fn) => fn())
}

/** Nur fuer Tests: den Stand vergessen. */
export function vorliebenZuruecksetzen(): void {
  aktuell = null
  try { localStorage.removeItem(SCHLUESSEL) } catch { /* egal */ }
  hoerer.forEach((fn) => fn())
}

export function useVorlieben(): Vorlieben {
  return useSyncExternalStore(
    (fn) => { hoerer.add(fn); return () => { hoerer.delete(fn) } },
    laden,
    () => VORGABEN,
  )
}

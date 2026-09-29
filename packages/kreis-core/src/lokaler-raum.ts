// Der lokale Raum-Adapter: mehrere Browser-Tabs auf einem Geraet, ueber
// `BroadcastChannel`. Ohne Server, ohne Bild und Ton.
//
// Wofuer: Den Kreis ausprobieren, ohne einen LiveKit-Server zu haben, und
// ihn pruefen. Jeder Tab ist ein Mensch; wer zwei Tabs oeffnet, sitzt zu
// zweit im Kreis.

import type { KreisRaum, KreisTeilnehmer } from "./raum"

/** So oft meldet sich jeder Tab im Raum. */
const TAKT_MS = 1500
/** Wer so lange schweigt, gilt als gegangen. */
const WEG_NACH_MS = 5000

type Funk =
  | { typ: "da"; id: string; name: string; mikroAn: boolean; kameraAn: boolean }
  | { typ: "weg"; id: string }
  | { typ: "nachricht"; von: string; inhalt: unknown }

interface Fremder {
  name: string
  mikroAn: boolean
  kameraAn: boolean
  zuletzt: number
}

export interface LokalerRaumOptionen {
  /** Fuer Tests: ein eigener Kanal statt `BroadcastChannel`. */
  kanal?: (name: string) => { postMessage(n: unknown): void; close(): void; onmessage: ((e: { data: unknown }) => void) | null }
  /** Fuer Tests: eine eigene Uhr. */
  jetzt?: () => number
  /** Fuer Tests: eigene Kennung. */
  id?: string
}

export function lokalerKreisRaum(optionen: LokalerRaumOptionen = {}): KreisRaum {
  const jetzt = optionen.jetzt ?? (() => Date.now())
  const oeffnen = optionen.kanal ?? ((name: string) => new BroadcastChannel(name))
  const meineId = optionen.id ?? `tab-${Math.random().toString(36).slice(2, 10)}`

  let kanal: ReturnType<typeof oeffnen> | null = null
  let takt: ReturnType<typeof setInterval> | null = null
  let meinName = ""
  let mikroAn = false
  let kameraAn = false
  const fremde = new Map<string, Fremder>()
  const aenderungen = new Set<() => void>()
  const nachrichten = new Set<(n: unknown, von: string) => void>()

  const melden = () => aenderungen.forEach((fn) => fn())
  const funken = (f: Funk) => kanal?.postMessage(f)
  const daSein = () => funken({ typ: "da", id: meineId, name: meinName, mikroAn, kameraAn })

  const aufraeumen = () => {
    const grenze = jetzt() - WEG_NACH_MS
    let geaendert = false
    for (const [id, f] of fremde) {
      if (f.zuletzt < grenze) { fremde.delete(id); geaendert = true }
    }
    if (geaendert) melden()
  }

  return {
    traegtMedien: false,

    async betreten(raum, name) {
      if (kanal) return
      meinName = name
      kanal = oeffnen(`kreis:${raum}`)
      kanal.onmessage = (e: { data: unknown }) => {
        const f = e.data as Funk
        if (!f || typeof f !== "object") return
        if (f.typ === "da") {
          const neu = !fremde.has(f.id)
          fremde.set(f.id, { name: f.name, mikroAn: f.mikroAn, kameraAn: f.kameraAn, zuletzt: jetzt() })
          // Wer neu ist, soll mich sofort sehen, nicht erst beim naechsten Takt.
          if (neu) daSein()
          melden()
        } else if (f.typ === "weg") {
          if (fremde.delete(f.id)) melden()
        } else if (f.typ === "nachricht") {
          nachrichten.forEach((fn) => fn(f.inhalt, f.von))
        }
      }
      daSein()
      takt = setInterval(() => { daSein(); aufraeumen() }, TAKT_MS)
      melden()
    },

    async verlassen() {
      if (!kanal) return
      funken({ typ: "weg", id: meineId })
      if (takt) clearInterval(takt)
      takt = null
      kanal.close()
      kanal = null
      fremde.clear()
      melden()
    },

    ich: () => (kanal ? meineId : null),

    teilnehmer(): readonly KreisTeilnehmer[] {
      if (!kanal) return []
      const ich: KreisTeilnehmer = { id: meineId, name: meinName, ichSelbst: true, spricht: false, mikroAn, kameraAn }
      const andere = [...fremde.entries()].map(([id, f]): KreisTeilnehmer => ({
        id, name: f.name, ichSelbst: false, spricht: false, mikroAn: f.mikroAn, kameraAn: f.kameraAn,
      }))
      return [ich, ...andere]
    },

    beiAenderung(fn) {
      aenderungen.add(fn)
      return () => { aenderungen.delete(fn) }
    },

    senden(inhalt) {
      funken({ typ: "nachricht", von: meineId, inhalt })
    },

    beiNachricht(fn) {
      nachrichten.add(fn)
      return () => { nachrichten.delete(fn) }
    },

    async mikro(an) { mikroAn = an; daSein(); melden() },
    async kamera(an) { kameraAn = an; daSein(); melden() },
  }
}

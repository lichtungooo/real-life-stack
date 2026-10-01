// @vitest-environment jsdom
/**
 * Die Konferenz verbindet nach einem Abriss von selbst neu (Timo mit Emil,
 * 01.10.2026: "ist dann abgebrochen ... rausgegangen, wollte wieder rein").
 * Der Raum ist hier eine Attrappe, die sich auf Zuruf trennt.
 */
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { KreisRaum, KreisTeilnehmer } from "@kreis/core"
import { KreisRaumProvider, useKreisVerbindung, type KreisKontext } from "../src/raum-kontext"

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function attrappe(optionen: { scheitern?: number; dauer?: number } = {}) {
  let ich: string | null = null
  let scheitern = optionen.scheitern ?? 0
  let abgerissen = false
  let nr = 0
  const hoerer = new Set<() => void>()
  const melden = () => hoerer.forEach((f) => f())
  const beigetreten: string[] = []
  const raum: KreisRaum = {
    traegtMedien: false,
    async betreten(_r, name) {
      if (optionen.dauer) await new Promise((r) => setTimeout(r, optionen.dauer))
      beigetreten.push(name)
      if (scheitern > 0) { scheitern--; throw new Error("Server antwortet nicht") }
      ich = `p-${++nr}`; abgerissen = false; melden()
    },
    async verlassen() { ich = null; abgerissen = false; melden() },
    ich: () => ich,
    teilnehmer: (): KreisTeilnehmer[] => (ich ? [{ id: ich, name: "Anna", ichSelbst: true, spricht: false, mikroAn: true, kameraAn: false }] : []),
    beiAenderung(f) { hoerer.add(f); return () => { hoerer.delete(f) } },
    senden() {},
    beiNachricht() { return () => {} },
    async mikro() {},
    async kamera() {},
    verbindungVerloren: () => abgerissen,
  }
  return { raum, beigetreten, abreissen: () => { ich = null; abgerissen = true; melden() }, scheitern: (n: number) => { scheitern = n } }
}

const wurzeln: Root[] = []
afterEach(() => { act(() => { wurzeln.forEach((w) => w.unmount()) }); wurzeln.length = 0; vi.useRealTimers() })

async function aufbauen(raum: KreisRaum) {
  let kreis: KreisKontext | null = null
  function Fuehler() { kreis = useKreisVerbindung(); return null }
  const huelle = document.createElement("div")
  const w = createRoot(huelle)
  wurzeln.push(w)
  await act(async () => { w.render(<KreisRaumProvider fabrik={() => raum}><Fuehler /></KreisRaumProvider>) })
  return () => kreis!
}

describe("Nach einem Abriss", () => {
  it("tritt die App von selbst wieder bei, mit demselben Namen", async () => {
    vi.useFakeTimers()
    const a = attrappe()
    const kreis = await aufbauen(a.raum)
    await act(async () => { await kreis().betreten("garten", "Anna", "Garten") })
    expect(kreis().zustand).toBe("drin")

    await act(async () => { a.abreissen() })
    await act(async () => { await vi.advanceTimersByTimeAsync(1200) })
    expect(a.beigetreten).toEqual(["Anna", "Anna"])
    expect(kreis().zustand).toBe("drin")
    expect(kreis().ich).not.toBeNull()
  })

  it("wer selbst geht, wird nicht zurueckgeholt", async () => {
    vi.useFakeTimers()
    const a = attrappe()
    const kreis = await aufbauen(a.raum)
    await act(async () => { await kreis().betreten("garten", "Anna", "Garten") })
    await act(async () => { await kreis().verlassen() })
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000) })
    expect(a.beigetreten).toEqual(["Anna"])
    expect(kreis().zustand).toBe("draussen")
  })
  it("haelt bis zum dritten Versuch durch, wenn die ersten scheitern (Kimi, zweite Runde)", async () => {
    vi.useFakeTimers()
    const a = attrappe()
    const kreis = await aufbauen(a.raum)
    await act(async () => { await kreis().betreten("garten", "Anna", "Garten") })
    a.scheitern(2)
    await act(async () => { a.abreissen() })
    await act(async () => { await vi.advanceTimersByTimeAsync(1100) })
    await act(async () => { await vi.advanceTimersByTimeAsync(3100) })
    await act(async () => { await vi.advanceTimersByTimeAsync(8100) })
    expect(a.beigetreten).toEqual(["Anna", "Anna", "Anna", "Anna"])
    expect(kreis().zustand).toBe("drin")
  })

  it("wer waehrend eines Beitritts geht, bleibt draussen (Kimi, zweite Runde)", async () => {
    vi.useFakeTimers()
    const a = attrappe({ dauer: 2000 })
    const kreis = await aufbauen(a.raum)
    let laeuft: Promise<void> = Promise.resolve()
    await act(async () => { laeuft = kreis().betreten("garten", "Anna", "Garten") })
    await act(async () => { await kreis().verlassen() })
    await act(async () => { await vi.advanceTimersByTimeAsync(2100); await laeuft })
    expect(kreis().zustand).toBe("draussen")
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000) })
    expect(kreis().zustand).toBe("draussen")
  })
})

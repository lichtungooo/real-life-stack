// Die Orte der Stiftungen, einheitlich (Timo, 01.10.2026). Erzeugt von
// td-tools/stiftungen/orte-setzen.py; dieser Test haelt fest, was danach gilt.
import { describe, expect, it } from "vitest"
import items from "../daten/items.json"

type Daten = Record<string, unknown> & { title: string; address?: string; position?: { type: string; coordinates: number[] } }
const stiftungen = (items as { id: string; data: Daten }[]).filter((i) => i.id.startsWith("stiftung-"))
const GENAUIGKEIT = ["anschrift", "ort", "bundesweit"]

describe("Die Orte der Stiftungen", () => {
  it("jede sagt, wie genau ihr Ort ist", () => {
    const ohne = stiftungen.filter((s) => !GENAUIGKEIT.includes(String(s.data.ortGenauigkeit))).map((s) => s.data.title)
    expect(ohne).toEqual([])
  })

  it("eine Anschrift hat immer dieselbe Form: Strasse Nr, PLZ Ort (PLZ aus DE, CH, NL oder SE)", () => {
    const falsch = stiftungen
      .filter((s) => s.data.ortGenauigkeit === "anschrift" && !/^.+, (\d{4,5}|\d{4} ?[A-Z]{2}|\d{3} \d{2}) \S.*$/.test(String(s.data.address)))
      .map((s) => `${s.data.title}: ${s.data.address}`)
    expect(falsch).toEqual([])
  })

  it("wer eine Anschrift hat, nennt die Seite, auf der sie steht", () => {
    const ohne = stiftungen.filter((s) => s.data.ortGenauigkeit === "anschrift" && !/^https?:\/\//.test(String(s.data.anschriftQuelle ?? "")))
    expect(ohne.map((s) => s.data.title)).toEqual([])
  })

  it("jede Koordinate liegt in Europa (kein vertauschtes lat/lng)", () => {
    const daneben = stiftungen.filter((s) => {
      const [lng, lat] = s.data.position?.coordinates ?? []
      return !(lng > -11 && lng < 32 && lat > 35 && lat < 71)
    })
    expect(daneben.map((s) => s.data.title)).toEqual([])
  })

  it("keine zwei Stiftungen auf genau demselben Punkt (sonst lassen sie sich nie trennen)", () => {
    const punkte = new Map<string, string>()
    const doppelt: string[] = []
    for (const s of stiftungen) {
      const k = JSON.stringify(s.data.position?.coordinates)
      if (punkte.has(k)) doppelt.push(`${punkte.get(k)} / ${s.data.title}`)
      else punkte.set(k, s.data.title)
    }
    expect(doppelt).toEqual([])
  })
})

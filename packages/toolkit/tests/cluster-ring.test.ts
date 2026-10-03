/**
 * NAHT trustdonation (A-Cluster, Ring): Der Ring um einen Sammelpunkt zeigt die
 * Anteile der Arten darin; die drei größten in ihrer Farbe, der Rest grau
 * (Timo, 03.10.2026).
 */
import { describe, expect, it } from "vitest"
import { clusterRingShares } from "../src/components/map/adapters/maplibre"

describe("Ring je Art um einen Sammelpunkt", () => {
  it("nur Stiftungen: ein einfarbiger Ring", () => {
    expect(clusterRingShares("#194294;#194294;#194294;")).toEqual([{ color: "#194294", share: 1 }])
  })

  it("Anteile nach Häufigkeit, größte zuerst", () => {
    const s = clusterRingShares("#194294;#1b5e40;#194294;#194294;")
    expect(s.map((x) => x.color)).toEqual(["#194294", "#1b5e40"])
    expect(s[0].share).toBeCloseTo(0.75)
    expect(s[1].share).toBeCloseTo(0.25)
  })

  it("mehr als drei Farben: der Rest wird grau", () => {
    const s = clusterRingShares("#a00000;#a00000;#a00000;#0000a0;#0000a0;#00a000;#111111;#222222;")
    expect(s).toHaveLength(4)
    expect(s[3]).toEqual({ color: "#9ca3af", share: 2 / 8 })
    expect(s.reduce((sum, x) => sum + x.share, 0)).toBeCloseTo(1)
  })

  it("leer oder kaputt: kein Ring", () => {
    expect(clusterRingShares("")).toEqual([])
    expect(clusterRingShares(undefined)).toEqual([])
    expect(clusterRingShares(";;;")).toEqual([])
  })
})

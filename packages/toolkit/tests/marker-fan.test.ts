/**
 * NAHT trustdonation (A-Cluster): Marker am selben Ort fächern auf einen
 * kleinen Ring, nah genug zoomt man; weit herausgezoomt bleiben sie an ihrem
 * Ort, statt kilometerweit verstreut zu werden (Kimi, 03.10.2026).
 */
import { describe, expect, it } from "vitest"
import { fanPositions, sameSpotGroups } from "../src/components/map/adapters/maplibre"

const kassel: [number, number] = [9.4932, 51.3162]
const marker = (id: string, position: [number, number]) => ({ id, position }) as never

function abstandMeter(a: [number, number], b: [number, number]) {
  const dLat = (b[1] - a[1]) * 111_320
  const dLng = (b[0] - a[0]) * 111_320 * Math.cos((a[1] * Math.PI) / 180)
  return Math.hypot(dLat, dLng)
}

describe("Fächer für Marker am selben Ort", () => {
  it("nah herangezoomt fächern sechs Stiftungen im selben Haus auf einen kleinen Ring", () => {
    const sechs = Array.from({ length: 6 }, (_, i) => marker(`s${i}`, [kassel[0] + i * 0.00001, kassel[1]]))
    const fan = fanPositions(sechs, 17)
    expect(fan.size).toBe(6)
    for (const p of fan.values()) expect(abstandMeter(kassel, p)).toBeLessThan(60)
  })

  it("weit herausgezoomt bleibt jeder Marker an seinem Ort", () => {
    const zwei = [marker("a", kassel), marker("b", [kassel[0] + 0.0001, kassel[1]])]
    expect(fanPositions(zwei, 5).size).toBe(0)
    expect(fanPositions(zwei, 10).size).toBe(0)
  })

  it("kein Ring wird größer als einige hundert Meter, auf keiner Zoomstufe", () => {
    const zwei = [marker("a", kassel), marker("b", kassel)]
    for (let z = 0; z <= 22; z++) {
      for (const p of fanPositions(zwei, z).values()) expect(abstandMeter(kassel, p)).toBeLessThanOrEqual(260)
    }
  })

  it("Marker an verschiedenen Orten fächern nie", () => {
    expect(fanPositions([marker("a", kassel), marker("b", [9.6, 51.4])], 18).size).toBe(0)
  })

  it("ein geteilter Ort zählt auch dann, wenn er weit herausgezoomt noch nicht fächert", () => {
    const zwei = [marker("a", kassel), marker("b", [kassel[0] + 0.0001, kassel[1]]), marker("c", [9.6, 51.4])]
    const gruppen = sameSpotGroups(zwei)
    expect(gruppen.map((g) => g.length)).toEqual([2, 1])
    expect(gruppen.some((g) => g.length > 1)).toBe(true)
    expect(fanPositions(zwei, 5, gruppen).size).toBe(0)
    expect(fanPositions(zwei, 18, gruppen)).toEqual(fanPositions(zwei, 18))
  })

  it("lauter verschiedene Orte: kein geteilter Ort", () => {
    expect(sameSpotGroups([marker("a", kassel), marker("b", [9.6, 51.4])]).every((g) => g.length === 1)).toBe(true)
  })
})

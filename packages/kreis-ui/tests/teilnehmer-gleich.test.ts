import { describe, expect, it } from "vitest"
import { gleicheTeilnehmer } from "../src/use-kreis"

const p = (o: Record<string, unknown> = {}) => ({ id: "a", name: "Anna", ichSelbst: true, spricht: false, mikroAn: true, kameraAn: false, ...o })

describe("Die Teilnehmerliste wird nur bei echter Aenderung neu gesetzt", () => {
  it("gleicher Stand ist gleich, jede sichtbare Aenderung nicht", () => {
    expect(gleicheTeilnehmer([p()], [p()])).toBe(true)
    for (const aenderung of [{ spricht: true }, { mikroAn: false }, { kameraAn: true }, { name: "Anne" }, { teiltBildschirm: true }]) {
      expect(gleicheTeilnehmer([p()], [p(aenderung)])).toBe(false)
    }
    expect(gleicheTeilnehmer([p()], [p(), p({ id: "b" })])).toBe(false)
  })
})

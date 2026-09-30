/** Die Tagesordnung: Punkte mit Zeit, einer laeuft, erledigte sind abgehakt. */
import { describe, expect, it } from "vitest"
import {
  leereSitzung, punktAbhaken, punktAufrufen, punktDazu, punktRest, punktVerschieben, punktWeg, tagesordnungVon,
} from "../src"

const start = () => {
  let s = leereSitzung(0)
  s = punktDazu(s, "Ankommen", 10, "anna", "p1")
  s = punktDazu(s, "Garten", 20, "anna", "p2")
  s = punktDazu(s, "Offenes", 0, "bert", "p3")
  return s
}

describe("Tagesordnung", () => {
  it("Punkte kommen in Reihenfolge dazu, leere Titel nicht", () => {
    const s = start()
    expect(tagesordnungVon(s).punkte.map((p) => p.titel)).toEqual(["Ankommen", "Garten", "Offenes"])
    expect(punktDazu(s, "  ", 5, "x", "p9")).toBe(s)
  })

  it("aufrufen macht den vorigen Punkt erledigt und startet die Zeit", () => {
    let s = punktAufrufen(start(), "p1", "anna", 1_000)
    expect(tagesordnungVon(s).aktiv).toBe("p1")
    s = punktAufrufen(s, "p2", "anna", 5_000)
    const t = tagesordnungVon(s)
    expect(t.punkte.find((p) => p.id === "p1")?.erledigt).toBe(true)
    expect(t.seit).toBe(5_000)
    expect(punktRest(s, 5_000 + 60_000)).toBe(19 * 60_000)
  })

  it("ohne Zeit keine Restzeit; ueberzogen wird negativ", () => {
    const s = punktAufrufen(start(), "p3", "anna", 0)
    expect(punktRest(s, 10_000)).toBeNull()
    const g = punktAufrufen(start(), "p1", "anna", 0)
    expect(punktRest(g, 11 * 60_000)).toBe(-60_000)
  })

  it("abhaken, verschieben, entfernen", () => {
    let s = punktAbhaken(start(), "p3", true, "bert")
    expect(tagesordnungVon(s).punkte[2].erledigt).toBe(true)
    s = punktVerschieben(s, "p3", -1, "bert")
    expect(tagesordnungVon(s).punkte.map((p) => p.id)).toEqual(["p1", "p3", "p2"])
    expect(punktVerschieben(s, "p1", -1, "bert")).toBe(s)
    s = punktAufrufen(s, "p2", "anna", 0)
    s = punktWeg(s, "p2", "anna")
    expect(tagesordnungVon(s).aktiv).toBeNull()
    expect(tagesordnungVon(s).punkte).toHaveLength(2)
  })
})

/** Gruppenraeume: pruefen, starten, zuordnen, zufaellig verteilen, Schluessel. */
import { describe, expect, it } from "vitest"
import {
  gruppenraeumeBeenden, gruppenraeumeStarten, istUnterraumVon, leereSitzung, meinGruppenraum, raeumePruefen,
  unterraumSchluessel, zufaelligVerteilen,
} from "../src"

describe("Gruppenraeume", () => {
  const raeume = [{ name: "Raum 1", mitglieder: ["a", "b"] }, { name: "Raum 2", mitglieder: ["c"] }]

  it("prueft: zwei Raeume, jeder mit jemandem, Dauer sinnvoll; selbst waehlen erlaubt leere", () => {
    expect(raeumePruefen(raeume, 15, false)).toBeNull()
    expect(raeumePruefen([raeume[0]], 15, false)).toBe("zu-wenige-raeume")
    expect(raeumePruefen([raeume[0], { name: "R", mitglieder: [] }], 15, false)).toBe("raum-leer")
    expect(raeumePruefen([raeume[0], { name: "R", mitglieder: [] }], 15, true)).toBeNull()
    expect(raeumePruefen(raeume, 0, false)).toBe("dauer")
  })

  it("starten zaehlt, setzt das Ende, und jeder findet seinen Raum", () => {
    const s = gruppenraeumeStarten(leereSitzung(0), raeume, 15, false, "a", 1000)
    expect(s.gruppenraeume?.nr).toBe(1)
    expect(s.gruppenraeume?.bis).toBe(1000 + 15 * 60_000)
    expect(meinGruppenraum(s.gruppenraeume, "c")).toBe(2)
    expect(meinGruppenraum(s.gruppenraeume, "z")).toBeNull()
    expect(gruppenraeumeBeenden(s, "a").gruppenraeume).toBeNull()
  })

  it("zufaellig verteilt gleichmaessig und verliert niemanden", () => {
    const r = zufaelligVerteilen(["a", "b", "c", "d", "e"], 2, () => 0.3)
    expect(r.map((x) => x.length).sort()).toEqual([2, 3])
    expect(r.flat().sort()).toEqual(["a", "b", "c", "d", "e"])
  })

  it("der Schluessel passt zum Token-Dienst und gehoert zum Hauptraum", () => {
    const haupt = "4f1c2a9e-7b3d-4e21-9a55-0c6d8e2f1b77"
    const k = unterraumSchluessel(haupt, 3)
    expect(k).toMatch(/^[a-z0-9][a-z0-9_-]{1,62}[a-z0-9]$/) // kreis-server, RAUM_MUSTER
    expect(istUnterraumVon(k, haupt)).toBe(true)
    expect(istUnterraumVon(haupt, haupt)).toBe(false)
    expect(istUnterraumVon("anderer-gr1", haupt)).toBe(false)
  })
})

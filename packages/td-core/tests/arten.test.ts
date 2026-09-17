// Was zaehlt als vollstaendige Art, und was passiert mit den uebrigen Zeilen,
// wenn eine unfertig ist? Beides sind Regeln, beide stehen hier.
import { describe, it, expect } from "vitest"
import { zeileVollstaendig, schreibbareArten } from "../src/arten.js"

describe("zeileVollstaendig", () => {
  it("nimmt eine Zeile mit Einzahl und Mehrzahl", () => {
    expect(zeileVollstaendig({ id: "stiftung", label: "Stiftung", labelPlural: "Stiftungen" })).toBe(true)
  })

  it("verwirft eine Zeile ohne Mehrzahl", () => {
    expect(zeileVollstaendig({ id: "", label: "Stiftung", labelPlural: "" })).toBe(false)
  })

  it("verwirft eine Zeile ohne Einzahl", () => {
    expect(zeileVollstaendig({ id: "", label: "", labelPlural: "Stiftungen" })).toBe(false)
  })

  it("zaehlt Leerzeichen nicht als Eingabe", () => {
    expect(zeileVollstaendig({ id: "", label: "  ", labelPlural: "  " })).toBe(false)
  })
})

describe("schreibbareArten", () => {
  it("laesst eine unfertige Zeile weg und behaelt die uebrigen", () => {
    const rows = [
      { id: "stiftung", label: "Stiftung", labelPlural: "Stiftungen" },
      { id: "", label: "Proj", labelPlural: "" },
      { id: "ort", label: "Ort", labelPlural: "Orte" },
    ]
    expect(schreibbareArten(rows).map((r) => r.label)).toEqual(["Stiftung", "Ort"])
  })

  it("gibt eine leere Liste zurueck, wenn nichts fertig ist", () => {
    expect(schreibbareArten([{ id: "", label: "", labelPlural: "" }])).toEqual([])
  })

  it("laesst eine vollstaendige Liste unveraendert", () => {
    const rows = [{ id: "a", label: "A", labelPlural: "As" }]
    expect(schreibbareArten(rows)).toEqual(rows)
  })
})

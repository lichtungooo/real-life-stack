// Ein Architektur-Test: Die Regel, wann eine Art vollständig ist, darf es
// nur einmal geben. Sie liegt in der UI-freien Schicht; `td-ui` reicht sie
// weiter, statt sie zu doppeln.
//
// Ohne diesen Test fällt eine zweite Fassung erst auf, wenn beide
// auseinanderlaufen, und das ist genau der Fehler, gegen den die zwei
// Schichten gebaut sind (DEFINITION, Muster 1 und 2).
import { describe, it, expect } from "vitest"
import * as core from "@trustdonation/core"
import { moduleIds } from "@real-life-stack/toolkit"
import { zeileVollstaendig, schreibbareArten, ArtenEditor } from "../src/index.js"

describe("Schichten", () => {
  it("reicht die Regel durch, statt sie zu doppeln", () => {
    expect(zeileVollstaendig).toBe(core.zeileVollstaendig)
    expect(schreibbareArten).toBe(core.schreibbareArten)
  })

  it("bringt den Arten-Editor als Komponente mit", () => {
    expect(typeof ArtenEditor).toBe("function")
  })

  it("laesst die Regel auch ueber td-ui gelten", () => {
    expect(zeileVollstaendig({ id: "", label: "Stiftung", labelPlural: "Stiftungen" })).toBe(true)
    expect(zeileVollstaendig({ id: "", label: "Stiftung", labelPlural: "" })).toBe(false)
  })

  it("schreibt alle registrierten Module auch im Baukasten aus (FND-0029)", () => {
    const expectedModules = [
      "feed",
      "kanban",
      "calendar",
      "map",
      "resonance",
      "collection",
      "graph",
      "baukasten"
    ]
    const baukastenModuleIds = core.baukasten.schichten.find(s => s.id === "module")?.stuecke.map(p => p.id) ?? []
    expect(baukastenModuleIds).toEqual(expectedModules)
  })
})

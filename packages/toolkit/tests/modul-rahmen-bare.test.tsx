// @vitest-environment jsdom
/**
 * Naht lichtungooo (NAEHTE.md, B-Rahmen): Ein Modul mit `frame: "bare"`
 * bekommt vom Rahmen keine Suche und keine Filter-Pille. Die Konferenz listet
 * keine Items; Suche, Filter und Plusknopf gehoeren anderen Modulen und lagen
 * dort ueber ihren eigenen Knoepfen (Timo, 30.09.2026).
 */
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { FilterProvider } from "../src/components/filter/filter-store"
import { ModuleFrame } from "../src/components/layout/module-frame"

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let host: HTMLDivElement
let root: Root
beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host) })
afterEach(() => { act(() => root.unmount()); host.remove() })

function zeige(bare: boolean) {
  act(() => {
    root.render(
      <FilterProvider>
        <ModuleFrame moduleId="probe" searchLabel="In Probe suchen" bare={bare}>
          <p>Fläche</p>
        </ModuleFrame>
      </FilterProvider>,
    )
  })
}

describe("Modul-Rahmen ohne Suche und Filter", () => {
  it("ein gewoehnliches Modul bekommt die Suche", () => {
    zeige(false)
    expect(host.querySelector("input")).not.toBeNull()
    expect(host.textContent).toContain("Fläche")
  })

  it("ein Modul mit frame: bare bekommt weder Suche noch Filter", () => {
    zeige(true)
    expect(host.querySelector("input")).toBeNull()
    expect(host.textContent).not.toContain("Filter")
    expect(host.textContent).toContain("Fläche")
  })
})

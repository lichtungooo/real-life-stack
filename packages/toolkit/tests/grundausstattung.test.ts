/**
 * Naht A-Grundausstattung (docs/NAEHTE.md): Ein Space ohne eigene
 * Modul-Liste fuehrt die Vorgaben, nicht jedes Modul. So zeigt ihn auch der
 * Space-Dialog an. Timo, 30.09.2026: Im Login waren in jedem Space alle
 * Module eingeschaltet, "das ueberlaedt ja wirklich alles".
 */
import { describe, expect, it } from "vitest"
import { defaultModuleIds, moduleIds, resolveSpaceModules } from "../src/lib/module-register"

describe("Grundausstattung eines Space ohne eigene Liste", () => {
  it("fuehrt die Vorgaben", () => {
    expect(resolveSpaceModules(undefined)).toEqual(defaultModuleIds())
    expect(resolveSpaceModules()).toEqual(defaultModuleIds())
  })

  it("eine eigene Liste gilt weiter, wie sie gespeichert ist", () => {
    expect(resolveSpaceModules(["map", "feed"])).toEqual(["map", "feed"])
  })

  it("bleibt nach dem Filtern nichts uebrig, gilt weiter der volle Satz", () => {
    expect(resolveSpaceModules(["gibt-es-nicht"])).toEqual(moduleIds())
  })
})

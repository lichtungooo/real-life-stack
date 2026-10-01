// @vitest-environment jsdom
/**
 * Die Erweiterungen im Space-Dialog (DEFINITION Teil 8), mit dem echten
 * Register dieser App. Geprueft werden die Listen, denn dort laufen Dinge
 * auseinander: Verzeichnis gegen Register, und was geschrieben wird.
 */
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getModules } from "@real-life-stack/toolkit"
import { ERWEITERUNGEN } from "@trustdonation/core"
import type { Group } from "@real-life-stack/data-interface"
import "./module-register"
import { ERWEITERUNGEN_ABSCHNITT } from "./views/erweiterungen-abschnitt"

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const wurzeln: Root[] = []
afterEach(() => { act(() => { wurzeln.forEach((w) => w.unmount()) }); wurzeln.length = 0; document.body.innerHTML = "" })

describe("Verzeichnis und Register", () => {
  it("jeder Modul-Eintrag im Verzeichnis meint ein Modul, das es im Register gibt", () => {
    const ids = new Set(getModules().map((m) => m.id))
    const fremd = ERWEITERUNGEN.filter((e) => e.art === "modul" && !ids.has(e.id)).map((e) => e.id)
    expect(fremd, "Eintrag ohne Modul: Tippfehler oder Modul entfernt").toEqual([])
  })

  it("jede Komponente nennt Namen und Typ und kollidiert mit keinem Modul", () => {
    const ids = new Set(getModules().map((m) => m.id))
    for (const k of ERWEITERUNGEN.filter((e) => e.art === "komponente")) {
      expect(k.name, k.id).toBeTruthy()
      expect(k.fuerTyp, k.id).toBeTruthy()
      expect(ids.has(k.id), k.id).toBe(false)
    }
  })

  it("jedes Modul im Register hat einen Eintrag (sonst steht es ohne Beschreibung da)", () => {
    const im = new Set(ERWEITERUNGEN.map((e) => e.id))
    expect(getModules().map((m) => m.id).filter((id) => !im.has(id))).toEqual([])
  })
})

describe("Der Abschnitt Erweiterungen", () => {
  async function zeigen(group: Group, canEdit = true) {
    const patchData = vi.fn(async () => {})
    const huelle = document.createElement("div")
    document.body.appendChild(huelle)
    const w = createRoot(huelle)
    wurzeln.push(w)
    await act(async () => { w.render(<>{ERWEITERUNGEN_ABSCHNITT.render({ group, canEdit, patchData })}</>) })
    // Der Abschnitt laedt nach (Budget): warten, bis er steht.
    for (let i = 0; i < 50 && !huelle.querySelector("button"); i++) {
      await act(async () => { await new Promise((r) => setTimeout(r, 10)) })
    }
    return { huelle, patchData }
  }
  const knopf = (text: string) => [...document.querySelectorAll("button")].find((b) => b.textContent?.includes(text) || b.getAttribute("aria-label") === text) as HTMLButtonElement
  const klick = async (text: string) => { await act(async () => { knopf(text).click() }) }

  it("oeffnet die Uebersicht; geprueft und Beta getrennt; Circeling in Beta", async () => {
    await zeigen({ id: "g1", name: "Garten", data: { modules: ["feed", "map"] } } as unknown as Group)
    await klick("Alle Erweiterungen ansehen")
    const liste = () => document.querySelector('[aria-label="Erweiterungen"]')?.textContent ?? ""
    expect(liste()).toContain("Karte")
    expect(liste()).toContain("von Anton Tranelis")
    expect(liste()).not.toContain("Circeling")
    await klick("Beta")
    expect(liste()).toContain("Circeling")
    expect(liste()).toContain("Mitschrift")
  })

  it("Dazunehmen schreibt Group.data.modules ueber Antons patchData und behaelt fremde Ids", async () => {
    const { patchData } = await zeigen({ id: "g1", name: "Garten", data: { modules: ["feed", "fremd"] } } as unknown as Group)
    await klick("Alle Erweiterungen ansehen")
    await klick("Kalender in den Space nehmen")
    expect(patchData).toHaveBeenCalledWith({ modules: ["feed", "fremd", "calendar"] })
    await klick("Feed aus dem Space nehmen")
    expect(patchData).toHaveBeenLastCalledWith({ modules: ["fremd"] })
  })

  it("wer den Space nicht verwaltet, sieht alles und kann nichts aendern", async () => {
    await zeigen({ id: "g1", name: "Garten", data: {} } as unknown as Group, false)
    await klick("Alle Erweiterungen ansehen")
    expect(document.body.textContent).toContain("Nur wer den Space verwaltet")
    expect(knopf("Kanban in den Space nehmen").disabled).toBe(true)
  })

  it("Komponenten: das Project Profile steht unter Beta und landet in Group.data.komponenten", async () => {
    const { patchData } = await zeigen({ id: "g1", name: "Garten", data: { modules: ["feed"], komponenten: ["fremd"] } } as unknown as Group)
    await klick("Alle Erweiterungen ansehen")
    await klick("Komponenten")
    const beta = [...document.body.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find((b) => b.textContent?.startsWith("Beta"))!
    await act(async () => { beta.click() })
    expect(document.body.textContent).toContain("Project Profile")
    await klick("Project Profile in den Space nehmen")
    expect(patchData).toHaveBeenCalledWith({ komponenten: ["fremd", "projekt-profil"] })
  })

  it("Themes sind angekuendigt, nicht vorgetaeuscht", async () => {
    await zeigen({ id: "g1", name: "Garten", data: {} } as unknown as Group)
    await klick("Alle Erweiterungen ansehen")
    await klick("Themes")
    expect(document.body.textContent).toContain("Themes kommen")
  })
})

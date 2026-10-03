// @vitest-environment jsdom
/**
 * Profile bearbeiten (DEFINITION Teil 8): Knopf nur mit Recht, Stift je
 * Abschnitt, Formular an Ort und Stelle mit sofortiger Vorschau, Speichern
 * je Abschnitt mit den ganzen Daten. Unbekannte Felder und die Quelle bleiben.
 */
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"
import { projektProfil, stiftungsProfil } from "@trustdonation/core"
import { musterItems } from "@trustdonation/core/musterdaten"
import { ProjektProfilVoll } from "@trustdonation/ui/projekt-profil"
import { StiftungsProfilVoll } from "@trustdonation/ui/stiftungs-profil"

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const wurzeln: Root[] = []
afterEach(() => { act(() => { wurzeln.forEach((w) => w.unmount()) }); wurzeln.length = 0; document.body.innerHTML = "" })

function zeigen(knoten: React.ReactNode) {
  const ort = document.createElement("div")
  document.body.appendChild(ort)
  const w = createRoot(ort)
  wurzeln.push(w)
  act(() => w.render(knoten))
}

const knopf = (name: string) => [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === name || b.getAttribute("aria-label") === name)

function klicken(name: string) {
  const b = knopf(name)
  if (!b) throw new Error(`Kein Knopf „${name}“`)
  act(() => b.click())
}

function tippen(el: HTMLInputElement | HTMLTextAreaElement, wert: string) {
  const setzen = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value")!.set!
  act(() => {
    setzen.call(el, wert)
    el.dispatchEvent(new Event("input", { bubbles: true }))
  })
}

const projekt = musterItems.find((i) => i.id === "projekt-gruenes-klassenzimmer")!
const projektDaten: Record<string, unknown> = { ...(projekt.data as Record<string, unknown>), fremd: { bleibt: true } }

describe("Project Profile bearbeiten", () => {
  it("ohne Recht kein Knopf", () => {
    zeigen(<ProjektProfilVoll profil={projektProfil(projektDaten, [])} offen onOffen={() => {}} />)
    expect(knopf("Profil bearbeiten")).toBeUndefined()
  })

  it("Stift öffnet den Abschnitt, die Vorschau folgt sofort, gespeichert wird alles", async () => {
    const speichern = vi.fn(async () => ({}))
    zeigen(<ProjektProfilVoll profil={projektProfil(projektDaten, [])} offen onOffen={() => {}}
      bearbeitung={{ daten: projektDaten, eintrag: { tags: ["garten"] }, speichern }} />)
    klicken("Profil bearbeiten")
    klicken("Was sich ändert bearbeiten")

    const erste = document.querySelector<HTMLInputElement>('input[aria-label="Was sich ändert 1"]')!
    tippen(erste, "Kinder ernten selbst")
    expect(document.querySelector('[aria-label="Vorschau"]')?.textContent).toContain("Kinder ernten selbst")

    await act(async () => { knopf("Speichern")!.click() })
    expect(speichern).toHaveBeenCalledTimes(1)
    const [aenderung] = speichern.mock.calls[0] as unknown as [{ data: Record<string, unknown> }]
    expect(aenderung.data.fremd).toEqual({ bleibt: true })
    expect(aenderung.data.title).toBe(projektDaten.title)
    expect((aenderung.data.wirkung as string[])[0]).toBe("Kinder ernten selbst")
    expect("tags" in aenderung).toBe(false)
    // Nach dem Speichern zeigt die Seite das Gespeicherte, das Formular ist zu.
    expect(knopf("Speichern")).toBeUndefined()
    expect(document.body.textContent).toContain("Kinder ernten selbst")
  })

  it("Schlagworte im Kopf gehen an den Eintrag", async () => {
    const speichern = vi.fn(async () => ({}))
    zeigen(<ProjektProfilVoll profil={projektProfil(projektDaten, ["garten"])} offen onOffen={() => {}}
      bearbeitung={{ daten: projektDaten, eintrag: { tags: ["garten"] }, speichern }} />)
    klicken("Profil bearbeiten")
    klicken("Kopf bearbeiten")
    klicken("garten entfernen")
    await act(async () => { knopf("Speichern")!.click() })
    const [aenderung] = speichern.mock.calls[0] as unknown as [{ data: Record<string, unknown>; tags: string[] }]
    expect(aenderung.tags).not.toContain("garten")
    expect("tags" in aenderung.data).toBe(false)
  })

  it("schnelles Zweitspeichern schreibt keine Schlagworte in data (Kimi, 03.10.2026)", async () => {
    const speichern = vi.fn(async () => ({}))
    // Die App meldet die neuen Daten hier nie zurück: genau das Zeitfenster vor der Rückmeldung.
    zeigen(<ProjektProfilVoll profil={projektProfil(projektDaten, ["garten"])} offen onOffen={() => {}}
      bearbeitung={{ daten: projektDaten, eintrag: { tags: ["garten"] }, speichern }} />)
    klicken("Profil bearbeiten")
    klicken("Kopf bearbeiten")
    await act(async () => { knopf("Speichern")!.click() })
    klicken("Was fehlt bearbeiten")
    await act(async () => { knopf("Speichern")!.click() })
    const [, zweite] = speichern.mock.calls as unknown as [unknown, [{ data: Record<string, unknown> }]]
    expect("tags" in zweite[0].data).toBe(false)
    expect(zweite[0].data.fremd).toEqual({ bleibt: true })
  })

  it("Abbrechen verwirft die Arbeit", () => {
    const speichern = vi.fn(async () => ({}))
    zeigen(<ProjektProfilVoll profil={projektProfil(projektDaten, [])} offen onOffen={() => {}}
      bearbeitung={{ daten: projektDaten, speichern }} />)
    klicken("Profil bearbeiten")
    klicken("Was fehlt bearbeiten")
    tippen(document.querySelector<HTMLTextAreaElement>("#feld-beduerfnis")!, "Etwas ganz anderes")
    klicken("Abbrechen")
    expect(speichern).not.toHaveBeenCalled()
    expect(document.body.textContent).not.toContain("Etwas ganz anderes")
  })

  it("ein Fehler beim Speichern bleibt sichtbar, das Formular offen", async () => {
    const speichern = vi.fn(async () => { throw new Error("Kein Netz") })
    zeigen(<ProjektProfilVoll profil={projektProfil(projektDaten, [])} offen onOffen={() => {}}
      bearbeitung={{ daten: projektDaten, speichern }} />)
    klicken("Profil bearbeiten")
    klicken("Was fehlt bearbeiten")
    await act(async () => { knopf("Speichern")!.click() })
    expect(document.querySelector('[role="alert"]')?.textContent).toContain("Kein Netz")
    expect(knopf("Speichern")).toBeDefined()
  })
})

describe("Stiftungsprofil bearbeiten", () => {
  const stiftung = { title: "Kleine Stiftung", foerdererart: "Stiftung", quelle: "Recherche 2026", website: "https://kleine.de", eigenes: 7 }

  it("ja, nein, keine Angabe; die Quelle und Unbekanntes bleiben", async () => {
    const speichern = vi.fn(async () => ({}))
    zeigen(<StiftungsProfilVoll profil={stiftungsProfil(stiftung)} offen onOffen={() => {}} bearbeitung={{ daten: stiftung, speichern }} />)
    klicken("Profil bearbeiten")
    // Ein leerer Abschnitt erscheint zum Ergänzen.
    klicken("Du willst selbst beitragen? ergänzen")
    const zustiftung = document.querySelector("#feld-zustiftung")!
    act(() => [...zustiftung.querySelectorAll("button")].find((b) => b.textContent === "nein")!.click())
    expect(document.body.textContent).toContain("Zustiftung möglich")
    await act(async () => { knopf("Speichern")!.click() })
    const [aenderung] = speichern.mock.calls[0] as unknown as [{ data: Record<string, unknown> }]
    expect(aenderung.data).toEqual({ ...stiftung, zustiftung: false })
  })

  it("sagt am Feld, was die Schleuse weglassen würde", () => {
    zeigen(<StiftungsProfilVoll profil={stiftungsProfil(stiftung)} offen onOffen={() => {}} bearbeitung={{ daten: stiftung, speichern: async () => ({}) }} />)
    klicken("Profil bearbeiten")
    klicken("Kontakt bearbeiten")
    tippen(document.querySelector<HTMLInputElement>("#feld-website")!, "javascript:alert(1)")
    expect(document.body.textContent).toContain("ist keine sichere Adresse und wird weggelassen")
  })
})

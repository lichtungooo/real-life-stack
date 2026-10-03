// @vitest-environment jsdom
/**
 * Spenden eines Space (DEFINITION Teil 8, „Nächster Träger: Space und
 * Netzwerk“): Adresse und Ziel im Abschnitt eintragen, geprüft über
 * `patchData` gespeichert, Vorschau als Widget; ohne Recht nur lesen.
 */
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { OcEinstellungen } from "@trustdonation/ui/opencollective"

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const wurzeln: Root[] = []
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
    name: "real-life", titel: "Real Life", waehrung: "EUR", eingegangen: 1200, unterstuetzende: 14,
    ausgaben: [], eingaenge: [], stand: "2026-10-03T12:00:00Z",
  }), { status: 200 })))
})
afterEach(() => { act(() => { wurzeln.forEach((w) => w.unmount()) }); wurzeln.length = 0; document.body.innerHTML = ""; vi.unstubAllGlobals() })

function zeigen(knoten: React.ReactNode) {
  const ort = document.createElement("div")
  document.body.appendChild(ort)
  const w = createRoot(ort)
  wurzeln.push(w)
  act(() => w.render(knoten))
}
function tippen(el: HTMLInputElement, wert: string) {
  const setzen = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value")!.set!
  act(() => { setzen.call(el, wert); el.dispatchEvent(new Event("input", { bubbles: true })) })
}
const feld = (text: string) => [...document.querySelectorAll("label")].find((l) => l.textContent?.startsWith(text))!.querySelector("input")!
const knopf = (name: string) => [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === name)

describe("Abschnitt Spenden", () => {
  it("speichert Adresse und Ziel geprüft", async () => {
    const onSpeichern = vi.fn(async () => {})
    zeigen(<OcEinstellungen adresse={null} ziel={null} darfAendern onSpeichern={onSpeichern} />)
    tippen(feld("Seite bei Open Collective"), "opencollective.com/Real-Life/donate")
    tippen(feld("Ziel in Euro"), "5.000")
    await act(async () => knopf("Speichern")!.click())
    expect(onSpeichern).toHaveBeenCalledWith({ opencollective: "https://opencollective.com/real-life", spendenziel: 5000 })
    expect(document.body.textContent).toContain("Gespeichert")
  })

  it("eine fremde Adresse speichert nicht und sagt, warum", async () => {
    const onSpeichern = vi.fn()
    zeigen(<OcEinstellungen adresse={null} ziel={null} darfAendern onSpeichern={onSpeichern} />)
    tippen(feld("Seite bei Open Collective"), "https://example.org/spenden")
    await act(async () => knopf("Speichern")!.click())
    expect(onSpeichern).not.toHaveBeenCalled()
    expect(document.querySelector("[role=alert]")?.textContent).toContain("Open Collective")
  })

  it("ohne Recht nur lesen, mit Vorschau aus dem Dienst", async () => {
    await act(async () => { zeigen(<OcEinstellungen adresse="https://opencollective.com/real-life" ziel={5000} darfAendern={false} onSpeichern={() => {}} />) })
    await act(async () => { await new Promise((r) => setTimeout(r, 0)) })
    expect(knopf("Speichern")).toBeUndefined()
    expect(feld("Seite bei Open Collective").disabled).toBe(true)
    expect(document.body.textContent).toContain("Ändern kann, wer den Space verwaltet")
    expect(document.body.textContent).toContain("1.200")
  })
})

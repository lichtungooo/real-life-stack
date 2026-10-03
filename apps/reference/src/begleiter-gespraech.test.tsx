// @vitest-environment jsdom
/**
 * Reinsprechen im Begleiter (DEFINITION 13.9): Das Mikrofon startet das
 * Diktat, fertige Abschnitte landen im Text, der Text geht mit Auftrag an
 * den eigenen Agenten. Die Fläche kennt keinen Dienst.
 */
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"
import { BegleiterGespraech, auftragFuerAgent, type Diktat } from "@trustdonation/ui/begleiter"

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const wurzeln: Root[] = []
afterEach(() => { act(() => { wurzeln.forEach((w) => w.unmount()) }); wurzeln.length = 0; document.body.innerHTML = ""; vi.unstubAllGlobals() })
function zeigen(knoten: React.ReactNode) {
  const ort = document.createElement("div")
  document.body.appendChild(ort)
  const w = createRoot(ort)
  wurzeln.push(w)
  act(() => w.render(knoten))
  return w
}
const knopf = (name: string) => [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === name || b.getAttribute("aria-label") === name)

function diktat(teil: Partial<Diktat> = {}): Diktat {
  return { zustand: "aus", live: "", fehler: null, starten: vi.fn(), stoppen: vi.fn(), ...teil }
}

describe("Begleiter: Reinsprechen", () => {
  it("Mikrofon startet das Diktat, fertige Abschnitte landen im Text", () => {
    const d = diktat()
    zeigen(<BegleiterGespraech diktat={d} />)
    act(() => knopf("Reinsprechen")!.click())
    expect(d.starten).toHaveBeenCalledTimes(1)
    const fertig = (d.starten as ReturnType<typeof vi.fn>).mock.calls[0][0] as (t: string) => void
    act(() => { fertig("Wir sind die Radwerkstatt Nord.") })
    act(() => { fertig("Uns fehlt Werkzeug.") })
    expect((document.querySelector("textarea") as HTMLTextAreaElement).value).toBe("Wir sind die Radwerkstatt Nord. Uns fehlt Werkzeug.")
  })

  it("während es hört: Live-Text sichtbar, der Knopf stoppt", () => {
    const d = diktat({ zustand: "hoert", live: "wir reparieren" })
    zeigen(<BegleiterGespraech diktat={d} />)
    expect(document.body.textContent).toContain("wir reparieren")
    act(() => knopf("Mikrofon aus")!.click())
    expect(d.stoppen).toHaveBeenCalled()
  })

  it("gibt den Text mit Auftrag an den Agenten (kopiert, wo nicht geteilt wird)", async () => {
    const schreiben = vi.fn(async () => {})
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText: schreiben }, share: undefined })
    zeigen(<BegleiterGespraech diktat={diktat()} />)
    const feld = document.querySelector("textarea") as HTMLTextAreaElement
    const setzen = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!
    act(() => { setzen.call(feld, "Wir sind der Verein X."); feld.dispatchEvent(new Event("input", { bubbles: true })) })
    await act(async () => knopf("An meinen Agenten geben")!.click())
    expect(schreiben).toHaveBeenCalledWith(auftragFuerAgent("Wir sind der Verein X."))
    expect(auftragFuerAgent("x")).toMatch(/trustdonation\.org\/mcp/)
    expect(document.body.textContent).toContain("Kopiert")
  })

  it("schließt das Mikrofon, wenn die Fläche geht", () => {
    const d = diktat()
    const w = zeigen(<BegleiterGespraech diktat={d} />)
    act(() => w.unmount())
    wurzeln.length = 0
    expect(d.stoppen).toHaveBeenCalled()
  })
})

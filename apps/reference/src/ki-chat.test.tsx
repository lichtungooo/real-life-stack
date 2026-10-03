// @vitest-environment jsdom
/**
 * Das KI-Modul (DEFINITION 13.10): Man schreibt, sieht die Arbeitsschritte,
 * die Antwort läuft ein, am Ende steht die Karte mit dem fertigen Profil.
 * Ohne Zugangswort ist das Senden gesperrt.
 */
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { KiEreignis, KiNachricht } from "@trustdonation/core"
import { KiChat } from "@trustdonation/ui/ki"
import type { Diktat } from "@trustdonation/ui/begleiter"

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
const diktat = (): Diktat => ({ zustand: "aus", live: "", fehler: null, starten: vi.fn(), stoppen: vi.fn() })
function tippen(text: string) {
  const feld = document.querySelector("textarea") as HTMLTextAreaElement
  const setzen = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!
  act(() => { setzen.call(feld, text); feld.dispatchEvent(new Event("input", { bubbles: true })) })
}

describe("KI-Chat", () => {
  it("schreiben, Schritte sehen, Antwort, fertiges Profil öffnen", async () => {
    const gesehen: KiNachricht[][] = []
    const senden = async function* (verlauf: KiNachricht[]): AsyncGenerator<KiEreignis> {
      gesehen.push(verlauf)
      yield { typ: "schritt", werkzeug: "profil_art_klaeren", titel: "Klärt, welche Art Profil entsteht" }
      yield { typ: "text", text: "Ich habe **euer Profil** gebaut:\n- Kassel\n- seit 2019" }
      yield { typ: "entwurf", fragment: "einrichtung-entwurf=abc" }
      yield { typ: "fertig" }
    }
    const onEntwurf = vi.fn()
    zeigen(<KiChat senden={senden} diktat={diktat()} onEntwurf={onEntwurf} />)
    expect(document.body.textContent).toContain("Erzähl, wer ihr seid")
    tippen("Wir sind die Radwerkstatt Nord.")
    await act(async () => knopf("Senden")!.click())
    expect(gesehen[0]).toEqual([{ rolle: "mensch", text: "Wir sind die Radwerkstatt Nord." }])
    expect(document.body.textContent).toContain("Klärt, welche Art Profil entsteht")
    expect(document.querySelector("strong")?.textContent).toBe("euer Profil")
    expect([...document.querySelectorAll("li")].map((l) => l.textContent)).toEqual(expect.arrayContaining(["Kassel", "seit 2019"]))
    act(() => knopf("Vorschau ansehen und speichern")!.click())
    expect(onEntwurf).toHaveBeenCalledWith("einrichtung-entwurf=abc")
  })

  it("die zweite Nachricht bringt den Verlauf mit", async () => {
    const gesehen: KiNachricht[][] = []
    const senden = async function* (verlauf: KiNachricht[]): AsyncGenerator<KiEreignis> {
      gesehen.push(verlauf)
      yield { typ: "text", text: "Wie heißt ihr?" }
      yield { typ: "fertig" }
    }
    zeigen(<KiChat senden={senden} diktat={diktat()} onEntwurf={() => {}} />)
    tippen("Hallo")
    await act(async () => knopf("Senden")!.click())
    tippen("Radwerkstatt Nord")
    await act(async () => knopf("Senden")!.click())
    expect(gesehen[1]).toEqual([{ rolle: "mensch", text: "Hallo" }, { rolle: "ki", text: "Wie heißt ihr?" }, { rolle: "mensch", text: "Radwerkstatt Nord" }])
  })

  it("ein Fehler steht im Chat; gesperrt ohne Zugangswort", async () => {
    const senden = async function* (): AsyncGenerator<KiEreignis> { yield { typ: "fehler", text: "Das Zugangswort fehlt." } }
    zeigen(<KiChat senden={senden} diktat={diktat()} onEntwurf={() => {}} />)
    tippen("x")
    await act(async () => knopf("Senden")!.click())
    expect(document.body.textContent).toContain("Das Zugangswort fehlt.")
    act(() => { wurzeln.forEach((w) => w.unmount()) }); wurzeln.length = 0; document.body.innerHTML = ""
    zeigen(<KiChat senden={senden} diktat={diktat()} onEntwurf={() => {}} gesperrt hinweis={<p>Zugangswort fehlt</p>} />)
    expect((document.querySelector("textarea") as HTMLTextAreaElement).disabled).toBe(true)
    expect(document.body.textContent).toContain("Zugangswort fehlt")
  })
})

// @vitest-environment jsdom
/**
 * Das Profil eines Menschen (DEFINITION 9.1): Stufe je Angabe wählen, ehrlich
 * sehen, wer es heute sieht, „So sehen mich andere“ zeigt nur Öffentliches.
 * Der erste Stand löscht kein heute veröffentlichtes „Über mich“.
 */
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"
import { MUSTER_PERSON, oeffentlichesProfil } from "@trustdonation/core"
import { PersonProfilVoll } from "@trustdonation/ui/person-profil"
import { ersterStand } from "./views/mein-profil"

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
const knopf = (name: string, im: ParentNode = document) => [...im.querySelectorAll("button")].find((b) => b.textContent?.trim() === name || b.getAttribute("aria-label") === name)

describe("Profil eines Menschen", () => {
  it("Stufe wählen und ehrlich sehen, wer es heute sieht", async () => {
    const onSichtbarkeit = vi.fn(async () => {})
    zeigen(<PersonProfilVoll daten={{ ...MUSTER_PERSON, telefon: "0561 123" }} offen onOffen={() => {}} onSichtbarkeit={onSichtbarkeit} did="did:key:z6Mk" profilLink="https://x.org/?profile=1" />)
    const tafel = document.querySelector('[aria-label="Wer sieht was"]')!
    expect(tafel.textContent).toContain("Über mich")
    expect(tafel.textContent).toContain("Sieht heute: alle, auch ohne Anmeldung")
    const kann = tafel.querySelector('[aria-label="Wer sieht „Was ich kann“"]')!
    expect(kann.parentElement!.textContent).toContain("der Profil-Server trägt heute nur Name, Über mich und Bild")
    await act(async () => knopf("Nur ich", kann)!.click())
    expect(onSichtbarkeit).toHaveBeenCalledWith("kann", "privat")
    const telefon = tafel.querySelector('[aria-label="Wer sieht „Telefon“"]')!
    expect((knopf("Öffentlich", telefon) as HTMLButtonElement).disabled).toBe(true)
    expect(document.body.textContent).toContain("Deine Identität")
  })

  it("„So sehen mich andere“ zeigt nur, was öffentlich ist", () => {
    zeigen(<PersonProfilVoll daten={MUSTER_PERSON} offen onOffen={() => {}} onSichtbarkeit={async () => {}} />)
    expect(document.body.textContent).toContain("Werkzeugspenden")
    act(() => [...document.querySelectorAll('[role="radio"]')].find((r) => r.textContent === "So sehen mich andere")!.dispatchEvent(new MouseEvent("click", { bubbles: true })))
    expect(document.body.textContent).not.toContain("Werkzeugspenden")
    expect(document.body.textContent).toContain("Holzbau")
    expect(document.querySelector('[aria-label="Wer sieht was"]')).toBeNull()
  })

  it("der erste Stand übernimmt, was heute schon öffentlich ist", () => {
    const d = ersterStand({ id: "did:key:a", displayName: "Timo", avatarUrl: "https://x.org/t.png" }, "Ich baue Netzwerke.")
    expect(oeffentlichesProfil(d)).toEqual({ name: "Timo", bio: "Ich baue Netzwerke.", avatar: "https://x.org/t.png" })
  })
})

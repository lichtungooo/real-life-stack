// @vitest-environment jsdom
/**
 * Profile aus dem Gespräch (DEFINITION 13.8): Der Link öffnet für jede Art
 * Vorschau und Prüfbericht; gespeichert wird erst auf den Klick, mit der Art.
 */
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"
import { profilEntwurfKodieren } from "@trustdonation/core"
import { ProfilEntwurfDialog } from "@trustdonation/ui/projekt-entwurf"

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver

const wurzeln: Root[] = []
afterEach(() => { act(() => { wurzeln.forEach((w) => w.unmount()) }); wurzeln.length = 0; document.body.innerHTML = "" })
function zeigen(knoten: React.ReactNode) {
  const ort = document.createElement("div")
  document.body.appendChild(ort)
  const w = createRoot(ort)
  wurzeln.push(w)
  act(() => w.render(knoten))
}
const knopf = (name: string) => [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === name)

describe("Profil aus dem Entwurf", () => {
  it("Stiftung: Vorschau, Komponente einschalten, anlegen mit der Art", async () => {
    const onAnlegen = vi.fn(async () => ({ weiter: () => {} }))
    const fragment = "#" + profilEntwurfKodieren("stiftung", { daten: { title: "Stiftung Grünes Tal", foerdererart: "Stiftung", kurz: "Fördert Naturschutz mit Kindern." }, tags: [] })
    const spaces = vi.fn(() => [{ id: "s1", name: "Förderer", profilAktiv: false }])
    zeigen(<ProfilEntwurfDialog fragment={fragment} spaces={spaces} onAnlegen={onAnlegen} onSchliessen={() => {}} />)
    expect(spaces).toHaveBeenCalledWith("stiftung")
    expect(document.body.textContent).toContain("Stiftungsprofil aus deinem Entwurf")
    expect(document.body.textContent).toContain("Fördert Naturschutz mit Kindern.")
    expect(document.body.textContent).toContain("Das Stiftungsprofil in diesem Space einschalten")
    await act(async () => knopf("Stiftung anlegen")!.click())
    expect(onAnlegen).toHaveBeenCalledWith("s1", expect.objectContaining({ daten: expect.objectContaining({ title: "Stiftung Grünes Tal" }) }), true, "stiftung")
  })

  it("Einrichtung: Profil im Space, ohne Komponente, mit Hinweis auf die Verwaltung", async () => {
    const onAnlegen = vi.fn(async () => ({ weiter: () => {} }))
    const fragment = "#" + profilEntwurfKodieren("einrichtung", { daten: { kind: "projekt", kurz: "Wir reparieren Fahrräder mit Jugendlichen.", beduerfnis: "Im Viertel fehlt ein Ort zum Schrauben." }, tags: [] })
    zeigen(<ProfilEntwurfDialog fragment={fragment} spaces={[{ id: "v1", name: "Radwerkstatt", profilAktiv: true, hatProfil: true }]} onAnlegen={onAnlegen} onSchliessen={() => {}} />)
    expect(document.body.textContent).toContain("Profil eurer Einrichtung aus deinem Entwurf")
    expect(document.body.textContent).toContain("Speichern kann, wer den Space verwaltet.")
    expect(document.body.textContent).toContain("ersetzt das Bisherige")
    expect(document.body.textContent).not.toContain("einschalten")
    await act(async () => knopf("Profil im Space speichern")!.click())
    expect(onAnlegen).toHaveBeenCalledWith("v1", expect.objectContaining({ daten: expect.objectContaining({ kind: "projekt" }) }), false, "einrichtung")
  })

  it("ein Fehler beim Speichern steht im Dialog", async () => {
    const fragment = "#" + profilEntwurfKodieren("einrichtung", { daten: { kurz: "k", beduerfnis: "b" }, tags: [] })
    zeigen(<ProfilEntwurfDialog fragment={fragment} spaces={[{ id: "v1", name: "R", profilAktiv: true }]}
      onAnlegen={async () => { throw new Error("Speichern kann, wer diesen Space verwaltet.") }} onSchliessen={() => {}} />)
    await act(async () => knopf("Profil im Space speichern")!.click())
    expect(document.body.textContent).toContain("Speichern kann, wer diesen Space verwaltet.")
  })
})

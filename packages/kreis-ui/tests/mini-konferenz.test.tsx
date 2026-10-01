// @vitest-environment jsdom
/**
 * Die Konferenz im Kleinen (Anton, 01.10.2026): Wer in ein anderes Modul
 * geht, sieht die Runde weiter in einem kleinen Fenster und kommt mit einem
 * Klick zurueck.
 */
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"
import { lokalerKreisRaum, type KreisTeilnehmer } from "@kreis/core"
import { KreisRaumProvider } from "../src/raum-kontext"
import { VideoRaumFlaeche } from "../src/video/video-raum-flaeche"
import { MiniKonferenz, miniWahl } from "../src/video/mini-konferenz"

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const wurzeln: Root[] = []
afterEach(() => { act(() => { wurzeln.forEach((w) => w.unmount()) }); wurzeln.length = 0; document.body.innerHTML = "" })

const t = (id: string, mehr: Partial<KreisTeilnehmer> = {}): KreisTeilnehmer =>
  ({ id, name: id, ichSelbst: false, spricht: false, mikroAn: true, kameraAn: false, ...mehr })

describe("Wen das kleine Bild zeigt", () => {
  it("wer spricht, nicht ich; ein Sprecher bleibt zwei Sekunden stehen; geteilter Bildschirm geht vor", () => {
    const ich = t("ich", { ichSelbst: true, spricht: true })
    let w = miniWahl([ich, t("anna", { spricht: true }), t("bert")], null, null, 0)
    expect(w?.id).toBe("anna")
    // Bert faengt an, Anna ist noch keine zwei Sekunden her: Anna bleibt.
    w = miniWahl([ich, t("anna"), t("bert", { spricht: true })], w, null, 1000)
    expect(w?.id).toBe("anna")
    w = miniWahl([ich, t("anna"), t("bert", { spricht: true })], w, null, 2500)
    expect(w?.id).toBe("bert")
    w = miniWahl([ich, t("anna", { teiltBildschirm: true }), t("bert", { spricht: true })], w, null, 2600)
    expect(w?.id).toBe("anna")
  })

  it("allein im Raum zeigt es mich", () => {
    expect(miniWahl([t("ich", { ichSelbst: true })], null, null, 0)?.id).toBe("ich")
  })
})

describe("Das kleine Fenster", () => {
  it("erscheint in der Runde, fuehrt zurueck in die Gruppe und geht mit", async () => {
    const GRUPPE = "4f1c2a9e-7b3d-4e21-9a55-0c6d8e2f1b77"
    const zurueck = vi.fn()
    const huelle = document.createElement("div")
    document.body.appendChild(huelle)
    const w = createRoot(huelle)
    wurzeln.push(w)
    const kanal = (() => { const enden = new Set<{ onmessage: unknown }>(); return () => { const e = { onmessage: null, postMessage() {}, close() { enden.delete(e) } }; enden.add(e); return e } })()
    act(() => {
      w.render(
        <KreisRaumProvider fabrik={() => lokalerKreisRaum({ kanal: kanal as never, id: "a-anna" })} kennung="k-anna">
          <VideoRaumFlaeche raumId={GRUPPE} raumName="Garten" vorschlagName="Anna" />
          <MiniKonferenz onZurueck={zurueck} />
        </KreisRaumProvider>,
      )
    })
    expect(document.querySelector('[aria-label="Laufende Konferenz"]')).toBeNull()
    await act(async () => { huelle.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })) })

    const fenster = document.querySelector('[aria-label="Laufende Konferenz"]')
    expect(fenster).not.toBeNull()
    expect(fenster?.textContent).toContain("Garten")
    await act(async () => { (document.querySelector('[aria-label="Zurück zur Runde"]') as HTMLButtonElement).click() })
    expect(zurueck).toHaveBeenCalledWith(GRUPPE)

    await act(async () => { (document.querySelector('[aria-label="Konferenz verlassen"]') as HTMLButtonElement).click() })
    expect(document.querySelector('[aria-label="Laufende Konferenz"]')).toBeNull()
  })
})

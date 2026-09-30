// @vitest-environment jsdom
/**
 * Das Textdokument als ganz normales Item (Anton, 30.09.2026): Die Flaeche
 * bekommt den Inhalt, zeigt die Vorschau und meldet Aenderungen; das Anlegen
 * macht daraus einen Beitrag. Der Editor ist hier eine Attrappe (CodeMirror
 * braucht mehr Browser, als jsdom bietet).
 */
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"
import { TextDokument, TextdokumentAnlegen } from "../src/video/textdokument"

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.mock("../src/video/textdokument-editor", () => ({
  default: ({ inhalt, onAendern }: { inhalt: string; onAendern: (s: string) => void }) => (
    <div>
      <span>Editor: {inhalt.length} Zeichen</span>
      <button type="button" onClick={() => onAendern(inhalt + "\n- Kartoffeln")}>tippen</button>
    </div>
  ),
}))

const wurzeln: Root[] = []
afterEach(() => { act(() => { wurzeln.forEach((w) => w.unmount()) }); wurzeln.length = 0; document.body.innerHTML = "" })

async function zeigen(el: React.ReactElement) {
  const huelle = document.createElement("div")
  document.body.appendChild(huelle)
  const w = createRoot(huelle)
  wurzeln.push(w)
  await act(async () => { w.render(el) })
  await act(async () => { await new Promise((r) => setTimeout(r, 0)) })
  return huelle
}

describe("Textdokument", () => {
  it("zeigt die Vorschau des Inhalts und meldet Aenderungen", async () => {
    const aendern = vi.fn()
    const h = await zeigen(<TextDokument inhalt={"# Ernte\n\nText"} gruppe="Garten" onAendern={aendern} />)
    expect(h.querySelector('article[aria-label="Vorschau"] h1')?.textContent).toBe("Ernte")
    expect(h.textContent).toContain("Liegt als Beitrag im Space")
    await act(async () => { [...h.querySelectorAll("button")].find((b) => b.textContent === "tippen")!.click() })
    expect(aendern).toHaveBeenCalledWith("# Ernte\n\nText\n- Kartoffeln")
  })

  it("das Anlegen schlaegt einen Titel vor und legt an", async () => {
    const anlegen = vi.fn(async () => {})
    const h = await zeigen(<TextdokumentAnlegen gruppe="Garten" onAnlegen={anlegen} />)
    expect((h.querySelector('input[aria-label="Titel des Dokuments"]') as HTMLInputElement).value).toContain("Mitschrift Garten")
    await act(async () => { h.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })) })
    expect(anlegen).toHaveBeenCalledWith(expect.stringContaining("Mitschrift Garten"))
  })
})

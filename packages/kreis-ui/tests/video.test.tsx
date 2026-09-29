// @vitest-environment jsdom
/**
 * Das Video und der Kreis teilen einen Raum (Spec video, "Ein Raum, zwei
 * Sichten"). Anna sitzt im Kreis, Bert in der Konferenz; der Stab, den Anna
 * nimmt, steht in Berts Kopfzeile. Chat und Hand gehen durch. Ein fremdes
 * Modul oeffnet sich in der Konferenz, ohne dass das Video es beim Namen kennt.
 */
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it } from "vitest"
import { lokalerKreisRaum } from "@kreis/core"
import { KreisRaumProvider } from "../src/raum-kontext"
import { KreisRaumFlaeche } from "../src/kreis-raum-flaeche"
import { VideoRaumFlaeche } from "../src/video/video-raum-flaeche"

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function kanalNetz() {
  const enden = new Map<string, Set<{ onmessage: ((e: { data: unknown }) => void) | null }>>()
  return (name: string) => {
    const ende = {
      onmessage: null as ((e: { data: unknown }) => void) | null,
      postMessage(n: unknown) {
        const kopie = structuredClone(n)
        for (const anderes of enden.get(name) ?? []) if (anderes !== ende) anderes.onmessage?.({ data: kopie })
      },
      close() { enden.get(name)?.delete(ende) },
    }
    if (!enden.has(name)) enden.set(name, new Set())
    enden.get(name)!.add(ende)
    return ende
  }
}

const wurzeln: Root[] = []
afterEach(() => {
  act(() => { wurzeln.forEach((w) => w.unmount()) })
  wurzeln.length = 0
  document.body.innerHTML = ""
})

function mensch(kanal: ReturnType<typeof kanalNetz>, id: string, name: string, flaeche: "kreis" | "video") {
  const huelle = document.createElement("div")
  document.body.appendChild(huelle)
  const wurzel = createRoot(huelle)
  wurzeln.push(wurzel)
  const fabrik = () => lokalerKreisRaum({ kanal, id })
  act(() => {
    wurzel.render(
      <KreisRaumProvider fabrik={fabrik}>
        {flaeche === "kreis"
          ? <KreisRaumFlaeche raumName="Lichtung" vorschlagName={name} />
          : <VideoRaumFlaeche
              raumName="Lichtung"
              vorschlagName={name}
              module={[{ id: "kanban", label: "Kanban" }]}
              modulZeigen={(m) => <p>Fläche von {m}</p>}
            />}
      </KreisRaumProvider>,
    )
  })
  const text = () => huelle.textContent ?? ""
  const klick = async (beschriftung: string | RegExp) => {
    const b = [...huelle.querySelectorAll("button")].find((x) =>
      typeof beschriftung === "string" ? x.textContent?.includes(beschriftung) : beschriftung.test(x.textContent ?? ""))
    if (!b) throw new Error(`Kein Knopf "${beschriftung}" bei ${name}: ${text()}`)
    await act(async () => { b.click() })
  }
  const betreten = async () => {
    await act(async () => { huelle.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })) })
  }
  return { huelle, text, klick, betreten }
}

describe("Video und Kreis, ein Raum", () => {
  it("der Vorraum nennt die Konferenz", () => {
    const bert = mensch(kanalNetz(), "b", "Bert", "video")
    expect(bert.text()).toContain("Konferenz")
    expect(bert.text()).toContain("Der Konferenz beitreten")
  })

  it("den Stab aus dem Kreis sieht die Konferenz, die Klangschale aus der Konferenz der Kreis", async () => {
    const kanal = kanalNetz()
    const anna = mensch(kanal, "a-anna", "Anna", "kreis")
    const bert = mensch(kanal, "b-bert", "Bert", "video")
    await anna.betreten()
    await bert.betreten()
    expect(bert.text()).toContain("2 Menschen")

    await anna.klick("Den Stab nehmen")
    expect(bert.text()).toContain("Anna hält den Stab")

    await bert.klick("Schale")
    expect(anna.text()).toContain("Stille")
    expect(bert.text()).toContain("Stille")
  })

  it("links stehen Menschen und Chat; Chat und Hand gehen durch", async () => {
    const kanal = kanalNetz()
    const anna = mensch(kanal, "a-anna", "Anna", "video")
    const bert = mensch(kanal, "b-bert", "Bert", "video")
    await anna.betreten()
    await bert.betreten()
    expect(bert.text()).toContain("Menschen · 2")

    const feld = anna.huelle.querySelector("textarea")!
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!
      setter.call(feld, "Schön, dass ihr da seid")
      feld.dispatchEvent(new Event("input", { bubbles: true }))
    })
    const senden = anna.huelle.querySelector('button[aria-label="Senden"]') as HTMLButtonElement
    await act(async () => { senden.click() })
    expect(bert.text()).toContain("Schön, dass ihr da seid")

    await anna.klick(/^Hand/)
    expect(bert.huelle.querySelector('[aria-label="Hand oben"]')).not.toBeNull()

    // Chat zu, Chat auf
    await act(async () => { (bert.huelle.querySelector('button[title="Chat auf und zu"]') as HTMLButtonElement).click() })
    expect(bert.huelle.querySelector("textarea")).toBeNull()
    await bert.klick(/^Menschen/)
    expect(bert.huelle.querySelector("textarea")).not.toBeNull()
  })

  it("was einer in die Mitte legt, liegt dort fuer alle: Tafel und fremdes Modul", async () => {
    const kanal = kanalNetz()
    const anna = mensch(kanal, "a-anna", "Anna", "video")
    const bert = mensch(kanal, "b-bert", "Bert", "video")
    await anna.betreten()
    await bert.betreten()

    await anna.klick(/^Mitte/)
    await anna.klick("Tafel")
    expect(bert.text()).toContain("liegt in der Mitte, für alle")
    expect(bert.huelle.querySelector('canvas[aria-label="Tafel zum Zeichnen"]')).not.toBeNull()

    await bert.klick(/^Mitte/)
    await bert.klick("Kanban")
    expect(anna.text()).toContain("Fläche von kanban")

    await anna.klick("zurück zu den Menschen")
    expect(bert.text()).not.toContain("Fläche von kanban")
  })
})

// @vitest-environment jsdom
/**
 * Der Durchgang: zwei Menschen betreten denselben Kreis und handeln. Anna
 * nimmt den Stab, Bert sieht es. Bert schlaegt die Klangschale, der Stab
 * kehrt in die Mitte, und beide sehen die Stille. Anna waehlt einen Prozess,
 * und Bert sieht denselben Schritt.
 *
 * Zwei React-Wurzeln in einem Dokument, verbunden ueber einen Kanal im
 * Speicher: genau so, wie zwei Fenster ueber BroadcastChannel sprechen.
 */
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it } from "vitest"
import { lokalerKreisRaum } from "@kreis/core"
import { KreisRaumFlaeche } from "../src/kreis-raum-flaeche"

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function kanalNetz() {
  const enden = new Map<string, Set<{ onmessage: ((e: { data: unknown }) => void) | null }>>()
  return (name: string) => {
    const ende = {
      onmessage: null as ((e: { data: unknown }) => void) | null,
      postMessage(n: unknown) {
        const kopie = structuredClone(n)
        for (const anderes of enden.get(name) ?? []) {
          if (anderes !== ende) anderes.onmessage?.({ data: kopie })
        }
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

function mensch(kanal: ReturnType<typeof kanalNetz>, id: string, name: string) {
  const huelle = document.createElement("div")
  document.body.appendChild(huelle)
  const wurzel = createRoot(huelle)
  wurzeln.push(wurzel)
  const fabrik = () => lokalerKreisRaum({ kanal, id })
  act(() => { wurzel.render(<KreisRaumFlaeche fabrik={fabrik} raumName="Kollektiv Lichtung" vorschlagName={name} />) })
  const text = () => huelle.textContent ?? ""
  const knopf = (beschriftung: string | RegExp) => {
    const alle = [...huelle.querySelectorAll("button")]
    const treffer = alle.find((b) =>
      typeof beschriftung === "string" ? b.textContent?.includes(beschriftung) : beschriftung.test(b.textContent ?? ""),
    )
    if (!treffer) throw new Error(`Kein Knopf "${beschriftung}" bei ${name}. Da steht: ${text()}`)
    return treffer
  }
  const klick = async (beschriftung: string | RegExp) => {
    await act(async () => { knopf(beschriftung).click() })
  }
  const betreten = async () => {
    await act(async () => {
      huelle.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
    })
  }
  return { huelle, text, klick, betreten }
}

describe("Der Kreis, zwei Menschen", () => {
  it("Vorraum, Betreten, Stab, Klangschale, Prozess: beide sehen dasselbe", async () => {
    const kanal = kanalNetz()
    const anna = mensch(kanal, "a-anna", "Anna")
    const bert = mensch(kanal, "b-bert", "Bert")

    // Draussen: der Vorraum nennt den Raum und sagt, dass es ein Probe-Raum ist.
    expect(anna.text()).toContain("Kollektiv Lichtung")
    expect(anna.text()).toContain("Probe-Raum")

    await anna.betreten()
    await bert.betreten()
    expect(anna.text()).toContain("2 Menschen im Kreis")
    expect(bert.text()).toContain("Anna")
    expect(bert.text()).toContain("Bert (ich)")

    // Anna nimmt den Stab, Bert sieht es und kann ihn nicht nehmen.
    await anna.klick("Den Stab nehmen")
    expect(anna.text()).toContain("Du hältst den Stab")
    expect(bert.text()).toContain("Anna hält den Stab")
    expect(bert.text()).not.toContain("Den Stab nehmen")

    // Bert schlaegt die Schale: Der Stab kehrt in die Mitte, beide sind still.
    await bert.klick("Klangschale")
    expect(anna.text()).toContain("Stille")
    expect(bert.text()).toContain("Stille")
    expect(anna.text()).not.toContain("Du hältst den Stab")

    // Anna waehlt den Wir-Prozess, Bert sieht denselben Schritt.
    await anna.klick(/^Wir-Prozess/)
    expect(anna.text()).toContain("Ankommen")
    expect(bert.text()).toContain("Wir-Prozess")
    expect(bert.text()).toContain("Schritt 1 von 4")

    // Bert geht weiter, Anna folgt.
    await bert.klick("nächster Schritt")
    expect(anna.text()).toContain("Die Empfehlungen")
    expect(anna.text()).toContain("Schritt 2 von 4")

    // Die 18 Empfehlungen haengen im Raum.
    expect(anna.huelle.querySelectorAll("details li")).toHaveLength(18)
  })

  it("wer spaeter kommt, bekommt den laufenden Stand", async () => {
    const kanal = kanalNetz()
    const anna = mensch(kanal, "a-anna", "Anna")
    await anna.betreten()
    await anna.klick(/^Klärungskreis/)
    await anna.klick("nächster Schritt")

    const cara = mensch(kanal, "c-cara", "Cara")
    await cara.betreten()
    expect(cara.text()).toContain("Klärungskreis")
    expect(cara.text()).toContain("Die Haltung einladen")
  })

  it("wer geht, kommt wieder in den Vorraum", async () => {
    const kanal = kanalNetz()
    const anna = mensch(kanal, "a-anna", "Anna")
    const bert = mensch(kanal, "b-bert", "Bert")
    await anna.betreten()
    await bert.betreten()
    await bert.klick("gehen")
    expect(bert.text()).toContain("Den Kreis betreten")
    expect(anna.text()).toContain("1 Mensch im Kreis")
  })
})

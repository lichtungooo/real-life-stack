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
  const aria = async (label: string) => {
    const b = huelle.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement | null
    if (!b) throw new Error(`Kein Knopf [${label}] bei ${name}: ${text()}`)
    await act(async () => { b.click() })
  }
  return { huelle, text, klick, betreten, aria }
}

describe("Die Konferenz nach Big Blue Button", () => {
  it("der Vorraum nennt die Konferenz", () => {
    const bert = mensch(kanalNetz(), "b", "Bert", "video")
    expect(bert.text()).toContain("Konferenz")
    expect(bert.text()).toContain("Der Konferenz beitreten")
  })

  it("links stehen Nachrichten, Notizen und Teilnehmer; ohne Tool zeigt die Mitte alle", async () => {
    const kanal = kanalNetz()
    const anna = mensch(kanal, "a-anna", "Anna", "video")
    const bert = mensch(kanal, "b-bert", "Bert", "video")
    await anna.betreten()
    await bert.betreten()
    expect(bert.text()).toContain("Gemeinsamer Chat")
    expect(bert.text()).toContain("Teilnehmer (2)")
    expect(bert.text()).not.toContain("liegt in der Mitte")
  })

  it("der Kreis ist ein Tool im Modul: ueber + in die Mitte, mit Prozess, fuer alle", async () => {
    const kanal = kanalNetz()
    const anna = mensch(kanal, "a-anna", "Anna", "video")
    const bert = mensch(kanal, "b-bert", "Bert", "video")
    await anna.betreten()
    await bert.betreten()

    await anna.aria("Aktionen")
    await anna.klick(/Wir-Prozess$/)
    expect(bert.text()).toContain("Kreis · Wir-Prozess")
    expect(bert.text()).toContain("liegt in der Mitte, für alle")

    await anna.klick("Den Stab nehmen")
    expect(bert.text()).toContain("Anna hält den Stab")

    await bert.aria("Die Klangschale schlagen: Stille für alle")
    expect(anna.text()).toContain("Stille")

    await bert.klick("Alle zeigen")
    expect(anna.text()).not.toContain("liegt in der Mitte")
  })

  it("Chat klappt als Spalte auf und zu; Chat und Hand gehen durch", async () => {
    const kanal = kanalNetz()
    const anna = mensch(kanal, "a-anna", "Anna", "video")
    const bert = mensch(kanal, "b-bert", "Bert", "video")
    await anna.betreten()
    await bert.betreten()

    await anna.klick("Gemeinsamer Chat")
    const feld = anna.huelle.querySelector("textarea")!
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!
      setter.call(feld, "Schön, dass ihr da seid")
      feld.dispatchEvent(new Event("input", { bubbles: true }))
    })
    await anna.aria("Senden")
    await anna.aria("Spalte schließen")
    expect(anna.huelle.querySelector("textarea")).toBeNull()

    await bert.klick("Gemeinsamer Chat")
    expect(bert.text()).toContain("Schön, dass ihr da seid")

    await anna.aria("Hand heben oder senken")
    expect(bert.huelle.querySelector('[aria-label="Hand oben"]')).not.toBeNull()
  })

  it("Tafel und fremdes Modul liegen fuer alle in der Mitte", async () => {
    const kanal = kanalNetz()
    const anna = mensch(kanal, "a-anna", "Anna", "video")
    const bert = mensch(kanal, "b-bert", "Bert", "video")
    await anna.betreten()
    await bert.betreten()

    await anna.aria("Aktionen")
    await anna.klick("Tafel")
    expect(bert.huelle.querySelector('canvas[aria-label="Tafel zum Zeichnen"]')).not.toBeNull()

    await bert.aria("Aktionen")
    await bert.klick("Kanban")
    expect(anna.text()).toContain("Fläche von kanban")
  })
})

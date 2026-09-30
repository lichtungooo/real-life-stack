// @vitest-environment jsdom
/**
 * Die Einstellungen wie in Big Blue Button (Timo, 30.09.2026): Anwendung,
 * Benachrichtigungen, Datensparmodus gelten nur fuer mich und liegen im
 * Browser; die Regeln des Raums gelten fuer alle.
 */
import { act, type ReactElement } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"
import { lokalerKreisRaum, type KreisRaum, type KreisTeilnehmer } from "@kreis/core"
import { KreisRaumProvider } from "../src/raum-kontext"
import { VideoRaumFlaeche } from "../src/video/video-raum-flaeche"
import { VideoKachel } from "../src/video/video-kachel"
import { VORGABEN, vorliebenLesen, vorliebenSetzen, vorliebenZuruecksetzen } from "../src/vorlieben"

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
  vorliebenZuruecksetzen()
})

function zeigen(inhalt: ReactElement) {
  const huelle = document.createElement("div")
  document.body.appendChild(huelle)
  const wurzel = createRoot(huelle)
  wurzeln.push(wurzel)
  act(() => { wurzel.render(inhalt) })
  const text = () => huelle.textContent ?? ""
  const klick = async (beschriftung: string) => {
    const b = [...huelle.querySelectorAll("button")].find((x) => x.textContent?.includes(beschriftung) || x.getAttribute("aria-label") === beschriftung)
    if (!b) throw new Error(`Kein Knopf "${beschriftung}": ${text()}`)
    await act(async () => { b.click() })
  }
  return { huelle, text, klick }
}

function konferenz(kanal: ReturnType<typeof kanalNetz>, id: string, name: string) {
  const m = zeigen(
    <KreisRaumProvider fabrik={() => lokalerKreisRaum({ kanal, id })}>
      <VideoRaumFlaeche raumName="Garten" vorschlagName={name} />
    </KreisRaumProvider>,
  )
  const betreten = async () => {
    await act(async () => { m.huelle.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })) })
  }
  return { ...m, betreten }
}

describe("Gespeicherte Vorlieben", () => {
  it("füllen Lücken mit den Vorgaben und verwerfen Unlesbares", () => {
    expect(vorliebenLesen(null)).toEqual(VORGABEN)
    expect(vorliebenLesen("kein json")).toEqual(VORGABEN)
    const v = vorliebenLesen(JSON.stringify({ pushToTalk: false, schrift: 77, hinweise: { chat: { ton: true, popup: true } } }))
    expect(v.pushToTalk).toBe(false)
    expect(v.schrift).toBe(100)
    expect(v.hinweise.chat).toEqual({ ton: true, popup: true })
    expect(v.hinweise.hand).toEqual(VORGABEN.hinweise.hand)
  })
})

describe("Der Dialog Einstellungen", () => {
  it("hat vier Reiter wie Big Blue Button und speichert, was ich wähle", async () => {
    const anna = konferenz(kanalNetz(), "a-anna", "Anna")
    await anna.betreten()
    await anna.klick("Mehr")
    await anna.klick("Einstellungen")
    for (const r of ["Anwendung", "Benachrichtigungen", "Datensparmodus", "Regeln des Raums"]) expect(anna.text()).toContain(r)

    await anna.klick("Push-to-Talk")
    await anna.klick("Speichern")
    expect(JSON.parse(localStorage.getItem("kreis-vorlieben") ?? "{}").pushToTalk).toBe(false)
    expect(anna.text()).not.toContain("Leertaste halten zum Sprechen")
  })
})

describe("Benachrichtigungen", () => {
  it("wer die Hand hebt, erscheint als Einblendung (Vorgabe an)", async () => {
    const kanal = kanalNetz()
    const anna = konferenz(kanal, "a-anna", "Anna")
    const bert = konferenz(kanal, "b-bert", "Bert")
    await anna.betreten()
    await bert.betreten()
    await bert.klick("Hand heben oder senken")
    expect(anna.text()).toContain("Bert hebt die Hand")
  })

  it("Beitritt nur, wenn eingeschaltet", async () => {
    const kanal = kanalNetz()
    vorliebenSetzen({ ...VORGABEN, hinweise: { ...VORGABEN.hinweise, beitritt: { ton: false, popup: true } } })
    const anna = konferenz(kanal, "a-anna", "Anna")
    await anna.betreten()
    const bert = konferenz(kanal, "b-bert", "Bert")
    await bert.betreten()
    expect(anna.text()).toContain("Bert ist dazugekommen")
  })
})

describe("Datensparmodus und Audiofilter", () => {
  const person = (ichSelbst: boolean): KreisTeilnehmer => ({ id: ichSelbst ? "ich" : "du", name: "X", ichSelbst, mikroAn: true, kameraAn: true, spricht: false })
  const raum = (bild = vi.fn(() => () => {})) => ({ traegtMedien: true, bildAnhaengen: bild } as unknown as KreisRaum)

  it("die Kameras der anderen bleiben aus, die eigene nicht", () => {
    vorliebenSetzen({ ...VORGABEN, kamerasAnderer: false })
    const bild = vi.fn(() => () => {})
    zeigen(<VideoKachel person={person(false)} raum={raum(bild)} />)
    expect(bild).not.toHaveBeenCalled()
    zeigen(<VideoKachel person={person(true)} raum={raum(bild)} />)
    expect(bild).toHaveBeenCalledTimes(1)
  })

  it("der Audiofilter geht an den Raum", async () => {
    vorliebenSetzen({ ...VORGABEN, audiofilter: false })
    const filter = vi.fn(async () => {})
    const kanal = kanalNetz()
    const m = zeigen(
      <KreisRaumProvider fabrik={() => Object.assign(lokalerKreisRaum({ kanal, id: "a" }), { mikroFilter: filter })}>
        <VideoRaumFlaeche raumName="Garten" vorschlagName="Anna" />
      </KreisRaumProvider>,
    )
    await act(async () => { m.huelle.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })) })
    expect(filter).toHaveBeenCalledWith(false)
  })
})

describe("Layouts wie in Big Blue Button", () => {
  it("vier Ansichten; Video im Zentrum zeigt das Tool klein, ein Klick holt es gross zurueck", async () => {
    const anna = konferenz(kanalNetz(), "a-anna", "Anna")
    await anna.betreten()
    await anna.klick("Aktionen")
    await anna.klick("Umfrage")
    await anna.klick("Mehr")
    await anna.klick("Layout")
    for (const n of ["Bilder oben", "Bilder rechts", "Präsentation im Zentrum", "Video im Zentrum"]) expect(anna.text()).toContain(n)
    await anna.klick("Video im Zentrum")
    await anna.klick("Übernehmen")
    expect(anna.text()).toContain("groß zeigen")
    expect(JSON.parse(localStorage.getItem("kreis-vorlieben") ?? "{}").layout).toBe("video")
    await anna.klick("groß zeigen")
    expect(anna.text()).not.toContain("groß zeigen")
  })
})

describe("Tagesordnung, Aufgaben und Beschluesse", () => {
  const tippen = async (feld: HTMLInputElement | HTMLTextAreaElement, text: string) => {
    await act(async () => {
      const proto = feld instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
      Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(feld, text)
      feld.dispatchEvent(new Event("input", { bubbles: true }))
    })
  }

  it("ein Punkt kommt bei allen an, laeuft oben mit; Aufgaben werden festgehalten und abgelegt", async () => {
    const kanal = kanalNetz()
    const ablegen = vi.fn(async () => {})
    const m = (id: string, name: string) => {
      const x = zeigen(
        <KreisRaumProvider fabrik={() => lokalerKreisRaum({ kanal, id })}>
          <VideoRaumFlaeche raumName="Garten" vorschlagName={name} ergebnisAblegen={ablegen} />
        </KreisRaumProvider>,
      )
      return { ...x, betreten: async () => { await act(async () => { x.huelle.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })) }) } }
    }
    const anna = m("a-anna", "Anna")
    const bert = m("b-bert", "Bert")
    await anna.betreten()
    await bert.betreten()

    await anna.klick("Tagesordnung")
    await tippen(anna.huelle.querySelector('input[aria-label="Neuer Punkt"]') as HTMLInputElement, "Ernte planen")
    await act(async () => { (anna.huelle.querySelector('input[aria-label="Neuer Punkt"]') as HTMLInputElement).form!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })) })
    await anna.klick("Ernte planen aufrufen")
    expect(bert.text()).toContain("TOP: Ernte planen")

    await anna.klick("Aufgaben und Beschlüsse")
    await tippen(anna.huelle.querySelector('textarea[aria-label="Was festhalten"]') as HTMLTextAreaElement, "Saatgut bestellen")
    await tippen(anna.huelle.querySelector('input[aria-label="Wer übernimmt"]') as HTMLInputElement, "Bert")
    await anna.klick("Festhalten und ins Kanban")
    expect(ablegen).toHaveBeenCalledTimes(1)
    expect(ablegen).toHaveBeenCalledWith(expect.objectContaining({ art: "aufgabe", text: "Saatgut bestellen", wer: "Bert", von: "Anna" }))

    await bert.klick("Aufgaben und Beschlüsse")
    expect(bert.text()).toContain("Saatgut bestellen")
    expect(bert.text()).toContain("übernimmt Bert")
    // Nur wer festhaelt, legt ab: Bert legt nichts doppelt an.
    expect(ablegen).toHaveBeenCalledTimes(1)
  })
})

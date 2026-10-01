// @vitest-environment jsdom
/**
 * Die Mitschrift (Spec video, "Mitschrift"). Timo, 01.10.2026: "da steht der
 * Name drin … und auch die Zeiten … wie lang". Jeder schreibt sein eigenes
 * Mikrofon mit; die Zeile reist mit Name, Beginn und Ende zu allen.
 *
 * Der Schneider laeuft echt. Die Aufnahme (Mikrofon, Worklet, Dienst) ist
 * hier eine Attrappe, die der Test von aussen fuehrt.
 */
import { act, type ReactElement } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"
import { lokalerKreisRaum } from "@kreis/core"
import type { MitschriftOptionen } from "../src/mitschrift-aufnahme"

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const aufnahmen: { o: MitschriftOptionen; gestoppt: boolean }[] = []
vi.mock("../src/mitschrift-aufnahme", async (echt) => {
  const original = await echt<typeof import("../src/mitschrift-aufnahme")>()
  class Attrappe {
    eintrag: { o: MitschriftOptionen; gestoppt: boolean }
    constructor(o: MitschriftOptionen) { this.eintrag = { o, gestoppt: false }; aufnahmen.push(this.eintrag) }
    async starten() { this.eintrag.o.hoerer.verbunden(true) }
    stoppen() { this.eintrag.gestoppt = true }
  }
  return { ...original, MitschriftAufnahme: Attrappe }
})

const { AbschnittSchneider, alsInt16 } = await import("../src/mitschrift-aufnahme")
const { KreisRaumProvider } = await import("../src/raum-kontext")
const { VideoRaumFlaeche } = await import("../src/video/video-raum-flaeche")

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
  aufnahmen.length = 0
  document.body.innerHTML = ""
})

function mensch(kanal: ReturnType<typeof kanalNetz>, id: string, name: string, inhalt: ReactElement) {
  const huelle = document.createElement("div")
  document.body.appendChild(huelle)
  const wurzel = createRoot(huelle)
  wurzeln.push(wurzel)
  // Der lokale Raum, dazu ein Mitschrift-Zugang wie beim LiveKit-Raum.
  const fabrik = () => ({ ...lokalerKreisRaum({ kanal, id }), mitschriftZugang: () => ({ url: "wss://test/mitschrift", token: "t" }) })
  act(() => { wurzel.render(<KreisRaumProvider fabrik={fabrik} kennung={`kennung-${id}`}>{inhalt}</KreisRaumProvider>) })
  const text = () => huelle.textContent ?? ""
  const knopf = (beschriftung: string) => [...huelle.querySelectorAll("button")].find((b) => b.textContent?.includes(beschriftung) || b.getAttribute("aria-label") === beschriftung)
  const klick = async (beschriftung: string) => {
    const b = knopf(beschriftung)
    if (!b) throw new Error(`Kein Knopf "${beschriftung}": ${text()}`)
    await act(async () => { b.click() })
  }
  const betreten = async () => {
    const feld = huelle.querySelector("#kreis-name") as HTMLInputElement | null
    if (feld) await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(feld, name)
      feld.dispatchEvent(new Event("input", { bubbles: true }))
    })
    await act(async () => { huelle.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })) })
  }
  return { huelle, text, knopf, klick, betreten }
}

const GRUPPE = "4f1c2a9e-7b3d-4e21-9a55-0c6d8e2f1b77"
const flaeche = (name: string) => <VideoRaumFlaeche raumId={GRUPPE} raumName="Garten" vorschlagName={name} />

describe("Der Schneider macht aus Bloecken Abschnitte", () => {
  it("ein Satz wird ein Abschnitt mit Beginn, Ende und Ton, samt Vorlauf", () => {
    const fertig: { id: string; beginn: number; ende: number; laenge: number }[] = []
    const s = new AbschnittSchneider((id, beginn, ende, ton) => fertig.push({ id, beginn, ende, laenge: ton.length }))
    const block = (w: number) => new Float32Array(2048).fill(w)
    let t = 1_000_000
    for (let i = 0; i < 10; i++) s.block(block(0.001), 0.001, (t += 128))
    for (let i = 0; i < 20; i++) s.block(block(0.1), 0.1, (t += 128))
    for (let i = 0; i < 10; i++) s.block(block(0.001), 0.001, (t += 128))
    expect(fertig).toHaveLength(1)
    expect(fertig[0].ende - fertig[0].beginn).toBe(20 * 128)
    // Der Ton reicht etwas vor den Beginn (Vorlauf), damit kein Anlaut fehlt.
    expect(fertig[0].laenge).toBeGreaterThan(20 * 2048)
  })

  it("Int16 fuer die Leitung: Grenzen bleiben heil", () => {
    expect([...alsInt16([new Float32Array([0, 1, -1, 2, -2])])]).toEqual([0, 32767, -32768, 32767, -32768])
  })
})

describe("Die Mitschrift in der Konferenz", () => {
  it("Anna laesst sich mitschreiben: Bert sieht ihre Zeile mit Name, Uhrzeit und Dauer, und die Redezeit", async () => {
    const kanal = kanalNetz()
    const anna = mensch(kanal, "a-anna", "Anna", flaeche("Anna"))
    const bert = mensch(kanal, "b-bert", "Bert", flaeche("Bert"))
    await anna.betreten()
    await bert.betreten()

    await anna.klick("Protokoll")
    expect(anna.text()).toContain("unserem eigenen Server")
    await anna.klick("Mich mitschreiben lassen")
    expect(aufnahmen).toHaveLength(1)
    expect(aufnahmen[0].o.url).toBe("wss://test/mitschrift")

    // Bert sieht an Anna, dass sie mitgeschrieben wird.
    expect(bert.huelle.querySelector('[aria-label="wird mitgeschrieben"]')).not.toBeNull()

    const beginn = new Date(2026, 9, 1, 10, 0, 5).getTime()
    const h = aufnahmen[0].o.hoerer
    await act(async () => { h.abschnitt("m-1", beginn, beginn + 23_000) })
    await bert.klick("Protokoll")
    expect(bert.text()).toContain("…")
    await act(async () => { h.text("m-1", "Wir pflanzen im April.") })

    expect(bert.text()).toContain("Anna")
    expect(bert.text()).toContain("Wir pflanzen im April.")
    expect(bert.text()).toContain("10:00:05")
    expect(bert.text()).toContain("0:23")
    expect(bert.text()).not.toContain("…")

    await bert.klick("Redezeit")
    const liste = bert.huelle.querySelector('[aria-label="Redezeit"]')
    expect(liste?.textContent).toContain("Anna")
    expect(liste?.textContent).toContain("0:23")

    // Nichts erkannt: die vorlaeufige Zeile verschwindet wieder.
    await act(async () => { h.abschnitt("m-2", beginn + 30_000, beginn + 31_000) })
    await act(async () => { h.text("m-2", "") })
    expect(bert.huelle.textContent?.match(/…/g) ?? []).toHaveLength(0)

    await anna.klick("Ich werde mitgeschrieben, anhalten")
    expect(aufnahmen[0].gestoppt).toBe(true)
    expect(bert.huelle.querySelector('[aria-label="wird mitgeschrieben"]')).toBeNull()
  })

  it("Anna bittet alle; Bert sagt ja und schreibt sein eigenes Mikrofon mit", async () => {
    const kanal = kanalNetz()
    const anna = mensch(kanal, "a-anna", "Anna", flaeche("Anna"))
    const bert = mensch(kanal, "b-bert", "Bert", flaeche("Bert"))
    await anna.betreten()
    await bert.betreten()
    await anna.klick("Protokoll")
    await anna.klick("Mich mitschreiben lassen")
    await anna.klick("Alle bitten, sich mitschreiben zu lassen")

    const dialog = bert.huelle.querySelector('[aria-label="Bitte um Mitschrift"]')
    expect(dialog?.textContent).toContain("Anna bittet")
    await bert.klick("Mich mitschreiben lassen")
    expect(aufnahmen).toHaveLength(2)
    expect(bert.huelle.querySelector('[aria-label="Bitte um Mitschrift"]')).toBeNull()
    // Annas Liste zeigt jetzt beide.
    expect(anna.text()).toMatch(/Mitgeschrieben: .*Anna.*Bert|Mitgeschrieben: .*Bert.*Anna/)
  })
})

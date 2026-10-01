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
const { VORGABEN, vorliebenSetzen } = await import("../src/vorlieben")

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
  /** Spielt Pegel durch den Schneider und schreibt mit, was er meldet. */
  function schneiden(folge: [number, number][]) {
    const log: string[] = []
    let bloecke = 0
    const ende: { beginn: number; ende: number; behalten: boolean }[] = []
    const s = new AbschnittSchneider({
      beginn: (id, _w, vorlauf) => { log.push(`beginn ${id}`); bloecke += vorlauf.length },
      block: () => { bloecke++ },
      ende: (id, beginn, e, behalten) => { log.push(`ende ${id}`); ende.push({ beginn, ende: e, behalten }) },
    })
    let t = 1_000_000
    for (const [n, w] of folge) for (let i = 0; i < n; i++) s.block(new Float32Array(2048).fill(w), w, (t += 128))
    return { log, bloecke, ende }
  }

  it("ein Satz: Beginn sofort, dann jeder Block live, das Ende nach zwei Sekunden Stille, samt Vorlauf", () => {
    const { log, bloecke, ende } = schneiden([[10, 0.001], [20, 0.1], [20, 0.001]])
    expect(log).toEqual(["beginn a-1", "ende a-1"])
    expect(ende[0].ende - ende[0].beginn).toBe(20 * 128)
    // Der Ton reicht etwas vor den Beginn (Vorlauf), damit kein Anlaut fehlt.
    expect(bloecke).toBeGreaterThan(20)
  })

  it("eine Pause von einer Sekunde bleibt ein Abschnitt", () => {
    const { log } = schneiden([[15, 0.1], [8, 0.001], [15, 0.1], [20, 0.001]])
    expect(log).toEqual(["beginn a-1", "ende a-1"])
  })

  it("Int16 fuer die Leitung: Grenzen bleiben heil", () => {
    expect([...alsInt16([new Float32Array([0, 1, -1, 2, -2])])]).toEqual([0, 32767, -32768, 32767, -32768])
  })
})

describe("Die Mitschrift in der Konferenz: ein Hebel fuer alle, jeder kann sich ausnehmen", () => {
  it("Anna legt den Hebel um: beide werden mitgeschrieben, Bert sieht den Hinweis und Annas Zeile mit Name, Uhrzeit, Dauer", async () => {
    const kanal = kanalNetz()
    const anna = mensch(kanal, "a-anna", "Anna", flaeche("Anna"))
    const bert = mensch(kanal, "b-bert", "Bert", flaeche("Bert"))
    await anna.betreten()
    await bert.betreten()

    await anna.klick("Protokoll")
    expect(anna.text()).toContain("Fragt in der Runde")
    expect(aufnahmen).toHaveLength(0)
    await anna.klick("Mitschrift für alle starten")

    // Jedes Geraet schreibt sein eigenes Mikrofon mit.
    expect(aufnahmen).toHaveLength(2)
    expect(aufnahmen[0].o.url).toBe("wss://test/mitschrift")
    expect(bert.huelle.querySelector('[aria-label="Mitschrift läuft"]')).not.toBeNull()
    expect(bert.huelle.querySelector('[role="dialog"][aria-label="Mitschrift läuft"]')?.textContent).toContain("Anna hat die Mitschrift für alle eingeschaltet")
    expect(bert.huelle.querySelectorAll('[aria-label="wird mitgeschrieben"]')).toHaveLength(2)

    const annas = aufnahmen[0].o.hoerer
    const beginn = new Date(2026, 9, 1, 10, 0, 5).getTime()
    await act(async () => { annas.beginn("m-1", beginn) })
    await bert.klick("Verstanden")
    await bert.klick("Protokoll")
    expect(bert.text()).toContain("…")
    // Der Text waechst, waehrend Anna spricht.
    await act(async () => { annas.live("m-1", "Wir pflanzen", "im") })
    // Gebremst auf alle 0,6 s; die neueste Fassung kommt nach.
    await act(async () => { await new Promise((r) => setTimeout(r, 700)) })
    expect(bert.text()).toContain("Wir pflanzen im")
    await act(async () => { annas.fertig("m-1", "Wir pflanzen im April.", beginn, beginn + 23_000, true) })
    expect(bert.text()).toContain("Wir pflanzen im April.")
    expect(bert.text()).toContain("10:00:05")
    expect(bert.text()).toContain("0:23")
    expect(bert.text()).not.toContain("…")

    await bert.klick("Redezeit")
    const liste = bert.huelle.querySelector('[aria-label="Redezeit"]')
    expect(liste?.textContent).toContain("Anna")
    expect(liste?.textContent).toContain("0:23")

    // Nach einer Pause spricht Anna weiter: dieselbe Zeile waechst, die Redezeit zaehlt nur das Gesprochene.
    await act(async () => { annas.beginn("m-2", beginn + 26_000) })
    await act(async () => { annas.fertig("m-2", "Und Bohnen im Mai.", beginn + 26_000, beginn + 30_000, true) })
    expect(bert.text()).toContain("Wir pflanzen im April. Und Bohnen im Mai.")
    expect(bert.text()).toContain("0:27")

    // Bert spricht dazwischen; danach beginnt Anna eine neue Zeile.
    const berts = aufnahmen[1].o.hoerer
    await act(async () => { berts.beginn("m-1", beginn + 32_000) })
    await act(async () => { berts.fertig("m-1", "Gute Idee.", beginn + 32_000, beginn + 33_000, true) })
    await act(async () => { annas.beginn("m-3", beginn + 35_000) })
    await act(async () => { annas.fertig("m-3", "Dann machen wir das so.", beginn + 35_000, beginn + 37_000, true) })
    const zeilen = [...bert.huelle.querySelectorAll("p")].map((p) => p.textContent).filter((t) => t && /pflanzen|Idee|machen/.test(t))
    expect(zeilen).toEqual(["Wir pflanzen im April. Und Bohnen im Mai.", "Gute Idee.", "Dann machen wir das so."])

    // Nichts erkannt (Huesteln): die vorlaeufige Zeile verschwindet wieder.
    await act(async () => { annas.beginn("m-4", beginn + 60_000) })
    await act(async () => { annas.fertig("m-4", "", beginn + 60_000, beginn + 60_300, false) })
    expect(bert.huelle.textContent?.match(/…/g) ?? []).toHaveLength(0)

    // Anna beendet fuer alle: jede Aufnahme stoppt.
    await anna.klick("Mitschrift für alle beenden")
    expect(aufnahmen.every((a) => a.gestoppt)).toBe(true)
    expect(bert.huelle.querySelector('[aria-label="wird mitgeschrieben"]')).toBeNull()
  })

  it("Bert nimmt sich aus und wieder auf; Anna sieht es an seinem Namen", async () => {
    const kanal = kanalNetz()
    const anna = mensch(kanal, "a-anna", "Anna", flaeche("Anna"))
    const bert = mensch(kanal, "b-bert", "Bert", flaeche("Bert"))
    await anna.betreten()
    await bert.betreten()
    await anna.klick("Protokoll")
    await anna.klick("Mitschrift für alle starten")
    expect(aufnahmen).toHaveLength(2)

    await bert.klick("Mich ausnehmen")
    expect(aufnahmen.filter((a) => a.gestoppt)).toHaveLength(1)
    expect(anna.huelle.querySelectorAll('[aria-label="wird mitgeschrieben"]')).toHaveLength(1)
    expect(bert.huelle.querySelector('[aria-label="Mitschrift läuft"]')?.textContent).toContain("ohne dich")

    await bert.klick("Protokoll")
    await bert.klick("Mich wieder mitschreiben")
    expect(aufnahmen).toHaveLength(3)
    expect(anna.huelle.querySelectorAll('[aria-label="wird mitgeschrieben"]')).toHaveLength(2)
  })

  it("wer in den Einstellungen \"Mich nie mitschreiben\" gewaehlt hat, bleibt draussen", async () => {
    vorliebenSetzen({ ...VORGABEN, nieMitschreiben: true })
    try {
      const kanal = kanalNetz()
      const anna = mensch(kanal, "a-anna", "Anna", flaeche("Anna"))
      await anna.betreten()
      await anna.klick("Protokoll")
      await anna.klick("Mitschrift für alle starten")
      expect(aufnahmen).toHaveLength(0)
      expect(anna.text()).toContain("in deinen Einstellungen")
    } finally {
      vorliebenSetzen(VORGABEN)
    }
  })
})

describe("Ein Wort zur Zeit (Timo, 01.10.2026: erst sprechen, wenn der andere freigegeben hat)", () => {
  it("Anna schaltet es ein; Bert nimmt das Wort; Anna wartet, bis er es freigibt", async () => {
    const kanal = kanalNetz()
    const anna = mensch(kanal, "a-anna", "Anna", flaeche("Anna"))
    const bert = mensch(kanal, "b-bert", "Bert", flaeche("Bert"))
    await anna.betreten()
    await bert.betreten()

    const aria = async (m: typeof anna, label: string) => {
      const b = m.huelle.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement
      await act(async () => { b.click() })
    }
    await aria(anna, "Moderation")
    await anna.klick("Ein Wort zur Zeit: erst sprechen")
    expect(bert.huelle.querySelector('[aria-label="Ein Wort zur Zeit"]')?.textContent).toContain("Das Wort ist frei")

    await bert.klick("Wort nehmen")
    expect(anna.huelle.querySelector('[aria-label="Ein Wort zur Zeit"]')?.textContent).toContain("Bert hat das Wort")
    const annasKnopf = anna.knopf("Wort nehmen") as HTMLButtonElement
    expect(annasKnopf.disabled).toBe(true)

    await bert.klick("Wort abgeben")
    expect(anna.huelle.querySelector('[aria-label="Ein Wort zur Zeit"]')?.textContent).toContain("Das Wort ist frei")
    expect((anna.knopf("Wort nehmen") as HTMLButtonElement).disabled).toBe(false)
  })
})

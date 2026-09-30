// @vitest-environment jsdom
/**
 * Das Video und der Kreis teilen einen Raum (Spec video, "Ein Raum, zwei
 * Sichten"). Anna sitzt im Kreis, Bert in der Konferenz; der Stab, den Anna
 * nimmt, steht in Berts Kopfzeile. Chat und Hand gehen durch. Ein fremdes
 * Modul oeffnet sich in der Konferenz, ohne dass das Video es beim Namen kennt.
 */
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"
import { lokalerKreisRaum } from "@kreis/core"
import { KreisRaumProvider } from "../src/raum-kontext"
import { KreisRaumFlaeche } from "../src/kreis-raum-flaeche"
import { VideoRaumFlaeche } from "../src/video/video-raum-flaeche"

// Excalidraw braucht eine echte Zeichenflaeche. Im Test steht an ihrer Stelle
// eine Attrappe mit denselben Anschluessen: Sie zeigt, wie viele Elemente sie
// hat, und kann selbst eines zeichnen.
vi.mock("../src/video/zeichenpad-flaeche", () => ({
  default: ({ elemente, onAenderung, nurLesen, hintergrund }: { elemente: readonly unknown[]; onAenderung: (e: unknown[]) => void; nurLesen: boolean; hintergrund?: { id: string } | null }) => (
    <div>
      <span>Elemente: {elemente.length}</span>
      <span>Hintergrund: {hintergrund?.id ?? "keiner"}</span>
      <span>{nurLesen ? "nur ansehen" : "zeichnen erlaubt"}</span>
      <button type="button" onClick={() => onAenderung([{ id: `strich-${elemente.length}`, version: 1, versionNonce: 1 }])}>Strich ziehen</button>
    </div>
  ),
}))
// pdf.js braucht einen echten Browser; die Attrappe kennt drei Seiten.
vi.mock("../src/video/pdf-seiten", () => ({
  seitenZahl: async () => 3,
  seiteAlsBild: async (datei: string, _b: Uint8Array, seite: number) => ({ id: `folie-${datei}:${seite}`, dataURL: "data:", breite: 10, hoehe: 10 }),
}))

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

const tippe = async (el: HTMLInputElement | HTMLTextAreaElement, text: string) => {
  await act(async () => {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(el, text)
    el.dispatchEvent(new Event("input", { bubbles: true }))
  })
}

describe("Die Werkzeuge der Konferenz", () => {
  it("Umfrage: fuer alle in der Mitte, gleichzeitige Stimmen zaehlen beide, Nachzuegler sieht den Stand", async () => {
    const kanal = kanalNetz()
    const anna = mensch(kanal, "a-anna", "Anna", "video")
    const bert = mensch(kanal, "b-bert", "Bert", "video")
    await anna.betreten()
    await bert.betreten()

    await anna.aria("Aktionen")
    await anna.klick("Umfrage")
    await tippe(anna.huelle.querySelector("#umfrage-frage") as HTMLInputElement, "Treffen wir uns am Montag?")
    await anna.klick("Schnell: Ja · Nein · Enthaltung")
    expect(bert.text()).toContain("Treffen wir uns am Montag?")

    await anna.klick(/^Ja/)
    await bert.klick(/^Ja/)
    expect(anna.text()).toContain("2 Stimmen")
    expect(bert.text()).toContain("2 Stimmen")

    const cara = mensch(kanal, "c-cara", "Cara", "video")
    await cara.betreten()
    expect(cara.text()).toContain("Treffen wir uns am Montag?")
    expect(cara.text()).toContain("2 Stimmen")

    await bert.klick("Umfrage beenden")
    expect(anna.text()).toContain("beendet")
  })

  it("Geteilte Notizen: was Anna schreibt, liest Bert", async () => {
    const kanal = kanalNetz()
    const anna = mensch(kanal, "a-anna", "Anna", "video")
    const bert = mensch(kanal, "b-bert", "Bert", "video")
    await anna.betreten()
    await bert.betreten()

    await anna.klick("Geteilte Notizen")
    const feld = anna.huelle.querySelector("#geteilte-notizen") as HTMLTextAreaElement
    await tippe(feld, "1. Ankommen, 2. Kreis")
    await act(async () => { feld.dispatchEvent(new FocusEvent("focusout", { bubbles: true })) })

    await bert.klick("Geteilte Notizen")
    expect((bert.huelle.querySelector("#geteilte-notizen") as HTMLTextAreaElement).value).toContain("1. Ankommen")
    expect(bert.text()).toContain("zuletzt von Anna")
  })

  it("Los und Kurzzeitwecker erscheinen bei allen", async () => {
    const kanal = kanalNetz()
    const anna = mensch(kanal, "a-anna", "Anna", "video")
    const bert = mensch(kanal, "b-bert", "Bert", "video")
    await anna.betreten()
    await bert.betreten()

    await anna.aria("Aktionen")
    await anna.klick("Zufällig jemanden wählen")
    expect(bert.text()).toMatch(/Das Los fällt auf (Anna|Bert)/)

    await anna.aria("Aktionen")
    const wecker = [...anna.huelle.querySelectorAll("details")].find((d) => d.querySelector("summary")?.textContent?.includes("Kurzzeitwecker"))!
    await act(async () => { [...wecker.querySelectorAll("button")].find((x) => x.textContent === "5 Min.")!.click() })
    expect(bert.huelle.querySelector('button[aria-label="Kurzzeitwecker aus"]')).not.toBeNull()
    await bert.aria("Kurzzeitwecker aus")
    expect(anna.huelle.querySelector('button[aria-label="Kurzzeitwecker aus"]')).toBeNull()
  })
})

describe("Redezeit mit Gong", () => {
  afterEach(() => { vi.useRealTimers() })

  it("in den Einstellungen fuer alle festgelegt; ist sie um, geht der Stab von selbst an den Naechsten", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false })
    vi.setSystemTime(new Date("2026-09-30T10:00:00Z"))
    const kanal = kanalNetz()
    const anna = mensch(kanal, "a-anna", "Anna", "video")
    const bert = mensch(kanal, "b-bert", "Bert", "video")
    await anna.betreten()
    await bert.betreten()

    await anna.aria("Mehr")
    await anna.klick("Einstellungen")
    await anna.klick("Regeln des Raums")
    await anna.klick("1 Min.")
    await act(async () => { (anna.huelle.querySelectorAll('[role="dialog"] input[name^="danach"]')[0] as HTMLInputElement).click() })
    await anna.klick("Für alle übernehmen")

    await anna.klick("Wort nehmen")
    expect(bert.text()).toContain("Anna hält den Stab")
    expect(bert.text()).toContain("noch 1:00")

    await act(async () => {
      vi.setSystemTime(new Date("2026-09-30T10:01:01Z"))
      vi.advanceTimersByTime(1000)
    })
    expect(anna.text()).toContain("Bert hält den Stab")
    expect(bert.text()).toContain("Wort abgeben")
  })
})

describe("Stille und Dauer des Treffens", () => {
  afterEach(() => { vi.useRealTimers() })

  const wahl = async (m: ReturnType<typeof mensch>, legende: string, stufe: string) => {
    const feld = [...m.huelle.querySelectorAll("fieldset")].find((f) => f.querySelector("legend")?.textContent === legende)
    const b = [...(feld?.querySelectorAll("button") ?? [])].find((x) => x.textContent === stufe)
    if (!b) throw new Error(`Keine Stufe ${stufe} unter ${legende}`)
    await act(async () => { b.click() })
  }

  it("die Stille nach der Klangschale laesst sich einstellen", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false })
    vi.setSystemTime(new Date("2026-09-30T10:00:00Z"))
    const kanal = kanalNetz()
    const anna = mensch(kanal, "a-anna", "Anna", "video")
    const bert = mensch(kanal, "b-bert", "Bert", "video")
    await anna.betreten()
    await bert.betreten()

    await anna.aria("Mehr")
    await anna.klick("Einstellungen")
    await anna.klick("Regeln des Raums")
    await wahl(anna, "Stille nach der Klangschale", "1 Min.")
    await anna.klick("Für alle übernehmen")

    await anna.aria("Aktionen")
    await anna.klick("Freier Kreis mit Redestab")
    await bert.aria("Die Klangschale schlagen: Stille für alle")
    expect(anna.text()).toContain("Stille")
    await act(async () => {
      vi.setSystemTime(new Date("2026-09-30T10:00:45Z"))
      vi.advanceTimersByTime(1000)
    })
    expect(anna.text()).toContain("Stille")
    await act(async () => {
      vi.setSystemTime(new Date("2026-09-30T10:01:05Z"))
      vi.advanceTimersByTime(1000)
    })
    expect(anna.text()).not.toContain("Stille ·")
  })

  it("ist die Dauer um, klingt der Gong, ein Hinweis ruft zur Abschlussrunde, das Treffen laeuft weiter", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false })
    vi.setSystemTime(new Date("2026-09-30T10:00:00Z"))
    const kanal = kanalNetz()
    const anna = mensch(kanal, "a-anna", "Anna", "video")
    const bert = mensch(kanal, "b-bert", "Bert", "video")
    await anna.betreten()
    await bert.betreten()

    await anna.aria("Mehr")
    await anna.klick("Einstellungen")
    await anna.klick("Regeln des Raums")
    await wahl(anna, "Dauer des Meetings", "30 Min.")
    await anna.klick("Für alle übernehmen")
    expect(bert.text()).toContain("Meeting noch 30 Min.")

    await act(async () => {
      vi.setSystemTime(new Date("2026-09-30T10:30:01Z"))
      vi.advanceTimersByTime(1000)
    })
    expect(bert.text()).toContain("Zeit für die Abschlussrunde")
    expect(bert.text()).toContain("Gemeinsamer Chat")
    await bert.aria("Hinweis schließen")
    expect(bert.text()).not.toContain("Zeit für die Abschlussrunde")
  })
})

describe("Dauer des Meetings im Aktions-Menü", () => {
  it("45 Minuten für alle, direkt über +", async () => {
    const kanal = kanalNetz()
    const anna = mensch(kanal, "a-anna", "Anna", "video")
    const bert = mensch(kanal, "b-bert", "Bert", "video")
    await anna.betreten()
    await bert.betreten()
    await anna.aria("Aktionen")
    const dauer = [...anna.huelle.querySelectorAll("details")].find((d) => d.querySelector("summary")?.textContent?.includes("Dauer des Meetings"))!
    await act(async () => { [...dauer.querySelectorAll("button")].find((x) => x.textContent === "45 Min.")!.click() })
    expect(bert.text()).toContain("Meeting noch 45 Min.")
  })
})

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

    // Alle zeigen ueber der Buehne gilt nur fuer mich; oben fuehrt ein Weg zurueck
    await bert.klick("Alle zeigen")
    expect(bert.text()).toContain("Zurück zu Kreis · Wir-Prozess")
    expect(anna.text()).toContain("liegt in der Mitte")
    await bert.klick("Zurück zu Kreis")
    expect(bert.text()).toContain("liegt in der Mitte")

    // Ueber + zeigt Bert allen die Menschen
    await bert.aria("Aktionen")
    await bert.klick("Alle zeigen, für alle")
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

  it("Zeichenpad: wer es oeffnet, praesentiert; Mehrere Benutzer gibt frei; Striche gehen durch", async () => {
    const kanal = kanalNetz()
    const anna = mensch(kanal, "a-anna", "Anna", "video")
    const bert = mensch(kanal, "b-bert", "Bert", "video")
    await anna.betreten()
    await bert.betreten()

    await anna.aria("Aktionen")
    await anna.klick("Zeichenpad")
    await act(async () => { await new Promise((r) => setTimeout(r, 0)) })
    expect(bert.text()).toContain("Anna präsentiert")
    expect(bert.text()).toContain("nur ansehen")
    expect(anna.text()).toContain("zeichnen erlaubt")

    await anna.klick("Strich ziehen")
    expect(bert.text()).toContain("Elemente: 1")

    await anna.klick("Mehrere Benutzer")
    expect(bert.text()).toContain("zeichnen erlaubt")
    await bert.klick("Strich ziehen")
    expect(anna.text()).toContain("Elemente: 2")

    // Wer spaeter kommt, bekommt das Gezeichnete
    const clara = mensch(kanal, "c-clara", "Clara", "video")
    await clara.betreten()
    await act(async () => { await new Promise((r) => setTimeout(r, 0)) })
    expect(clara.text()).toContain("Elemente: 2")
  })

  it("Folien: PDF hochladen, sie kommt in Stuecken bei allen an, gemeinsam blaettern, Nachzuegler bekommt sie", async () => {
    const kanal = kanalNetz()
    const anna = mensch(kanal, "a-anna", "Anna", "video")
    const bert = mensch(kanal, "b-bert", "Bert", "video")
    await anna.betreten()
    await bert.betreten()
    await anna.aria("Aktionen")
    await anna.klick("Zeichenpad")
    const warten = async (ms = 0) => { await act(async () => { await new Promise((r) => setTimeout(r, ms)) }) }
    await warten()

    // Eine PDF von gut 60 KB: mehrere Stuecke
    const inhalt = new Uint8Array(60_000).map((_, i) => i % 251)
    const datei = new File([inhalt], "Vortrag.pdf", { type: "application/pdf" })
    const feld = anna.huelle.querySelector('input[type="file"]') as HTMLInputElement
    Object.defineProperty(feld, "files", { value: [datei], configurable: true })
    await act(async () => { feld.dispatchEvent(new Event("change", { bubbles: true })) })
    await warten(200)

    expect(bert.text()).toContain("Folie 1 von 3")
    expect(bert.text()).toContain("Vortrag.pdf")
    await warten(50)
    expect(bert.text()).toMatch(/Hintergrund: folie-[a-z0-9]+:1/)

    await anna.aria("Nächste Folie")
    await warten(20)
    expect(bert.text()).toContain("Folie 2 von 3")
    expect(bert.text()).toMatch(/Hintergrund: folie-[a-z0-9]+:2/)

    const clara = mensch(kanal, "c-clara", "Clara", "video")
    await clara.betreten()
    await warten(300)
    expect(clara.text()).toContain("Folie 2 von 3")
    expect(clara.text()).toMatch(/Hintergrund: folie-[a-z0-9]+:2/)
  })

  it("ein fremdes Modul liegt fuer alle in der Mitte", async () => {
    const kanal = kanalNetz()
    const anna = mensch(kanal, "a-anna", "Anna", "video")
    const bert = mensch(kanal, "b-bert", "Bert", "video")
    await anna.betreten()
    await bert.betreten()

    await bert.aria("Aktionen")
    await bert.klick("Kanban")
    expect(anna.text()).toContain("Fläche von kanban")
  })
})

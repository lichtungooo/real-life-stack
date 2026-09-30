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
    await anna.klick("5 Min.")
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
    await anna.klick("Einstellungen: Redezeit")
    await anna.klick("1 Min.")
    await act(async () => { (anna.huelle.querySelectorAll('input[name="danach"]')[0] as HTMLInputElement).click() })
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
    await anna.klick("Einstellungen: Redezeit")
    await wahl(anna, "Stille nach der Klangschale", "1 Min.")
    await anna.klick("Für alle übernehmen")

    await anna.aria("Aktionen")
    await anna.klick("Kreis mit Redestab")
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
    await anna.klick("Einstellungen: Redezeit")
    await wahl(anna, "Dauer des Treffens", "30 Min.")
    await anna.klick("Für alle übernehmen")
    expect(bert.text()).toContain("Treffen noch 30 Min.")

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

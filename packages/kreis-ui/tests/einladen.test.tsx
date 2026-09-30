// @vitest-environment jsdom
/**
 * Einladen in die Konferenz (Spec video, "Einladen"). Anna gehoert zur
 * Gruppe, Bert kommt ueber den Link und hat noch keinen Platz darin. Beide
 * sitzen im selben Raum, dessen Schluessel die Id der Gruppe ist. Anna sieht
 * Bert als "neu" und nimmt ihn auf; der Dialog "Einladen" baut den Text zum
 * Weitergeben und laedt Kontakte ein.
 */
import { act, type ReactElement } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"
import { lokalerKreisRaum } from "@kreis/core"
import { KreisRaumProvider } from "../src/raum-kontext"
import { VideoRaumFlaeche } from "../src/video/video-raum-flaeche"
import { BeitrittsKonferenz } from "../src/video/beitritts-konferenz"
import { einladungsText, type KonferenzEinladen } from "../src/video/einladen"
import { ueberblickAlsCsv } from "../src/video/ueberblick"

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

const GRUPPE = "4f1c2a9e-7b3d-4e21-9a55-0c6d8e2f1b77"

function einladenFuer(): KonferenzEinladen & { aufnehmen: ReturnType<typeof vi.fn>; kontaktEinladen: ReturnType<typeof vi.fn> } {
  return {
    link: `https://trustdonation.org/einladung/?konferenz=${GRUPPE}&gruppe=Garten`,
    kontakte: [
      { id: "kennung-clara", name: "Clara", mitglied: false },
      { id: "kennung-anna", name: "Anna", mitglied: true },
    ],
    kontaktEinladen: vi.fn(async () => {}),
    istMitglied: (k: string) => k === "kennung-anna",
    aufnehmen: vi.fn(async () => {}),
  }
}

function mensch(kanal: ReturnType<typeof kanalNetz>, id: string, kennung: string, inhalt: (einladen?: KonferenzEinladen) => ReactElement, einladen?: KonferenzEinladen) {
  const huelle = document.createElement("div")
  document.body.appendChild(huelle)
  const wurzel = createRoot(huelle)
  wurzeln.push(wurzel)
  const fabrik = () => lokalerKreisRaum({ kanal, id })
  act(() => {
    wurzel.render(<KreisRaumProvider fabrik={fabrik} kennung={kennung}>{inhalt(einladen)}</KreisRaumProvider>)
  })
  const text = () => huelle.textContent ?? ""
  const knopf = (beschriftung: string) => [...huelle.querySelectorAll("button")].find((b) => b.textContent?.includes(beschriftung))
  const klick = async (beschriftung: string) => {
    const b = knopf(beschriftung)
    if (!b) throw new Error(`Kein Knopf "${beschriftung}": ${text()}`)
    await act(async () => { b.click() })
  }
  const betreten = async () => {
    await act(async () => { huelle.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })) })
  }
  return { huelle, text, knopf, klick, betreten }
}

const namenFeld = async (h: HTMLElement, name: string) => {
  const feld = h.querySelector("#kreis-name") as HTMLInputElement
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(feld, name)
    feld.dispatchEvent(new Event("input", { bubbles: true }))
  })
}

describe("Der Einladungstext", () => {
  it("nennt die Session, trägt die Beschreibung, den Link und woher das Werkzeug kommt", () => {
    const t = einladungsText("Garten", "https://x.org/einladung/?konferenz=1", "Wir planen das Frühjahr.")
    expect(t).toContain("Einladung zur Session „Garten“")
    expect(t).toContain("Wir planen das Frühjahr.")
    expect(t).toContain("https://x.org/einladung/?konferenz=1")
    expect(t).toContain("Conferencing ist ein Modul vom Real Life Network.")
  })

  it("ohne Beschreibung bleibt keine leere Zeile", () => {
    expect(einladungsText("Garten", "L")).not.toMatch(/\n\n\n/)
  })
})

describe("Einladen in die Konferenz", () => {
  it("wer neu im Raum ist, erscheint bei den Mitgliedern und lässt sich aufnehmen", async () => {
    const kanal = kanalNetz()
    const einladen = einladenFuer()
    const anna = mensch(kanal, "a-anna", "kennung-anna",
      (e) => <VideoRaumFlaeche raumId={GRUPPE} raumName="Garten" vorschlagName="Anna" einladen={e} />, einladen)
    const bert = mensch(kanal, "b-bert", "kennung-bert",
      () => <BeitrittsKonferenz raumId={GRUPPE} raumName="Garten" />)

    await anna.betreten()
    await namenFeld(bert.huelle, "Bert")
    await bert.betreten()

    expect(bert.text()).toContain("Willkommen in „Garten“")
    expect(bert.text()).toContain("Teilnehmer (2)")
    expect(anna.text()).toContain("Neu im Raum")
    expect(anna.text()).toContain("Bert")

    await anna.klick("In die Gruppe aufnehmen")
    expect(einladen.aufnehmen).toHaveBeenCalledWith("kennung-bert", "Bert")
    expect(anna.text()).toContain("eingeladen")
  })

  it("wer selbst nicht Mitglied ist, bekommt keinen Knopf zum Aufnehmen", async () => {
    const kanal = kanalNetz()
    const einladen = { ...einladenFuer(), istMitglied: () => false }
    const clara = mensch(kanal, "c-clara", "kennung-clara",
      (e) => <VideoRaumFlaeche raumId={GRUPPE} raumName="Garten" vorschlagName="Clara" einladen={e} />, einladen)
    const bert = mensch(kanal, "b-bert", "kennung-bert", () => <BeitrittsKonferenz raumId={GRUPPE} raumName="Garten" />)
    await clara.betreten()
    await namenFeld(bert.huelle, "Bert")
    await bert.betreten()
    expect(clara.text()).not.toContain("Neu im Raum")
  })

  it("der Dialog baut den Text zum Weitergeben und lädt Kontakte ein", async () => {
    const schreiben = vi.fn(async () => {})
    Object.defineProperty(navigator, "clipboard", { value: { writeText: schreiben }, configurable: true })
    const einladen = einladenFuer()
    const anna = mensch(kanalNetz(), "a-anna", "kennung-anna",
      (e) => <VideoRaumFlaeche raumId={GRUPPE} raumName="Garten" vorschlagName="Anna" einladen={e} />, einladen)
    await anna.betreten()
    await anna.klick("Einladen")

    const beschreibung = anna.huelle.querySelector('[role="dialog"] textarea') as HTMLTextAreaElement
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(beschreibung, "Wir planen das Frühjahr.")
      beschreibung.dispatchEvent(new Event("input", { bubbles: true }))
    })
    await anna.klick("Text mit Link kopieren")
    const kopiert = String((schreiben.mock.calls[0] as unknown[])[0])
    expect(kopiert).toContain("Einladung zur Session „Garten“")
    expect(kopiert).toContain("Wir planen das Frühjahr.")
    expect(kopiert).toContain(einladen.link)
    expect(anna.text()).toContain("Kopiert")

    // Clara ist noch nicht in der Gruppe, Anna schon.
    const zeilen = [...anna.huelle.querySelectorAll('[role="dialog"] li')]
    expect(zeilen.find((z) => z.textContent?.includes("Anna"))?.textContent).toContain("in der Gruppe")
    const clara = zeilen.find((z) => z.textContent?.includes("Clara"))!
    await act(async () => { (clara.querySelector("button") as HTMLButtonElement).click() })
    expect(einladen.kontaktEinladen).toHaveBeenCalledWith("kennung-clara")
    expect(clara.textContent).toContain("eingeladen")
  })

  it("ohne Einladen-Schnittstelle gibt es keinen Knopf", async () => {
    const anna = mensch(kanalNetz(), "a-anna", "kennung-anna", () => <VideoRaumFlaeche raumId={GRUPPE} raumName="Garten" vorschlagName="Anna" />)
    await anna.betreten()
    expect(anna.knopf("Einladen")).toBeUndefined()
  })
})

describe("Moderation auf Augenhoehe", () => {
  it("Chat schliessen, alle stumm, Reaktionen loeschen: jedes Geraet folgt", async () => {
    const kanal = kanalNetz()
    const einladen = einladenFuer()
    const anna = mensch(kanal, "a-anna", "kennung-anna",
      (e) => <VideoRaumFlaeche raumId={GRUPPE} raumName="Garten" vorschlagName="Anna" einladen={e} />, einladen)
    const bert = mensch(kanal, "b-bert", "kennung-bert",
      (e) => <VideoRaumFlaeche raumId={GRUPPE} raumName="Garten" vorschlagName="Bert" einladen={e} />, einladen)
    await anna.betreten()
    await namenFeld(bert.huelle, "Bert")
    await bert.betreten()

    const aria = async (m: typeof anna, label: string) => {
      const b = m.huelle.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement
      await act(async () => { b.click() })
    }
    await aria(anna, "Moderation")
    await anna.klick("Chat schließen")
    await bert.klick("Gemeinsamer Chat")
    expect((bert.huelle.querySelector("textarea#video-chat") as HTMLTextAreaElement).disabled).toBe(true)

    await aria(bert, "Hand heben oder senken")
    expect(anna.text()).toContain("hebt die Hand")
    await aria(anna, "Moderation")
    await anna.klick("Alle Reaktionen löschen")
    expect(bert.huelle.querySelector('button[aria-label="Hand heben oder senken"]')?.getAttribute("aria-pressed")).toBe("false")
  })

  it("Warteraum: Neue warten ohne Ton, bis jemand sie hereinholt", async () => {
    const kanal = kanalNetz()
    const einladen = einladenFuer()
    const anna = mensch(kanal, "a-anna", "kennung-anna",
      (e) => <VideoRaumFlaeche raumId={GRUPPE} raumName="Garten" vorschlagName="Anna" einladen={e} />, einladen)
    await anna.betreten()
    const aria = async (m: typeof anna, label: string) => {
      const b = m.huelle.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement
      await act(async () => { b.click() })
    }
    await aria(anna, "Moderation")
    await anna.klick("Warteraum einschalten")

    const bert = mensch(kanal, "b-bert", "kennung-bert", () => <BeitrittsKonferenz raumId={GRUPPE} raumName="Garten" />)
    await namenFeld(bert.huelle, "Bert")
    await bert.betreten()
    expect(bert.text()).toContain("Warteraum")
    expect(bert.text()).toContain("Gleich holt dich jemand")

    await anna.klick("Hereinholen")
    expect(bert.text()).not.toContain("Gleich holt dich jemand")
    expect(bert.text()).toContain("Willkommen in „Garten“")
  })
})

describe("Gruppenraeume", () => {
  it("erstellen, zufaellig verteilen, hinueber, getrennt, und zurueck", async () => {
    const kanal = kanalNetz()
    const einladen = einladenFuer()
    const anna = mensch(kanal, "a-anna", "kennung-anna",
      (e) => <VideoRaumFlaeche raumId={GRUPPE} raumName="Garten" vorschlagName="Anna" einladen={e} />, einladen)
    const bert = mensch(kanal, "b-bert", "kennung-bert",
      (e) => <VideoRaumFlaeche raumId={GRUPPE} raumName="Garten" vorschlagName="Bert" einladen={e} />, einladen)
    await anna.betreten()
    await namenFeld(bert.huelle, "Bert")
    await bert.betreten()
    expect(anna.text()).toContain("Teilnehmer (2)")

    await act(async () => { (anna.huelle.querySelector('button[aria-label="Moderation"]') as HTMLButtonElement).click() })
    await anna.klick("Gruppenräume erstellen")
    expect(anna.text()).toContain("Räume verwalten")
    await anna.klick("Zufällig zuordnen")
    await anna.klick("Erstellen")

    expect(bert.text()).toContain("Du gehst gleich in")
    await anna.klick("Jetzt gehen")
    await bert.klick("Jetzt gehen")
    await act(async () => { await new Promise((r) => setTimeout(r, 20)) })
    expect(anna.text()).toMatch(/Garten · Raum \d · noch/)
    expect(anna.text()).toContain("Teilnehmer (1)")
    expect(bert.text()).toContain("Teilnehmer (1)")

    await anna.klick("Zurück in den Hauptraum")
    await bert.klick("Zurück in den Hauptraum")
    await act(async () => { await new Promise((r) => setTimeout(r, 20)) })
    expect(anna.text()).toContain("Teilnehmer (2)")
    expect(anna.text()).not.toContain("Du gehst gleich in")
  }, 15_000)
})

describe("Meeting-Ueberblick", () => {
  it("zeigt jeden Menschen mit Nachrichten und Haenden", async () => {
    const kanal = kanalNetz()
    const einladen = einladenFuer()
    const anna = mensch(kanal, "a-anna", "kennung-anna",
      (e) => <VideoRaumFlaeche raumId={GRUPPE} raumName="Garten" vorschlagName="Anna" einladen={e} />, einladen)
    const bert = mensch(kanal, "b-bert", "kennung-bert",
      (e) => <VideoRaumFlaeche raumId={GRUPPE} raumName="Garten" vorschlagName="Bert" einladen={e} />, einladen)
    await anna.betreten()
    await namenFeld(bert.huelle, "Bert")
    await bert.betreten()
    await act(async () => { (bert.huelle.querySelector('button[aria-label="Hand heben oder senken"]') as HTMLButtonElement).click() })

    await act(async () => { (anna.huelle.querySelector('button[aria-label="Moderation"]') as HTMLButtonElement).click() })
    await anna.klick("Meeting-Überblick")
    const tabelle = anna.huelle.querySelector('[aria-label="Meeting-Überblick"] table')!
    const bertZeile = [...tabelle.querySelectorAll("tr")].find((r) => r.textContent?.includes("Bert"))!
    expect(bertZeile.textContent).toContain("Online")
    expect(bertZeile.querySelectorAll("td")[6].textContent).toBe("1")
    expect(anna.text()).toContain("Aktive Teilnehmer")
  })

  it("CSV mit Semikolon und Kopfzeile", () => {
    const csv = ueberblickAlsCsv([{ name: "Anna; die Erste", seit: 0, onlineMs: 65_000, redeMs: 5_000, kameraMs: 0, haende: 2, reaktionen: 1, da: true, nachrichten: 3 }])
    const zeilen = csv.split(/\r?\n/)
    expect(zeilen[0]).toBe("Name;Onlinezeit;Redezeit;Kamerazeit;Nachrichten;Reaktionen;Gehobene Haende;Status")
    expect(zeilen[1]).toBe("Anna, die Erste;00:01:05;00:00:05;00:00:00;3;1;2;online")
  })
})

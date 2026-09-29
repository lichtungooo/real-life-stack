import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { lokalerKreisRaum } from "../src"

// Ein Kanal wie BroadcastChannel, im Speicher: Jede Nachricht geht an alle
// anderen Enden desselben Namens, nie an den Absender.
function kanalNetz() {
  const enden = new Map<string, Set<{ onmessage: ((e: { data: unknown }) => void) | null }>>()
  return (name: string) => {
    const ende = {
      onmessage: null as ((e: { data: unknown }) => void) | null,
      postMessage(n: unknown) {
        for (const anderes of enden.get(name) ?? []) {
          if (anderes !== ende) anderes.onmessage?.({ data: structuredClone(n) })
        }
      },
      close() { enden.get(name)?.delete(ende) },
    }
    if (!enden.has(name)) enden.set(name, new Set())
    enden.get(name)!.add(ende)
    return ende
  }
}

describe("Der lokale Raum", () => {
  let uhr = 0
  beforeEach(() => { vi.useFakeTimers(); uhr = 0 })
  afterEach(() => { vi.useRealTimers() })

  it("zwei Tabs sehen einander, Nachrichten gehen nur an den anderen", async () => {
    const kanal = kanalNetz()
    const anna = lokalerKreisRaum({ kanal, id: "anna", jetzt: () => uhr })
    const bert = lokalerKreisRaum({ kanal, id: "bert", jetzt: () => uhr })
    expect(anna.traegtMedien).toBe(false)

    await anna.betreten("kreis-test", "Anna")
    await bert.betreten("kreis-test", "Bert")

    expect(anna.teilnehmer().map((t) => t.name)).toEqual(["Anna", "Bert"])
    expect(bert.teilnehmer().map((t) => t.name)).toEqual(["Bert", "Anna"])
    expect(anna.ich()).toBe("anna")

    const beiBert: unknown[] = []
    const beiAnna: unknown[] = []
    bert.beiNachricht((n, von) => beiBert.push([n, von]))
    anna.beiNachricht((n) => beiAnna.push(n))
    anna.senden({ art: "kreis-frage" })
    expect(beiBert).toEqual([[{ art: "kreis-frage" }, "anna"]])
    expect(beiAnna).toEqual([])
  })

  it("wer geht, verschwindet; wer schweigt, auch", async () => {
    const kanal = kanalNetz()
    const anna = lokalerKreisRaum({ kanal, id: "anna", jetzt: () => uhr })
    const bert = lokalerKreisRaum({ kanal, id: "bert", jetzt: () => uhr })
    const cara = lokalerKreisRaum({ kanal, id: "cara", jetzt: () => uhr })
    await anna.betreten("r", "Anna")
    await bert.betreten("r", "Bert")
    await cara.betreten("r", "Cara")
    expect(anna.teilnehmer()).toHaveLength(3)

    await bert.verlassen()
    expect(anna.teilnehmer().map((t) => t.id)).toEqual(["anna", "cara"])
    expect(bert.teilnehmer()).toEqual([])
    expect(bert.ich()).toBeNull()

    await cara.verlassen()
    expect(anna.teilnehmer().map((t) => t.id)).toEqual(["anna"])

    // Ein Tab, der ohne Abschied zugeht, meldet sich einmal und dann nie
    // wieder. Nach der Frist ist er weg.
    const geist = kanal("kreis:r")
    geist.postMessage({ typ: "da", id: "geist", name: "Geist", mikroAn: false, kameraAn: false })
    expect(anna.teilnehmer().map((t) => t.id)).toContain("geist")
    uhr = 6000
    vi.advanceTimersByTime(1500)
    expect(anna.teilnehmer().map((t) => t.id)).toEqual(["anna"])
  })

  it("Mikrofon und Kamera reisen mit dem Lebenszeichen", async () => {
    const kanal = kanalNetz()
    const anna = lokalerKreisRaum({ kanal, id: "anna", jetzt: () => uhr })
    const bert = lokalerKreisRaum({ kanal, id: "bert", jetzt: () => uhr })
    await anna.betreten("r", "Anna")
    await bert.betreten("r", "Bert")
    await anna.mikro(true)
    expect(bert.teilnehmer().find((t) => t.id === "anna")?.mikroAn).toBe(true)
  })
})

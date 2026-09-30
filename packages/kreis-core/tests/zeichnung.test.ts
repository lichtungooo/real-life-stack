/**
 * Das gemeinsame Zeichenpad ohne Server: je Element gilt die hoehere
 * Fassung, bei Gleichstand die kleinere Zufallszahl (wie Excalidraw).
 * Dazu wer praesentiert und ob "Mehrere Benutzer" freigegeben ist.
 */
import { describe, expect, it } from "vitest"
import {
  darfZeichnen,
  elementeEinmischen,
  fremdesGilt,
  geaenderteElemente,
  inPakete,
  istZeichenElement,
  leereSitzung,
  padFreigeben,
  padOeffnen,
  padUebernehmen,
  type ZeichenElement,
} from "../src"

const el = (id: string, version: number, versionNonce = 1, mehr: Record<string, unknown> = {}): ZeichenElement =>
  ({ id, version, versionNonce, ...mehr })

describe("Elemente einmischen", () => {
  it("die hoehere Fassung gewinnt, bei Gleichstand die kleinere Zufallszahl", () => {
    expect(fremdesGilt(el("a", 2), el("a", 3))).toBe(true)
    expect(fremdesGilt(el("a", 3), el("a", 2))).toBe(false)
    expect(fremdesGilt(el("a", 2, 50), el("a", 2, 10))).toBe(true)
    expect(fremdesGilt(el("a", 2, 10), el("a", 2, 50))).toBe(false)
    expect(fremdesGilt(undefined, el("a", 1))).toBe(true)
  })

  it("behaelt die Reihenfolge, haengt Neues an und liefert bei nichts Neuem dieselbe Liste", () => {
    const eigene = [el("a", 1), el("b", 1)]
    const neu = elementeEinmischen(eigene, [el("c", 1), el("a", 2)])
    expect(neu.map((e) => `${e.id}${e.version}`)).toEqual(["a2", "b1", "c1"])
    expect(elementeEinmischen(eigene, [el("a", 1)])).toBe(eigene)
    expect(elementeEinmischen(eigene, [])).toBe(eigene)
  })

  it("zwei Geraete kommen in beliebiger Reihenfolge zum selben Stand", () => {
    const start = [el("a", 1, 5)]
    const annas = el("a", 2, 30)
    const berts = el("a", 2, 20)
    const beiAnna = elementeEinmischen([annas], [berts])
    const beiBert = elementeEinmischen([berts], [annas])
    expect(beiAnna[0]).toEqual(beiBert[0])
    expect(elementeEinmischen(start, [annas, berts])[0]).toEqual(berts)
  })

  it("Geloeschtes bleibt als geloescht stehen", () => {
    const neu = elementeEinmischen([el("a", 1)], [el("a", 2, 1, { isDeleted: true })])
    expect(neu[0].isDeleted).toBe(true)
  })
})

describe("Senden", () => {
  it("nur was sich seit dem letzten Senden geaendert hat", () => {
    const gesendet = new Map([["a", 1], ["b", 3]])
    expect(geaenderteElemente([el("a", 1), el("b", 4), el("c", 1)], gesendet).map((e) => e.id)).toEqual(["b", "c"])
  })

  it("teilt in Pakete unter der Grenze; ein grosses Element reist allein", () => {
    const klein = Array.from({ length: 10 }, (_, i) => el(`k${i}`, 1, 1, { punkte: "x".repeat(50) }))
    const gross = el("g", 1, 1, { punkte: "y".repeat(500) })
    const pakete = inPakete([...klein, gross], 300)
    expect(pakete.flat()).toHaveLength(11)
    expect(pakete.find((p) => p.includes(gross))).toEqual([gross])
    for (const p of pakete) if (p.length > 1) expect(JSON.stringify(p).length).toBeLessThanOrEqual(300 + 20)
  })

  it("erkennt Elemente", () => {
    expect(istZeichenElement(el("a", 1))).toBe(true)
    expect(istZeichenElement({ id: "a" })).toBe(false)
  })
})

describe("Wer zeichnen darf", () => {
  it("wer das Pad oeffnet, praesentiert; zuerst zeichnet nur er", () => {
    const s = padOeffnen(leereSitzung(0), "pad", "anna")
    expect(s.mitte).toBe("pad")
    expect(s.pad).toEqual({ praesentiert: "anna", alle: false })
    expect(darfZeichnen(s, "anna")).toBe(true)
    expect(darfZeichnen(s, "bert")).toBe(false)
  })

  it("Mehrere Benutzer: nur wer praesentiert, gibt frei", () => {
    const s = padOeffnen(leereSitzung(0), "pad", "anna")
    expect(padFreigeben(s, true, "bert")).toBe(s)
    const frei = padFreigeben(s, true, "anna")
    expect(darfZeichnen(frei, "bert")).toBe(true)
    expect(padFreigeben(frei, true, "anna")).toBe(frei)
  })

  it("die Praesentation uebernimmt nur, wer da ist, wenn der Praesentierende gegangen ist", () => {
    const s = padOeffnen(leereSitzung(0), "pad", "anna")
    expect(padUebernehmen(s, "bert", ["anna", "bert"])).toBe(s)
    expect(padUebernehmen(s, "bert", ["bert"]).pad?.praesentiert).toBe("bert")
  })

  it("ohne Pad-Angabe (aeltere Fassung) zeichnen alle", () => {
    expect(darfZeichnen(leereSitzung(0), "wer")).toBe(true)
  })
})

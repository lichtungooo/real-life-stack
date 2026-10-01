// @vitest-environment jsdom
/**
 * Reisst die Verbindung zum Mitschrift-Dienst mitten im Satz, geht nichts
 * verloren, was schon erkannt war (01.10.2026: der Dienst stuerzte ab, und
 * Saetze fehlten). Die Verbindung ist hier eine Attrappe.
 */
import { afterEach, describe, expect, it, vi } from "vitest"
import { MitschriftAufnahme, type MitschriftHoerer } from "../src/mitschrift-aufnahme"

class Leitung {
  static alle: Leitung[] = []
  static OPEN = 1
  readyState = 1
  binaryType = ""
  gesendet: unknown[] = []
  onopen: (() => void) | null = null
  onmessage: ((e: { data: unknown }) => void) | null = null
  onclose: ((e: { code: number }) => void) | null = null
  constructor(public url: string) { Leitung.alle.push(this); setTimeout(() => this.onopen?.(), 0) }
  send(d: unknown) { this.gesendet.push(d) }
  close() {}
  antworten(n: unknown) { this.onmessage?.({ data: JSON.stringify(n) }) }
  reissen() { this.readyState = 3; this.onclose?.({ code: 1006 }) }
  get texte() { return this.gesendet.filter((d): d is string => typeof d === "string").map((d) => JSON.parse(d) as { typ: string; id?: string }) }
}

afterEach(() => { Leitung.alle = []; vi.useRealTimers(); vi.unstubAllGlobals() })

describe("Die Mitschrift ueberlebt einen Abriss", () => {
  it("der Satz geht nach dem Wiederverbinden weiter, der Text bis zum Abriss bleibt davor stehen", async () => {
    vi.stubGlobal("WebSocket", Leitung)
    vi.useFakeTimers()
    const live: string[] = []
    const fertig: string[] = []
    const hoerer: MitschriftHoerer = {
      beginn: () => {}, live: (_id, t, v) => live.push([t, v].filter(Boolean).join(" ")),
      fertig: (_id, t) => fertig.push(t), verbunden: () => {}, fehler: () => {},
    }
    const a = new MitschriftAufnahme({ url: "wss://test", token: "t", darfHoeren: () => true, hoerer })
    const intern = a as unknown as { verbinden(): void; schneider: { block(p: Float32Array, pegel: number, t: number): void } }
    intern.verbinden()
    await vi.advanceTimersByTimeAsync(1)
    const erste = Leitung.alle[0]
    erste.antworten({ typ: "bereit" })

    // Anna spricht: der Abschnitt beginnt.
    let t = 1_000_000
    for (let i = 0; i < 6; i++) intern.schneider.block(new Float32Array(2048).fill(0.1), 0.1, (t += 128))
    const id = erste.texte.find((n) => n.typ === "beginn")!.id!
    erste.antworten({ typ: "live", id, text: "Die Tomaten wachsen gut", vorlaeufig: "" })

    // Abriss mitten im Satz, dann wieder verbunden.
    erste.reissen()
    await vi.advanceTimersByTimeAsync(2000)
    const zweite = Leitung.alle[1]
    expect(zweite).toBeDefined()
    zweite.antworten({ typ: "bereit" })
    // Der laufende Abschnitt geht beim Dienst unter derselben Id neu auf.
    expect(zweite.texte.filter((n) => n.typ === "beginn").map((n) => n.id)).toEqual([id])

    zweite.antworten({ typ: "live", id, text: "aber die Gurken", vorlaeufig: "brauchen" })
    expect(live.at(-1)).toBe("Die Tomaten wachsen gut aber die Gurken brauchen")

    // Stille: das Ende, dann der fertige Text, mit dem Teil vor dem Abriss.
    for (let i = 0; i < 20; i++) intern.schneider.block(new Float32Array(2048), 0.001, (t += 128))
    zweite.antworten({ typ: "text", id, text: "aber die Gurken brauchen Wasser." })
    expect(fertig).toEqual(["Die Tomaten wachsen gut aber die Gurken brauchen Wasser."])
  })
})

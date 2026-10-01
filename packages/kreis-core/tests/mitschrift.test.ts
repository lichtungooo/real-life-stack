import { describe, expect, it } from "vitest"
import {
  WAECHTER_STANDARD, dauerText, protokollMarkdown, redezeiten, waechterNeu, waechterSchritt,
  type MitschriftZeile, type WaechterEreignis, type WaechterZustand,
} from "../src/mitschrift"

const BLOCK = 128

/** Spielt eine Folge von Pegeln durch, je 128 ms, und sammelt die Ereignisse. */
function durch(pegel: number[], start = 0, z: WaechterZustand = waechterNeu()) {
  const ereignisse: WaechterEreignis[] = []
  let t = start
  for (const p of pegel) {
    t += BLOCK
    const r = waechterSchritt(z, p, BLOCK, t)
    z = r.zustand
    if (r.ereignis) ereignisse.push(r.ereignis)
  }
  return { ereignisse, z }
}
const still = (n: number) => Array(n).fill(0.002)
const laut = (n: number) => Array(n).fill(0.08)

describe("Der Waechter trennt Sprache von Stille", () => {
  it("ein Satz: Beginn, dann Ende nach der Stille, ohne die Stille am Ende", () => {
    const { ereignisse } = durch([...still(10), ...laut(20), ...still(10)])
    expect(ereignisse.map((e) => e.art)).toEqual(["beginn", "ende"])
    const ende = ereignisse[1] as Extract<WaechterEreignis, { art: "ende" }>
    expect(ende.behalten).toBe(true)
    // 20 laute Bloecke = 2560 ms; der Beginn liegt am ersten lauten Block.
    expect(ende.ende - ende.beginn).toBe(20 * BLOCK)
    expect(ende.beginn).toBe(10 * BLOCK)
  })

  it("eine kurze Pause im Satz beendet den Abschnitt nicht", () => {
    const { ereignisse } = durch([...laut(10), ...still(4), ...laut(10), ...still(10)])
    expect(ereignisse.filter((e) => e.art === "ende")).toHaveLength(1)
  })

  it("ein Klopfen ist kein Beitrag", () => {
    const { ereignisse } = durch([...still(5), ...laut(2), ...still(12)])
    const ende = ereignisse.find((e) => e.art === "ende") as Extract<WaechterEreignis, { art: "ende" }> | undefined
    expect(ende?.behalten ?? false).toBe(false)
  })

  it("wer lange redet, wird nach 25 Sekunden geschnitten, und es geht nahtlos weiter", () => {
    const bloecke = Math.ceil(60_000 / BLOCK)
    const { ereignisse } = durch(laut(bloecke))
    const enden = ereignisse.filter((e) => e.art === "ende") as Extract<WaechterEreignis, { art: "ende" }>[]
    expect(enden.length).toBe(2)
    expect(enden.every((e) => e.weiter && e.ende - e.beginn <= WAECHTER_STANDARD.maxMs + BLOCK)).toBe(true)
    expect(enden[1].beginn).toBe(enden[0].ende)
  })

  it("ein lauter Raum hebt die Schwelle: Rauschen allein wird kein Abschnitt", () => {
    // Erst lernt er das Grundrauschen eines lauten Raums, dann steigt es leicht.
    // 0.02 liegt ueber der Mindestschwelle; ohne Lernen gaebe es einen Beginn.
    const { ereignisse } = durch([...Array(100).fill(0.011), ...Array(100).fill(0.02)])
    expect(ereignisse).toHaveLength(0)
    // Eine Stimme darueber kommt weiter durch.
    const mitStimme = durch([...Array(100).fill(0.011), ...Array(20).fill(0.09), ...Array(10).fill(0.011)])
    expect(mitStimme.ereignisse.map((e) => e.art)).toEqual(["beginn", "ende"])
  })
})

describe("Redezeit und Datei", () => {
  const t0 = Date.UTC(2026, 9, 1, 8, 0, 0)
  const zeilen: MitschriftZeile[] = [
    { name: "Anna", text: "Guten Morgen zusammen.", wann: t0, bis: t0 + 4_000 },
    { name: "Bert", text: "Morgen! Ich habe die Zahlen dabei.", wann: t0 + 5_000, bis: t0 + 65_000 },
    { name: "Anna", text: "Dann fang du an.", wann: t0 + 66_000, bis: t0 + 68_000 },
    { name: "Cara", text: "…", wann: t0 + 70_000, vorlaeufig: true },
  ]

  it("zaehlt Beitraege und Redezeit je Mensch, ohne Vorlaeufiges", () => {
    const rz = redezeiten(zeilen)
    expect(rz.map((r) => [r.name, r.beitraege, r.ms])).toEqual([["Bert", 1, 60_000], ["Anna", 2, 6_000]])
    expect(Math.round(rz[0].anteil * 100)).toBe(91)
  })

  it("schreibt Dauer lesbar", () => {
    expect(dauerText(42_000)).toBe("0:42")
    expect(dauerText(725_000)).toBe("12:05")
    expect(dauerText(3_729_000)).toBe("1:02:09")
  })

  it("das Protokoll als Datei: Name, von bis, Dauer, Text, und die Redezeiten", () => {
    const md = protokollMarkdown(zeilen, { raum: "Garten", teilnehmer: ["Anna", "Bert", "Cara"], zone: "Europe/Berlin" })
    expect(md).toContain("# Protokoll Garten, 01.10.2026")
    expect(md).toContain("**Zeit:** 10:00:00 bis 10:01:08 (1:08)")
    expect(md).toContain("**Dabei:** Anna, Bert, Cara")
    expect(md).toContain("**Bert** · 10:00:05 bis 10:01:05 · 1:00  \nMorgen! Ich habe die Zahlen dabei.")
    expect(md).toContain("| Bert | 1 | 1:00 | 91 % |")
    expect(md).toContain("| Anna | 2 | 0:06 | 9 % |")
    expect(md).not.toContain("Cara |")
  })
})

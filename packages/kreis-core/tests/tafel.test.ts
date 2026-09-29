import { describe, expect, it } from "vitest"
import { strichDazu, standEinmischen, punktRunden, istStrich, TAFEL_GRENZE, type Strich } from "../src"

const strich = (id: string): Strich => ({ id, von: "anna", farbe: "#000", breite: 0.004, punkte: [[0.1, 0.1], [0.2, 0.2]] })

describe("Die Tafel", () => {
  it("ein Strich steht einmal, auch wenn er doppelt ankommt", () => {
    const a = strichDazu([], strich("1"))
    expect(strichDazu(a, strich("1"))).toBe(a)
    expect(strichDazu(a, strich("2"))).toHaveLength(2)
  })

  it("ein Nachzuegler mischt den Stand ein, ohne Doppelte", () => {
    const meine = [strich("1")]
    expect(standEinmischen(meine, [strich("1"), strich("2"), strich("3")]).map((s) => s.id)).toEqual(["1", "2", "3"])
  })

  it("haelt hoechstens die Grenze, die aeltesten gehen zuerst", () => {
    let t: readonly Strich[] = []
    for (let i = 0; i < TAFEL_GRENZE + 5; i++) t = strichDazu(t, strich(String(i)))
    expect(t).toHaveLength(TAFEL_GRENZE)
    expect(t[0].id).toBe("5")
  })

  it("rundet Punkte und haelt sie in der Flaeche", () => {
    expect(punktRunden(0.12345, 1.5)).toEqual([0.123, 1])
    expect(punktRunden(-0.2, 0.5)).toEqual([0, 0.5])
  })

  it("erkennt fremde Nachrichten", () => {
    expect(istStrich(strich("1"))).toBe(true)
    expect(istStrich({ id: "x", punkte: "nein" })).toBe(false)
  })
})

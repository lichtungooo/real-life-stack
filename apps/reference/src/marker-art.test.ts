/**
 * Die Marker je Art (Timo, 01.10.2026): Stiftungen in der Stecknadel mit der
 * gebenden Hand, Projekte rund ohne Spitze in Waldgruen mit Spross. Geprueft
 * mit dem echten Register dieser App; die Naht A-Marker steht in NAEHTE.md.
 */
import { describe, expect, it } from "vitest"
import type { Item } from "@real-life-stack/data-interface"
import { mapLensMarkers, renderMarkerSvg, resolveTypePresentation } from "@real-life-stack/toolkit"
import { musterItems } from "@trustdonation/core/musterdaten"
import "./type-register"

const ort = { type: "Point", coordinates: [9.18, 48.78] }
const item = (type: string, data: Record<string, unknown>, tags?: string[]) =>
  ({ id: `${type}-1`, type, data: { title: "Probe", position: ort, ...data }, tags } as unknown as Item)

describe("Projekte", () => {
  it("tragen ihre Vorgabe: rund, Waldgruen, Spross", () => {
    expect(resolveTypePresentation("project").marker).toEqual({ icon: "sprout", color: "#2E7D5B", shape: "round" })
    const [m] = mapLensMarkers([item("project", {})])
    expect(m).toMatchObject({ shape: "round", color: "#2E7D5B", icon: "sprout" })
  })

  it("lassen sich mit Ort anlegen: der Composer bekommt das Location-Widget", () => {
    const felder = resolveTypePresentation("project").fields ?? []
    expect(felder.find((f) => f.key === "address")?.widget).toBe("location")
  })

  it("eigene Farbe und eigenes Symbol eines Projekts gewinnen gegen die Vorgabe", () => {
    const [m] = mapLensMarkers([item("project", { color: "#123456", icon: "garden" })])
    expect(m).toMatchObject({ color: "#123456", icon: "garden", shape: "round" })
  })
})

describe("Stiftungen", () => {
  it("tragen die gebende Hand und behalten ihr Blau, in der Stecknadel", () => {
    const stiftungen = musterItems.filter((i) => String(i.id).startsWith("stiftung-")) as unknown as Item[]
    expect(stiftungen.length).toBe(234)
    expect(stiftungen.every((s) => (s.data as { icon?: string }).icon === "hands")).toBe(true)
    const [m] = mapLensMarkers(stiftungen.slice(0, 1))
    expect(m.icon).toBe("hands")
    expect(m.color).toBe((stiftungen[0].data as { color: string }).color)
    expect(m.shape).toBeUndefined()
  })
})

describe("Die runde Form", () => {
  it("ist eine Scheibe ohne Spitze, das Symbol in ihrer Mitte", () => {
    const rund = renderMarkerSvg({ color: "#2E7D5B", icon: "sprout", shape: "round" })
    const nadel = renderMarkerSvg({ color: "#2E7D5B", icon: "sprout" })
    expect(rund).toContain('<circle cx="17.5" cy="22.5" r="15"')
    expect(rund).not.toContain("M17.5 2.746")
    expect(nadel).toContain("M17.5 2.746")
    expect(rund).not.toEqual(nadel)
  })
})

/**
 * Die Ordnung der Beispielwelt in echte Spaces (Timo, 30.09.2026: "Unsere
 * gehen vor"). Geprueft am echten Musterbestand, nicht an erfundenen Faellen.
 */
import { describe, expect, it } from "vitest"
import type { Group } from "@real-life-stack/data-interface"
import { netzwerkePlanen } from "../src/netzwerke-uebernehmen"
import { musterGroups } from "../src/musterdaten"

const namen = (plan: ReturnType<typeof netzwerkePlanen>) => plan.schritte.map((s) => s.name)

describe("Unsere Netzwerke übernehmen", () => {
  const plan = netzwerkePlanen(musterGroups, [])

  it("nimmt die Netzwerke, Projekte und die recherchierte Stiftung", () => {
    expect(namen(plan).sort()).toEqual(["Lichtung", "Marker & Maps", "Real Life", "Software AG-Stiftung", "trustdonation"])
  })

  it("lässt Erfundenes in der Demo", () => {
    expect(plan.ausgelassen.map((a) => a.name)).toEqual(["Löwenherz Stiftung"])
  })

  it("legt jedes Netzwerk vor den Spaces an, die auf es verweisen", () => {
    const stelle = new Map(plan.schritte.map((s, i) => [s.musterId, i]))
    for (const s of plan.schritte) {
      if (s.netzwerkVon) expect(stelle.get(s.netzwerkVon)!, s.name).toBeLessThan(stelle.get(s.musterId)!)
    }
    const td = plan.schritte.find((s) => s.name === "trustdonation")!
    expect(plan.schritte.find((s) => s.name === "Lichtung")?.netzwerkVon).toBe(td.musterId)
  })

  it("trägt, was den Space beschreibt, und lässt, was der Connector führt", () => {
    const td = plan.schritte.find((s) => s.name === "trustdonation")!
    expect(td.data.isNetwork).toBe(true)
    expect(td.data.spaceKinds).toBeTruthy()
    expect(td.data.domain).toBe("wir.ooo")
    for (const s of plan.schritte) {
      for (const k of ["scope", "access", "roles", "memberCount", "modules", "network"]) {
        expect(s.data, `${s.name}: ${k}`).not.toHaveProperty(k)
      }
    }
  })

  it("verdoppelt nichts: Was es unter dem Namen schon gibt, bleibt", () => {
    const da = [{ id: "echt-1", name: "trustdonation", data: {} }, { id: "echt-2", name: " real life " , data: {} }] as unknown as Group[]
    const zweiter = netzwerkePlanen(musterGroups, da)
    expect(zweiter.schritte.find((s) => s.name === "trustdonation")?.vorhandenId).toBe("echt-1")
    expect(zweiter.schritte.find((s) => s.name === "Real Life")?.vorhandenId).toBe("echt-2")
    expect(zweiter.schritte.find((s) => s.name === "Lichtung")?.vorhandenId).toBeUndefined()
  })
})

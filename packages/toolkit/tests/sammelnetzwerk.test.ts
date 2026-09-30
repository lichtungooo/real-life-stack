/**
 * Naht A-Sammelnetzwerk (docs/NAEHTE.md). Timo, 30.09.2026: Die Gruppen aus
 * Antons Real Life Stack (etwa Emils) stehen bei uns unter Real Life, auch
 * jede neue. Bei Anton bleiben sie unveraendert: Es wird nichts in sie
 * geschrieben, die Zuordnung geschieht nur in der Anzeige. Wer im eigenen
 * Zahnrad ein Netzwerk waehlt, zieht dorthin um.
 */
import { describe, expect, it } from "vitest"
import type { Group } from "@real-life-stack/data-interface"
import { workspaceOf } from "../src/components/layout/workspace-switcher"

const g = (id: string, name: string, data: Record<string, unknown> = {}) => ({ id, name, data }) as unknown as Group

describe("Das Sammelnetzwerk", () => {
  it("workspaceOf liest adoptsUnassigned nur an einem Netzwerk", () => {
    expect(workspaceOf(g("rl", "Real Life", { isNetwork: true, adoptsUnassigned: "gruppe" })).adoptsUnassigned).toBe("gruppe")
    expect(workspaceOf(g("rl", "Real Life", { isNetwork: true, adoptsUnassigned: true })).adoptsUnassigned).toBe(true)
    expect(workspaceOf(g("x", "Gruppe", { adoptsUnassigned: true })).adoptsUnassigned).toBeUndefined()
    expect(workspaceOf(g("rl", "Real Life", { isNetwork: true, adoptsUnassigned: 5 })).adoptsUnassigned).toBeUndefined()
  })

  it("die Zuordnung steht in workspace-routing, auf der Liste aus workspaceOf", async () => {
    const { readFileSync } = await import("node:fs")
    const quelle = readFileSync(new URL("../src/components/router/workspace-routing.tsx", import.meta.url), "utf-8")
    expect(quelle).toContain("ohneNetzwerkZuordnen(groups.map(workspaceOf))")
  })
})

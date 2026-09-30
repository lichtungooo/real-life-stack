// Was das Anlegen der Netzwerke verspricht, ohne Browser geprueft: jedes
// Netzwerk vor seinen Spaces, der Verweis auf die neue Id, nichts doppelt,
// ein Fehler haelt die uebrigen nicht auf.
import { describe, it, expect, vi } from "vitest"
import type { Group } from "@real-life-stack/data-interface"
import { netzwerkePlanHolen, netzwerkeSchreiben, type NetzwerkeStand } from "../src/netzwerke-import.js"

function attrappe(vorhanden: Group[] = [], scheiternBei?: string) {
  // Wie der WoT-Connector: Beim Anlegen zaehlen nur Name und Module, alles
  // Weitere kommt mit updateGroup.
  const angelegt: { name: string; data: Record<string, unknown>; modules?: unknown; id: string }[] = []
  let n = 0
  const connector = {
    getGroups: vi.fn(async () => vorhanden),
    createGroup: vi.fn(async (name: string, data: Record<string, unknown> = {}) => {
      if (name === scheiternBei) throw new Error("abgelehnt")
      const id = `neu-${++n}`
      angelegt.push({ name, data: {}, modules: data.modules, id })
      return { id, name, data: {} } as unknown as Group
    }),
    updateGroup: vi.fn(async (id: string, u: { data?: Record<string, unknown> }) => {
      const a = angelegt.find((x) => x.id === id)!
      a.data = { ...a.data, ...u.data }
      return { id, name: a.name, data: a.data } as unknown as Group
    }),
  }
  return { connector, angelegt }
}

async function laufen(connector: Parameters<typeof netzwerkePlanHolen>[0], module?: string[]) {
  const plan = await netzwerkePlanHolen(connector)
  const staende: NetzwerkeStand[] = []
  await netzwerkeSchreiben(connector, plan, (s) => staende.push(s), module)
  return staende.at(-1)!
}

describe("Netzwerke anlegen", () => {
  it("legt jedes Netzwerk vor seinen Spaces an und verweist auf die neue Id", async () => {
    const { connector, angelegt } = attrappe()
    const ende = await laufen(connector)
    expect(ende.art).toBe("fertig")
    const td = angelegt.find((a) => a.name === "trustdonation")!
    const lichtung = angelegt.find((a) => a.name === "Lichtung")!
    expect(angelegt.indexOf(td)).toBeLessThan(angelegt.indexOf(lichtung))
    expect(lichtung.data.network).toBe(td.id)
    expect(td.data.isNetwork).toBe(true)
    expect(angelegt.map((a) => a.name)).not.toContain("Löwenherz Stiftung")
  })

  it("gibt jedem neuen Space die Grundausstattung der App mit", async () => {
    const { connector, angelegt } = attrappe()
    await laufen(connector, ["feed", "calendar", "map", "video"])
    for (const a of angelegt) expect(a.modules, a.name).toEqual(["feed", "calendar", "map", "video"])
  })

  it("verdoppelt nichts und verweist auf den schon vorhandenen Space", async () => {
    const { connector, angelegt } = attrappe([{ id: "echt-td", name: "trustdonation", data: {} } as unknown as Group])
    const ende = await laufen(connector)
    expect(angelegt.map((a) => a.name)).not.toContain("trustdonation")
    expect(angelegt.find((a) => a.name === "Lichtung")?.data.network).toBe("echt-td")
    expect(ende.art === "fertig" && ende.vorhanden).toEqual(["trustdonation"])
  })

  it("ein Fehler haelt die uebrigen nicht auf", async () => {
    const { connector, angelegt } = attrappe([], "Marker & Maps")
    const ende = await laufen(connector)
    expect(ende.art === "fertig" && ende.fehler).toEqual(["Marker & Maps"])
    expect(angelegt.map((a) => a.name)).toContain("Lichtung")
  })

  it("ohne createGroup meldet es, statt zu schweigen", async () => {
    const staende: NetzwerkeStand[] = []
    await netzwerkeSchreiben({ getGroups: async () => [] } as never, { schritte: [], ausgelassen: [] }, (s) => staende.push(s))
    expect(staende[0]?.art).toBe("fehler")
  })
})

// Die Musterdaten tragen die Struktur, die der Prototyp zeigt. Was hier
// geprueft wird, ist keine Fuelle, sondern die Form: Ein Netzwerk, das seine
// Arten verloren hat, oder ein Space, der auf ein Netzwerk zeigt, das es nicht
// gibt, macht den Umschalter still kaputt.
import { describe, it, expect } from "vitest"
import { musterdaten, MUSTERDATEN_VERSION } from "../src/musterdaten.js"

describe("Musterdaten", () => {
  const { groups, users, groupMembers, groupItems, items } = musterdaten

  it("bringt die fuenf Spaces aus Timos Umschalter", () => {
    expect(groups.map((g) => g.name).sort()).toEqual([
      "Lichtung",
      "Löwenherz Stiftung",
      "Marker & Maps",
      "Real Life",
      "trustdonation",
    ])
  })

  it("fuehrt trustdonation als Netzwerk mit den Arten Projekt und Stiftung", () => {
    const netz = groups.find((g) => g.name === "trustdonation")
    expect(netz?.data?.isNetwork).toBe(true)
    const arten = (netz?.data?.spaceKinds as Array<{ id: string }> | undefined) ?? []
    expect(arten.map((a) => a.id).sort()).toEqual(["projekt", "stiftung"])
  })

  it("laesst keinen Space auf ein Netzwerk zeigen, das es nicht gibt", () => {
    const ids = new Set(groups.map((g) => g.id))
    for (const g of groups) {
      const netz = g.data?.network
      if (typeof netz === "string") {
        expect(ids.has(netz), `${g.name} zeigt auf ${netz}`).toBe(true)
      }
    }
  })

  it("gibt jedem Space eine Art, die sein Netzwerk kennt", () => {
    const artenVon = new Map(
      groups.map((g) => [
        g.id,
        new Set(((g.data?.spaceKinds as Array<{ id: string }> | undefined) ?? []).map((a) => a.id)),
      ]),
    )
    for (const g of groups) {
      const netz = g.data?.network
      const art = g.data?.kind
      if (typeof netz === "string" && typeof art === "string") {
        expect(artenVon.get(netz)?.has(art), `${g.name}: Art ${art} fehlt im Netzwerk`).toBe(true)
      }
    }
  })

  it("kennt jedes Mitglied und jedes zugeordnete Item", () => {
    const userIds = new Set(users.map((u) => u.id))
    const itemIds = new Set(items.map((i) => i.id))
    for (const [gruppe, mitglieder] of Object.entries(groupMembers)) {
      expect(groups.some((g) => g.id === gruppe), `Mitglieder fuer unbekannte Gruppe ${gruppe}`).toBe(true)
      for (const m of mitglieder) expect(userIds.has(m), `Unbekanntes Mitglied ${m}`).toBe(true)
    }
    for (const [gruppe, eintraege] of Object.entries(groupItems)) {
      expect(groups.some((g) => g.id === gruppe), `Items fuer unbekannte Gruppe ${gruppe}`).toBe(true)
      for (const i of eintraege) expect(itemIds.has(i), `Unbekanntes Item ${i}`).toBe(true)
    }
  })

  it("liegt kein Item in zwei Spaces", () => {
    // Der Connector laesst mehrdeutige Items in der Uebersicht bewusst weg.
    // Ein Ort, der in zwei Spaces steht, verschwindet dort spurlos.
    const zahl = new Map<string, number>()
    for (const eintraege of Object.values(groupItems)) {
      for (const i of eintraege) zahl.set(i, (zahl.get(i) ?? 0) + 1)
    }
    const doppelt = [...zahl.entries()].filter(([, n]) => n > 1).map(([id]) => id)
    expect(doppelt).toEqual([])
  })

  it("traegt eine Version, die mit den Daten hochgeht", () => {
    expect(MUSTERDATEN_VERSION).toBeGreaterThan(0)
  })
})

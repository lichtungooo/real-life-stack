// Die Musterdaten tragen die Struktur, die der Prototyp zeigt. Was hier
// geprüft wird, ist keine Fuelle, sondern die Form: Ein Netzwerk, das seine
// Arten verloren hat, oder ein Space, der auf ein Netzwerk zeigt, das es nicht
// gibt, macht den Umschalter still kaputt.
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { describe, it, expect } from "vitest"
import { musterdaten, MUSTERDATEN_VERSION } from "../src/musterdaten.js"

const __dirname = dirname(fileURLToPath(import.meta.url))

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
    // Der Connector lässt mehrdeutige Items in der Übersicht bewusst weg.
    // Ein Ort, der in zwei Spaces steht, verschwindet dort spurlos.
    const zahl = new Map<string, number>()
    for (const eintraege of Object.values(groupItems)) {
      for (const i of eintraege) zahl.set(i, (zahl.get(i) ?? 0) + 1)
    }
    const doppelt = [...zahl.entries()].filter(([, n]) => n > 1).map(([id]) => id)
    expect(doppelt).toEqual([])
  })

  it("legt keine zwei Orte exakt aufeinander", () => {
    // Timo beim ersten Blick auf die Karte: "Die stehen alle an einem Punkt,
    // übereinander. Also ich sehe gar nicht, wie viele Stiftungen das sind."
    //
    // Ursache war die Stadtmitte als Koordinate für alle. Wer sich einen Ort
    // teilt, bekommt jetzt einen festen kleinen Versatz. Deckungsgleiche
    // Punkte lassen sich auch beim Aufklappen nicht auseinanderhalten.
    const orte = new Map<string, string[]>()
    for (const i of items) {
      const pos = (i.data as { position?: { coordinates?: number[] } })?.position
      if (!pos?.coordinates) continue
      const schluessel = pos.coordinates.map((c) => c.toFixed(5)).join(",")
      const liste = orte.get(schluessel) ?? []
      liste.push((i.data as { title?: string }).title ?? i.id)
      orte.set(schluessel, liste)
    }
    const doppelt = [...orte.entries()].filter(([, namen]) => namen.length > 1)
    expect(doppelt.map(([ort, namen]) => `${ort}: ${namen.join(", ")}`)).toEqual([])
  })

  it("gibt jeder Stiftung die Farbe ihrer Art", () => {
    // Antons getItemColor nimmt die Farbe des ersten Tags, wenn data.color
    // fehlt. Unsere Items tragen dort ihr Thema, und jede Stiftung bekam eine
    // andere Farbe. Eine Stiftung soll als Stiftung erkennbar sein.
    const stiftungen = items.filter((i) => String(i.id).startsWith("stiftung-"))
    expect(stiftungen.length).toBeGreaterThan(200)
    const farben = new Set(stiftungen.map((i) => (i.data as { color?: string }).color))
    expect(farben).toEqual(new Set(["#194294"]))
  })

  it("traegt eine Version, die mit den Daten hochgeht", () => {
    expect(MUSTERDATEN_VERSION).toBeGreaterThan(0)
  })

  it("bindet MUSTERDATEN_VERSION an SEED_VERSION", () => {
    const connectorPath = join(__dirname, "../../local-connector/src/local-connector.ts")
    const quelle = readFileSync(connectorPath, "utf8")
    const treffer = /export const SEED_VERSION = (\d+)/.exec(quelle)
    expect(treffer).not.toBeNull()
    const seedVersion = Number(treffer?.[1])
    expect(seedVersion).toBe(MUSTERDATEN_VERSION)
  })
})

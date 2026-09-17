// Die Ordnung des Umschalters ist eine Liste, und Listen laufen auseinander.
// Darum steht jede Regel aus Spec 11 hier als eigener Fall.
import { describe, it, expect } from "vitest"
import { ordneSpaces, gliedereNachArt } from "../src/space-ordnung.js"

const uebersicht = { id: "__overview__" }
const netz = (id: string) => ({ id, isNetwork: true })
const space = (id: string) => ({ id })

describe("ordneSpaces", () => {
  it("stellt das Start-Netzwerk ganz nach vorn", () => {
    const liste = [space("a"), netz("n1"), netz("n2"), space("b")]
    expect(ordneSpaces(liste, uebersicht, "n2").map((w) => w.id))
      .toEqual(["n2", "__overview__", "n1", "a", "b"])
  })

  it("laesst ein Start-Netzwerk still weg, das nicht in der Liste steht", () => {
    // Der Mensch ist dort kein Mitglied. Ein Eintrag, der ins Leere führt,
    // wäre schlimmer als keiner.
    const liste = [netz("n1"), space("a")]
    expect(ordneSpaces(liste, uebersicht, "fremd").map((w) => w.id))
      .toEqual(["__overview__", "n1", "a"])
  })

  it("macht die Uebersicht zum Anfang, wenn kein Start-Netzwerk gesetzt ist", () => {
    const liste = [netz("n1"), space("a")]
    expect(ordneSpaces(liste, uebersicht).map((w) => w.id))
      .toEqual(["__overview__", "n1", "a"])
  })

  it("haelt die Reihenfolge der uebrigen Netzwerke, wie sie kam", () => {
    const liste = [netz("n3"), netz("n1"), netz("n2")]
    expect(ordneSpaces(liste, uebersicht, "n1").map((w) => w.id))
      .toEqual(["n1", "__overview__", "n3", "n2"])
  })

  it("kommt mit einer Liste ohne Netzwerke zurecht", () => {
    const liste = [space("a"), space("b")]
    expect(ordneSpaces(liste, uebersicht).map((w) => w.id))
      .toEqual(["__overview__", "a", "b"])
  })

  it("kommt mit einer leeren Liste zurecht", () => {
    expect(ordneSpaces([], uebersicht).map((w) => w.id)).toEqual(["__overview__"])
  })

  it("nimmt einen Space, der Netzwerk und Mitglied zugleich ist, nur einmal", () => {
    // Die Lichtung ist ein Projekt in trustdonation und selbst ein Netzwerk.
    // Sie gehört in den Abschnitt Netzwerke, nicht zusaetzlich nach unten.
    const lichtung = { id: "lichtung", isNetwork: true, kind: "projekt" }
    const liste = [lichtung, space("a")]
    const raus = ordneSpaces(liste, uebersicht)
    expect(raus.filter((w) => w.id === "lichtung")).toHaveLength(1)
  })
})

describe("gliedereNachArt", () => {
  const arten = [
    { id: "stiftung", labelPlural: "Stiftungen" },
    { id: "projekt", labelPlural: "Projekte" },
  ]

  it("gliedert in der Reihenfolge der Arten des Netzwerks", () => {
    const spaces = [
      { id: "p1", kind: "projekt" },
      { id: "s1", kind: "stiftung" },
      { id: "p2", kind: "projekt" },
    ]
    const raus = gliedereNachArt(spaces, arten)
    expect(raus.arten.map((a) => a.id)).toEqual(["stiftung", "projekt"])
    expect(raus.arten[1].spaces.map((s) => s.id)).toEqual(["p1", "p2"])
  })

  it("laesst einen Abschnitt ohne Spaces weg", () => {
    const raus = gliedereNachArt([{ id: "s1", kind: "stiftung" }], arten)
    expect(raus.arten.map((a) => a.id)).toEqual(["stiftung"])
  })

  it("stellt Spaces ohne Art zuletzt", () => {
    const raus = gliedereNachArt([{ id: "a" }, { id: "s1", kind: "stiftung" }], arten)
    expect(raus.ohneArt.map((s) => s.id)).toEqual(["a"])
  })

  it("behaelt eine unbekannte Art, statt den Space zu verlieren", () => {
    // Sie stammt aus einer anderen Version oder einem anderen Netzwerk.
    // Muster 5: Unbekanntes bleibt erhalten und fällt sichtbar zurück.
    const raus = gliedereNachArt([{ id: "x", kind: "kaffeetanten" }], arten)
    expect(raus.arten).toEqual([])
    expect(raus.ohneArt.map((s) => s.id)).toEqual(["x"])
  })

  it("kommt mit einem Netzwerk ohne Arten zurecht", () => {
    const raus = gliedereNachArt([{ id: "a", kind: "projekt" }], [])
    expect(raus.arten).toEqual([])
    expect(raus.ohneArt.map((s) => s.id)).toEqual(["a"])
  })
})

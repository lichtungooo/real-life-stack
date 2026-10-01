// Die Erweiterungen (DEFINITION Teil 8). Getestet werden die Listen, denn
// genau dort laufen Dinge auseinander.
import { describe, expect, it } from "vitest"
import { ERWEITERUNGEN, erweiterungenAus, modulSchalten } from "../src/erweiterungen"

describe("Erweiterungen aus Antons Register und unserem Verzeichnis", () => {
  it("Regel 1: das Register sagt, welche es gibt, in seiner Reihenfolge", () => {
    const e = erweiterungenAus([{ id: "map", label: "Karte" }, { id: "feed", label: "Feed" }])
    expect(e.map((x) => x.id)).toEqual(["map", "feed"])
    expect(e[0]).toMatchObject({ name: "Karte", reife: "geprueft", bekannt: true })
    expect(e[0].beschreibung).toBeTruthy()
  })

  it("Regel 2: ein Modul ohne Eintrag erscheint trotzdem, als Beta ohne Beschreibung", () => {
    const [x] = erweiterungenAus([{ id: "fremd", label: "Fremdes Modul" }])
    expect(x).toMatchObject({ id: "fremd", name: "Fremdes Modul", reife: "beta", bekannt: false, beschreibung: null, erbauer: null, art: "modul" })
  })

  it("Regel 3: ein Eintrag ohne Modul im Register erscheint nicht", () => {
    expect(erweiterungenAus([{ id: "feed", label: "Feed" }]).map((x) => x.id)).toEqual(["feed"])
  })

  it("Circeling steht in Beta, bis es durch das Testing ist; jede Id nur einmal", () => {
    expect(ERWEITERUNGEN.find((e) => e.id === "video")?.reife).toBe("beta")
    const ids = ERWEITERUNGEN.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("keine Bewertung: die Reife kennt genau zwei Werte", () => {
    expect(new Set(ERWEITERUNGEN.map((e) => e.reife))).toEqual(new Set(["geprueft", "beta"]))
  })
})

describe("Ein Modul in den Space nehmen", () => {
  const vorgaben = ["feed", "calendar", "map", "video"]

  it("nimmt dazu und heraus, auf der gespeicherten Liste", () => {
    expect(modulSchalten(["feed"], vorgaben, "map", true)).toEqual(["feed", "map"])
    expect(modulSchalten(["feed", "map"], vorgaben, "feed", false)).toEqual(["map"])
  })

  it("ohne eigene Liste beginnt es bei den Vorgaben", () => {
    expect(modulSchalten(undefined, vorgaben, "kanban", true)).toEqual([...vorgaben, "kanban"])
  })

  it("Regel 4: Ids, die die Instanz nicht kennt, bleiben stehen", () => {
    expect(modulSchalten(["feed", "fremd"], vorgaben, "map", true)).toEqual(["feed", "fremd", "map"])
  })

  it("aendert sich nichts, kommt dieselbe Liste zurueck", () => {
    const liste = ["feed"]
    expect(modulSchalten(liste, vorgaben, "feed", true)).toBe(liste)
  })
})

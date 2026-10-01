/**
 * Profil-Entwürfe über den eigenen Agenten (DEFINITION 13.6): eine
 * Feldliste, dieselbe Schleuse wie beim Anzeigen, nichts geht verloren,
 * ohne dass der Bericht es sagt.
 */
import { describe, expect, it } from "vitest"
import {
  PROJEKT_PROFIL_FELDER,
  projektEntwurfPruefen,
  entwurfKodieren,
  entwurfLesen,
  ortAus,
  ENTWURF_HOECHSTENS,
} from "../src/projekt-entwurf"
import { projektProfil } from "../src/projekt-profil"
import { musterItems } from "../src/musterdaten"

const muster = musterItems.find((i) => i.id === "projekt-gruenes-klassenzimmer")!

describe("Die eine Feldliste", () => {
  it("jede Id kommt einmal vor, jede hat Frage und Hinweis", () => {
    const ids = PROJEKT_PROFIL_FELDER.map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const f of PROJEKT_PROFIL_FELDER) {
      expect(f.frage, f.id).toMatch(/\?$/)
      expect(f.hinweis.length, f.id).toBeGreaterThan(3)
    }
  })

  it("das Musterprojekt trägt jedes Feld der Liste, und die Schleuse liest es", () => {
    const daten = muster.data as Record<string, unknown>
    for (const f of PROJEKT_PROFIL_FELDER) {
      if (f.id === "tags") continue // steht in Item.tags
      expect(daten[f.id], f.id).toBeDefined()
    }
    const b = projektEntwurfPruefen({ ...daten, tags: muster.tags })
    expect(b.fehlt).toEqual([])
    expect(b.verworfen).toEqual([])
    expect(b.zeigt).toEqual(expect.arrayContaining(["Kopf", "Kennzahlen", "Unterstützen", "Was fehlt", "Bilder", "Kontakt"]))
  })
})

describe("Prüfen", () => {
  it("nennt fehlende Kernfelder mit ihrer Frage", () => {
    const b = projektEntwurfPruefen({ title: "Bachpaten" })
    expect(b.fehlt.map((f) => f.id)).toEqual(["kurz", "beduerfnis", "address"])
    expect(b.fehlt[0].frage).toMatch(/\?$/)
  })

  it("verwirft unsichere Adressen und sagt es", () => {
    const b = projektEntwurfPruefen({
      title: "X", bilder: ["javascript:alert(1)", "https://x.org/a.jpg"],
      kontakt: { website: "javascript:x", mail: "keine" }, spende: { ziel: 100, opencollective: "javascript:y" },
    })
    expect(b.entwurf.daten.bilder).toEqual(["https://x.org/a.jpg"])
    expect(b.entwurf.daten.kontakt).toBeUndefined()
    expect((b.entwurf.daten.spende as Record<string, unknown>).opencollective).toBeUndefined()
    expect(b.verworfen.join(" ")).toMatch(/bilder.*javascript/)
    expect(b.verworfen.join(" ")).toMatch(/kontakt\.mail/)
    expect(b.verworfen.join(" ")).toMatch(/kontakt\.website/)
    expect(b.verworfen.join(" ")).toMatch(/spende\.opencollective/)
  })

  it("unbekannte Felder bleiben liegen und werden gemeldet", () => {
    const b = projektEntwurfPruefen({ title: "X", eigenesFeld: { a: 1 } })
    expect(b.unbekannt).toEqual(["eigenesFeld"])
    expect(b.entwurf.daten.eigenesFeld).toEqual({ a: 1 })
  })

  it("Schlagworte wandern nach Item.tags, ohne # und ohne Dopplung", () => {
    const b = projektEntwurfPruefen({ title: "X", tags: ["#Garten", "Garten", "Kinder", 3] })
    expect(b.entwurf.tags).toEqual(["Garten", "Kinder"])
    expect(b.entwurf.daten.tags).toBeUndefined()
  })

  it("kaputter Entwurf wirft nicht", () => {
    for (const roh of [null, 3, "text", [1, 2]]) {
      const b = projektEntwurfPruefen(roh)
      expect(b.entwurf.daten).toEqual({})
      expect(b.verworfen.length).toBeGreaterThan(0)
    }
  })

  it("Ort: lat/lng oder GeoJSON, sonst nichts", () => {
    expect(ortAus({ lat: 51.3, lng: 9.5 })).toEqual({ type: "Point", coordinates: [9.5, 51.3] })
    expect(ortAus({ type: "Point", coordinates: [9.5, 51.3] })).toEqual({ type: "Point", coordinates: [9.5, 51.3] })
    expect(ortAus({ lat: 200, lng: 9 })).toBeNull()
    expect(ortAus({ lat: "51", lng: 9 })).toBeNull()
  })

  it("was gespeichert wird, zeigt dasselbe wie der Entwurf", () => {
    const daten = muster.data as Record<string, unknown>
    const b = projektEntwurfPruefen({ ...daten, tags: muster.tags })
    expect(projektProfil(b.entwurf.daten, b.entwurf.tags)).toEqual(projektProfil(daten, muster.tags ?? []))
  })
})

describe("Im Fragment des Links", () => {
  it("hin und zurück, mit Umlauten", () => {
    const b = projektEntwurfPruefen({ title: "Grünes Klassenzimmer", kurz: "Kinder gärtnern – draußen.", tags: ["Schulgarten"] })
    const f = entwurfKodieren(b.entwurf)
    expect(f).toMatch(/^projekt-entwurf=[A-Za-z0-9_-]+$/)
    const zurueck = entwurfLesen("#" + f)!
    expect(zurueck.entwurf).toEqual(b.entwurf)
  })

  it("fremdes oder kaputtes Fragment ergibt null", () => {
    expect(entwurfLesen("#etwas-anderes")).toBeNull()
    expect(entwurfLesen("#projekt-entwurf=%%%")).toBeNull()
    expect(entwurfLesen("#projekt-entwurf=" + btoa(JSON.stringify({ v: 2 })))).toBeNull()
  })

  it("lehnt zu große Entwürfe ab", () => {
    expect(() => entwurfKodieren({ daten: { description: "x".repeat(ENTWURF_HOECHSTENS) }, tags: [] })).toThrow(/zu groß/)
  })

  it("ein gelesener Entwurf geht noch einmal durch die Schleuse", () => {
    // Jemand baut das Fragment von Hand, an der Prüfung vorbei.
    const json = JSON.stringify({ v: 1, daten: { title: "X", bilder: ["javascript:alert(1)"] }, tags: [] })
    const kette = btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
    const b = entwurfLesen("projekt-entwurf=" + kette)!
    expect(b.entwurf.daten.bilder).toBeUndefined()
    expect(b.verworfen.length).toBe(1)
  })
})

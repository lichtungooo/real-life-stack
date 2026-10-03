/**
 * Profile aus dem Gespräch (DEFINITION 13.8): Stiftung und Einrichtung neben
 * dem Projekt; geprüft wie beim Bearbeiten, im Fragment für alle drei Arten.
 */
import { describe, expect, it } from "vitest"
import {
  EINRICHTUNGS_PROFIL_FELDER, PROFIL_ARTEN, PROFIL_ART_REGELN, einrichtungEntwurfPruefen,
  profilEntwurfKodieren, profilEntwurfLesen, stiftungEntwurfPruefen,
} from "../src/profil-entwurf"
import { entwurfLesen } from "../src/projekt-entwurf"
import { bauplanFuer, BAUPLAN_PROJEKT, traegtProfil } from "../src/profil"

const stiftung = {
  title: "Stiftung Grünes Tal", foerdererart: "Stiftung", kurz: "Fördert Naturschutz mit Kindern.",
  schwerpunkte: [{ titel: "Bäche", text: "Bachpatenschaften" }, { text: "ohne Titel" }],
  website: "javascript:alert(1)", address: "Hauptstraße 1, 34117 Kassel", position: { lat: 51.3, lng: 9.5 },
  fremd: 1, __proto__x: 2,
}

describe("Stiftung", () => {
  it("bereinigt wie das Formular, nennt Weggelassenes, behält Unbekanntes", () => {
    const b = stiftungEntwurfPruefen(stiftung)
    expect(b.entwurf.daten.title).toBe("Stiftung Grünes Tal")
    expect(b.entwurf.daten.position).toEqual({ type: "Point", coordinates: [9.5, 51.3] })
    expect(b.verworfen.join(" ")).toMatch(/Website/)
    expect(b.verworfen.join(" ")).toMatch(/ohne „Schwerpunkt“/)
    expect(b.unbekannt).toContain("fremd")
    expect(b.fehlt).toEqual([])
    expect(b.zeigt).toEqual(expect.arrayContaining(["Kopf", "Was sie fördert"]))
  })

  it("ohne Art fehlt ein Kernfeld", () => {
    expect(stiftungEntwurfPruefen({ title: "X" }).fehlt.map((f) => f.id)).toEqual(["foerdererart"])
  })
})

describe("Einrichtung", () => {
  const verein = {
    kurz: "Wir reparieren Fahrräder mit Jugendlichen.", beduerfnis: "Im Viertel fehlt ein Ort zum Schrauben.",
    themen: ["#Mobilität", "Jugend", ""], wirkung: ["Jugendliche lernen ein Handwerk", " "], gemeinnuetzig: true,
    mail: "kein", gegruendet: "2019", meilensteine: ["2019: Gegründet"],
  }
  it("speichert, was die Profil-Collage zeigt, mit kind = projekt", () => {
    const b = einrichtungEntwurfPruefen(verein)
    expect(b.entwurf.daten).toMatchObject({ kind: "projekt", themen: ["Mobilität", "Jugend"], wirkung: ["Jugendliche lernen ein Handwerk"], gemeinnuetzig: true })
    expect(b.verworfen.join(" ")).toMatch(/Mail/)
    expect(bauplanFuer(b.entwurf.daten)).toBe(BAUPLAN_PROJEKT)
    expect(traegtProfil(b.entwurf.daten)).toBe(true)
    expect(b.zeigt).toEqual(expect.arrayContaining(["Kopf", "Worum es geht", "Geschichte", "Rechtliches"]))
  })

  it("jedes Feld der Liste steht im Bauplan der Collage oder ist Ort, Bild, Geschichte", () => {
    const imBauplan = new Set([...BAUPLAN_PROJEKT.einordnung.map((f) => f.id), ...BAUPLAN_PROJEKT.kacheln.flatMap((k) => k.felder.map((f) => f.id)),
      BAUPLAN_PROJEKT.gegruendetFeld, BAUPLAN_PROJEKT.meilensteineFeld, BAUPLAN_PROJEKT.ortFeld, BAUPLAN_PROJEKT.anschriftFeld, BAUPLAN_PROJEKT.bildFeld])
    expect(EINRICHTUNGS_PROFIL_FELDER.map((f) => f.id).filter((id) => !imBauplan.has(id))).toEqual([])
  })
})

describe("Im Fragment", () => {
  it("jede Art hin und zurück; das Projekt bleibt lesbar wie bisher", () => {
    for (const art of PROFIL_ARTEN) {
      const roh = art === "projekt" ? { title: "P", kurz: "k", beduerfnis: "b", address: "a" } : art === "stiftung" ? { title: "S", foerdererart: "Stiftung" } : { kurz: "k", beduerfnis: "b" }
      const f = profilEntwurfKodieren(art, { daten: roh, tags: [] })
      const gelesen = profilEntwurfLesen(f)!
      expect(gelesen.art).toBe(art)
      expect(gelesen.bericht.fehlt).toEqual([])
      if (art === "projekt") expect(entwurfLesen(f)?.entwurf.daten.title).toBe("P")
    }
    expect(profilEntwurfLesen("#etwas-anderes=1")).toBeNull()
    expect(Object.keys(PROFIL_ART_REGELN)).toEqual([...PROFIL_ARTEN])
  })
})

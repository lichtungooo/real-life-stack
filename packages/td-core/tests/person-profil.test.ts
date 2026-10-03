/** Das Profil eines Menschen (DEFINITION 9.1): Stufen je Angabe, ehrlich wer es heute sieht. */
import { describe, expect, it } from "vitest"
import { MUSTER_PERSON, oeffentlichesProfil, personProfil, sichtbarkeit, sichtbarkeitSetzen, werSiehtHeute } from "../src/person-profil"
import { personEntwurfPruefen } from "../src/profil-entwurf"

describe("Sichtbarkeit", () => {
  it("Vorgabe: Name öffentlich, alles andere nur für mich; Telefon nie öffentlich", () => {
    expect(sichtbarkeit({}, "displayName")).toBe("oeffentlich")
    expect(sichtbarkeit({}, "bio")).toBe("privat")
    expect(sichtbarkeit({ sichtbar: { telefon: "oeffentlich" } }, "telefon")).toBe("kontakte")
    expect(sichtbarkeitSetzen({ x: 1 }, "telefon", "oeffentlich")).toEqual({ x: 1, sichtbar: { telefon: "kontakte" } })
    expect(sichtbarkeitSetzen({ sichtbar: { bio: "privat" } }, "bio", "oeffentlich").sichtbar).toEqual({ bio: "oeffentlich" })
    expect(sichtbarkeitSetzen({}, "unbekannt", "oeffentlich")).toEqual({})
  })

  it("sagt ehrlich, wer es heute sieht", () => {
    expect(werSiehtHeute("bio", "oeffentlich")).toBe("alle")
    expect(werSiehtHeute("kann", "oeffentlich")).toBe("nur du")
    expect(werSiehtHeute("bio", "kontakte")).toBe("nur du")
  })
})

describe("Ansicht", () => {
  it("die öffentliche Ansicht zeigt nur, was öffentlich ist", () => {
    const o = personProfil(MUSTER_PERSON, "oeffentlich")
    expect(o.ueber).toBeTruthy()
    expect(o.kann).toEqual(["Holzbau", "Moderation", "Förderanträge"])
    expect(o.bietet).toEqual([])
    expect(personProfil(MUSTER_PERSON, "ich").bietet.length).toBe(2)
  })

  it("an Antons Profil gehen Name immer, Über mich und Bild nur öffentlich", () => {
    expect(oeffentlichesProfil({ displayName: "Timo", bio: "geheim", avatarUrl: "https://x.org/a.png" })).toEqual({ name: "Timo", bio: "" })
    expect(oeffentlichesProfil({ displayName: "Timo", bio: "offen", sichtbar: { bio: "oeffentlich" } })).toEqual({ name: "Timo", bio: "offen" })
  })
})

describe("Entwurf eines Menschen", () => {
  it("behält gültige Stufen, Telefon nie öffentlich, meldet Unbekanntes", () => {
    const b = personEntwurfPruefen({ displayName: "Timo", kurz: "Ich baue Netzwerke.", telefon: "0123", sichtbar: { bio: "oeffentlich", telefon: "oeffentlich", quatsch: "x" } })
    expect(b.entwurf.daten.sichtbar).toEqual({ bio: "oeffentlich", telefon: "kontakte" })
    expect(b.verworfen.join(" ")).toMatch(/sichtbar/)
    expect(b.fehlt).toEqual([])
    expect(b.zeigt).toContain("Kopf")
  })
})

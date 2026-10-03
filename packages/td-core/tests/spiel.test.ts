/** Das Real Life Game (DEFINITION Teil 14): Kurve, Quest, Spielstand nur aus bestätigten Teilnahmen. */
import { describe, expect, it } from "vitest"
import { SPIELPAKET_MACHER, bereichsKette, bezeugt, questAus, spielstand, stufeAus, teilnahmeAus, xpFuerStufe, type Bestaetigung } from "../src/spiel"

describe("Stufe aus XP", () => {
  it("die Kurve aus dem rln-Bestand", () => {
    expect([1, 2, 3, 5, 11].map(xpFuerStufe)).toEqual([0, 100, 283, 800, 3163])
    expect(stufeAus(0)).toMatchObject({ stufe: 1, inStufe: 0, stufeBreite: 100, anteil: 0 })
    expect(stufeAus(150)).toMatchObject({ stufe: 2, inStufe: 50, stufeBreite: 183 })
    expect(stufeAus(-5).stufe).toBe(1)
    expect(stufeAus(Number.NaN).xp).toBe(0)
  })
})

describe("Quest und Teilnahme", () => {
  it("unbekannte Bereiche und Unsinn fallen weg, XP gedeckelt", () => {
    const q = questAus("q1", { title: "Hochbeet bauen", belohnung: [{ bereich: "holz-moebelbau", xp: 25 }, { bereich: "mond", xp: 99 }, { bereich: "garten", xp: 9999 }, { bereich: "holz", xp: -3 }], lohn: ["Gemüse", ""], bestaetigtVon: "boese" })!
    expect(q.belohnung).toEqual([{ bereich: "holz-moebelbau", xp: 25 }, { bereich: "garten", xp: 500 }])
    expect(q.lohn).toEqual(["Gemüse"])
    expect(q.bestaetigtVon).toBe("gastgeber")
    expect(questAus("x", { beschreibung: "ohne Titel" })).toBeNull()
    expect(teilnahmeAus("t", { quest: "q1" })).toBeNull()
  })
  it("ein Bereich kennt seine Oberbereiche", () => {
    expect(bereichsKette(SPIELPAKET_MACHER, "holz-moebelbau")).toEqual(["holz-moebelbau", "holz"])
    expect(bereichsKette(SPIELPAKET_MACHER, "unbekannt")).toEqual([])
  })
})

describe("Spielstand", () => {
  const quests = [
    questAus("q1", { title: "Hochbeet", belohnung: [{ bereich: "holz-moebelbau", xp: 25 }, { bereich: "garten-gemuese", xp: 10 }] })!,
    questAus("q2", { title: "Workshop leiten", belohnung: [{ bereich: "gemeinschaft-lehren", xp: 50 }] })!,
  ]
  const teilnahmen = [
    teilnahmeAus("t1", { quest: "q1", person: "mira", stand: "gemeldet" })!,
    teilnahmeAus("t2", { quest: "q2", person: "mira", stand: "gemeldet" })!,
    teilnahmeAus("t3", { quest: "q1", person: "jan", stand: "gemeldet" })!,
  ]
  const signiert = (subjectId: string, issuerId = "gastgeber"): Bestaetigung => ({ subjectId, issuerId, trustLevel: "signed-attested" })

  it("nur bestätigte Teilnahmen zählen, in Bereich, Oberbereich, gesamt und Attribut", () => {
    const s = spielstand({ person: "mira", quests, teilnahmen, bestaetigungen: [signiert("t1")] })
    expect(s.gesamt.xp).toBe(35)
    expect(s.bereiche["holz-moebelbau"].xp).toBe(25)
    expect(s.bereiche.holz.xp).toBe(25)
    expect(s.bereiche.garten.xp).toBe(10)
    expect(s.attribute.find((a) => a.id === "handwerk")!.stand.xp).toBe(25)
    expect(s.wartend).toBe(1)
    expect(s.quests.map((q) => q.stand)).toEqual(["bestaetigt", "gemeldet"])
  })

  it("niemand bestätigt sich selbst; Demo zählt nur in der Beispielwelt; attests über Relation", () => {
    expect(spielstand({ person: "mira", quests, teilnahmen, bestaetigungen: [signiert("t1", "mira")] }).gesamt.xp).toBe(0)
    const demo: Bestaetigung = { subjectId: "t2", issuerId: "x", trustLevel: "demo" }
    expect(spielstand({ person: "mira", quests, teilnahmen, bestaetigungen: [demo] }).gesamt.xp).toBe(0)
    expect(spielstand({ person: "mira", quests, teilnahmen, bestaetigungen: [demo], beispielwelt: true }).gesamt.xp).toBe(50)
    expect(bezeugt({ subjectId: "mira", issuerId: "x", trustLevel: "signed-attested", relations: [{ predicate: "attests", target: "t1" }] }, teilnahmen[0])).toBe(true)
  })

  it("eine Quest zählt einmal, auch bei doppelter Teilnahme", () => {
    const doppelt = [...teilnahmen, teilnahmeAus("t4", { quest: "q1", person: "mira", stand: "gemeldet" })!]
    expect(spielstand({ person: "mira", quests, teilnahmen: doppelt, bestaetigungen: [signiert("t1"), signiert("t4")] }).gesamt.xp).toBe(35)
  })
})

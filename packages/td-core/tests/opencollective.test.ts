/**
 * Der Baustein Open Collective (DEFINITION Teil 8): aus der öffentlichen
 * Antwort ein geprüfter Stand; nur öffentliche Zahlen, bei Eingängen keine
 * Namen; fremde Daten gehen durch die Schleuse.
 */
import { describe, expect, it } from "vitest"
import antwort from "./vorlagen/oc-webpack.json"
import { ocBetrag, ocName, ocSpende, ocStandAus, ocStandAusAntwort, ocZiel } from "../src/opencollective"

const jetzt = new Date("2026-10-03T12:00:00Z")

describe("Der Name einer Seite", () => {
  it("aus Adressen mit und ohne Schema, mit Unterseiten", () => {
    expect(ocName("https://opencollective.com/real-life")).toBe("real-life")
    expect(ocName("opencollective.com/Real-Life/donate")).toBe("real-life")
    expect(ocName("https://opencollective.com/real-life?ref=web")).toBe("real-life")
  })

  it("nur Open Collective, nur gültige Namen", () => {
    expect(ocName("https://example.org/real-life")).toBeNull()
    expect(ocName("https://opencollective.com/")).toBeNull()
    expect(ocName("https://opencollective.com/a b")).toBeNull()
    expect(ocName("javascript:alert(1)")).toBeNull()
    expect(ocName(undefined)).toBeNull()
  })
})

describe("Der Stand aus der Antwort", () => {
  const stand = ocStandAusAntwort(antwort, "webpack", jetzt)!

  it("Zahlen in ganzen Beträgen, Ausgaben positiv", () => {
    expect(stand.titel).toBe("webpack")
    expect(stand.waehrung).toBe("USD")
    expect(stand.eingegangen).toBeGreaterThan(1_000_000)
    expect(stand.ausgegeben).toBeGreaterThan(0)
    expect(stand.unterstuetzende).toBeGreaterThan(100)
    expect(stand.adresse).toBe("https://opencollective.com/webpack")
    expect(stand.stand).toBe("2026-10-03T12:00:00.000Z")
  })

  it("Ausgaben mit Beschreibung, Eingänge ohne Namen", () => {
    expect(stand.ausgaben.length).toBeGreaterThan(0)
    expect(stand.ausgaben[0]).toMatchObject({ was: expect.any(String), betrag: expect.any(Number) })
    for (const e of stand.eingaenge) expect(Object.keys(e).sort()).toEqual(["betrag", "wann"])
  })

  it("ohne Konto kein Stand", () => {
    expect(ocStandAusAntwort({ data: { account: null } }, "gibtsnicht")).toBeNull()
    expect(ocStandAusAntwort("kaputt", "x")).toBeNull()
  })
})

describe("Nachprüfen, was der Dienst schickt", () => {
  it("ein gültiger Stand kommt heil durch", () => {
    const stand = ocStandAusAntwort(antwort, "webpack", jetzt)!
    expect(ocStandAus(JSON.parse(JSON.stringify(stand)))).toEqual(stand)
  })

  it("Fremdes fällt weg: falscher Name, unsichere Bilder, falsche Währung, kaputte Einträge", () => {
    const s = ocStandAus({ name: "gut", bild: "javascript:x", waehrung: "euro", kontostand: -5, ausgaben: [{ was: "x", betrag: "viel", wann: "gestern" }], eingaenge: [{ betrag: 5, wann: "2026-10-01" }, { betrag: 1 }] })!
    expect(s.bild).toBeNull()
    expect(s.waehrung).toBe("EUR")
    expect(s.kontostand).toBeNull()
    expect(s.ausgaben).toEqual([])
    expect(s.eingaenge).toHaveLength(1)
    expect(ocStandAus({ name: "../böse" })).toBeNull()
  })
})

describe("Hilfen", () => {
  it("Beträge in ihrer Währung", () => {
    expect(ocBetrag(1234, "EUR")).toMatch(/^1\.234\s€$/)
    expect(ocBetrag(10, "USD")).toMatch(/10/)
    expect(ocBetrag(10, "XX")).toBe("10 XX")
  })

  it("Anteil am Ziel und was fehlt", () => {
    expect(ocZiel({ eingegangen: 2500 }, 10000)).toEqual({ anteil: 0.25, offen: 7500 })
    expect(ocZiel({ eingegangen: 20000 }, 10000)).toEqual({ anteil: 1, offen: 0 })
    expect(ocZiel({ eingegangen: null }, 10000)).toBeNull()
    expect(ocZiel({ eingegangen: 10 }, null)).toBeNull()
  })
})

describe("Die Spendenkarte mit Live-Stand", () => {
  const spende = { ziel: 10000, gesammelt: 7340, unterstuetzende: 52, opencollective: "https://opencollective.com/x", anteil: 0.734, offen: 2660, beispiel: true, stufen: [] }
  it("live geht vor Eintrag, Beispiel gilt nicht mehr", () => {
    const stand = { ...ocStandAusAntwort(antwort, "webpack", jetzt)!, eingegangen: 2500, unterstuetzende: 9 }
    const s = ocSpende(spende, stand)
    expect(s).toMatchObject({ gesammelt: 2500, unterstuetzende: 9, anteil: 0.25, offen: 7500, beispiel: false, waehrung: "USD", live: stand.stand })
  })
  it("ohne Stand bleibt der Eintrag", () => {
    expect(ocSpende(spende, null)).toMatchObject({ gesammelt: 7340, beispiel: true, live: null })
  })
})

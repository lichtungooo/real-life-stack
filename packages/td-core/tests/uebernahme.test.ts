/**
 * Profil übernehmen (DEFINITION Teil 8): anfragen, bestätigen, ablehnen,
 * jeweils mit den ganzen Daten; wer danach bearbeiten darf.
 */
import { describe, expect, it } from "vitest"
import {
  GEPFLEGT_VON_DER_STIFTUNG, darfStiftungBearbeiten, gepflegtAus, uebernahmeAblehnen,
  uebernahmeAnfragen, uebernahmeAus, uebernahmeBestaetigen, verwaltetSpace,
} from "../src/uebernahme"
import { nachtrag } from "../../td-ui/src/stiftungen-import"

const jetzt = new Date("2026-10-03T12:00:00Z")
const recherche = { title: "Kleine Stiftung", foerdererart: "Stiftung", quelle: "Recherche 2026", website: "https://kleine.de", eigenes: 7 }

describe("Anfragen", () => {
  it("die Anfrage steht am Eintrag, alles andere bleibt", () => {
    const d = uebernahmeAnfragen(recherche, { von: "mensch-anna", name: " Anna Berg ", rolle: "Vorstand", mail: "anna@kleine.de" }, jetzt)!
    expect(d).toMatchObject({ ...recherche, uebernahme: { von: "mensch-anna", name: "Anna Berg", rolle: "Vorstand", mail: "anna@kleine.de", stand: "angefragt" } })
    expect(uebernahmeAus(d)).toMatchObject({ von: "mensch-anna", name: "Anna Berg", wann: jetzt.toISOString() })
  })

  it("ohne Namen keine Anfrage, eine falsche Mail fällt weg", () => {
    expect(uebernahmeAnfragen(recherche, { von: "mensch-anna", name: "  " })).toBeNull()
    const d = uebernahmeAnfragen(recherche, { von: "mensch-anna", name: "Anna", mail: "kein" }, jetzt)!
    expect("mail" in (d.uebernahme as object)).toBe(false)
  })
})

describe("Bestätigen und ablehnen", () => {
  const angefragt = uebernahmeAnfragen(recherche, { von: "mensch-anna", name: "Anna" }, jetzt)!

  it("bestätigt: gepflegt von der Stiftung, Anfrage weg, Rest heil", () => {
    const d = uebernahmeBestaetigen(angefragt, jetzt)!
    expect(d.quelle).toBe(GEPFLEGT_VON_DER_STIFTUNG)
    expect(gepflegtAus(d)).toEqual({ von: "mensch-anna", seit: jetzt.toISOString() })
    expect("uebernahme" in d).toBe(false)
    expect(d.eigenes).toBe(7)
  })

  it("abgelehnt: Anfrage weg, bleibt Recherche", () => {
    const d = uebernahmeAblehnen(angefragt)!
    expect(d).toEqual(recherche)
  })

  it("ohne Anfrage nichts zu bestätigen; eine übernommene Stiftung nimmt keine neue Anfrage", () => {
    expect(uebernahmeBestaetigen(recherche)).toBeNull()
    const gepflegt = uebernahmeBestaetigen(angefragt, jetzt)!
    expect(uebernahmeAnfragen(gepflegt, { von: "mensch-bert", name: "Bert" })).toBeNull()
  })

  it("ein späterer Import lässt die übernommene Stiftung in Ruhe", () => {
    const gepflegt = uebernahmeBestaetigen(angefragt, jetzt)!
    expect(nachtrag(gepflegt, { ...recherche, address: "Neue Anschrift", icon: "hands", kurz: "Neu" })).toEqual({ icon: "hands" })
  })
})

describe("Wer bearbeiten darf", () => {
  const gepflegt = uebernahmeBestaetigen(uebernahmeAnfragen(recherche, { von: "mensch-anna", name: "Anna" }, jetzt)!, jetzt)!
  it("vor der Übernahme alle nach Antons Regel, danach die Pflegenden und die Verwaltenden", () => {
    expect(darfStiftungBearbeiten(recherche, "mensch-bert", false)).toBe(true)
    expect(darfStiftungBearbeiten(gepflegt, "mensch-anna", false)).toBe(true)
    expect(darfStiftungBearbeiten(gepflegt, "mensch-bert", false)).toBe(false)
    expect(darfStiftungBearbeiten(gepflegt, "mensch-bert", true)).toBe(true)
  })

  it("kaputte oder gefährliche Daten", () => {
    expect(uebernahmeAus({ uebernahme: { stand: "angefragt", von: "x" } })).toBeNull()
    const boese = JSON.parse('{"__proto__":{"x":1},"title":"A"}')
    expect(Object.keys(uebernahmeAnfragen(boese, { von: "a", name: "b" }, jetzt)!)).toEqual(["title", "uebernahme"])
  })
})

describe("Wer den Space verwaltet (Antons Regel)", () => {
  it("mit Angabe gilt die Angabe, ohne verwaltet das erste Mitglied", () => {
    expect(verwaltetSpace([{ id: "a", isAdmin: false }, { id: "b", isAdmin: true }], "b")).toBe(true)
    expect(verwaltetSpace([{ id: "a", isAdmin: false }, { id: "b", isAdmin: true }], "a")).toBe(false)
    expect(verwaltetSpace([{ id: "a" }, { id: "b" }], "a")).toBe(true)
    expect(verwaltetSpace([{ id: "a" }, { id: "b" }], "b")).toBe(false)
    expect(verwaltetSpace([{ id: "a" }], null)).toBe(false)
  })
})

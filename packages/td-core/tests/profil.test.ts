// Die Regeln der Profilkarte aus `docs/13-profil.md`, jede mit einem Test.
//
// Die Definition nennt sechs Regeln. Fünf davon lassen sich hier prüfen, ohne
// einen Browser zu starten; die sechste ("kein Feld wird erfunden") prüft der
// Mensch beim Lesen.
import { describe, it, expect } from "vitest"
import {
  profilAbschnitte,
  profilStand,
  feldTraegt,
  BAUPLAN_FOERDERER,
  BAUPLAN_PROJEKT,
} from "../src/profil.js"

/** Eine Stiftung, wie sie aus der Recherche kommt: wenig ausgefüllt. */
const KNAPP = {
  name: "Umweltstiftung Michael Otto",
  foerdererart: "Stiftung",
  sitz: "Hamburg",
  foerderbereiche: ["Gewässerschutz", "Umweltbildung"],
}

/** Eine Stiftung, die ihren Eintrag übernommen und gepflegt hat. */
const VOLL = {
  ...KNAPP,
  art: "fördernd",
  website: "https://beispiel.de",
  zweck: "Wir fördern Vorhaben, die Gewässer schützen.",
  zielgruppen: ["Jugend", "Vereine"],
  reichweite: ["national"],
  hinweis: "Ihr Vorhaben verbessert ein Gewässer und bindet Menschen ein.",
  bisherGefoerdert: ["Elbe-Auen", "Schulteiche"],
  summeVon: 5000,
  summeBis: 50000,
  eigenmittel: "teilweise",
  antragstellung: "ja",
  antragsweg: "offen",
  fristen: "laufend",
  unterlagen: ["Skizze", "Finanzplan"],
  ansprache: "Förderberatung",
  mail: "foerderung@beispiel.de",
  zustiftung: true,
  spende: true,
  treuhand: false,
}

describe("Profilabschnitte", () => {
  it("laesst leere Felder weg", () => {
    const abschnitte = profilAbschnitte(KNAPP)
    const alleFelder = abschnitte.flatMap((a) => a.felder.map((f) => f.id))

    expect(alleFelder).toContain("foerdererart")
    expect(alleFelder).toContain("sitz")
    expect(alleFelder).toContain("foerderbereiche")
    // Was die Stiftung nicht angegeben hat, steht nicht da. Eine Karte mit
    // zwanzig Strichen wirkt leerer als eine mit vier Angaben.
    expect(alleFelder).not.toContain("summeVon")
    expect(alleFelder).not.toContain("hinweis")
  })

  it("laesst leere Abschnitte weg", () => {
    const abschnitte = profilAbschnitte(KNAPP).map((a) => a.id)

    expect(abschnitte).toContain("wer")
    expect(abschnitte).toContain("was")
    // Drei Abschnitte tragen nichts und erscheinen darum nicht.
    expect(abschnitte).not.toContain("wieviel")
    expect(abschnitte).not.toContain("antrag")
    expect(abschnitte).not.toContain("kontakt")
  })

  it("haelt die Reihenfolge der Fragen, nicht die der Datenlage", () => {
    // Die Abschnitte folgen den Fragen eines Besuchers. Sie ändern sich nicht,
    // weil ein Feld mehr oder weniger gefüllt ist.
    const voll = profilAbschnitte(VOLL).map((a) => a.id)
    expect(voll).toEqual(["wer", "was", "wieviel", "antrag", "kontakt", "geben"])

    const knapp = profilAbschnitte(KNAPP).map((a) => a.id)
    expect(knapp).toEqual(["wer", "was"])
  })

  it("zeigt ein Nein, weil es eine Antwort ist", () => {
    // `treuhand: false` heißt "nein, das geht bei uns nicht". Das gehört auf
    // die Karte: Es erspart jemandem eine Anfrage.
    const abschnitte = profilAbschnitte(VOLL)
    const geben = abschnitte.find((a) => a.id === "geben")
    const treuhand = geben?.felder.find((f) => f.id === "treuhand")

    expect(treuhand).toBeDefined()
    expect(treuhand?.wert).toBe(false)
  })

  it("zeigt den Hinweis, sobald er da ist", () => {
    // Das wertvollste Feld der Karte: Es steht nirgends sonst.
    const abschnitte = profilAbschnitte(VOLL)
    const was = abschnitte.find((a) => a.id === "was")
    expect(was?.felder.map((f) => f.id)).toContain("hinweis")
  })

  it("kommt mit einem leeren Space zurecht", () => {
    expect(profilAbschnitte({})).toEqual([])
    expect(profilAbschnitte(null)).toEqual([])
    expect(profilAbschnitte(undefined)).toEqual([])
  })

  it("nennt zu jedem Abschnitt seine Frage", () => {
    // Ein Abschnitt ohne Frage ist eine Überschrift. Mit Frage ist er eine
    // Antwort, und das ist der Unterschied.
    for (const a of profilAbschnitte(VOLL)) {
      expect(a.frage.length).toBeGreaterThan(5)
      expect(a.frage.endsWith("?")).toBe(true)
    }
  })
})

describe("Ob ein Feld traegt", () => {
  it("erkennt die fuenf Formen von Leere", () => {
    expect(feldTraegt(undefined, "text")).toBe(false)
    expect(feldTraegt(null, "text")).toBe(false)
    expect(feldTraegt("", "text")).toBe(false)
    expect(feldTraegt("   ", "text")).toBe(false)
    expect(feldTraegt([], "tags")).toBe(false)
  })

  it("haelt `false` bei einem Ja-Nein-Feld fuer eine Antwort", () => {
    expect(feldTraegt(false, "bool")).toBe(true)
    expect(feldTraegt(true, "bool")).toBe(true)
    // Bei jeder anderen Form bleibt `false` eine Leere.
    expect(feldTraegt(false, "text")).toBe(false)
  })

  it("haelt die Null fuer eine Zahl", () => {
    // Ein Fördervolumen von 0 ist eine Angabe, keine Leere.
    expect(feldTraegt(0, "money")).toBe(true)
    expect(feldTraegt(NaN, "money")).toBe(false)
  })
})

describe("Der Stand eines Profils", () => {
  it("zaehlt, was gefuellt ist", () => {
    const knapp = profilStand(KNAPP)
    const voll = profilStand(VOLL)

    expect(knapp.gesamt).toBe(voll.gesamt)
    expect(knapp.gefuellt).toBeLessThan(voll.gefuellt)
    expect(voll.gefuellt).toBeGreaterThan(15)
  })

  it("zaehlt dieselben Felder wie der Bauplan", () => {
    const summe = BAUPLAN_FOERDERER.reduce((n, a) => n + a.felder.length, 0)
    expect(profilStand({}).gesamt).toBe(summe)
  })
})

describe("Der Bauplan fuer ein Projekt", () => {
  it("stellt dieselben sechs Fragen mit anderen Feldern", () => {
    const projekt = {
      kurz: "Vierzig Bäche in Nordhessen",
      beduerfnis: "Ohne uns bleiben vierzig Bäche unbetreut.",
      luecke: 12400,
      wirkung: ["Vierzig Patengruppen messen viermal im Jahr."],
    }
    const abschnitte = profilAbschnitte(projekt, BAUPLAN_PROJEKT)

    expect(abschnitte.map((a) => a.id)).toEqual(["wer", "warum", "kosten", "wirkung"])
    const warum = abschnitte.find((a) => a.id === "warum")
    expect(warum?.felder[0].id).toBe("beduerfnis")
  })

  it("traegt keine Felder, die es im Foerderer-Bauplan gibt", () => {
    // Zwei Baupläne, zwei Vokabulare. Ein Projekt hat keinen `antragsweg`.
    const projektFelder = BAUPLAN_PROJEKT.flatMap((a) => a.felder.map((f) => f.id))
    expect(projektFelder).not.toContain("antragsweg")
    expect(projektFelder).not.toContain("foerdererart")
  })
})

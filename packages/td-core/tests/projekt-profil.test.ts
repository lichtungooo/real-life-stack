/**
 * Das Project Profile (DEFINITION Teil 8): was fehlt, faellt weg; Zahlen
 * werden gerechnet, nicht geglaubt; nur sichere Adressen kommen durch.
 */
import { describe, expect, it } from "vitest"
import { projektProfil, traegtProjektProfil, euro, spendenLink } from "../src/projekt-profil"
import { ERWEITERUNGEN, komponentenAus, komponenteAktiv, PROJEKT_PROFIL } from "../src/erweiterungen"

describe("Project Profile", () => {
  it("laesst Leeres weg statt Striche zu zeigen", () => {
    const p = projektProfil({ title: "Bachpaten" })
    expect(p.titel).toBe("Bachpaten")
    expect(p.titelbild).toBeNull()
    expect(p.spende).toBeNull()
    expect(p.kontakt).toBeNull()
    expect(p.bedarfe).toEqual([])
    expect(p.naechsterSchritt).toBeNull()
  })

  it("rechnet Anteil und Rest der Spende, nie ueber das Ziel und nie unter null", () => {
    expect(projektProfil({ spende: { ziel: 10000, gesammelt: 2500 } }).spende).toMatchObject({ anteil: 0.25, offen: 7500 })
    expect(projektProfil({ spende: { ziel: 1000, gesammelt: 1500 } }).spende).toMatchObject({ anteil: 1, offen: 0 })
    expect(projektProfil({ spende: { ziel: 1000 } }).spende).toMatchObject({ anteil: null, offen: null })
    expect(projektProfil({ spende: { ziel: -5, gesammelt: "viel" } }).spende).toBeNull()
  })

  it("kennzeichnet Beispielzahlen und laesst den Knopf ohne Open-Collective-Seite still", () => {
    const s = projektProfil({ spende: { ziel: 5000, gesammelt: 100, beispiel: true } }).spende!
    expect(s.beispiel).toBe(true)
    expect(s.opencollective).toBeNull()
    expect(projektProfil({ spende: { opencollective: "opencollective.com/bachpaten" } }).spende!.opencollective).toBe("https://opencollective.com/bachpaten")
  })

  it("laesst gefaehrliche Adressen nicht durch", () => {
    const p = projektProfil({
      bilder: ["javascript:alert(1)", "muster/garten.svg", "../geheim.svg", "https://x.org/a.jpg"],
      kontakt: { website: "javascript:alert(1)", mail: "kein-mail" },
    })
    expect(p.titelbild).toBe("muster/garten.svg")
    expect(p.galerie).toEqual(["https://x.org/a.jpg"])
    expect(p.kontakt).toBeNull()
  })

  it("teilt die Bedarfe nach Anteil und findet den naechsten Schritt", () => {
    const p = projektProfil({
      bedarfe: [{ wofuer: "Werkzeug", betrag: 3000 }, { wofuer: "Saatgut", betrag: 1000 }, "Helfende Haende"],
      schritte: [{ titel: "Flaeche", erledigt: true }, { titel: "Beete" }, "Fest"],
    })
    expect(p.bedarfSumme).toBe(4000)
    expect(p.bedarfe.map((b) => b.anteil)).toEqual([0.75, 0.25, null])
    expect(p.naechsterSchritt).toBe(1)
  })

  it("macht Kuerzel fuer das Team und fuehrt Tags ohne Dopplung zusammen", () => {
    const p = projektProfil({ team: [{ name: "Mara Feld", rolle: "Leitung" }, "Ole"], tags: ["Garten"] }, ["Garten", "Kinder"])
    expect(p.team.map((m) => m.kuerzel)).toEqual(["MF", "OL"])
    expect(p.tags).toEqual(["Garten", "Kinder"])
  })

  it("greift nur, wenn der Eintrag etwas fuer das Profil traegt", () => {
    expect(traegtProjektProfil({ title: "Nur ein Titel" })).toBe(false)
    expect(traegtProjektProfil({ beduerfnis: "Vierzig Baeche bleiben unbetreut" })).toBe(true)
  })

  it("ordnet Spendenstufen und laesst kaputte weg", () => {
    const s = projektProfil({ spende: { ziel: 100, stufen: [{ betrag: 150, bewirkt: "ein Hochbeet" }, 25, { betrag: -1 }, "x"] } }).spende!
    expect(s.stufen).toEqual([{ betrag: 25, bewirkt: null }, { betrag: 150, bewirkt: "ein Hochbeet" }])
  })

  it("fuehrt mit Betrag zur Spendenseite bei Open Collective", () => {
    expect(spendenLink(null, 50)).toBeNull()
    expect(spendenLink("https://opencollective.com/garten/", 50)).toBe("https://opencollective.com/garten/donate?amount=50")
    expect(spendenLink("https://opencollective.com/garten")).toBe("https://opencollective.com/garten")
    // Eine Seite mit Query bleibt heil (Kimi, 02.10.2026).
    expect(spendenLink("https://opencollective.com/verein?ref=web", 50)).toBe("https://opencollective.com/verein/donate?ref=web&amount=50")
  })

  it("zählt nur sichere Bilder als Inhalt (Kimi, 02.10.2026)", () => {
    expect(traegtProjektProfil({ bilder: ["javascript:alert(1)", "../geheim.png"] })).toBe(false)
    expect(traegtProjektProfil({ bilder: ["https://x.org/a.jpg"] })).toBe(true)
  })

  it("zeigt hoechstens vier Kennzahlen, nur vollstaendige", () => {
    const k = projektProfil({ kennzahlen: [{ wert: 120, was: "Kinder" }, { wert: "12", was: "Hochbeete" }, { wert: "3" }, { wert: "1", was: "a" }, { wert: "2", was: "b" }, { wert: "3", was: "c" }] }).kennzahlen
    expect(k).toEqual([{ wert: "120", was: "Kinder" }, { wert: "12", was: "Hochbeete" }, { wert: "1", was: "a" }, { wert: "2", was: "b" }])
  })

  it("schreibt Euro deutsch", () => {
    expect(euro(12500)).toMatch(/^12\.500\s€$/)
  })
})

describe("Komponenten im Verzeichnis", () => {
  it("fuehrt das Project Profile fuer den Typ project", () => {
    const e = ERWEITERUNGEN.find((x) => x.id === PROJEKT_PROFIL)
    expect(e).toMatchObject({ art: "komponente", fuerTyp: "project", name: "Project Profile" })
    expect(komponentenAus().map((k) => k.id)).toContain(PROJEKT_PROFIL)
  })

  it("liest die Wahl aus Group.data.komponenten", () => {
    expect(komponenteAktiv({ komponenten: [PROJEKT_PROFIL, "fremd"] }, PROJEKT_PROFIL)).toBe(true)
    expect(komponenteAktiv({ komponenten: "kaputt" }, PROJEKT_PROFIL)).toBe(false)
    expect(komponenteAktiv(null, PROJEKT_PROFIL)).toBe(false)
  })
})

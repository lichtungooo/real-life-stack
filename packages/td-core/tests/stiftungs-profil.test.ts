/**
 * Das Stiftungsprofil (DEFINITION Teil 8): die Vorlage wächst mit; was
 * fehlt, fällt weg; `false` ist eine Antwort; Adressen nur sicher.
 */
import { describe, expect, it } from "vitest"
import { stiftungsProfil, traegtStiftungsProfil, kontrast, lesbarAuf, lesbarAufHell, dunkler, motivFuer } from "../src/stiftungs-profil"
import { ERWEITERUNGEN, STIFTUNGS_PROFIL, PROJEKT_PROFIL } from "../src/erweiterungen"
import { musterItems } from "../src/musterdaten"

const auridis = musterItems.find((i) => i.id === "stiftung-auridis-stiftung-11")!

describe("Stiftungsprofil", () => {
  it("eine recherchierte Stiftung: Antrag oben, Summe, Bereiche, Kontakt mit Quelle", () => {
    const p = stiftungsProfil(auridis.data as Record<string, unknown>)
    expect(p.titel).toBe("Auridis Stiftung")
    expect(p.monogramm).toBe("AU")
    expect(p.art).toEqual(["Stiftung", "fördernd"])
    expect(p.antrag).toMatchObject({ weg: expect.stringMatching(/eingeladene/), ziel: "https://auridis-stiftung.de", portal: false })
    expect(p.summe).toMatch(/^100\.000\s€ bis 1\.000\.000\s€$/)
    expect(p.foerderbereiche).toContain("Kinder")
    expect(p.kontakt).toMatchObject({ website: "https://auridis-stiftung.de", anschriftQuelle: expect.stringMatching(/impressum/) })
    expect(p.geben).toEqual({ zustiftung: true, spende: null, treuhand: null })
    // Der Auftritt (02.10.2026): Logo bei uns, Herkunft genannt.
    expect(p.bild).toBe("stiftungen/stiftung-auridis-stiftung-11.svg")
    expect(p.auftritt?.quelle).toMatch(/auridis-stiftung\.de/)
  })

  it("nur Name und Art: das Profil steht trotzdem, ohne leere Abschnitte", () => {
    const p = stiftungsProfil({ title: "Kleine Stiftung", foerdererart: "Stiftung" })
    expect(p.antrag).toBeNull()
    expect(p.kontakt).toBeNull()
    expect(p.geben).toBeNull()
    expect(p.summe).toBeNull()
    expect(p.farbe).toBe("#194294")
  })

  it("false ist eine Antwort, und Fristen als Satz werden eine Zeile", () => {
    const p = stiftungsProfil({ title: "X Stiftung", foerdererart: "Stiftung", treuhand: false, fristen: "Stichtage im März und im September" })
    expect(p.geben).toEqual({ zustiftung: null, spende: null, treuhand: false })
    expect(p.antrag?.fristen).toEqual(["Stichtage im März und im September"])
  })

  it("Summen: von bis, nur bis, nur ab", () => {
    expect(stiftungsProfil({ title: "A", summeBis: 500000 }).summe).toMatch(/^bis 500\.000\s€$/)
    expect(stiftungsProfil({ title: "A", summeVon: 10000 }).summe).toMatch(/^ab 10\.000\s€$/)
  })

  it("ein eigenes Antragsportal geht vor der Website", () => {
    const p = stiftungsProfil({ title: "A", foerdererart: "Stiftung", website: "a.de", antragsportal: "https://antrag.a.de", antragsweg: "online" })
    expect(p.antrag).toMatchObject({ ziel: "https://antrag.a.de", portal: true })
  })

  it("lässt gefährliche Adressen, Mails und Farben nicht durch", () => {
    const p = stiftungsProfil({ title: "A", website: "javascript:alert(1)", mail: "kein", color: "red;", bild: "javascript:x", anschriftQuelle: "javascript:y" })
    expect(p.kontakt).toBeNull()
    expect(p.bild).toBeNull()
    expect(p.farbe).toBe("#194294")
  })

  it("die Hausfarbe färbt das Profil, color bleibt für die Karte", () => {
    expect(stiftungsProfil({ title: "A", color: "#194294", hausfarbe: "#990000" }).farbe).toBe("#990000")
    expect(stiftungsProfil({ title: "A", color: "#123456" }).farbe).toBe("#123456")
  })

  it("die Musterstiftung trägt jedes Feld der Vorlage", () => {
    const m = musterItems.find((i) => i.id === "stiftung-muster-loewenherz")!
    const p = stiftungsProfil(m.data as Record<string, unknown>)
    expect(p.muster).toBe(true)
    expect(p.bild).toMatch(/^data:image\/svg/)
    expect(p.antrag?.unterlagen.length).toBe(3)
    expect(p.zweck && p.hinweis && p.summe && p.kontakt?.mail).toBeTruthy()
    expect(p.geben).toEqual({ zustiftung: true, spende: true, treuhand: false })
  })

  it("Monogramm ohne „Stiftung“ und Füllwörter", () => {
    expect(stiftungsProfil({ title: "Stiftung der Sparkasse Kassel" }).monogramm).toBe("SK")
    expect(stiftungsProfil({ title: "Löwenherz Stiftung" }).monogramm).toBe("LÖ")
  })

  it("greift nur bei einem Förderer mit Namen", () => {
    expect(traegtStiftungsProfil(auridis.data as Record<string, unknown>)).toBe(true)
    expect(traegtStiftungsProfil({ title: "Ein Garten" })).toBe(false)
    expect(traegtStiftungsProfil({ foerdererart: "Stiftung" })).toBe(false)
  })

  it("jede der recherchierten Stiftungen trägt ein Profil", () => {
    const stiftungen = musterItems.filter((i) => String(i.id).startsWith("stiftung-"))
    expect(stiftungen.every((i) => traegtStiftungsProfil(i.data as Record<string, unknown>))).toBe(true)
  })
})

describe("Im Verzeichnis", () => {
  it("führt das Stiftungsprofil für Orte, neben dem Project Profile", () => {
    expect(ERWEITERUNGEN.find((e) => e.id === STIFTUNGS_PROFIL)).toMatchObject({ art: "komponente", fuerTyp: "place", name: "Stiftungsprofil" })
    expect(STIFTUNGS_PROFIL).not.toBe(PROJEKT_PROFIL)
  })
})

describe("Im Auftritt der Stiftung", () => {
  it("zweite Farbe, Kurzsatz und Herkunft aus den Daten", () => {
    const p = stiftungsProfil({ title: "A", hausfarbe: "#961E82", akzent: "#dc5082", kurz: " Hilft in Lateinamerika. ", auftrittQuelle: "https://adveniat.de", auftrittStand: "2026-10-02" })
    expect(p.farbe).toBe("#961e82")
    expect(p.akzent).toBe("#dc5082")
    expect(p.kurz).toBe("Hilft in Lateinamerika.")
    expect(p.auftritt).toEqual({ quelle: "https://adveniat.de", stand: "2026-10-02" })
  })

  it("ein helles Logo steht auf den Hausfarben", () => {
    expect(stiftungsProfil({ title: "A", bild: "stiftungen/a.svg", bildHell: true }).bildHell).toBe(true)
    expect(stiftungsProfil({ title: "A", bild: "stiftungen/a.svg", bildHell: "ja" }).bildHell).toBe(false)
  })

  it("ohne zweite Farbe eine dunklere Hausfarbe, ohne Herkunft nichts", () => {
    const p = stiftungsProfil({ title: "A", hausfarbe: "#ffffff" })
    expect(p.akzent).toBe(dunkler("#ffffff"))
    expect(p.auftritt).toBeNull()
  })

  it("Text auf Farbe bleibt lesbar: auf Gelb dunkel, auf Dunkelblau hell", () => {
    expect(lesbarAuf("#ffd500")).toBe("#111827")
    expect(lesbarAuf("#00005f")).toBe("#ffffff")
    expect(kontrast("#ffffff", "#000000")).toBeCloseTo(21, 0)
    const p = stiftungsProfil({ title: "A", hausfarbe: "#e31519", akzent: "#a00f12" })
    expect(kontrast(p.textAufFarbe, p.farbe)).toBeGreaterThanOrEqual(4.5)
  })

  it("Schrift in der Hausfarbe wird abgedunkelt, bis sie auf hellem Grund lesbar ist", () => {
    const gelb = stiftungsProfil({ title: "A", hausfarbe: "#f6de30" })
    expect(kontrast(gelb.farbeText, "#f8f8f8")).toBeGreaterThanOrEqual(4.5)
    expect(stiftungsProfil({ title: "A", hausfarbe: "#00245c" }).farbeText).toBe("#00245c")
    expect(lesbarAufHell("#ffffff")).not.toBe("#ffffff")
  })
})

describe("Das große Ganze (02.10.2026)", () => {
  it("Schwerpunkte mit Motiv, Beispiele, Zahlen, Herkunft", () => {
    const p = stiftungsProfil({
      title: "A", foerdererart: "Stiftung", herkunft: " Gegründet 1964 von einer Familie. ",
      schwerpunkte: [{ titel: "Leseförderung", text: "Lesepaten an Grundschulen." }, { titel: "Natur erleben", motiv: "umwelt" }, { titel: "X", motiv: "erfunden" }, { text: "ohne Titel" }],
      beispiele: [{ titel: "Lesesommer Kassel", ort: "Kassel", jahr: 2025 }], bisherGefoerdert: ["Werkstatt am Fluss"],
      zahlen: [{ wert: "1964", was: "gegründet" }, { wert: "", was: "leer" }], summeBis: 5000,
    })
    expect(p.schwerpunkte.map((s) => [s.titel, s.motiv])).toEqual([["Leseförderung", "bildung"], ["Natur erleben", "umwelt"], ["X", "allgemein"]])
    expect(p.beispiele.map((b) => b.titel)).toEqual(["Lesesommer Kassel", "Werkstatt am Fluss"])
    expect(p.beispiele[0]).toMatchObject({ ort: "Kassel", jahr: "2025" })
    expect(p.kennzahlen).toEqual([{ wert: "1964", was: "gegründet" }, { wert: expect.stringMatching(/^bis 5\.000\s€$/), was: "je Vorhaben" }])
    expect(p.herkunft).toBe("Gegründet 1964 von einer Familie.")
  })

  it("jeder Förderbereich findet ein Motiv, Unbekanntes das allgemeine", () => {
    expect(motivFuer("kinder")).toBe("kinder")
    expect(motivFuer("Denkmalschutz")).toBe("denkmal")
    expect(motivFuer("klimaschutz")).toBe("klima")
    expect(motivFuer("xyz")).toBe("allgemein")
  })
})

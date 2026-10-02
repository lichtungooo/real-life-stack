/**
 * Das Stiftungsprofil (DEFINITION Teil 8): die Vorlage wächst mit; was
 * fehlt, fällt weg; `false` ist eine Antwort; Adressen nur sicher.
 */
import { describe, expect, it } from "vitest"
import { stiftungsProfil, traegtStiftungsProfil } from "../src/stiftungs-profil"
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
    expect(p.zweck).toBeNull()
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

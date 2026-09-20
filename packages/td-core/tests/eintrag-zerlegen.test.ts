// Was ein Zerleger aus recherchiertem Text macht, und was er sein lässt.
//
// Die Proben sind echte Einträge aus `daten/items.json`, Wort für Wort
// übernommen. Ein erfundenes Beispiel prüft den Zerleger gegen sich selbst,
// ein echtes prüft ihn gegen den Bestand.
import { describe, it, expect } from "vitest"
import { zerlegeEintrag, sitzAusAnschrift } from "../src/eintrag-zerlegen.js"

/** VR PartnerBank Heimatstiftungen, echter Eintrag. */
const VR_PARTNERBANK =
  "Förderschwerpunkte: kunst, kultur, natur, umwelt, bildung, ausbildung, sport, jugend, gemeinwesen. " +
  "Förderrahmen: 300 bis 5.000 Euro. " +
  "Antragsweg: Formular vr-partnerbank.de -> Stiftung & Engagement -> Heimatstiftung. " +
  "Zwei getrennte Formulare je Heimatstiftung (Zustaendigkeit nach Wohnort/Vereinssitz). " +
  "Laufender Antrag, mehrmals jaehrlich.. Zustiftung ist möglich. " +
  "Website: https://vr-partnerbank.de Quelle: Recherche Foerder-Landschaft, Runde 1 und 2. " +
  "Dieser Eintrag stammt aus öffentlicher Recherche. Die Stiftung pflegt ihn selbst, " +
  "sobald sie ihn übernimmt. Der Punkt zeigt die Stadt, nicht die Anschrift."

/** Software AG-Stiftung, echter Eintrag mit anderer Zusammensetzung. */
const SAGST =
  "Förderschwerpunkte: bildung, reformpaedagogik, kinder, jugend, inklusion, gesundheit, " +
  "natur, nachhaltigkeit, potenzialentfaltung. Förderrahmen: 20.000 bis 500.000 Euro. " +
  "Antragsweg: Mehrstufig: (1) Projektskizze 2-3 Seiten via sagst.de, (2) auf Aufforderung " +
  "Vollantrag, (3) Besuch vor Ort, (4) Vorstandsentscheid. Keine Fristen.. " +
  "Zustiftung ist möglich. Website: https://sagst.de Quelle: Recherche Foerder-Landschaft, " +
  "Runde 1 und 2. Dieser Eintrag stammt aus öffentlicher Recherche."

describe("Einen Eintrag zerlegen", () => {
  it("gewinnt die Foerderbereiche als Liste", () => {
    const { felder } = zerlegeEintrag(VR_PARTNERBANK)
    expect(felder.foerderbereiche).toEqual([
      "kunst", "kultur", "natur", "umwelt", "bildung",
      "ausbildung", "sport", "jugend", "gemeinwesen",
    ])
  })

  it("liest den Foerderrahmen als zwei Zahlen", () => {
    const { felder } = zerlegeEintrag(VR_PARTNERBANK)
    expect(felder.summeVon).toBe(300)
    expect(felder.summeBis).toBe(5000)
  })

  it("liest deutsche Tausenderpunkte richtig", () => {
    // "20.000 bis 500.000" ist zwanzigtausend bis fünfhunderttausend.
    // Ein `parseInt` ohne Sorgfalt liest daraus 20 und 500.
    const { felder } = zerlegeEintrag(SAGST)
    expect(felder.summeVon).toBe(20000)
    expect(felder.summeBis).toBe(500000)
  })

  it("liest eine Obergrenze ohne Untergrenze", () => {
    // Sechs der 234 tragen "Förderrahmen: bis 5.000 Euro". Ohne diesen Fall
    // blieb der Satz als Rest liegen und das Feld leer.
    const { felder, rest } = zerlegeEintrag("Förderrahmen: bis 5.000 Euro. Quelle: Recherche.")
    expect(felder.summeBis).toBe(5000)
    expect(felder.summeVon).toBeUndefined()
    expect(rest).toBe("")
  })

  it("nimmt den Antragsweg als Ganzes", () => {
    const { felder } = zerlegeEintrag(SAGST)
    expect(String(felder.antragsweg)).toContain("Projektskizze")
    expect(String(felder.antragsweg)).toContain("Vorstandsentscheid")
    // Was danach kommt, gehört nicht mehr dazu.
    expect(String(felder.antragsweg)).not.toContain("Zustiftung")
    expect(String(felder.antragsweg)).not.toContain("Website")
  })

  it("haelt einen Gedankenstrich fuer keine Angabe", () => {
    // Ein Eintrag im Bestand trug "Antragsweg: —". Auf einer Karte sieht ein
    // Strich aus wie eine Antwort und ist keine: Ein leeres Feld erscheint
    // gar nicht, ein Strich erscheint und sagt nichts.
    expect(zerlegeEintrag("Antragsweg: —. Quelle: Recherche.").felder.antragsweg).toBeUndefined()
    expect(zerlegeEintrag("Antragsweg: k.A. Quelle: Recherche.").felder.antragsweg).toBeUndefined()
    // Eine echte Angabe bleibt.
    expect(zerlegeEintrag("Antragsweg: auf Anfrage. Quelle: R.").felder.antragsweg).toBe("auf Anfrage")
  })

  it("erkennt die Zustiftung als Ja", () => {
    expect(zerlegeEintrag(VR_PARTNERBANK).felder.zustiftung).toBe(true)
    // Ohne den Satz bleibt das Feld leer, statt auf `false` zu springen:
    // "steht nicht da" und "geht nicht" sind zweierlei.
    expect(zerlegeEintrag("Förderschwerpunkte: jugend.").felder.zustiftung).toBeUndefined()
  })

  it("nimmt die Website ohne angehaengten Satz", () => {
    expect(zerlegeEintrag(VR_PARTNERBANK).felder.website).toBe("https://vr-partnerbank.de")
    expect(zerlegeEintrag(SAGST).felder.website).toBe("https://sagst.de")
  })

  it("traegt die Quelle, ohne die Floskeln", () => {
    const { felder } = zerlegeEintrag(VR_PARTNERBANK)
    expect(felder.quelle).toBe("Recherche Foerder-Landschaft, Runde 1 und 2")
    expect(String(felder.quelle)).not.toContain("Dieser Eintrag stammt")
  })

  it("laesst nichts uebrig, wenn alles aufgeht", () => {
    expect(zerlegeEintrag(VR_PARTNERBANK).rest).toBe("")
    expect(zerlegeEintrag(SAGST).rest).toBe("")
  })

  it("haelt fest, was in kein Feld passt", () => {
    const text = "Eine eigene Beschreibung ohne Muster. Quelle: Recherche."
    const { felder, rest } = zerlegeEintrag(text)
    expect(felder.quelle).toBe("Recherche")
    expect(rest).toBe("Eine eigene Beschreibung ohne Muster")
  })

  it("raet nichts, wo nichts steht", () => {
    const { felder, rest } = zerlegeEintrag("")
    expect(felder).toEqual({})
    expect(rest).toBe("")
    expect(zerlegeEintrag(null).felder).toEqual({})
    expect(zerlegeEintrag(undefined).felder).toEqual({})
  })

  it("setzt kein Feld, das der Text nicht traegt", () => {
    const { felder } = zerlegeEintrag("Förderschwerpunkte: jugend. Quelle: Recherche.")
    expect(felder.summeVon).toBeUndefined()
    expect(felder.summeBis).toBeUndefined()
    expect(felder.website).toBeUndefined()
    expect(felder.antragsweg).toBeUndefined()
  })
})

describe("Den Sitz aus einer Anschrift lesen", () => {
  it("nimmt die Stadt hinter der Postleitzahl", () => {
    expect(sitzAusAnschrift("Karl-Hessenberger-Str. 20, 64354 Reinheim")).toBe("Reinheim")
    expect(sitzAusAnschrift("Am Eichwäldchen 6, 64297 Darmstadt")).toBe("Darmstadt")
  })

  it("laesst eine Stadt stehen, die schon allein dasteht", () => {
    expect(sitzAusAnschrift("Darmstadt")).toBe("Darmstadt")
    expect(sitzAusAnschrift("Frankfurt am Main")).toBe("Frankfurt am Main")
  })

  it("gibt nichts zurueck, wo nichts zu holen ist", () => {
    expect(sitzAusAnschrift("")).toBeNull()
    expect(sitzAusAnschrift(null)).toBeNull()
    // Eine Anschrift ohne erkennbare Stadt liefert lieber nichts als Unsinn.
    expect(sitzAusAnschrift("Postfach 12 34")).toBeNull()
  })
})

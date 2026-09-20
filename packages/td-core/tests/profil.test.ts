// Die Regeln des Profils aus `docs/13-profil.md`, jede mit einem Test.
//
// Die Definition nennt neun Regeln. Acht davon lassen sich hier prüfen, ohne
// einen Browser zu starten; die neunte ("kein Feld wird erfunden") prüft der
// Mensch beim Lesen.
import { describe, it, expect } from "vitest"
import {
  profilAufbauen,
  profilStand,
  alleFelder,
  bauplanFuer,
  traegtProfil,
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
  volumenJahr: 900000,
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

describe("Der Kopf", () => {
  it("traegt die kurzen Angaben, mit denen man jemanden einordnet", () => {
    const { kopf } = profilAufbauen(VOLL)
    expect(kopf.map((f) => f.id)).toEqual(["foerdererart", "art", "sitz", "reichweite"])
    expect(kopf.map((f) => f.wert)).toEqual([
      "Stiftung",
      "fördernd",
      "Hamburg",
      ["national"],
    ])
  })

  it("laesst weg, was fehlt", () => {
    // KNAPP hat kein `art`. Ein leeres Feld erscheint nicht (Regel 1).
    expect(profilAufbauen(KNAPP).kopf.map((f) => f.id)).toEqual(["foerdererart", "sitz"])
  })

  it("reicht Website und Mail als eigene Aktionen heraus", () => {
    const profil = profilAufbauen(VOLL)
    expect(profil.website).toBe("https://beispiel.de")
    expect(profil.mail).toBe("foerderung@beispiel.de")
    // Ohne Angabe keine Aktion.
    expect(profilAufbauen(KNAPP).website).toBeUndefined()
    expect(profilAufbauen(KNAPP).mail).toBeUndefined()
  })
})

describe("Die Kennzahlen", () => {
  it("fasst eine Spanne zu einer Zahl zusammen", () => {
    // "5.000 bis 50.000" ist eine Aussage, keine zwei. Zwei Kennzahlen
    // nebeneinander sagten dasselbe doppelt.
    const [foerderung] = profilAufbauen(VOLL).kennzahlen
    expect(foerderung.id).toBe("summeVon")
    expect(foerderung.wert).toBe(5000)
    expect(foerderung.bis).toBe(50000)
  })

  it("traegt eine Obergrenze auch ohne Untergrenze", () => {
    // Sechs der 234 Stiftungen nennen "bis 5.000 Euro" ohne Untergrenze.
    const { kennzahlen } = profilAufbauen({ foerdererart: "Stiftung", summeBis: 5000 })
    expect(kennzahlen).toHaveLength(1)
    expect(kennzahlen[0].wert).toBeUndefined()
    expect(kennzahlen[0].bis).toBe(5000)
  })

  it("laesst eine Kennzahl ohne Angabe weg", () => {
    // KNAPP nennt keine einzige Zahl.
    expect(profilAufbauen(KNAPP).kennzahlen).toEqual([])
  })

  /**
   * ⚠ Eine Kennzahl ist eine Zahl.
   *
   * Die Reichweite ordnet ein, sie misst nicht. Neben zwei Geldbeträgen
   * stünde sie da wie eine Zahl, die keine ist, und sie stand am 20.09.2026
   * als einzige Kennzahl einer Stiftung da, die bewusst keine Summen nennt.
   * Sie gehört in die Einordnungszeile des Kopfes.
   */
  it("⚠ fuehrt allein Geldbetraege als Kennzahl", () => {
    for (const k of BAUPLAN_FOERDERER.kennzahlen) {
      expect(k.form, `${k.id} ist keine Zahl`).toBe("money")
    }
  })

  it("bleibt bei hoechstens drei", () => {
    // Vier große Zahlen nebeneinander sind keine Kennzahlen mehr, sondern
    // eine Tabelle.
    expect(BAUPLAN_FOERDERER.kennzahlen.length).toBeLessThanOrEqual(3)
    expect(BAUPLAN_PROJEKT.kennzahlen.length).toBeLessThanOrEqual(3)
  })
})

describe("Der Inhalt", () => {
  it("gibt den Zweck als Aussage heraus, ohne Beschriftung", () => {
    // Ein Zweck mit dem Etikett "Zweck" davor ist ein Formularfeld; ohne
    // Etikett ist er die Stimme der Einrichtung.
    expect(profilAufbauen(VOLL).zweck).toBe("Wir fördern Vorhaben, die Gewässer schützen.")
    expect(profilAufbauen(KNAPP).zweck).toBeUndefined()
  })

  it("hebt den Hinweis heraus, mit seiner eigenen Ueberschrift", () => {
    const { hinweis } = profilAufbauen(VOLL)
    expect(hinweis?.label).toBe("Woran Sie erkennen, dass Sie passen")
    expect(hinweis?.text).toContain("Gewässer")
  })

  it("nimmt beim Projekt das Beduerfnis an dieselbe Stelle", () => {
    const projekt = { kind: "projekt", beduerfnis: "Vierzig Bäche bleiben unbetreut." }
    const { hinweis } = profilAufbauen(projekt, BAUPLAN_PROJEKT)
    expect(hinweis?.label).toBe("Was ohne dieses Vorhaben fehlt")
    expect(hinweis?.text).toBe("Vierzig Bäche bleiben unbetreut.")
  })
})

describe("Die Reiter", () => {
  it("laesst einen Reiter ohne gefuellte Felder weg", () => {
    // KNAPP trägt allein Förderbereiche: ein Reiter, nicht drei (Regel 2).
    expect(profilAufbauen(KNAPP).reiter.map((r) => r.id)).toEqual(["ueberblick"])
  })

  it("bringt alle drei, wenn alle etwas tragen", () => {
    expect(profilAufbauen(VOLL).reiter.map((r) => r.id)).toEqual([
      "ueberblick",
      "antrag",
      "geben",
    ])
  })

  it("laesst in einem Reiter kein leeres Feld stehen", () => {
    for (const r of profilAufbauen(VOLL).reiter) {
      for (const f of r.felder) {
        expect(feldTraegt(f.wert, f.form), `${r.id}.${f.id} steht leer da`).toBe(true)
      }
    }
  })

  /**
   * ⚠ Ein Nein ist eine Antwort.
   *
   * "Treuhandstiftung: nein" gehört auf die Karte: Es erspart jemandem eine
   * Anfrage. `false` ist der Fall, den eine Prüfung auf Leere verschluckt.
   */
  it("⚠ haelt ein Nein fuer eine Antwort", () => {
    const geben = profilAufbauen(VOLL).reiter.find((r) => r.id === "geben")
    const treuhand = geben?.felder.find((f) => f.id === "treuhand")
    expect(treuhand, "Treuhand fehlt, obwohl sie mit nein beantwortet ist").toBeTruthy()
    expect(treuhand?.wert).toBe(false)
  })

  /**
   * ⚠ Keine Frage steht auf dem Bildschirm.
   *
   * Timo am 20.09.2026 zur ersten Fassung: *"Das ist ja jetzt wirklich dumm
   * Design ... nicht da die Fragen reinzustellen."* Die Fragen stehen im
   * Bauplan als Raster; was herauskommt, trägt allein Titel.
   */
  it("⚠ reicht keine Frage an die Oberflaeche", () => {
    for (const r of profilAufbauen(VOLL).reiter) {
      expect(Object.keys(r).sort()).toEqual(["felder", "id", "titel"])
    }
  })

  it("gibt bei einem Projekt die Reiter des Projekts", () => {
    const projekt = {
      kind: "projekt",
      beduerfnis: "Vierzig Bäche bleiben unbetreut.",
      themen: ["Gewässer"],
      bedarfe: ["Messgeräte"],
    }
    expect(profilAufbauen(projekt, BAUPLAN_PROJEKT).reiter.map((r) => r.id)).toEqual([
      "ueberblick",
      "vorhaben",
    ])
  })
})

describe("Ein leeres Profil", () => {
  it("gibt nichts zurueck statt einer leeren Huelle", () => {
    const leer = profilAufbauen({})
    expect(leer.kopf).toEqual([])
    expect(leer.kennzahlen).toEqual([])
    expect(leer.reiter).toEqual([])
    expect(leer.zweck).toBeUndefined()
    expect(leer.hinweis).toBeUndefined()
  })

  it("kommt mit null und undefined zurecht", () => {
    expect(profilAufbauen(null).reiter).toEqual([])
    expect(profilAufbauen(undefined).reiter).toEqual([])
  })
})

describe("Der Bauplan selbst", () => {
  /**
   * ⚠ Ein Feld steht an genau einer Stelle.
   *
   * Ein Wert, der im Kopf steht, steht nicht noch einmal in einem Reiter:
   * Doppelt gesagt ist halb geglaubt. Die Gefahr ist echt, weil ein Feld beim
   * Umsortieren leicht an zwei Orten landet.
   */
  it("⚠ fuehrt kein Feld doppelt", () => {
    for (const [name, bauplan] of [
      ["Förderer", BAUPLAN_FOERDERER],
      ["Projekt", BAUPLAN_PROJEKT],
    ] as const) {
      const ids = alleFelder(bauplan).map((f) => f.id)
      const doppelt = ids.filter((id, i) => ids.indexOf(id) !== i)
      expect(doppelt, `${name}: ${doppelt.join(", ")} steht mehrfach`).toEqual([])
    }
  })

  it("gibt jedem Reiter eine Frage als Raster", () => {
    // Die Frage steht im Bauplan, damit klar bleibt, welche Felder
    // hineingehören. Auf den Bildschirm kommt sie nie.
    for (const bauplan of [BAUPLAN_FOERDERER, BAUPLAN_PROJEKT]) {
      for (const r of bauplan.reiter) {
        expect(r.frage.length, `${r.id} hat keine Frage`).toBeGreaterThan(10)
        expect(r.frage.endsWith("?"), `${r.id}: die Frage endet ohne Fragezeichen`).toBe(true)
      }
    }
  })

  it("bleibt bei drei bis vier Reitern", () => {
    // Mehr Reiter heißt: Niemand findet mehr, was er sucht.
    for (const bauplan of [BAUPLAN_FOERDERER, BAUPLAN_PROJEKT]) {
      expect(bauplan.reiter.length).toBeGreaterThanOrEqual(2)
      expect(bauplan.reiter.length).toBeLessThanOrEqual(4)
    }
  })
})

describe("Der Stand", () => {
  it("zaehlt ueber den ganzen Bauplan, auch ueber das Weggelassene", () => {
    const knapp = profilStand(KNAPP)
    const voll = profilStand(VOLL)
    expect(knapp.gesamt).toBe(voll.gesamt)
    expect(voll.gefuellt).toBeGreaterThan(knapp.gefuellt)
  })

  it("nennt dieselbe Gesamtzahl wie der Bauplan Felder hat", () => {
    expect(profilStand({}).gesamt).toBe(alleFelder(BAUPLAN_FOERDERER).length)
    expect(profilStand({}).gefuellt).toBe(0)
  })

  it("reicht den Stand mit dem Profil heraus", () => {
    const profil = profilAufbauen(VOLL)
    expect(profil.stand.gefuellt).toBe(profilStand(VOLL).gefuellt)
  })
})

describe("Traegt dieses Feld etwas", () => {
  it("haelt leere Zeichen und leere Listen fuer nichts", () => {
    expect(feldTraegt(undefined, "text")).toBe(false)
    expect(feldTraegt(null, "text")).toBe(false)
    expect(feldTraegt("", "text")).toBe(false)
    expect(feldTraegt("   ", "text")).toBe(false)
    expect(feldTraegt([], "tags")).toBe(false)
  })

  it("laesst ein Nein allein dort gelten, wo ein Ja-Nein-Feld steht", () => {
    expect(feldTraegt(false, "bool")).toBe(true)
    // Ein `false` in einem Textfeld ist ein Fehler, keine Antwort.
    expect(feldTraegt(false, "text")).toBe(false)
  })

  it("laesst die Null gelten", () => {
    // "Eigenmittel: 0" ist eine Angabe, und zwar eine wichtige.
    expect(feldTraegt(0, "money")).toBe(true)
  })
})

describe("Wer traegt ein Profil", () => {
  it("nimmt die Art, die ein Netzwerk seinen Spaces gibt", () => {
    expect(bauplanFuer({ kind: "stiftung" })).toBe(BAUPLAN_FOERDERER)
    expect(bauplanFuer({ kind: "projekt" })).toBe(BAUPLAN_PROJEKT)
    // Gross und klein geschrieben zaehlt gleich: Die Art kommt aus einem
    // Eingabefeld, und dort schreibt jemand auch "Stiftung".
    expect(bauplanFuer({ kind: "Stiftung" })).toBe(BAUPLAN_FOERDERER)
  })

  it("erkennt einen recherchierten Eintrag an seinen Feldern", () => {
    // Die 234 Stiftungen sind place-Items ohne `kind`. Sie tragen aber
    // `foerdererart`, und das genuegt (Muster 4: Feld-Praesenz).
    expect(bauplanFuer({ foerdererart: "Stiftung", sitz: "Essen" })).toBe(BAUPLAN_FOERDERER)
    expect(bauplanFuer({ beduerfnis: "Vierzig Baeche bleiben unbetreut" })).toBe(BAUPLAN_PROJEKT)
  })

  /**
   * ⚠ Ein Netzwerk hat kein Foerderer-Profil.
   *
   * Timo am 20.09.2026: *"manche profile zeigt er garnicht an"*. Vier von
   * sechs Spaces zeigten "traegt noch keine Angaben", weil der
   * Foerderer-Bauplan auf ein Netzwerk gelegt wurde. Eine leere Karte wirkt
   * kaputt; keine Karte ist ehrlich.
   */
  it("⚠ gibt einem Netzwerk keinen Bauplan", () => {
    expect(bauplanFuer({ isNetwork: true, name: "trustdonation" })).toBeNull()
    expect(bauplanFuer({})).toBeNull()
    expect(bauplanFuer(null)).toBeNull()
    expect(bauplanFuer({ kind: "netzwerk" })).toBeNull()
  })

  it("verlangt fuer die Taste mindestens eine Angabe", () => {
    // Ein Bauplan allein genuegt nicht: Eine Taste, die auf eine leere
    // Flaeche fuehrt, ist ein gebrochenes Versprechen.
    expect(traegtProfil({ kind: "stiftung" })).toBe(false)
    expect(traegtProfil({ kind: "stiftung", sitz: "Darmstadt" })).toBe(true)
    expect(traegtProfil({ isNetwork: true })).toBe(false)
  })

  it("laesst ein Ja-Nein-Feld allein das Profil tragen", () => {
    // "Treuhandstiftung: nein" ist eine Antwort, die jemandem eine Anfrage
    // erspart (Regel 4 in docs/13-profil.md).
    expect(traegtProfil({ foerdererart: "Stiftung", treuhand: false })).toBe(true)
  })
})

// Die Regeln des Profils aus `docs/13-profil.md`, jede mit einem Test.
//
// Die Anatomie stammt von echten Profilen (Instagram, LinkedIn, GitHub): Cover,
// Identität, Bio, Aktionen, Zahlen, Themen, Reiter, Werk. Was sich davon ohne
// Browser prüfen lässt, steht hier.
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
  bisherGefoerdert: ["Elbe-Auen", "Schulteiche", "Bachpaten Weser"],
  summeVon: 5000,
  summeBis: 50000,
  volumenJahr: 900000,
  eigenmittel: "teilweise",
  antragstellung: "ja",
  antragsweg: "offen",
  antragsportal: "https://beispiel.de/antrag",
  fristen: "laufend",
  unterlagen: ["Skizze", "Finanzplan"],
  ansprache: "Förderberatung",
  mail: "foerderung@beispiel.de",
  zustiftung: true,
  spende: true,
  treuhand: false,
}

describe("Die Einordnung", () => {
  it("steht als eine Zeile, in fester Reihenfolge", () => {
    // Vier Zeilen Beschriftung und Wert untereinander sagen dasselbe und
    // brauchen viermal so viel Platz.
    expect(profilAufbauen(VOLL).einordnung).toEqual([
      "Stiftung",
      "fördernd",
      "Hamburg",
      "national",
    ])
  })

  it("laesst weg, was fehlt", () => {
    // KNAPP hat weder `art` noch `reichweite` (Regel 1).
    expect(profilAufbauen(KNAPP).einordnung).toEqual(["Stiftung", "Hamburg"])
  })
})

describe("Die Bio", () => {
  it("traegt die Stimme, ohne Beschriftung", () => {
    // Ein Zweck mit dem Etikett "Zweck" davor ist ein Formularfeld; ohne
    // Etikett ist er die Stimme der Einrichtung.
    expect(profilAufbauen(VOLL).bio).toBe("Wir fördern Vorhaben, die Gewässer schützen.")
    expect(profilAufbauen(KNAPP).bio).toBeUndefined()
  })

  it("hebt den Satz heraus, an dem jemand erkennt, ob es passt", () => {
    const { hervorhebung } = profilAufbauen(VOLL)
    expect(hervorhebung?.label).toBe("Woran Sie erkennen, dass Sie passen")
    expect(hervorhebung?.text).toContain("Gewässer")
  })

  it("nimmt beim Projekt das Beduerfnis an dieselbe Stelle", () => {
    const projekt = { kind: "projekt", beduerfnis: "Vierzig Bäche bleiben unbetreut." }
    const { hervorhebung } = profilAufbauen(projekt, BAUPLAN_PROJEKT)
    expect(hervorhebung?.label).toBe("Was ohne dieses Vorhaben fehlt")
    expect(hervorhebung?.text).toBe("Vierzig Bäche bleiben unbetreut.")
  })
})

describe("Die Aktionen", () => {
  it("bringt, was tatsaechlich hinterlegt ist", () => {
    const ids = profilAufbauen(VOLL).aktionen.map((a) => a.id)
    expect(ids).toEqual(["website", "antrag", "mail"])
  })

  it("laesst weg, wofuer kein Ziel dasteht", () => {
    expect(profilAufbauen(KNAPP).aktionen).toEqual([])
  })

  /**
   * ⚠ Eine Aktion steht immer hervorgehoben.
   *
   * Instagram hebt "Folgen" hervor, GitHub "Sponsor". Ein Profil, dessen
   * Aktionen alle gleich aussehen, sagt nicht, was man als Nächstes tut.
   * Fehlt die vorgesehene starke Aktion, rückt die erste vorhandene nach.
   */
  it("⚠ hebt immer eine Aktion hervor", () => {
    const ohneWebsite = { ...VOLL, website: undefined }
    const aktionen = profilAufbauen(ohneWebsite).aktionen
    expect(aktionen.length).toBeGreaterThan(0)
    expect(aktionen.filter((a) => a.stark)).toHaveLength(1)
    expect(aktionen[0].stark).toBe(true)
  })
})

describe("Die Zahlen", () => {
  it("zaehlt, was sich zaehlen laesst", () => {
    // "1.234 Beiträge" bei Instagram ist gezählt, nicht eingegeben. Eine
    // gezählte Zahl ist immer wahr und immer aktuell.
    const zahlen = profilAufbauen(VOLL).zahlen
    const bereiche = zahlen.find((z) => z.id === "bereiche")
    expect(bereiche?.wert).toBe(2)
    const gefoerdert = zahlen.find((z) => z.id === "gefoerdert")
    expect(gefoerdert?.wert).toBe(3)
  })

  it("fasst eine Spanne zu einer Zahl zusammen", () => {
    const foerderung = profilAufbauen(VOLL).zahlen.find((z) => z.id === "foerderung")
    expect(foerderung?.wert).toBe(5000)
    expect(foerderung?.bis).toBe(50000)
  })

  it("traegt eine Obergrenze auch ohne Untergrenze", () => {
    // Sechs der 234 Stiftungen nennen "bis 5.000 Euro" ohne Untergrenze.
    const zahlen = profilAufbauen({ foerdererart: "Stiftung", summeBis: 5000 }).zahlen
    expect(zahlen).toHaveLength(1)
    expect(zahlen[0].bis).toBe(5000)
  })

  it("nennt die Einzahl, wo genau eines gezaehlt wurde", () => {
    const zahlen = profilAufbauen({ foerdererart: "Stiftung", foerderbereiche: ["Bildung"] }).zahlen
    expect(zahlen.find((z) => z.id === "bereiche")?.label).toBe("Förderbereich")
  })

  it("laesst eine Zahl ohne Angabe weg", () => {
    expect(profilAufbauen({ foerdererart: "Stiftung", sitz: "Essen" }).zahlen).toEqual([])
  })

  it("bleibt bei hoechstens drei", () => {
    // Vier Zahlen nebeneinander sind keine Signale mehr, sondern eine
    // Tabelle.
    expect(BAUPLAN_FOERDERER.zahlen.length).toBeLessThanOrEqual(3)
    expect(BAUPLAN_PROJEKT.zahlen.length).toBeLessThanOrEqual(3)
  })
})

describe("Die Themen", () => {
  it("werden zu runden Kacheln", () => {
    expect(profilAufbauen(VOLL).themen).toEqual(["Gewässerschutz", "Umweltbildung"])
  })

  it("fehlen, wo keine dastehen", () => {
    expect(profilAufbauen({ foerdererart: "Stiftung", sitz: "Essen" }).themen).toEqual([])
  })
})

describe("Das Werk", () => {
  /**
   * ⚠ Das Werk ist das Herz eines Profils.
   *
   * Ein GitHub-Profil ohne Repositories wäre sinnlos, ein Instagram-Profil
   * ohne Raster auch. Die ersten zwei Fassungen zeigten ein Formular und
   * versteckten das Werk als Stichwort-Chips. Timo dazu am 20.09.2026:
   * *"Diese Profile sind der letzte Wobs."*
   */
  it("⚠ steht als Karten im ersten Reiter", () => {
    const erster = profilAufbauen(VOLL).reiter[0]
    expect(erster.id).toBe("gefoerdert")
    expect(erster.karten?.map((k) => k.titel)).toEqual([
      "Elbe-Auen",
      "Schulteiche",
      "Bachpaten Weser",
    ])
  })

  it("laesst den Reiter erscheinen, auch wenn er sonst nichts traegt", () => {
    // Ein Werk allein füllt seinen Reiter. Ohne diese Regel verschwände das
    // Wichtigste, weil daneben kein Feld steht.
    const nurWerk = { foerdererart: "Stiftung", bisherGefoerdert: ["Elbe-Auen"] }
    const reiter = profilAufbauen(nurWerk).reiter
    expect(reiter).toHaveLength(1)
    expect(reiter[0].karten).toHaveLength(1)
    expect(reiter[0].felder).toEqual([])
  })

  it("fehlt, wo nichts getan wurde", () => {
    expect(profilAufbauen(KNAPP).reiter.some((r) => r.karten)).toBe(false)
  })
})

describe("Die Reiter", () => {
  it("laesst einen Reiter ohne Inhalt weg", () => {
    // KNAPP trägt weder Werk noch Zielgruppen noch Antragsangaben.
    expect(profilAufbauen(KNAPP).reiter).toEqual([])
  })

  it("bringt alle drei, wenn alle etwas tragen", () => {
    expect(profilAufbauen(VOLL).reiter.map((r) => r.id)).toEqual([
      "gefoerdert",
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
   * Timo am 20.09.2026: *"mit sauberen Reitern, nicht da die Fragen
   * reinzustellen."* Die Fragen stehen im Bauplan als Raster; was
   * herauskommt, trägt allein Titel.
   */
  it("⚠ reicht keine Frage an die Oberflaeche", () => {
    for (const r of profilAufbauen(VOLL).reiter) {
      expect(Object.keys(r).sort().join(",")).toMatch(/^(felder,id,karten,titel|felder,id,titel)$/)
    }
  })

  it("gibt bei einem Projekt die Reiter des Projekts", () => {
    const projekt = {
      kind: "projekt",
      beduerfnis: "Vierzig Bäche bleiben unbetreut.",
      themen: ["Gewässer"],
      wirkung: ["Vierzig Bäche haben Paten"],
      bedarfe: ["Messgeräte"],
    }
    expect(profilAufbauen(projekt, BAUPLAN_PROJEKT).reiter.map((r) => r.id)).toEqual([
      "vorhaben",
      "mittel",
    ])
  })
})

describe("Ein leeres Profil", () => {
  it("gibt nichts zurueck statt einer leeren Huelle", () => {
    const leer = profilAufbauen({})
    expect(leer.einordnung).toEqual([])
    expect(leer.zahlen).toEqual([])
    expect(leer.themen).toEqual([])
    expect(leer.reiter).toEqual([])
    expect(leer.aktionen).toEqual([])
    expect(leer.bio).toBeUndefined()
    expect(leer.hervorhebung).toBeUndefined()
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
   * Ein Wert, der in der Einordnung steht, steht nicht noch einmal in einem
   * Reiter: Doppelt gesagt ist halb geglaubt. Die Gefahr ist echt, weil ein
   * Feld beim Umsortieren leicht an zwei Orten landet.
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

  it("legt das Werk in einen Reiter, den es gibt", () => {
    for (const bauplan of [BAUPLAN_FOERDERER, BAUPLAN_PROJEKT]) {
      if (!bauplan.werk) continue
      expect(bauplan.reiter.map((r) => r.id)).toContain(bauplan.werk.reiter)
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
    expect(profilAufbauen(VOLL).stand.gefuellt).toBe(profilStand(VOLL).gefuellt)
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
    // erspart.
    expect(traegtProfil({ foerdererart: "Stiftung", treuhand: false })).toBe(true)
  })
})

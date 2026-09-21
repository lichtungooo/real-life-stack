// Die Regeln des Profils aus `docs/13-profil.md`, jede mit einem Test.
//
// Die Anatomie stammt von Janosch (UX im Kernteam, 21.09.2026): Bild, Name,
// Mitwirkende, relevante Details, Hashtags, Gründung und Meilensteine, Karte,
// Rechtliches, freies Textfeld, Kontakt. Wichtiges oben, Details unten, als
// Collage, die sich per Drag and Drop umsortieren lässt.
import { describe, it, expect } from "vitest"
import {
  profilAufbauen,
  profilStand,
  kachelnOrdnen,
  hashtagsFuer,
  alsHashtag,
  alleFelder,
  bauplanFuer,
  traegtProfil,
  feldTraegt,
  kartenAusschnitt,
  BAUPLAN_FOERDERER,
  BAUPLAN_PROJEKT,
} from "../src/profil.js"

/** Eine Stiftung, wie sie aus der Recherche kommt: zehn kurze Angaben. */
const KNAPP = {
  foerdererart: "Stiftung",
  art: "fördernd",
  sitz: "Essen",
  address: "Essen",
  position: { type: "Point", coordinates: [7.00561, 51.477311] },
  foerderbereiche: ["umwelt", "klima", "natur"],
  antragsweg: "offen ausgeschrieben",
  quelle: "Recherche Foerder-Landschaft",
}

/** Eine Stiftung, die ihren Eintrag übernommen und gepflegt hat. */
const VOLL = {
  ...KNAPP,
  image: "https://beispiel.de/logo.png",
  reichweite: ["national"],
  zweck: "Wir fördern Vorhaben, die Gewässer schützen.",
  hinweis: "Ihr Vorhaben verbessert ein Gewässer und bindet Menschen ein.",
  zielgruppen: ["Jugend", "Vereine"],
  summeVon: 5000,
  summeBis: 50000,
  gegruendet: "1992",
  gruender: "Peter Schnell",
  meilensteine: [
    "1992: Gegründet in Darmstadt",
    "2005: Erste Förderlinie Bildung",
    "2020: Kapital überschreitet eine Milliarde",
  ],
  mitwirkende: ["Vorstand: Anna Weber", "Kuratorium: Jonas Krell"],
  website: "https://beispiel.de",
  mail: "foerderung@beispiel.de",
  telefon: "+49 6151 9292-0",
  rechtsform: "Rechtsfähige Stiftung bürgerlichen Rechts",
  register: "Stiftungsverzeichnis Hessen, Nr. 4711",
  gemeinnuetzig: true,
  notiz: "Beim Erstgespräch nach der Projektskizze fragen.",
  hashtags: ["Gewässerschutz"],
}

describe("Das Bild", () => {
  it("wird durchgereicht, wenn eines dasteht", () => {
    expect(profilAufbauen(VOLL).bild).toBe("https://beispiel.de/logo.png")
  })

  /**
   * ⚠ Ohne Bild bleibt die Stelle frei, nicht weg.
   *
   * Janosch: *"Wenn kein Bild vorhanden ist, dann ist dort ein
   * Platzhalterbild, sodass man das Bild manuell ergänzen kann."* Die Regel
   * meldet `undefined`; die Fläche zeigt den Platzhalter. Keine von 234
   * recherchierten Stiftungen trägt ein Bild, also ist das der Normalfall.
   */
  it("⚠ fehlt ohne Angabe, statt einen leeren Text zu liefern", () => {
    expect(profilAufbauen(KNAPP).bild).toBeUndefined()
    expect(profilAufbauen({ ...KNAPP, image: "   " }).bild).toBeUndefined()
  })
})

describe("Die Einordnung", () => {
  it("steht als eine Zeile, in fester Reihenfolge", () => {
    expect(profilAufbauen(VOLL).einordnung).toEqual([
      "Stiftung",
      "fördernd",
      "Essen",
      "national",
    ])
  })

  it("laesst weg, was fehlt", () => {
    expect(profilAufbauen(KNAPP).einordnung).toEqual(["Stiftung", "fördernd", "Essen"])
  })
})

describe("Die Hashtags", () => {
  it("macht aus einem Wort ein Schlagwort", () => {
    expect(alsHashtag("umwelt")).toBe("Umwelt")
    expect(alsHashtag("Kinder und Jugend")).toBe("KinderUndJugend")
    expect(alsHashtag("Alten- und Behindertenhilfe")).toBe("AltenUndBehindertenhilfe")
    // Eine Abkuerzung behaelt ihre Schreibweise.
    expect(alsHashtag("SAGST")).toBe("SAGST")
  })

  /**
   * ⚠ Was jemand selbst ergaenzt hat, steht vorn.
   *
   * Janosch: *"Hashtags können vorgeschlagen werden von Anfang an und manuell
   * ergänzt werden."* Ein Vorschlag ist geraten, eine Ergänzung ist gemeint.
   */
  it("⚠ stellt die eigenen Schlagworte vor die vorgeschlagenen", () => {
    const tags = hashtagsFuer(VOLL)
    expect(tags[0]).toBe("Gewässerschutz")
    expect(tags).toContain("Umwelt")
    expect(tags).toContain("PeterSchnell")
  })

  it("schlaegt aus Themen, Zielgruppen, Gruender und Ort vor", () => {
    expect(hashtagsFuer(KNAPP)).toEqual(["Umwelt", "Klima", "Natur", "Essen"])
  })

  it("laesst kein Schlagwort doppelt stehen", () => {
    // "Essen" steht als Sitz und als eigenes Schlagwort.
    const tags = hashtagsFuer({ ...KNAPP, hashtags: ["essen", "Essen"] })
    expect(tags.filter((t) => t.toLowerCase() === "essen")).toHaveLength(1)
  })

  it("steht als erste Kachel, weil es in einer Zeile sagt, worum es geht", () => {
    expect(profilAufbauen(KNAPP).kacheln[0].id).toBe("hashtags")
  })
})

describe("Die Geschichte", () => {
  it("liest ein Jahr und einen Satz aus einer Zeile", () => {
    const geschichte = profilAufbauen(VOLL).kacheln.find((k) => k.id === "geschichte")
    expect(geschichte?.meilensteine).toEqual([
      { wann: "1992", was: "Gegründet in Darmstadt" },
      { wann: "2005", was: "Erste Förderlinie Bildung" },
      { wann: "2020", was: "Kapital überschreitet eine Milliarde" },
    ])
  })

  it("sortiert von alt nach neu, denn eine Geschichte liest sich von vorn", () => {
    const durcheinander = {
      ...KNAPP,
      meilensteine: ["2020: Drittens", "1992: Erstens", "2005: Zweitens"],
    }
    const geschichte = profilAufbauen(durcheinander).kacheln.find((k) => k.id === "geschichte")
    expect(geschichte?.meilensteine?.map((m) => m.wann)).toEqual(["1992", "2005", "2020"])
  })

  it("nimmt auch Objekte statt Zeilen", () => {
    const mitObjekten = { ...KNAPP, meilensteine: [{ jahr: "1992", was: "Gegründet" }] }
    const geschichte = profilAufbauen(mitObjekten).kacheln.find((k) => k.id === "geschichte")
    expect(geschichte?.meilensteine).toEqual([{ wann: "1992", was: "Gegründet" }])
  })

  it("laesst ein Gruendungsjahr allein die Kachel tragen", () => {
    const nurJahr = { ...KNAPP, gegruendet: "1992" }
    const geschichte = profilAufbauen(nurJahr).kacheln.find((k) => k.id === "geschichte")
    expect(geschichte?.felder[0]?.wert).toBe("1992")
    expect(geschichte?.meilensteine).toEqual([])
  })

  it("fehlt, wo weder Jahr noch Meilenstein dasteht", () => {
    expect(profilAufbauen(KNAPP).kacheln.some((k) => k.id === "geschichte")).toBe(false)
  })
})

describe("Die Karte", () => {
  it("nimmt die Koordinaten und die Anschrift dazu", () => {
    const karte = profilAufbauen(KNAPP).kacheln.find((k) => k.id === "karte")
    expect(karte?.ort).toEqual({ laenge: 7.00561, breite: 51.477311, anschrift: "Essen" })
  })

  it("fehlt ohne brauchbare Koordinaten", () => {
    for (const kaputt of [
      { ...KNAPP, position: undefined },
      { ...KNAPP, position: { type: "Point" } },
      { ...KNAPP, position: { type: "Point", coordinates: [7] } },
      { ...KNAPP, position: { type: "Point", coordinates: ["7", "51"] } },
    ]) {
      expect(profilAufbauen(kaputt).kacheln.some((k) => k.id === "karte")).toBe(false)
    }
  })
})

describe("Die uebrigen Kacheln", () => {
  it("bringt bei einem gepflegten Profil alle", () => {
    expect(profilAufbauen(VOLL).kacheln.map((k) => k.id)).toEqual([
      "hashtags",
      "details",
      "geschichte",
      "karte",
      "mitwirkende",
      "kontakt",
      "rechtliches",
      "notiz",
    ])
  })

  it("laesst bei einem duennen Eintrag nur, was dasteht", () => {
    // Der Normalfall: 234 von 234 recherchierten Stiftungen sehen so aus.
    expect(profilAufbauen(KNAPP).kacheln.map((k) => k.id)).toEqual([
      "hashtags",
      "details",
      "karte",
    ])
  })

  /**
   * ⚠ Wichtiges oben, Details unten.
   *
   * Janosch: *"Das Profil ist so angeordnet, dass die wichtigen
   * Informationen ganz oben stehen und je mehr es ins Detail geht, werden die
   * Informationen unten angezeigt."*
   */
  it("⚠ haelt die Rangfolge wichtig vor detailliert", () => {
    const ids = BAUPLAN_FOERDERER.kacheln.map((k) => k.id)
    expect(ids.indexOf("details")).toBeLessThan(ids.indexOf("kontakt"))
    expect(ids.indexOf("kontakt")).toBeLessThan(ids.indexOf("rechtliches"))
    expect(ids.indexOf("rechtliches")).toBeLessThan(ids.indexOf("notiz"))
  })

  it("stellt den Satz, der zieht, an den Anfang der Details", () => {
    const details = profilAufbauen(VOLL).kacheln.find((k) => k.id === "details")
    expect(details?.felder[0].id).toBe("hinweis")
  })

  it("laesst in einer Kachel kein leeres Feld stehen", () => {
    for (const k of profilAufbauen(VOLL).kacheln) {
      for (const f of k.felder) {
        expect(feldTraegt(f.wert, f.form), `${k.id}.${f.id} steht leer da`).toBe(true)
      }
    }
  })

  it("gibt bei einem Projekt die Kacheln des Projekts", () => {
    const projekt = {
      kind: "projekt",
      beduerfnis: "Vierzig Bäche bleiben unbetreut.",
      themen: ["Gewässer"],
      website: "https://bachpaten.de",
    }
    expect(profilAufbauen(projekt, BAUPLAN_PROJEKT).kacheln.map((k) => k.id)).toEqual([
      "hashtags",
      "details",
      "kontakt",
    ])
  })
})

describe("Die Collage umsortieren", () => {
  /**
   * ⚠ Eine gespeicherte Reihenfolge ist eine Wunschliste, kein Bestand.
   *
   * Sie nennt Kacheln, die es inzwischen nicht mehr gibt (ein Feld wurde
   * geleert), und sie kennt neue nicht (ein Feld kam dazu). Wer sie als
   * Bestand nimmt, verliert Inhalt still.
   */
  it("⚠ haengt Unbekanntes hinten an und laesst Verschwundenes weg", () => {
    const kacheln = profilAufbauen(VOLL).kacheln
    const geordnet = kachelnOrdnen(kacheln, ["kontakt", "gibtEsNichtMehr", "karte"])
    expect(geordnet.slice(0, 2).map((k) => k.id)).toEqual(["kontakt", "karte"])
    // Nichts geht verloren.
    expect(geordnet).toHaveLength(kacheln.length)
    expect(new Set(geordnet.map((k) => k.id))).toEqual(new Set(kacheln.map((k) => k.id)))
  })

  it("laesst ohne Wunsch die Rangfolge des Bauplans stehen", () => {
    const kacheln = profilAufbauen(VOLL).kacheln
    expect(kachelnOrdnen(kacheln, null)).toEqual(kacheln)
    expect(kachelnOrdnen(kacheln, [])).toEqual(kacheln)
  })
})

describe("Ein leeres Profil", () => {
  it("gibt nichts zurueck statt einer leeren Huelle", () => {
    const leer = profilAufbauen({})
    expect(leer.einordnung).toEqual([])
    expect(leer.kacheln).toEqual([])
    expect(leer.bild).toBeUndefined()
  })

  it("kommt mit null und undefined zurecht", () => {
    expect(profilAufbauen(null).kacheln).toEqual([])
    expect(profilAufbauen(undefined).kacheln).toEqual([])
  })
})

describe("Der Bauplan selbst", () => {
  /**
   * ⚠ Ein Feld steht an genau einer Stelle.
   *
   * Ein Wert, der in der Einordnung steht, steht nicht noch einmal in einer
   * Kachel: Doppelt gesagt ist halb geglaubt. Die Gefahr ist echt, weil ein
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

  it("gibt jeder Kachel einen Titel und eine Breite", () => {
    for (const bauplan of [BAUPLAN_FOERDERER, BAUPLAN_PROJEKT]) {
      for (const k of bauplan.kacheln) {
        // "Wo" ist ein guter Titel. Gefordert ist, dass einer dasteht.
        expect(k.titel.trim().length, `${k.id} hat keinen Titel`).toBeGreaterThan(1)
        expect(["schmal", "breit"]).toContain(k.breite)
      }
    }
  })

  it("nennt dieselben Kacheln in beiden Bauplaenen", () => {
    // Ein Mensch, der von einer Stiftung zu einem Projekt wechselt, soll
    // dieselbe Fläche wiedererkennen.
    expect(BAUPLAN_FOERDERER.kacheln.map((k) => k.id)).toEqual(
      BAUPLAN_PROJEKT.kacheln.map((k) => k.id),
    )
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
    expect(bauplanFuer({ kind: "Stiftung" })).toBe(BAUPLAN_FOERDERER)
  })

  it("erkennt einen recherchierten Eintrag an seinen Feldern", () => {
    expect(bauplanFuer({ foerdererart: "Stiftung", sitz: "Essen" })).toBe(BAUPLAN_FOERDERER)
    expect(bauplanFuer({ beduerfnis: "Vierzig Baeche bleiben unbetreut" })).toBe(BAUPLAN_PROJEKT)
  })

  /**
   * ⚠ Ein Netzwerk hat kein Foerderer-Profil.
   *
   * Vier von sechs Spaces zeigten am 20.09.2026 "traegt noch keine Angaben",
   * weil der Foerderer-Bauplan auf ein Netzwerk gelegt wurde. Eine leere
   * Karte wirkt kaputt; keine Karte ist ehrlich.
   */
  it("⚠ gibt einem Netzwerk keinen Bauplan", () => {
    expect(bauplanFuer({ isNetwork: true, name: "trustdonation" })).toBeNull()
    expect(bauplanFuer({})).toBeNull()
    expect(bauplanFuer(null)).toBeNull()
    expect(bauplanFuer({ kind: "netzwerk" })).toBeNull()
  })

  it("verlangt fuer die Taste mindestens eine Angabe", () => {
    expect(traegtProfil({ kind: "stiftung" })).toBe(false)
    expect(traegtProfil({ kind: "stiftung", sitz: "Darmstadt" })).toBe(true)
    expect(traegtProfil({ isNetwork: true })).toBe(false)
  })

  it("laesst ein Ja-Nein-Feld allein das Profil tragen", () => {
    expect(traegtProfil({ foerdererart: "Stiftung", treuhand: false })).toBe(true)
  })
})

describe("Der Kartenausschnitt", () => {
  const DARMSTADT = { laenge: 8.646229, breite: 49.894767 }

  it("legt die Nadel in die Mitte des Kastens", () => {
    const a = kartenAusschnitt(DARMSTADT, 400, 200, 14)
    expect(a.nadel).toEqual({ links: 200, oben: 100 })
  })

  it("findet die Kachel, in der Darmstadt liegt", () => {
    // Erwartungswert unabhängig in Python gerechnet, nicht mit derselben
    // Formel: Kachel 14/8585/5563 ist die, die jeder Kachelserver liefert.
    const a = kartenAusschnitt(DARMSTADT, 400, 200, 14)
    const unterDerNadel = a.kacheln.find(
      (k) =>
        k.links <= a.nadel.links && a.nadel.links < k.links + 256 &&
        k.oben <= a.nadel.oben && a.nadel.oben < k.oben + 256,
    )
    expect(unterDerNadel).toMatchObject({ z: 14, x: 8585, y: 5563 })
  })

  it("deckt den Kasten ohne Luecke und ohne Ueberschuss", () => {
    const a = kartenAusschnitt(DARMSTADT, 400, 200, 14)
    // 400 px breit braucht zwei bis drei Kacheln, 200 px hoch eine bis zwei.
    expect(a.kacheln.length).toBeGreaterThanOrEqual(2)
    expect(a.kacheln.length).toBeLessThanOrEqual(6)
    for (const k of a.kacheln) {
      // Jede Kachel ragt in den Kasten hinein.
      expect(k.links).toBeLessThan(400)
      expect(k.links + 256).toBeGreaterThan(0)
      expect(k.oben).toBeLessThan(200)
      expect(k.oben + 256).toBeGreaterThan(0)
    }
  })

  it("laeuft um die Datumsgrenze weiter, statt Kacheln zu erfinden", () => {
    const a = kartenAusschnitt({ laenge: 179.99, breite: 0 }, 600, 100, 1)
    for (const k of a.kacheln) {
      expect(k.x).toBeGreaterThanOrEqual(0)
      expect(k.x).toBeLessThan(2)
    }
  })

  it("fordert ueber den Polen keine Kachel, die es nicht gibt", () => {
    const a = kartenAusschnitt({ laenge: 0, breite: 85 }, 300, 2000, 2)
    for (const k of a.kacheln) {
      expect(k.y).toBeGreaterThanOrEqual(0)
      expect(k.y).toBeLessThan(4)
    }
  })

  it("haelt den Zoom in dem Bereich, den ein Kachelserver kennt", () => {
    expect(kartenAusschnitt(DARMSTADT, 100, 100, 40).zoom).toBe(19)
    expect(kartenAusschnitt(DARMSTADT, 100, 100, -3).zoom).toBe(0)
  })
})

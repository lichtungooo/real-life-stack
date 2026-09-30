import { describe, expect, it } from "vitest"
import {
  PROZESSE,
  TEMPELHOF_EMPFEHLUNGEN,
  SCHRITT_ARTEN,
  prozessFinden,
  istProzess,
  leereSitzung,
  gilt,
  prozessWaehlen,
  prozessBeenden,
  schrittGehen,
  stabNehmen,
  stabZuruecklegen,
  stabWeitergeben,
  naechsterImKreis,
  schaleSchlagen,
  pauseBeginnen,
  pauseBeenden,
  gruppenEinteilen,
  gruppenListe,
  aktuellerSchritt,
  stabArt,
  istSitzung,
  raumKennung,
  mitteSetzen,
  type Prozess,
} from "../src"

const wir = prozessFinden("wir-prozess") as Prozess
const klaerung = prozessFinden("klaerungskreis") as Prozess
const T = 1_000_000

describe("Die mitgelieferten Prozesse", () => {
  it("sind sechs, mit eindeutigen Ids", () => {
    expect(PROZESSE.map((p) => p.id)).toEqual([
      "kennenlernen", "redestab-runde", "reflexionskreis", "wir-prozess", "klaerungskreis", "zwiegespraech",
    ])
  })

  it("jeder hat Schritte, jede Schritt-Art ist bekannt, jede Schritt-Id ist im Prozess eindeutig", () => {
    for (const p of PROZESSE) {
      expect(p.schritte.length).toBeGreaterThan(0)
      expect(new Set(p.schritte.map((s) => s.id)).size).toBe(p.schritte.length)
      for (const s of p.schritte) {
        expect(SCHRITT_ARTEN).toContain(s.art)
        expect(s.minuten).toBeGreaterThan(0)
        expect(s.anleitung.length).toBeGreaterThan(0)
      }
    }
  })

  it("der Wir-Prozess traegt die 18 Empfehlungen aus Tempelhof, mit dem Risiko", () => {
    expect(TEMPELHOF_EMPFEHLUNGEN).toHaveLength(18)
    expect(wir.empfehlungen).toBe(TEMPELHOF_EMPFEHLUNGEN)
    expect(TEMPELHOF_EMPFEHLUNGEN).toContain("Gehe ein Risiko ein!")
  })

  it("der Klaerungskreis hat Kleingruppen mit den fuenf Konfliktarten", () => {
    const klein = klaerung.schritte.find((s) => s.art === "kleingruppen")
    expect(klein?.gruppenGroesse).toBe(4)
    for (const art of ["Ressource", "Ziel", "Werte", "Rang", "Trigger"]) {
      expect(klein?.fragen?.some((f) => f.startsWith(art))).toBe(true)
    }
  })

  it("eigene Vorlagen gehen vor, eine unbekannte Id findet nichts", () => {
    const eigener: Prozess = { ...wir, name: "Unser Wir" }
    expect(prozessFinden("wir-prozess", [eigener])?.name).toBe("Unser Wir")
    expect(prozessFinden("gibt-es-nicht")).toBeNull()
    expect(prozessFinden(null)).toBeNull()
  })

  it("istProzess nimmt eine fremde Schritt-Art an, weist Unvollstaendiges ab", () => {
    expect(istProzess({ id: "x", name: "X", schritte: [{ titel: "Tanzen", art: "tanz" }] })).toBe(true)
    expect(istProzess({ id: "x", name: "X", schritte: [] })).toBe(false)
    expect(istProzess({ name: "X", schritte: [{ titel: "a" }] })).toBe(false)
    expect(istProzess(null)).toBe(false)
  })

  it("eine unbekannte Schritt-Art wandert den Stab wie offen", () => {
    expect(stabArt({ id: "t", titel: "Tanz", minuten: 5, art: "tanz", anleitung: "…" })).toBe("offen")
    expect(stabArt(null)).toBe("offen")
    expect(stabArt({ id: "r", titel: "Runde", minuten: 5, art: "reihum", anleitung: "…" })).toBe("reihum")
  })
})

describe("Einigung ohne Server", () => {
  it("die hoehere Fassung gilt, bei Gleichstand der groessere Absender", () => {
    const a = { ...leereSitzung(), v: 3, von: "a" }
    const b = { ...leereSitzung(), v: 3, von: "b" }
    const c = { ...leereSitzung(), v: 4, von: "a" }
    expect(gilt(a, b)).toBe(b)
    expect(gilt(b, a)).toBe(b)
    expect(gilt(b, c)).toBe(c)
    expect(gilt(c, b)).toBe(c)
  })

  it("greifen zwei im selben Augenblick nach dem Stab, sehen am Ende alle denselben Halter", () => {
    const start = prozessWaehlen(leereSitzung(T), wir, "a", T)
    const beiAnna = stabNehmen(start, "anna", "Anna", ["anna", "bert"], T + 1)
    const beiBert = stabNehmen(start, "bert", "Bert", ["anna", "bert"], T + 1)
    const annaSieht = gilt(beiAnna, beiBert)
    const bertSieht = gilt(beiBert, beiAnna)
    expect(annaSieht.stab.halter).toBe(bertSieht.stab.halter)
    expect(annaSieht.stab.halter).toBe("bert")
  })

  it("istSitzung weist fremde Nachrichten ab", () => {
    expect(istSitzung(leereSitzung())).toBe(true)
    expect(istSitzung({ art: "chat" })).toBe(false)
    expect(istSitzung(null)).toBe(false)
  })
})

describe("Der Redestab", () => {
  const start = prozessWaehlen(leereSitzung(T), wir, "a", T)

  it("liegt zu Beginn in der Mitte, wer ihn nimmt, haelt ihn", () => {
    expect(start.stab.halter).toBeNull()
    const s = stabNehmen(start, "anna", "Anna", ["anna", "bert"], T + 1)
    expect(s.stab).toMatchObject({ halter: "anna", name: "Anna" })
    expect(s.v).toBe(start.v + 1)
  })

  it("wer ihn haelt, behaelt ihn, bis er ihn zuruecklegt", () => {
    const s = stabNehmen(start, "anna", "Anna", ["anna", "bert"], T + 1)
    expect(stabNehmen(s, "bert", "Bert", ["anna", "bert"], T + 2)).toBe(s)
    expect(stabZuruecklegen(s, "bert", T + 2)).toBe(s)
    const zurueck = stabZuruecklegen(s, "anna", T + 3)
    expect(zurueck.stab.halter).toBeNull()
  })

  it("haelt ihn jemand, der den Raum verlassen hat, darf jeder ihn nehmen", () => {
    const s = stabNehmen(start, "anna", "Anna", ["anna", "bert"], T + 1)
    const nachGehen = stabNehmen(s, "bert", "Bert", ["bert"], T + 2)
    expect(nachGehen.stab.halter).toBe("bert")
  })

  it("wandert reihum in derselben Reihenfolge fuer alle, und vom Letzten zum Ersten", () => {
    expect(naechsterImKreis(["cara", "anna", "bert"], "anna")).toBe("bert")
    expect(naechsterImKreis(["cara", "anna", "bert"], "cara")).toBe("anna")
    const kreis = [{ id: "anna", name: "Anna" }, { id: "bert", name: "Bert" }]
    const s = stabNehmen(start, "anna", "Anna", ["anna", "bert"], T + 1)
    const weiter = stabWeitergeben(s, "anna", kreis, T + 2)
    expect(weiter.stab).toMatchObject({ halter: "bert", name: "Bert" })
  })

  it("allein im Kreis legt Weitergeben den Stab zurueck in die Mitte", () => {
    const s = stabNehmen(start, "anna", "Anna", ["anna"], T + 1)
    expect(stabWeitergeben(s, "anna", [{ id: "anna", name: "Anna" }], T + 2).stab.halter).toBeNull()
  })
})

describe("Klangschale und Stille", () => {
  const start = prozessWaehlen(leereSitzung(T), wir, "a", T)

  it("die Schale holt den Stab in die Mitte und haelt den Raum still", () => {
    const s = stabNehmen(start, "anna", "Anna", ["anna", "bert"], T + 1)
    const klang = schaleSchlagen(s, "bert", wir.stilleSekunden, T + 2)
    expect(klang.stab.halter).toBeNull()
    expect(klang.schale).toMatchObject({ nr: 1, von: "bert", stilleBis: T + 2 + 30_000 })
  })

  it("waehrend der Stille nimmt niemand den Stab, danach wieder", () => {
    const klang = schaleSchlagen(start, "bert", 30, T)
    expect(stabNehmen(klang, "anna", "Anna", ["anna"], T + 29_999)).toBe(klang)
    expect(stabNehmen(klang, "anna", "Anna", ["anna"], T + 30_000).stab.halter).toBe("anna")
  })

  it("jeder Schlag zaehlt, damit jeder Schlag einmal klingt", () => {
    const zwei = schaleSchlagen(schaleSchlagen(start, "a", 10, T), "b", 10, T + 1)
    expect(zwei.schale.nr).toBe(2)
  })
})

describe("Pause", () => {
  const start = prozessWaehlen(leereSitzung(T), wir, "a", T)

  it("waehrend der Pause bleibt der Stab in der Mitte", () => {
    const p = pauseBeginnen(start, 10, "a", T)
    expect(p.pause?.bis).toBe(T + 600_000)
    expect(stabNehmen(p, "anna", "Anna", ["anna"], T + 1000)).toBe(p)
    expect(pauseBeenden(p, "a").pause).toBeNull()
  })

  it("keine Pause von null Minuten, und ohne Pause nichts zu beenden", () => {
    expect(pauseBeginnen(start, 0, "a", T)).toBe(start)
    expect(pauseBeenden(start, "a")).toBe(start)
  })
})

describe("Schritte", () => {
  it("vor und zurueck, am Rand bleibt alles, ein neuer Schritt legt den Stab in die Mitte", () => {
    const start = prozessWaehlen(leereSitzung(T), wir, "a", T)
    expect(schrittGehen(start, wir, -1, "a", T)).toBe(start)
    const s = stabNehmen(start, "anna", "Anna", ["anna"], T + 1)
    const zwei = schrittGehen(s, wir, 1, "a", T + 2)
    expect(zwei.schritt).toBe(1)
    expect(zwei.stab.halter).toBeNull()
    let ende = zwei
    for (let i = 0; i < 10; i++) ende = schrittGehen(ende, wir, 1, "a", T + 3)
    expect(ende.schritt).toBe(wir.schritte.length - 1)
    expect(aktuellerSchritt(ende, wir)?.id).toBe("abschluss")
  })

  it("ein Pausen-Schritt beginnt seine Pause gleich mit", () => {
    let s = prozessWaehlen(leereSitzung(T), klaerung, "a", T)
    const pausenIndex = klaerung.schritte.findIndex((x) => x.art === "pause")
    for (let i = 0; i < pausenIndex; i++) s = schrittGehen(s, klaerung, 1, "a", T)
    expect(s.pause?.bis).toBe(T + 15 * 60_000)
  })

  it("ein anderer Prozess im Zustand verschiebt keine Schritte, Beenden raeumt auf", () => {
    const start = prozessWaehlen(leereSitzung(T), wir, "a", T)
    expect(schrittGehen(start, klaerung, 1, "a", T)).toBe(start)
    const aus = prozessBeenden(start, "a", T)
    expect(aus.prozessId).toBeNull()
    expect(prozessBeenden(aus, "a", T)).toBe(aus)
  })
})

describe("Kleingruppen", () => {
  const start = prozessWaehlen(leereSitzung(T), klaerung, "a", T)
  const neun = ["a", "b", "c", "d", "e", "f", "g", "h", "i"]

  it("jeder landet in genau einer Gruppe, die Groessen liegen nah beieinander", () => {
    const s = gruppenEinteilen(start, neun, 4, "a", () => 0.5)
    const liste = gruppenListe(s.gruppen)
    expect(liste.flatMap((g) => g.ids).sort()).toEqual(neun)
    const groessen = liste.map((g) => g.ids.length)
    expect(Math.max(...groessen) - Math.min(...groessen)).toBeLessThanOrEqual(1)
    expect(liste.length).toBe(2)
  })

  it("zwei Menschen bilden eine Gruppe, niemand bleibt allein", () => {
    const s = gruppenEinteilen(start, ["a", "b"], 4, "a", () => 0.1)
    expect(gruppenListe(s.gruppen)).toEqual([{ nr: 1, ids: ["a", "b"] }])
  })

  it("niemand da, keine Einteilung", () => {
    expect(gruppenEinteilen(start, [], 4, "a")).toBe(start)
  })
})

describe("Die Mitte", () => {
  it("wer etwas in die Mitte legt, legt es fuer alle hinein; dasselbe noch einmal aendert nichts", () => {
    const s = leereSitzung(T)
    expect(s.mitte).toBeNull()
    const tafel = mitteSetzen(s, "tafel", "anna")
    expect(tafel.mitte).toBe("tafel")
    expect(tafel.v).toBe(s.v + 1)
    expect(mitteSetzen(tafel, "tafel", "bert")).toBe(tafel)
    expect(mitteSetzen(tafel, null, "bert").mitte).toBeNull()
  })
})

describe("Raumkennung", () => {
  it("macht aus einem Namen eine gueltige Kennung", () => {
    expect(raumKennung("Kollektiv Lichtung")).toBe("kollektiv-lichtung")
    expect(raumKennung("Größe & Mut")).toBe("groesse-mut")
    expect(raumKennung("")).toBe("kreis-offen")
    expect(raumKennung("ab")).toBe("kreis-ab")
  })

  it("passt immer zum Muster des Token-Dienstes, auch mit Unterstrichen am Rand", () => {
    const muster = /^[a-z0-9][a-z0-9_-]{1,62}[a-z0-9]$/ // kreis-server, token/server.js
    for (const roh of ["__overview__", "_a_", "Tratsch&Off-Topics", "UX/UI", "x".repeat(90), "---", "Real Life Netzwerk"]) {
      expect(raumKennung(roh), roh).toMatch(muster)
    }
    expect(raumKennung("__overview__")).toBe("overview")
  })
})

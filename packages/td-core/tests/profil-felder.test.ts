/**
 * Profile bearbeiten (DEFINITION Teil 8): eine Feldliste je Profil, Speichern
 * je Abschnitt mit den ganzen Daten, Unbekanntes bleibt, die Schleuse sagt
 * vorher, was wegfällt.
 */
import { describe, expect, it } from "vitest"
import {
  STIFTUNGS_PROFIL_FELDER,
  abschnittSpeichern,
  arbeitskopie,
  bereinigt,
  feldHinweise,
  felderIm,
  schlagworte,
  type EingabeFeld,
} from "../src/profil-felder"
import { PROJEKT_PROFIL_FELDER } from "../src/projekt-entwurf"
import { stiftungsProfil } from "../src/stiftungs-profil"
import { projektProfil } from "../src/projekt-profil"

const feld = (felder: readonly EingabeFeld[], id: string) => felder.find((f) => f.id === id)!

describe("Die Feldlisten", () => {
  it("jedes Feld beider Listen hat einen Abschnitt und eine Beschriftung", () => {
    for (const f of [...PROJEKT_PROFIL_FELDER, ...STIFTUNGS_PROFIL_FELDER]) {
      expect(f.abschnitt, f.id).toBeTruthy()
      expect(f.name, f.id).toBeTruthy()
    }
  })

  it("keine Id doppelt, kein gefährlicher Schlüssel", () => {
    for (const felder of [PROJEKT_PROFIL_FELDER, STIFTUNGS_PROFIL_FELDER]) {
      const ids = felder.map((f) => f.id)
      expect(new Set(ids).size).toBe(ids.length)
      expect(ids.some((i) => ["__proto__", "constructor", "prototype"].includes(i))).toBe(false)
    }
  })

  it("jede Liste von Objekten nennt ihre Teile, mindestens einen als Pflicht", () => {
    for (const id of ["kennzahlen", "bedarfe", "schritte", "team"]) {
      const f = feld(PROJEKT_PROFIL_FELDER, id)
      expect(f.form).toBe("list")
      expect(f.teile?.some((t) => t.pflicht), id).toBe(true)
    }
    const stufen = feld(PROJEKT_PROFIL_FELDER, "spende").teile?.find((t) => t.id === "stufen")
    expect(stufen?.teile?.find((t) => t.pflicht)?.id).toBe("betrag")
  })

  it("jedes Feld beider Listen ändert, was die Seite zeigt (außer dem Punkt auf der Karte)", () => {
    const probe = (f: EingabeFeld): unknown => {
      if (f.pruefung) {
        const wert = { url: "https://probe.de", bild: "https://probe.de/l.png", mail: "a@probe.de", farbe: "#123456" }[f.pruefung]
        return f.form === "list" ? [wert] : wert
      }
      const teil = (t: { form: string; teile?: readonly { id: string; form: string }[] }): unknown =>
        t.teile ? Object.fromEntries(t.teile.map((x) => [x.id, teil(x)])) : { text: "Probe", longtext: "Probe", tags: ["probe"], list: ["Probe"], geld: 1000, zahl: 3, janein: true, zeitraum: { von: "Mai" } }[t.form]
      if (f.form === "list" && f.teile) return [teil(f)]
      return teil(f)
    }
    const basis = { title: "S", foerdererart: "Stiftung", kurz: "k" }
    for (const [felder, zeigen] of [[STIFTUNGS_PROFIL_FELDER, stiftungsProfil], [PROJEKT_PROFIL_FELDER, (d: Record<string, unknown>) => projektProfil(d, (d.tags as string[]) ?? [])]] as const) {
      for (const f of felder) {
        if (f.form === "ort") continue
        expect(JSON.stringify(zeigen({ ...basis, [f.id]: probe(f) })), f.id).not.toBe(JSON.stringify(zeigen(basis)))
      }
    }
  })

  it("felderIm hält die Reihenfolge der Liste", () => {
    expect(felderIm(STIFTUNGS_PROFIL_FELDER, "geben").map((f) => f.id)).toEqual(["zustiftung", "spende", "treuhand"])
  })
})

describe("Speichern je Abschnitt", () => {
  const daten = { title: "Garten", kurz: "alt", fremd: { bleibt: true }, wirkung: ["eins"], quelle: "Recherche" }

  it("schreibt nur die Felder des Abschnitts, alles andere bleibt", () => {
    const { data } = abschnittSpeichern(PROJEKT_PROFIL_FELDER, "wirkung", daten, { kurz: "darf nicht", wirkung: ["eins", " zwei ", ""] })
    expect(data).toEqual({ ...daten, wirkung: ["eins", "zwei"] })
  })

  it("ein geleertes Feld verschwindet aus den Daten", () => {
    const { data } = abschnittSpeichern(PROJEKT_PROFIL_FELDER, "wirkung", daten, { wirkung: ["", "  "] })
    expect("wirkung" in data).toBe(false)
    expect(data.fremd).toEqual({ bleibt: true })
  })

  it("Schlagworte gehen an den Eintrag, nicht in die Daten", () => {
    const { data, eintrag } = abschnittSpeichern(PROJEKT_PROFIL_FELDER, "kopf", daten, { title: "Garten", kurz: "neu", tags: ["natur", ""] })
    expect(eintrag).toEqual({ tags: ["natur"] })
    expect("tags" in data).toBe(false)
    expect(data.kurz).toBe("neu")
  })

  it("Schlagworte aus data und am Eintrag werden eine Liste am Eintrag", () => {
    const arbeit = arbeitskopie(PROJEKT_PROFIL_FELDER, { title: "G", tags: ["alt", "natur"] }, { tags: ["natur", "neu"] })
    expect(arbeit.tags).toEqual(["natur", "neu", "alt"])
    const { data, eintrag } = abschnittSpeichern(PROJEKT_PROFIL_FELDER, "kopf", { title: "G", tags: ["alt"] }, { ...arbeit, tags: ["neu"] })
    expect(eintrag.tags).toEqual(["neu"])
    expect("tags" in data).toBe(false)
  })

  it("leere Schlagworte ergeben eine leere Liste am Eintrag", () => {
    expect(abschnittSpeichern(PROJEKT_PROFIL_FELDER, "kopf", daten, { title: "Garten" }).eintrag).toEqual({ tags: [] })
  })

  it("false und 0 sind Antworten und bleiben", () => {
    const { data } = abschnittSpeichern(STIFTUNGS_PROFIL_FELDER, "geben", {}, { zustiftung: false, spende: true, treuhand: null })
    expect(data).toEqual({ zustiftung: false, spende: true })
    const s = abschnittSpeichern(PROJEKT_PROFIL_FELDER, "spende", {}, { spende: { gesammelt: 0, ziel: 5000, stufen: [{ betrag: 25, bewirkt: "" }, { betrag: undefined, bewirkt: "" }] } })
    expect(s.data.spende).toEqual({ gesammelt: 0, ziel: 5000, stufen: [{ betrag: 25 }] })
  })

  it("gefährliche Schlüssel kommen weder aus den Daten noch aus der Arbeitskopie", () => {
    const boese = JSON.parse('{"title":"A","__proto__":{"x":1},"kontakt":{"__proto__":{"y":2},"mail":"a@b.de"}}')
    const { data } = abschnittSpeichern(PROJEKT_PROFIL_FELDER, "kontakt", boese, boese)
    expect(Object.keys(data).sort()).toEqual(["kontakt", "title"])
    expect(data.kontakt).toEqual({ mail: "a@b.de" })
    expect(({} as Record<string, unknown>).x).toBeUndefined()
  })

  it("die gespeicherten Daten ergeben dasselbe Profil wie die Arbeitskopie", () => {
    const arbeit = { bedarfe: [{ wofuer: "Saatgut", betrag: 300 }, { wofuer: " Werkzeug ", betrag: 1200 }] }
    const { data } = abschnittSpeichern(PROJEKT_PROFIL_FELDER, "bedarfe", { title: "Garten" }, arbeit)
    expect(projektProfil(data).bedarfe).toEqual(projektProfil({ title: "Garten", ...arbeit }).bedarfe)
    const st = abschnittSpeichern(STIFTUNGS_PROFIL_FELDER, "antrag", { title: "S", foerdererart: "Stiftung" }, { summeVon: 2000, summeBis: 25000, fristen: ["31. März"] })
    expect(stiftungsProfil(st.data).summe).toMatch(/^2\.000\s€ bis 25\.000\s€$/)
  })
})

describe("Was die Schleuse weglassen würde", () => {
  it("nennt unsichere Adressen, falsche Mails und Farben", () => {
    expect(feldHinweise(feld(STIFTUNGS_PROFIL_FELDER, "website"), "javascript:alert(1)")[0]).toMatch(/keine sichere Adresse/)
    expect(feldHinweise(feld(STIFTUNGS_PROFIL_FELDER, "mail"), "kein")[0]).toMatch(/keine Mail-Adresse/)
    expect(feldHinweise(feld(STIFTUNGS_PROFIL_FELDER, "hausfarbe"), "rot")[0]).toMatch(/keine Farbe/)
    expect(feldHinweise(feld(STIFTUNGS_PROFIL_FELDER, "website"), "stiftung.de")).toEqual([])
  })

  it("schweigt bei leeren Feldern", () => {
    for (const f of [...PROJEKT_PROFIL_FELDER, ...STIFTUNGS_PROFIL_FELDER]) expect(feldHinweise(f, undefined)).toEqual([])
  })

  it("zählt Einträge ohne Pflichtteil und sagt, wie viele die Seite zeigt", () => {
    const h = feldHinweise(feld(PROJEKT_PROFIL_FELDER, "kennzahlen"), [
      { wert: "1", was: "a" }, { wert: "2", was: "b" }, { wert: "3", was: "c" }, { wert: "4", was: "d" }, { wert: "5", was: "e" }, { wert: "6" },
    ])
    expect(h).toContain("Kennzahlen: ein Eintrag ohne „Was er zählt“ wird weggelassen.")
    expect(h).toContain("Kennzahlen: Die Seite zeigt die ersten 4.")
  })

  it("prüft Teile in Objekten und Bilder in Listen", () => {
    const k = feldHinweise(feld(PROJEKT_PROFIL_FELDER, "kontakt"), { mail: "x", website: "https://ok.de" })
    expect(k).toEqual(["Mail: „x“ ist keine Mail-Adresse und wird weggelassen."])
    const b = feldHinweise(feld(PROJEKT_PROFIL_FELDER, "bilder"), ["https://a.de/b.jpg", "javascript:x"])
    expect(b).toHaveLength(1)
    const s = feldHinweise(feld(PROJEKT_PROFIL_FELDER, "spende"), { opencollective: "ftp://x", stufen: [{ bewirkt: "ohne Betrag" }] })
    expect(s.join(" ")).toMatch(/Seite bei Open Collective.*keine sichere Adresse/)
    expect(s.join(" ")).toMatch(/ohne „Betrag“/)
  })

  it("Beträge unter null fallen weg", () => {
    expect(feldHinweise(feld(STIFTUNGS_PROFIL_FELDER, "summeBis"), -5)[0]).toMatch(/ab null/)
  })
})

describe("Hilfen", () => {
  it("bereinigt Texte, Listen und Objekte", () => {
    expect(bereinigt("  a ")).toBe("a")
    expect(bereinigt(["", " "])).toBeUndefined()
    expect(bereinigt({ a: "", b: [] })).toBeUndefined()
    expect(bereinigt(Number.NaN)).toBeUndefined()
    expect(bereinigt({ type: "Point", coordinates: [9.5, 51.3] })).toEqual({ type: "Point", coordinates: [9.5, 51.3] })
  })

  it("Schlagworte ohne Raute und ohne Doppelte", () => {
    expect(schlagworte(["#natur", "natur", " garten ", 3])).toEqual(["natur", "garten"])
  })
})

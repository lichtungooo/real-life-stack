import { describe, expect, it } from "vitest"
import {
  LEERE_NOTIZ, notizSchreiben, notizGilt,
  umfrageNeu, stimmeDazu, umfrageSchliessen, ergebnis, umfrageEinmischen,
  leereSitzung, weckerStellen, weckerAus, losZiehen,
  type Umfrage,
} from "../src"

const T = 1_000_000

describe("Geteilte Notizen", () => {
  it("schreiben zaehlt die Fassung, derselbe Text aendert nichts", () => {
    const a = notizSchreiben(LEERE_NOTIZ, "Tagesordnung", "anna", "Anna", T)
    expect(a).toMatchObject({ text: "Tagesordnung", v: 1, name: "Anna" })
    expect(notizSchreiben(a, "Tagesordnung", "bert", "Bert", T + 1)).toBe(a)
  })

  it("bei gleichzeitigem Schreiben sehen am Ende alle denselben Text", () => {
    const anna = notizSchreiben(LEERE_NOTIZ, "von Anna", "anna", "Anna", T)
    const bert = notizSchreiben(LEERE_NOTIZ, "von Bert", "bert", "Bert", T)
    expect(notizGilt(anna, bert).text).toBe(notizGilt(bert, anna).text)
  })
})

describe("Umfrage", () => {
  const u = umfrageNeu("u1", "Wann treffen wir uns?", ["Montag", " Dienstag ", ""], "anna") as Umfrage

  it("braucht eine Frage und zwei Antworten; leere fallen weg", () => {
    expect(u.antworten).toEqual(["Montag", "Dienstag"])
    expect(umfrageNeu("x", "Frage", ["nur eine"], "a")).toBeNull()
    expect(umfrageNeu("x", "  ", ["a", "b"], "a")).toBeNull()
  })

  it("zwei gleichzeitige Stimmen gehen beide ein, je Mensch zaehlt die juengste", () => {
    let v = stimmeDazu(u, { umfrage: "u1", wer: "anna", wahl: 0, wann: T })
    v = stimmeDazu(v, { umfrage: "u1", wer: "bert", wahl: 1, wann: T })
    expect(ergebnis(v)).toEqual([1, 1])
    v = stimmeDazu(v, { umfrage: "u1", wer: "anna", wahl: 1, wann: T + 5 })
    expect(ergebnis(v)).toEqual([0, 2])
    // eine aeltere, spaet angekommene Stimme ueberschreibt nichts
    v = stimmeDazu(v, { umfrage: "u1", wer: "anna", wahl: 0, wann: T + 1 })
    expect(ergebnis(v)).toEqual([0, 2])
  })

  it("nach dem Schliessen zaehlt keine Stimme mehr; fremde Umfrage und falsche Wahl zaehlen nie", () => {
    const zu = umfrageSchliessen(u)
    expect(stimmeDazu(zu, { umfrage: "u1", wer: "anna", wahl: 0, wann: T })).toBe(zu)
    expect(stimmeDazu(u, { umfrage: "andere", wer: "anna", wahl: 0, wann: T })).toBe(u)
    expect(stimmeDazu(u, { umfrage: "u1", wer: "anna", wahl: 7, wann: T })).toBe(u)
  })

  it("ein Nachzuegler mischt den Stand ein: Stimmen vereinigt, geschlossen bleibt geschlossen", () => {
    const meine = stimmeDazu(u, { umfrage: "u1", wer: "anna", wahl: 0, wann: T })
    const fremde = umfrageSchliessen(stimmeDazu(u, { umfrage: "u1", wer: "bert", wahl: 1, wann: T }))
    const zusammen = umfrageEinmischen(meine, fremde)
    expect(ergebnis(zusammen)).toEqual([1, 1])
    expect(zusammen.offen).toBe(false)
    expect(umfrageEinmischen(null, fremde)).toBe(fremde)
  })
})

describe("Kurzzeitwecker und Los", () => {
  it("der Wecker laeuft fuer alle und laesst sich ausschalten", () => {
    const s = weckerStellen(leereSitzung(T), 5, "anna", T)
    expect(s.wecker).toEqual({ bis: T + 300_000, minuten: 5, von: "anna" })
    expect(weckerStellen(s, 0, "anna", T)).toBe(s)
    expect(weckerAus(s, "bert").wecker).toBeNull()
    expect(weckerAus(leereSitzung(T), "bert").wecker).toBeUndefined()
  })

  it("das Los faellt auf einen der Anwesenden und zaehlt jeden Zug", () => {
    const leute = [{ id: "a", name: "Anna" }, { id: "b", name: "Bert" }, { id: "c", name: "Cara" }]
    const eins = losZiehen(leereSitzung(T), leute, "anna", T, () => 0.5)
    expect(eins.los).toMatchObject({ nr: 1, id: "b", name: "Bert" })
    const zwei = losZiehen(eins, leute, "anna", T, () => 0.999)
    expect(zwei.los).toMatchObject({ nr: 2, id: "c" })
    expect(losZiehen(eins, [], "anna", T)).toBe(eins)
  })
})

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

import { regelnSetzen, regelnVon, redezeitRest, redezeitAblaufen, stabNehmen, STANDARD_REGELN } from "../src"

describe("Redezeit mit Gong", () => {
  const leute = [{ id: "anna", name: "Anna" }, { id: "bert", name: "Bert" }, { id: "cara", name: "Cara" }]
  const ids = leute.map((l) => l.id)
  const mitRegel = (danach: "weiter" | "mitte") =>
    stabNehmen(regelnSetzen(leereSitzung(T), { redezeit: 3, danach }, "anna"), "anna", "Anna", ids, T)

  it("ohne Regel keine Redezeit; die Regel gilt fuer alle", () => {
    expect(regelnVon(leereSitzung(T))).toEqual(STANDARD_REGELN)
    const s = mitRegel("mitte")
    expect(regelnVon(s)).toEqual({ redezeit: 3, danach: "mitte" })
    expect(redezeitRest(s, T + 60_000)).toBe(120_000)
  })

  it("vor dem Ablauf geschieht nichts, und nur wer den Stab haelt, loest aus", () => {
    const s = mitRegel("weiter")
    expect(redezeitAblaufen(s, leute, "anna", T + 179_999)).toBe(s)
    expect(redezeitAblaufen(s, leute, "bert", T + 180_000)).toBe(s)
  })

  it("danach 'weiter': Gong und der Stab geht an den Naechsten im Kreis", () => {
    const um = redezeitAblaufen(mitRegel("weiter"), leute, "anna", T + 180_000)
    expect(um.gong?.nr).toBe(1)
    expect(um.stab).toMatchObject({ halter: "bert", name: "Bert", seit: T + 180_000 })
    // Die Redezeit beginnt fuer Bert neu
    expect(redezeitRest(um, T + 180_000)).toBe(180_000)
  })

  it("danach 'mitte': Gong und der Stab liegt wieder in der Mitte", () => {
    const um = redezeitAblaufen(mitRegel("mitte"), leute, "anna", T + 200_000)
    expect(um.gong?.nr).toBe(1)
    expect(um.stab.halter).toBeNull()
    expect(redezeitRest(um, T + 200_000)).toBeNull()
  })
})

import { stilleSekundenVon, sitzungRest, prozessFinden } from "../src"

describe("Stille und Sitzungsdauer", () => {
  const wir = prozessFinden("wir-prozess")

  it("die Stille kommt aus der Regel des Raums, sonst aus dem Prozess, sonst 20 Sekunden", () => {
    const s = leereSitzung(T)
    expect(stilleSekundenVon(s, null)).toBe(20)
    expect(stilleSekundenVon(s, wir)).toBe(30)
    const mitStille = regelnSetzen(s, { redezeit: 0, danach: "mitte", stille: 60 }, "anna", T)
    expect(stilleSekundenVon(mitStille, wir)).toBe(60)
  })

  it("die Sitzungsdauer laeuft ab dem Festlegen und bleibt stehen, wenn anderes geaendert wird", () => {
    const s = regelnSetzen(leereSitzung(T), { redezeit: 0, danach: "mitte", sitzungsdauer: 120 }, "anna", T)
    expect(sitzungRest(s, T + 60 * 60_000)).toBe(60 * 60_000)
    const spaeter = regelnSetzen(s, { redezeit: 3, danach: "weiter", sitzungsdauer: 120 }, "bert", T + 30 * 60_000)
    expect(sitzungRest(spaeter, T + 60 * 60_000)).toBe(60 * 60_000)
    const neu = regelnSetzen(spaeter, { redezeit: 3, danach: "weiter", sitzungsdauer: 90 }, "bert", T + 60 * 60_000)
    expect(sitzungRest(neu, T + 60 * 60_000)).toBe(90 * 60_000)
    expect(sitzungRest(leereSitzung(T), T)).toBeNull()
  })
})

describe("Fremde Stände prüfen (Kimi, 02.10.2026, Befund 4)", () => {
  const u = umfrageNeu("u1", "Wann treffen wir uns?", ["Montag", "Dienstag"], "anna") as Umfrage
  it("Stimmen ohne passende Antwort fallen beim Einmischen weg, das Ergebnis bleibt heil", () => {
    const fremde = { ...u, stimmen: { anna: { wahl: 1, wann: T }, x: { wahl: 99, wann: T }, y: { wahl: "a", wann: T }, z: { wahl: 0 } } } as never
    const eingemischt = umfrageEinmischen(null, fremde)
    expect(Object.keys(eingemischt.stimmen)).toEqual(["anna"])
    expect(ergebnis(eingemischt)).toEqual([0, 1])
    const meine = stimmeDazu(u, { umfrage: "u1", wer: "bert", wahl: 0, wann: T })
    expect(ergebnis(umfrageEinmischen(meine, fremde))).toEqual([1, 1])
  })

  it("ergebnis zählt nur gültige Stimmen, auch wenn der Stand schon kaputt ankam", () => {
    const kaputt = { ...u, stimmen: { a: { wahl: 0, wann: T }, b: { wahl: 7, wann: T } } } as never
    expect(ergebnis(kaputt)).toEqual([1, 0])
  })
})

/** Die Moderation: offen, bis jemand sie einstellt; jedes Geraet haelt sich selbst daran. */
import { describe, expect, it } from "vitest"
import { leereSitzung, moderationSetzen, moderationVon, namensliste, OFFENE_MODERATION } from "../src"

describe("Moderation", () => {
  it("ohne Einstellung ist alles offen", () => {
    expect(moderationVon(leereSitzung(0))).toEqual(OFFENE_MODERATION)
  })

  it("setzt Teile, und dasselbe noch einmal aendert nichts", () => {
    const s = moderationSetzen(leereSitzung(0), { chat: false, neueStumm: true }, "anna")
    expect(moderationVon(s)).toMatchObject({ chat: false, neueStumm: true, notizen: true })
    expect(moderationSetzen(s, { chat: false }, "bert")).toBe(s)
  })

  it("die Namensliste ist sortiert und nennt den Raum", () => {
    const t = namensliste("Garten", ["Bert", "anna", "Clara"], 0)
    expect(t.split("\n")[0]).toContain("„Garten“")
    expect(t).toContain("- anna\n- Bert\n- Clara")
  })
})

describe("Textdokument als Item", () => {
  it("merkt sich nur die Id des Items", async () => {
    const { dokumentSetzen } = await import("../src")
    const s = dokumentSetzen(leereSitzung(0), "item-1", "anna")
    expect(s.dokument).toEqual({ item: "item-1" })
    expect(dokumentSetzen(s, "item-1", "bert")).toBe(s)
    expect(dokumentSetzen(s, null, "bert").dokument).toBeNull()
  })
})

describe("Ein Wort zur Zeit", () => {
  it("ist aus, bis es jemand einschaltet; der Kreis mit Redestab gilt ohnehin", async () => {
    const { nurEinerSpricht, moderationSetzen } = await import("../src/moderation")
    const { leereSitzung } = await import("../src/sitzung")
    const s = leereSitzung(0)
    expect(nurEinerSpricht(s, null)).toBe(false)
    expect(nurEinerSpricht(s, { nurStabSpricht: true })).toBe(true)
    expect(nurEinerSpricht(moderationSetzen(s, { einWort: true }, "a"), null)).toBe(true)
  })
})

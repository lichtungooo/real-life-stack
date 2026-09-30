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

/** Demo und Login getrennt: Ein Neuladen bleibt, wo man war (Timo, 03.10.2026). */
import { describe, expect, it } from "vitest"
import { connectorWahl } from "./connector-wahl"

const bekannt = ["local", "wot", "mock"]

describe("Connector beim Start", () => {
  it("wer zum ersten Mal kommt, landet in der Vorgabe der Instanz (Demo)", () => {
    expect(connectorWahl({ url: null, gespeichert: null, vorgabe: "local", bekannt })).toBe("local")
  })
  it("wer eingeloggt war, bleibt nach dem Neuladen im Login", () => {
    expect(connectorWahl({ url: null, gespeichert: "wot", vorgabe: "local", bekannt })).toBe("wot")
  })
  it("die Adresse sticht alles (Spec 11)", () => {
    expect(connectorWahl({ url: "local", gespeichert: "wot", vorgabe: "wot", bekannt })).toBe("local")
  })
  it("Unbekanntes fällt durch", () => {
    expect(connectorWahl({ url: "tippfehler", gespeichert: "alt", vorgabe: undefined, bekannt })).toBe("wot")
  })
})

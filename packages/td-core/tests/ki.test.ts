/** Das KI-Modul (DEFINITION 13.10): Datenstrom, Entwurf, erlaubte MCP-Adresse, Verlauf. */
import { describe, expect, it } from "vitest"
import { KI_MCP_VORGABE, entwurfAusText, kiLeser, kiMcpAdresse, kiVerlauf, kiZeile, schrittTitel, werkzeugName } from "../src/ki"

describe("KI-Modul", () => {
  it("Datenstrom hin und zurück, auch in Stücken", () => {
    const lesen = kiLeser()
    const strom = kiZeile({ typ: "text", text: "Hallo" }) + kiZeile({ typ: "schritt", werkzeug: "profil_art_klaeren", titel: "x" }) + kiZeile({ typ: "fertig" })
    const a = lesen(strom.slice(0, 20))
    const b = lesen(strom.slice(20))
    expect([...a, ...b].map((e) => e.typ)).toEqual(["text", "schritt", "fertig"])
    expect(lesen("data: kaputt\n\n")).toEqual([])
  })

  it("erkennt Werkzeuge und den fertigen Entwurf", () => {
    expect(werkzeugName("mcp__profil__stiftung_profil_link")).toBe("stiftung_profil_link")
    expect(schrittTitel("mcp__profil__projekt_profil_pruefen")).toBe("Prüft den Entwurf")
    expect(schrittTitel("unbekannt_ding")).toBe("Nutzt unbekannt ding")
    expect(entwurfAusText("Link: https://trustdonation.org/app/#einrichtung-entwurf=eyJ2Ijo_x-1")).toBe("einrichtung-entwurf=eyJ2Ijo_x-1")
    expect(entwurfAusText("nichts")).toBeNull()
  })

  it("lässt nur öffentliche https-Adressen zu", () => {
    expect(kiMcpAdresse("https://macher-map.org/mcp")).toBe("https://macher-map.org/mcp")
    for (const boese of ["http://x.org/mcp", "https://localhost/mcp", "https://127.0.0.1/mcp", "https://10.0.0.5/mcp", "https://192.168.1.2/mcp", "https://user:pw@x.org", "https://intranet/mcp", "", 7])
      expect(kiMcpAdresse(boese), String(boese)).toBe(KI_MCP_VORGABE)
  })

  it("kürzt den Verlauf und verlangt am Ende eine Frage des Menschen", () => {
    expect(kiVerlauf([{ rolle: "mensch", text: "Hallo" }])).toEqual([{ rolle: "mensch", text: "Hallo" }])
    expect(kiVerlauf([{ rolle: "mensch", text: "a" }, { rolle: "ki", text: "b" }])).toBeNull()
    expect(kiVerlauf("x")).toBeNull()
    const lang = Array.from({ length: 60 }, (_, i) => ({ rolle: i % 2 ? "ki" : "mensch", text: "x".repeat(1000) })).concat([{ rolle: "mensch", text: "Ende" }])
    const k = kiVerlauf(lang)!
    expect(k.length).toBeLessThanOrEqual(40)
    expect(k.reduce((s, n) => s + n.text.length, 0)).toBeLessThanOrEqual(40_000)
  })
})

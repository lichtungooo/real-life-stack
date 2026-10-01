/**
 * Der MCP-Server (DEFINITION 13.6): drei Werkzeuge, keins schreibt, alles
 * kommt aus td-core, der Link trägt denselben Entwurf, den die App liest.
 */
import { describe, expect, it } from "vitest"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { PROJEKT_PROFIL_FELDER, entwurfLesen } from "@trustdonation/core"
import { createServer, link, vorgabe } from "../src/server"

async function verbinden() {
  const server = createServer({ appUrl: "https://beispiel.org/app/", geocode: async () => ({ lat: 51.32, lng: 9.49 }) })
  const [c, s] = InMemoryTransport.createLinkedPair()
  const client = new Client({ name: "test", version: "0" })
  await Promise.all([server.connect(s), client.connect(c)])
  return client
}

describe("td-mcp", () => {
  it("meldet genau die drei Werkzeuge, jedes mit Beschreibung", async () => {
    const client = await verbinden()
    const { tools } = await client.listTools()
    expect(tools.map((t) => t.name).sort()).toEqual(["projekt_profil_link", "projekt_profil_pruefen", "projekt_profil_vorgabe"])
    for (const t of tools) expect(t.description?.length, t.name).toBeGreaterThan(40)
  })

  it("die Vorgabe trägt die Feldliste aus td-core, nicht eine eigene", () => {
    const v = vorgabe()
    expect(v.felder).toBe(PROJEKT_PROFIL_FELDER)
    expect(v.beispiel.title).toBe("Grünes Klassenzimmer Nordstadt")
    expect(v.beispiel).not.toHaveProperty("muster")
  })

  it("prüfen über MCP nennt fehlende Kernfelder", async () => {
    const client = await verbinden()
    const r = (await client.callTool({ name: "projekt_profil_pruefen", arguments: { entwurf: { title: "Bachpaten" } } })) as { content: { text: string }[] }
    expect(r.content[0].text).toMatch(/Es fehlen Kernfelder: kurz/)
  })

  it("der Link trägt den Entwurf mit ergänztem Ort, und die App liest ihn", async () => {
    const r = await link(
      { title: "Bachpaten", kurz: "Kinder pflegen Bäche.", beduerfnis: "Vierzig Bäche bleiben unbetreut.", address: "Musterweg 1, 34127 Kassel", tags: ["Wasser"] },
      { appUrl: "https://beispiel.org/app/", geocode: async () => ({ lat: 51.32, lng: 9.49 }) },
    )
    expect(r.url).toMatch(/^https:\/\/beispiel\.org\/app\/#projekt-entwurf=/)
    const gelesen = entwurfLesen(new URL(r.url).hash)!
    expect(gelesen.entwurf.daten.position).toEqual({ type: "Point", coordinates: [9.49, 51.32] })
    expect(gelesen.entwurf.tags).toEqual(["Wasser"])
    expect(gelesen.fehlt).toEqual([])
    expect(r.text).toMatch(/OpenStreetMap/)
  })

  it("eine App-Adresse mit Query-Teil bleibt heil", async () => {
    const r = await link({ title: "X" }, { appUrl: "http://localhost:5181/?connector=local", ortErgaenzen: false })
    expect(r.url).toMatch(/^http:\/\/localhost:5181\/\?connector=local#projekt-entwurf=/)
  })

  it("ohne Fund zur Anschrift sagt der Link es, statt zu raten", async () => {
    const r = await link({ title: "X", address: "Nirgendwo 0" }, { geocode: async () => null })
    expect(r.text).toMatch(/kein Ort zu finden/)
    expect(entwurfLesen(new URL(r.url).hash)!.entwurf.daten.position).toBeUndefined()
  })

  it("ein zu großer Entwurf kommt als Fehler zurück, nicht als Absturz", async () => {
    const client = await verbinden()
    const r = (await client.callTool({ name: "projekt_profil_link", arguments: { entwurf: { title: "X", description: "x".repeat(60_000) }, ort_ergaenzen: false } })) as { isError?: boolean; content: { text: string }[] }
    expect(r.isError).toBe(true)
    expect(r.content[0].text).toMatch(/zu groß/)
  })
})

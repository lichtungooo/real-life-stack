/**
 * Der Server eines Netzwerks über HTTP (DEFINITION 13.7): ein echter
 * MCP-Client spricht mit ihm, zustandslos, unter /mcp; die Ortssuche hält
 * den Abstand für alle und sucht jede Anschrift nur einmal.
 */
import { afterEach, describe, expect, it } from "vitest"
import type { AddressInfo } from "node:net"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import { netzwerkServer } from "../src/http"
import { gedrosselteOrtsuche } from "../src/ort"

const offen: { close: () => void }[] = []
afterEach(() => { offen.splice(0).forEach((s) => s.close()) })

async function starten(netzwerk?: string) {
  const { server, aufrufe } = netzwerkServer({ appUrl: "https://beispiel.org/app", netzwerk, geocode: async () => ({ lat: 51.3, lng: 9.5 }) })
  await new Promise<void>((r) => server.listen(0, r))
  offen.push(server)
  return { url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`, aufrufe }
}

async function client(url: string) {
  const c = new Client({ name: "test", version: "0" })
  await c.connect(new StreamableHTTPClientTransport(new URL(url)))
  return c
}

describe("td-mcp über HTTP", () => {
  it("ein MCP-Client sieht unter /mcp die drei Werkzeuge mit dem Namen des Netzwerks", async () => {
    const { url } = await starten("Macher-Map")
    const c = await client(`${url}/mcp`)
    const { tools } = await c.listTools()
    expect(tools.map((t) => t.name).sort()).toEqual(["einrichtung_profil_link", "einrichtung_profil_pruefen", "einrichtung_profil_vorgabe", "profil_art_klaeren", "projekt_profil_link", "projekt_profil_pruefen", "projekt_profil_vorgabe", "stiftung_profil_link", "stiftung_profil_pruefen", "stiftung_profil_vorgabe"])
    expect(tools.find((t) => t.name === "projekt_profil_vorgabe")!.description).toMatch(/Netzwerk Macher-Map/)
    await c.close()
  })

  it("baut den Link über HTTP, mit dem Ort zur Anschrift", async () => {
    const { url } = await starten()
    const c = await client(`${url}/mcp`)
    const r = (await c.callTool({ name: "projekt_profil_link", arguments: { entwurf: { title: "Bachpaten", address: "Musterweg 1, Kassel" } } })) as { content: { text: string }[] }
    expect(r.content[0].text).toMatch(/https:\/\/beispiel\.org\/app\/#projekt-entwurf=/)
    await c.close()
  })

  it("hält keine Sitzung: GET bekommt 405, fremde Pfade 404", async () => {
    const { url } = await starten()
    expect((await fetch(`${url}/mcp`)).status).toBe(405)
    expect((await fetch(`${url}/anderswo`, { method: "POST" })).status).toBe(404)
  })

  it("lehnt eine übergroße Anfrage ab", async () => {
    const { url } = await starten()
    const r = await fetch(`${url}/mcp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "x".repeat(300_000) })
    expect(r.status).toBe(413)
  })

  it("zählt die Aufrufe, schreibt sonst nichts mit", async () => {
    const { url, aufrufe } = await starten()
    const c = await client(`${url}/mcp`)
    await c.listTools()
    expect(aufrufe()).toBeGreaterThanOrEqual(2)
    await c.close()
  })
})

describe("Die gedrosselte Ortssuche", () => {
  it("sucht jede Anschrift nur einmal und hält den Abstand", async () => {
    const zeiten: number[] = []
    const suche = async (a: string) => { zeiten.push(Date.now()); return a.includes("Kassel") ? { lat: 51.3, lng: 9.5 } : null }
    const ort = gedrosselteOrtsuche({ suche, abstandMs: 80 })
    const [a, b, c] = await Promise.all([ort("Musterweg 1, Kassel"), ort("musterweg 1,  kassel"), ort("Irgendwo 2, Felsberg")])
    expect(a).toEqual({ lat: 51.3, lng: 9.5 })
    expect(b).toEqual(a)
    expect(c).toBeNull()
    expect(zeiten).toHaveLength(2)
    expect(zeiten[1] - zeiten[0]).toBeGreaterThanOrEqual(75)
  })

  it("eine gescheiterte Suche hält die Reihe nicht an", async () => {
    let n = 0
    const ort = gedrosselteOrtsuche({ suche: async () => { n++; if (n === 1) throw new Error("Netz weg"); return { lat: 1, lng: 2 } }, abstandMs: 1 })
    expect(await ort("A")).toBeNull()
    expect(await ort("B")).toEqual({ lat: 1, lng: 2 })
  })
})

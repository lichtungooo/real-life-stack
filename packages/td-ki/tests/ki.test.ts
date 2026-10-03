/**
 * Der Agent-Dienst des KI-Moduls (DEFINITION 13.10), mit einer nachgebildeten
 * KI: Text, Arbeitsschritte, fertiger Entwurf, Zugangswort, Grenzen, und dass
 * Claude Code nur die Werkzeuge des MCP-Servers bekommt.
 */
import { afterEach, describe, expect, it } from "vitest"
import type { AddressInfo } from "node:net"
import type { Server } from "node:http"
import { kiLeser, type KiEreignis } from "@trustdonation/core"
import { auftrag, kiAntwort, optionen, type Abfrage } from "../src/agent"
import { kiServer } from "../src/http"

/** Eine KI, die einmal ein Werkzeug nutzt und den Link bekommt. */
const nachgebildet: Abfrage = async function* () {
  yield { type: "stream_event", parent_tool_use_id: null, event: { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "Ich schaue " } } } as never
  yield { type: "stream_event", parent_tool_use_id: null, event: { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "mir das an." } } } as never
  yield { type: "assistant", message: { content: [{ type: "tool_use", id: "t1", name: "mcp__profil__einrichtung_profil_link", input: {} }] } } as never
  yield { type: "user", message: { content: [{ type: "tool_result", tool_use_id: "t1", content: [{ type: "text", text: "Link: https://trustdonation.org/app/#einrichtung-entwurf=eyJ2IjoxfQ" }] }] } } as never
  yield { type: "result", subtype: "success" } as never
}

async function sammeln(it: AsyncIterable<KiEreignis>) {
  const aus: KiEreignis[] = []
  for await (const e of it) aus.push(e)
  return aus
}

describe("kiAntwort", () => {
  it("streamt Text, Schritt, Entwurf und Ende", async () => {
    const e = await sammeln(kiAntwort({ verlauf: [{ rolle: "mensch", text: "Wir sind die Radwerkstatt." }], mcp: "https://trustdonation.org/mcp", abbruch: new AbortController(), abfrage: nachgebildet }))
    expect(e).toEqual([
      { typ: "text", text: "Ich schaue " },
      { typ: "text", text: "mir das an." },
      { typ: "schritt", werkzeug: "einrichtung_profil_link", titel: "Stellt das Profil fertig" },
      { typ: "entwurf", fragment: "einrichtung-entwurf=eyJ2IjoxfQ" },
      { typ: "fertig" },
    ])
  })

  it("ein Fehler der KI kommt als Ereignis, nie als Absturz", async () => {
    const kaputt: Abfrage = async function* () { throw new Error("401 not logged in") }
    const e = await sammeln(kiAntwort({ verlauf: [{ rolle: "mensch", text: "x" }], mcp: "https://x.org/mcp", abbruch: new AbortController(), abfrage: kaputt }))
    expect(e).toEqual([{ typ: "fehler", text: "Die KI ist auf dem Server nicht angemeldet." }])
  })

  it("Claude Code bekommt nur den einen MCP-Server, keine eigenen Werkzeuge, keine Einstellungen", () => {
    const o = optionen("https://trustdonation.org/mcp", new AbortController())
    expect(o.tools).toEqual([])
    expect(o.allowedTools).toEqual(["mcp__profil__*"])
    expect(o.mcpServers).toEqual({ profil: { type: "http", url: "https://trustdonation.org/mcp" } })
    expect(o.strictMcpConfig).toBe(true)
    expect(o.settingSources).toEqual([])
    expect(o.persistSession).toBe(false)
    expect(o.permissionMode).toBe("dontAsk")
  })

  it("der Verlauf geht als ein Auftrag mit", () => {
    expect(auftrag([{ rolle: "mensch", text: "Hallo" }])).toBe("Hallo")
    expect(auftrag([{ rolle: "mensch", text: "A" }, { rolle: "ki", text: "B" }, { rolle: "mensch", text: "C" }])).toBe("Bisheriges Gespräch:\nMensch: A\n\nKI: B\n\nNeue Nachricht des Menschen:\nC")
  })
})

describe("HTTP", () => {
  let server: Server | null = null
  afterEach(() => { server?.close(); server = null })
  async function starten(zugang = "geheim") {
    server = kiServer({ zugang, herkunft: ["https://trustdonation.org"], abfrage: nachgebildet })
    await new Promise<void>((r) => server!.listen(0, r))
    return `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  }
  const senden = (url: string, kopf: Record<string, string>, koerper: unknown) =>
    fetch(`${url}/ki`, { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://trustdonation.org", ...kopf }, body: JSON.stringify(koerper) })

  it("mit Zugangswort: Ereignisse als Datenstrom", async () => {
    const url = await starten()
    const r = await senden(url, { "X-KI-Zugang": "geheim" }, { verlauf: [{ rolle: "mensch", text: "Hallo" }] })
    expect(r.status).toBe(200)
    expect(r.headers.get("content-type")).toMatch(/event-stream/)
    expect(r.headers.get("access-control-allow-origin")).toBe("https://trustdonation.org")
    const e = kiLeser()(await r.text())
    expect(e.map((x) => x.typ)).toEqual(["text", "text", "schritt", "entwurf", "fertig"])
  })

  it("ohne oder mit falschem Zugangswort: 401; fremde Seite: 403; ohne Einrichtung: 503", async () => {
    const url = await starten()
    expect((await senden(url, {}, { verlauf: [{ rolle: "mensch", text: "x" }] })).status).toBe(401)
    expect((await senden(url, { "X-KI-Zugang": "falsch" }, { verlauf: [{ rolle: "mensch", text: "x" }] })).status).toBe(401)
    expect((await fetch(`${url}/ki`, { method: "POST", headers: { Origin: "https://boese.example", "X-KI-Zugang": "geheim" }, body: "{}" })).status).toBe(403)
    server!.close()
    const ohne = await starten("")
    expect((await senden(ohne, { "X-KI-Zugang": "x" }, { verlauf: [{ rolle: "mensch", text: "x" }] })).status).toBe(503)
    expect(await (await fetch(`${ohne}/ki/stand`)).json()).toEqual({ bereit: false })
  })

  it("ohne Nachricht des Menschen am Ende: 400", async () => {
    const url = await starten()
    expect((await senden(url, { "X-KI-Zugang": "geheim" }, { verlauf: [] })).status).toBe(400)
  })
})

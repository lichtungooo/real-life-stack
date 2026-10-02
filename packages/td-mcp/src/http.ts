#!/usr/bin/env node
/**
 * Der Server eines Netzwerks über HTTP (DEFINITION 13.7).
 *
 * Ein Netzwerk bietet seine Begleitung unter einer Adresse an, etwa
 * https://trustdonation.org/mcp. Wer sie nutzt, trägt nur die Adresse in
 * seinen Agenten ein. Zustandslos: Jede Anfrage bekommt einen frischen Server
 * und Transport, nichts bleibt liegen. Mitgeschrieben wird nur, wie oft.
 *
 *   PORT          Standard 8787
 *   TD_APP_URL    wohin der Link führt (Standard https://trustdonation.org/app)
 *   TD_NETZWERK   Name des Netzwerks, erscheint in den Beschreibungen
 */
import { createServer as httpServer, type IncomingMessage, type Server } from "node:http"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { createServer, nominatim, type ServerOptionen } from "./server.js"
import { gedrosselteOrtsuche } from "./ort.js"

/** Größte Anfrage: ein Entwurf bis 48 KB, als JSON-RPC verpackt, mit Luft. */
const HOECHSTENS_BYTES = 200_000

async function koerper(req: IncomingMessage): Promise<unknown> {
  const teile: Buffer[] = []
  let laenge = 0
  for await (const t of req) {
    laenge += (t as Buffer).length
    if (laenge > HOECHSTENS_BYTES) throw Object.assign(new Error("zu groß"), { status: 413 })
    teile.push(t as Buffer)
  }
  const text = Buffer.concat(teile).toString("utf8")
  return text ? JSON.parse(text) : undefined
}

export interface NetzwerkServerOptionen extends ServerOptionen {
  netzwerk?: string
}

/** Den HTTP-Server bauen (nicht starten). Für Tests und für den Einstieg unten. */
export function netzwerkServer(optionen: NetzwerkServerOptionen = {}): { server: Server; aufrufe: () => number } {
  let aufrufe = 0
  const geocode = optionen.geocode ?? gedrosselteOrtsuche({ suche: nominatim })
  const server = httpServer(async (req, res) => {
    const pfad = (req.url ?? "/").split("?")[0].replace(/\/+$/, "") || "/"
    if (pfad !== "/" && pfad !== "/mcp") {
      res.writeHead(404).end()
      return
    }
    if (req.method !== "POST") {
      // Zustandslos: kein Strom vom Server, keine Sitzung zum Beenden.
      res.writeHead(405, { Allow: "POST", "Content-Type": "application/json" })
        .end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Nur POST. Dieser Server hält keine Sitzung." }, id: null }))
      return
    }
    aufrufe++
    try {
      const body = await koerper(req)
      const mcp = createServer({ ...optionen, geocode })
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
      res.on("close", () => { void transport.close(); void mcp.close() })
      await mcp.connect(transport)
      await transport.handleRequest(req, res, body)
    } catch (e) {
      const status = (e as { status?: number }).status ?? 400
      if (!res.headersSent) {
        res.writeHead(status, { "Content-Type": "application/json" })
          .end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32700, message: status === 413 ? "Anfrage zu groß." : "Anfrage nicht lesbar." }, id: null }))
      }
    }
  })
  return { server, aufrufe: () => aufrufe }
}

// Direkt gestartet: lauschen und alle zehn Minuten die Zahl der Aufrufe nennen.
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}` || process.argv[1]?.endsWith("http.js")) {
  const port = Number(process.env.PORT ?? 8787)
  const netzwerk = process.env.TD_NETZWERK
  const { server, aufrufe } = netzwerkServer({ appUrl: process.env.TD_APP_URL, netzwerk })
  server.listen(port, () => console.log(`td-mcp für ${netzwerk ?? "trustdonation"} auf :${port}`))
  setInterval(() => console.log(`Aufrufe bisher: ${aufrufe()}`), 600_000).unref()
}

#!/usr/bin/env node
/**
 * Der Agent-Dienst des KI-Moduls über HTTP (DEFINITION 13.10), unter
 * https://trustdonation.org/ki.
 *
 *   POST /ki        { verlauf, mcp } → Ereignisse als Server-Sent Events
 *   GET  /ki/stand  { bereit }        ob der Dienst eingerichtet ist
 *
 * Ein Abo gilt für einen Menschen (Anthropics Bedingungen). Darum fragt der
 * Dienst nach einem Zugangswort, das nur sein Mensch kennt. Höchstens zwei
 * Gespräche zugleich: Jedes startet Claude Code mit rund einem Gigabyte.
 *
 *   PORT                     Standard 8788
 *   TD_KI_ZUGANG             das Zugangswort (ohne: nicht eingerichtet)
 *   CLAUDE_CODE_OAUTH_TOKEN  die Anmeldung von Claude Code (claude setup-token)
 *   TD_KI_HERKUNFT           erlaubte Seiten, mit Komma (Standard trustdonation.org, wir.ooo)
 */
import { createServer as httpServer, type IncomingMessage, type Server } from "node:http"
import { timingSafeEqual } from "node:crypto"
import { kiMcpAdresse, kiVerlauf, kiZeile } from "@trustdonation/core"
import { kiAntwort, type Abfrage } from "./agent.js"

const HOECHSTENS_BYTES = 120_000
const ZUGLEICH = 2
const LAUFZEIT_MS = 4 * 60_000

async function koerper(req: IncomingMessage): Promise<unknown> {
  const teile: Buffer[] = []
  let laenge = 0
  for await (const t of req) {
    laenge += (t as Buffer).length
    if (laenge > HOECHSTENS_BYTES) throw Object.assign(new Error("zu groß"), { status: 413 })
    teile.push(t as Buffer)
  }
  return JSON.parse(Buffer.concat(teile).toString("utf8") || "null")
}

function gleich(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export interface KiServerOptionen {
  zugang?: string
  herkunft?: readonly string[]
  abfrage?: Abfrage
}

export function kiServer(o: KiServerOptionen = {}): Server {
  const zugang = o.zugang ?? process.env.TD_KI_ZUGANG ?? ""
  const herkunft = o.herkunft ?? (process.env.TD_KI_HERKUNFT ?? "https://trustdonation.org,https://wir.ooo").split(",").map((s) => s.trim()).filter(Boolean)
  let laufend = 0

  return httpServer(async (req, res) => {
    const pfad = (req.url ?? "/").split("?")[0].replace(/\/+$/, "") || "/"
    const von = req.headers.origin
    const cors: Record<string, string> = von && herkunft.includes(von)
      ? { "Access-Control-Allow-Origin": von, "Access-Control-Allow-Headers": "Content-Type, X-KI-Zugang", "Access-Control-Allow-Methods": "GET, POST", Vary: "Origin" }
      : {}
    const json = (status: number, wert: unknown) => res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...cors }).end(JSON.stringify(wert))

    if (req.method === "OPTIONS") { res.writeHead(204, cors).end(); return }
    if (pfad === "/ki/stand" && req.method === "GET") { json(200, { bereit: Boolean(zugang) }); return }
    if (pfad !== "/ki" && pfad !== "/") { json(404, { fehler: "Unbekannter Weg." }); return }
    if (req.method !== "POST") { json(405, { fehler: "Nur POST." }); return }
    if (von && !cors["Access-Control-Allow-Origin"]) { json(403, { fehler: "Diese Seite ist hier nicht eingetragen." }); return }
    if (!zugang) { json(503, { fehler: "Die KI ist auf diesem Server noch nicht eingerichtet." }); return }
    const wort = req.headers["x-ki-zugang"]
    if (typeof wort !== "string" || !gleich(wort, zugang)) { json(401, { fehler: "Das Zugangswort fehlt oder stimmt nicht. Trag es in den Einstellungen der KI ein." }); return }

    let anfrage: { verlauf?: unknown; mcp?: unknown }
    try { anfrage = ((await koerper(req)) ?? {}) as typeof anfrage } catch (e) {
      json((e as { status?: number }).status ?? 400, { fehler: "Die Anfrage ist nicht lesbar." })
      return
    }
    const verlauf = kiVerlauf(anfrage.verlauf)
    if (!verlauf) { json(400, { fehler: "Es fehlt eine Nachricht." }); return }
    if (laufend >= ZUGLEICH) { json(429, { fehler: "Gerade arbeiten schon zwei Gespräche. Gleich noch einmal versuchen." }); return }

    laufend++
    const abbruch = new AbortController()
    const uhr = setTimeout(() => abbruch.abort(), LAUFZEIT_MS)
    res.on("close", () => abbruch.abort())
    res.writeHead(200, { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no", ...cors })
    try {
      for await (const e of kiAntwort({ verlauf, mcp: kiMcpAdresse(anfrage.mcp), abbruch, abfrage: o.abfrage })) {
        if (res.writableEnded) break
        res.write(kiZeile(e))
      }
    } finally {
      clearTimeout(uhr)
      laufend--
      res.end()
    }
  })
}

// Direkt gestartet: lauschen.
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}` || process.argv[1]?.endsWith("http.js")) {
  const port = Number(process.env.PORT ?? 8788)
  kiServer().listen(port, () => console.log(`td-ki auf :${port}${process.env.TD_KI_ZUGANG ? "" : " (ohne Zugangswort: nicht eingerichtet)"}`))
}

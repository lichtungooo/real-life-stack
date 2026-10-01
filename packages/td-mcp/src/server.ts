/**
 * Der MCP-Server für Profil-Entwürfe (DEFINITION 13.6).
 *
 * Der eigene Agent eines Menschen (Claude, Kimi, ein offenes Modell) holt die
 * Vorgabe, prüft seinen Entwurf und bekommt einen Link. Der Server schreibt
 * nichts in einen Space und hält keine Daten: Der Entwurf reist im Fragment
 * des Links, und der Mensch legt ihn in der App mit seiner Identität an.
 *
 * Felder, Regeln und Prüfung kommen allein aus `@trustdonation/core`. Dieser
 * Server zählt nichts selbst auf (Muster 1).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  PROJEKT_PROFIL_FELDER,
  PROJEKT_ENTWURF_REGELN,
  projektEntwurfPruefen,
  entwurfKodieren,
  type EntwurfBericht,
} from "@trustdonation/core"
import { musterItems } from "@trustdonation/core/musterdaten"

export interface ServerOptionen {
  /** Wo die App läuft. Standard: https://trustdonation.org/app */
  appUrl?: string
  /** Anschrift zu Koordinaten. Standard: Nominatim (OpenStreetMap). */
  geocode?: (anschrift: string) => Promise<{ lat: number; lng: number } | null>
}

export const APP_URL = "https://trustdonation.org/app"

/** Anschrift zu Koordinaten über Nominatim, höflich: ein Treffer, eigener Name. */
export async function nominatim(anschrift: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(anschrift)}`
  try {
    const r = await fetch(url, { headers: { "User-Agent": "td-mcp/0.1 (+https://trustdonation.org)" }, signal: AbortSignal.timeout(8000) })
    if (!r.ok) return null
    const [t] = (await r.json()) as { lat: string; lon: string }[]
    return t ? { lat: Number(t.lat), lng: Number(t.lon) } : null
  } catch {
    return null
  }
}

/** Die Vorgabe: Ablauf, Felder, Regeln und das Musterprojekt als Beispiel. */
export function vorgabe() {
  const m = musterItems.find((i) => i.id === "projekt-gruenes-klassenzimmer")
  const { muster: _m, color: _c, icon: _i, ...beispiel } = (m?.data ?? {}) as Record<string, unknown>
  return {
    ablauf: [
      "1. Lies, was der Mensch über sein Projekt mitgibt (Text, Notizen, Bild-Adressen).",
      "2. Fülle die Felder, die der Text hergibt. Erfinde nichts.",
      "3. Frage nach den Kernfeldern, die fehlen, mit der Frage aus der Liste.",
      "4. Rufe projekt_profil_pruefen auf und bessere nach, was verworfen wird.",
      "5. Rufe projekt_profil_link auf und gib dem Menschen den Link. Er öffnet ihn, sieht die Vorschau und legt das Projekt selbst an.",
    ],
    felder: PROJEKT_PROFIL_FELDER,
    regeln: PROJEKT_ENTWURF_REGELN,
    beispiel: { ...beispiel, tags: m?.tags ?? [] },
  }
}

function berichtText(b: EntwurfBericht): string {
  const zeilen = [`Das Profil zeigt: ${b.zeigt.length ? b.zeigt.join(", ") : "noch nichts"}.`]
  if (b.fehlt.length) zeilen.push(`Es fehlen Kernfelder: ${b.fehlt.map((f) => `${f.id} („${f.frage}“)`).join("; ")}.`)
  else zeilen.push("Alle Kernfelder sind da.")
  if (b.verworfen.length) zeilen.push(`Verworfen: ${b.verworfen.join("; ")}.`)
  if (b.unbekannt.length) zeilen.push(`Unbekannte Felder (bleiben liegen, erscheinen nicht): ${b.unbekannt.join(", ")}.`)
  return zeilen.join("\n")
}

const ENTWURF = z.record(z.string(), z.unknown()).describe(
  "Der Entwurf: ein Objekt mit den Feldern aus projekt_profil_vorgabe (title, kurz, beduerfnis, …). Schlagworte als tags.",
)

/** Prüfen. Exportiert für Tests und andere Clients. */
export function pruefen(entwurf: unknown) {
  const b = projektEntwurfPruefen(entwurf)
  return { text: berichtText(b), bericht: b }
}

/** Den Link bauen, auf Wunsch mit Koordinaten zur Anschrift. */
export async function link(entwurf: Record<string, unknown>, optionen: ServerOptionen & { ortErgaenzen?: boolean } = {}) {
  const roh = { ...entwurf }
  let ortHinweis: string | null = null
  if (optionen.ortErgaenzen !== false && roh.position === undefined && typeof roh.address === "string" && roh.address.trim()) {
    const ort = await (optionen.geocode ?? nominatim)(roh.address)
    if (ort) {
      roh.position = ort
      ortHinweis = `Ort zur Anschrift ergänzt (${ort.lat.toFixed(4)}, ${ort.lng.toFixed(4)}), Quelle OpenStreetMap.`
    } else ortHinweis = "Zur Anschrift war kein Ort zu finden; das Projekt erscheint erst nach dem Bearbeiten auf der Karte."
  }
  const b = projektEntwurfPruefen(roh)
  // Über URL gebaut: Eine App-Adresse darf einen Query-Teil tragen
  // (`?connector=local`), und der Schrägstrich gehört an den Pfad.
  const u = new URL(optionen.appUrl ?? APP_URL)
  if (!u.pathname.endsWith("/")) u.pathname += "/"
  u.hash = entwurfKodieren(b.entwurf)
  const url = u.toString()
  const text = [
    berichtText(b),
    ...(ortHinweis ? [ortHinweis] : []),
    "",
    "Link für den Menschen (öffnen, Vorschau ansehen, Space wählen, anlegen):",
    url,
  ].join("\n")
  return { text, url, bericht: b }
}

export function createServer(optionen: ServerOptionen = {}): McpServer {
  const server = new McpServer({ name: "trustdonation-profil", version: "0.1.0" })

  server.registerTool(
    "projekt_profil_vorgabe",
    {
      title: "Vorgabe für ein Projektprofil",
      description:
        "Gibt den Ablauf, die Felder eines Projektprofils für trustdonation (mit Frage, Form und ob es ein Kernfeld ist), die Regeln und ein vollständiges Beispiel. Zuerst aufrufen.",
      inputSchema: {},
    },
    async () => {
      const v = vorgabe()
      return { content: [{ type: "text", text: JSON.stringify(v, null, 2) }] }
    },
  )

  server.registerTool(
    "projekt_profil_pruefen",
    {
      title: "Entwurf prüfen",
      description:
        "Prüft einen Entwurf mit derselben Schleuse wie die App: welche Abschnitte erscheinen, welche Kernfelder fehlen, was verworfen wird und warum. Schreibt nichts.",
      inputSchema: { entwurf: ENTWURF },
    },
    async ({ entwurf }) => {
      const { text, bericht } = pruefen(entwurf)
      return { content: [{ type: "text", text }, { type: "text", text: JSON.stringify(bericht.entwurf) }] }
    },
  )

  server.registerTool(
    "projekt_profil_link",
    {
      title: "Link zum Anlegen",
      description:
        "Prüft den Entwurf, ergänzt auf Wunsch die Koordinaten zur Anschrift (OpenStreetMap) und gibt einen Link zur App. Der Entwurf steht im Fragment des Links und geht an keinen Server. Der Mensch öffnet ihn, sieht die Vorschau und legt das Projekt mit seiner eigenen Identität an. Schreibt nichts.",
      inputSchema: {
        entwurf: ENTWURF,
        ort_ergaenzen: z.boolean().optional().describe("Koordinaten zur Anschrift suchen, wenn keine angegeben sind. Standard: ja."),
      },
    },
    async ({ entwurf, ort_ergaenzen }) => {
      try {
        const { text } = await link(entwurf, { ...optionen, ortErgaenzen: ort_ergaenzen })
        return { content: [{ type: "text", text }] }
      } catch (e) {
        return { isError: true, content: [{ type: "text", text: e instanceof Error ? e.message : String(e) }] }
      }
    },
  )

  return server
}

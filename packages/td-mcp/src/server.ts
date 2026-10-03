/**
 * Der MCP-Server für Profil-Entwürfe (DEFINITION 13.6; seit 13.8 für alle
 * drei Arten: Projekt, Stiftung, Einrichtung).
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
  PROJEKT_ENTWURF_REGELN,
  PROFIL_ARTEN,
  PROFIL_ART_REGELN,
  PROFIL_ENTWURF_REGELN,
  felderFuer,
  profilEntwurfPruefen,
  profilEntwurfKodieren,
  type EntwurfBericht,
  type ProfilArt,
} from "@trustdonation/core"
import { musterItems } from "@trustdonation/core/musterdaten"

export interface ServerOptionen {
  /** Wo die App läuft. Standard: https://trustdonation.org/app */
  appUrl?: string
  /** Anschrift zu Koordinaten. Standard: Nominatim (OpenStreetMap). */
  geocode?: (anschrift: string) => Promise<{ lat: number; lng: number } | null>
  /** Für welches Netzwerk der Server spricht (DEFINITION 13.7). Standard: trustdonation. */
  netzwerk?: string
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

const ART_NAME: Record<ProfilArt, string> = { projekt: "Projekt", stiftung: "Stiftung", einrichtung: "Einrichtung" }
const ANLEGEN: Record<ProfilArt, string> = {
  projekt: "Er öffnet ihn, sieht die Vorschau, wählt den Space und legt das Projekt selbst an.",
  stiftung: "Er öffnet ihn, sieht die Vorschau, wählt den Space und legt die Stiftung selbst an.",
  einrichtung: "Er öffnet ihn, sieht die Vorschau und speichert das Profil in seinen Space; das darf, wer den Space verwaltet.",
}

/** Ein vollständiges Beispiel aus den Musterdaten, ohne die Kennzeichen des Musters. */
function beispielFuer(art: ProfilArt): Record<string, unknown> | null {
  const id = art === "projekt" ? "projekt-gruenes-klassenzimmer" : art === "stiftung" ? "stiftung-muster-loewenherz" : null
  const m = id ? musterItems.find((i) => i.id === id) : undefined
  if (!m) return null
  const { muster: _m, color: _c, icon: _i, ...beispiel } = (m.data ?? {}) as Record<string, unknown>
  return { ...beispiel, tags: m.tags ?? [] }
}

/** Die Vorgabe einer Art: Ablauf, Felder, Regeln und, wo es eines gibt, ein Beispiel. */
export function vorgabe(art: ProfilArt = "projekt") {
  const name = ART_NAME[art]
  return {
    art,
    wofuer: PROFIL_ART_REGELN[art],
    ablauf: [
      `1. Lies, was der Mensch erzählt (Text, Sprachnachricht, Notizen, Bild-Adressen).`,
      "2. Fülle die Felder, die das Erzählte hergibt. Erfinde nichts.",
      "3. Frage nach den Kernfeldern, die fehlen, mit der Frage aus der Liste. Frag in kleinen Schritten, wie im Gespräch.",
      `4. Rufe ${art}_profil_pruefen auf und bessere nach, was verworfen wird.`,
      `5. Rufe ${art}_profil_link auf und gib dem Menschen den Link. ${ANLEGEN[art]}`,
    ],
    felder: felderFuer(art),
    regeln: art === "projekt" ? PROJEKT_ENTWURF_REGELN : PROFIL_ENTWURF_REGELN,
    beispiel: beispielFuer(art),
    ...(art === "einrichtung" ? { hinweis: `Der Name der ${name} ist der Name ihres Space; er steht nicht im Profil.` } : {}),
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

const entwurfSchema = (art: ProfilArt) => z.record(z.string(), z.unknown()).describe(
  `Der Entwurf: ein Objekt mit den Feldern aus ${art}_profil_vorgabe.${art === "einrichtung" ? "" : " Schlagworte als tags."}`,
)

/** Prüfen. Exportiert für Tests und andere Clients. */
export function pruefen(entwurf: unknown, art: ProfilArt = "projekt") {
  const b = profilEntwurfPruefen(art, entwurf)
  return { text: berichtText(b), bericht: b }
}

/** Den Link bauen, auf Wunsch mit Koordinaten zur Anschrift. */
export async function link(entwurf: Record<string, unknown>, optionen: ServerOptionen & { ortErgaenzen?: boolean; art?: ProfilArt } = {}) {
  const art = optionen.art ?? "projekt"
  const roh = { ...entwurf }
  let ortHinweis: string | null = null
  if (optionen.ortErgaenzen !== false && roh.position === undefined && typeof roh.address === "string" && roh.address.trim()) {
    const ort = await (optionen.geocode ?? nominatim)(roh.address)
    if (ort) {
      roh.position = ort
      ortHinweis = `Ort zur Anschrift ergänzt (${ort.lat.toFixed(4)}, ${ort.lng.toFixed(4)}), Quelle OpenStreetMap.`
    } else ortHinweis = `Zur Anschrift war kein Ort zu finden; ${art === "einrichtung" ? "die Karte im Profil fehlt" : "der Eintrag erscheint erst nach dem Bearbeiten auf der Karte"}.`
  }
  const b = profilEntwurfPruefen(art, roh)
  // Über URL gebaut: Eine App-Adresse darf einen Query-Teil tragen
  // (`?connector=local`), und der Schrägstrich gehört an den Pfad.
  const u = new URL(optionen.appUrl ?? APP_URL)
  if (!u.pathname.endsWith("/")) u.pathname += "/"
  u.hash = profilEntwurfKodieren(art, b.entwurf)
  const url = u.toString()
  const text = [
    berichtText(b),
    ...(ortHinweis ? [ortHinweis] : []),
    "",
    `Link für den Menschen: ${ANLEGEN[art]}`,
    url,
  ].join("\n")
  return { text, url, bericht: b }
}

export function createServer(optionen: ServerOptionen = {}): McpServer {
  const netzwerk = optionen.netzwerk ?? "trustdonation"
  const server = new McpServer({ name: `${netzwerk.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-profil`, version: "0.3.0" })

  server.registerTool(
    "profil_art_klaeren",
    {
      title: "Welche Art Profil?",
      description:
        `Zuerst aufrufen, wenn unklar ist, was entstehen soll. Gibt die drei Arten eines Profils im Netzwerk ${netzwerk} (Projekt, Stiftung, Einrichtung) und woran man sie erkennt. Passt keine sicher, frag den Menschen.`,
      inputSchema: {},
    },
    async () => ({
      content: [{
        type: "text",
        text: JSON.stringify({
          arten: PROFIL_ARTEN.map((a) => ({ art: a, wofuer: PROFIL_ART_REGELN[a], werkzeuge: [`${a}_profil_vorgabe`, `${a}_profil_pruefen`, `${a}_profil_link`] })),
          frage: "Passt keine sicher: Wollt ihr Unterstützung für ein Vorhaben (Projekt), fördert ihr selbst (Stiftung), oder stellt ihr euch als Verein oder Gemeinschaft vor (Einrichtung)?",
        }, null, 2),
      }],
    }),
  )

  for (const art of PROFIL_ARTEN) {
    const name = ART_NAME[art]
    const schema = entwurfSchema(art)
    server.registerTool(
      `${art}_profil_vorgabe`,
      {
        title: `Vorgabe für ein Profil: ${name}`,
        description:
          `Gibt den Ablauf, die Felder eines Profils der Art ${name} für das Netzwerk ${netzwerk} (mit Frage, Form und ob es ein Kernfeld ist), die Regeln und, wo es eines gibt, ein vollständiges Beispiel. Zuerst aufrufen.`,
        inputSchema: {},
      },
      async () => ({ content: [{ type: "text", text: JSON.stringify(vorgabe(art), null, 2) }] }),
    )
    server.registerTool(
      `${art}_profil_pruefen`,
      {
        title: `Entwurf prüfen: ${name}`,
        description:
          "Prüft einen Entwurf mit derselben Schleuse wie die App: welche Abschnitte erscheinen, welche Kernfelder fehlen, was verworfen wird und warum. Schreibt nichts.",
        inputSchema: { entwurf: schema },
      },
      async ({ entwurf }) => {
        const { text, bericht } = pruefen(entwurf, art)
        return { content: [{ type: "text", text }, { type: "text", text: JSON.stringify(bericht.entwurf) }] }
      },
    )
    server.registerTool(
      `${art}_profil_link`,
      {
        title: `Link zum Anlegen: ${name}`,
        description:
          `Prüft den Entwurf, ergänzt auf Wunsch die Koordinaten zur Anschrift (OpenStreetMap) und gibt einen Link zur App. Der Entwurf steht im Fragment des Links und geht an keinen Server. ${ANLEGEN[art]} Schreibt nichts.`,
        inputSchema: {
          entwurf: schema,
          ort_ergaenzen: z.boolean().optional().describe("Koordinaten zur Anschrift suchen, wenn keine angegeben sind. Standard: ja."),
        },
      },
      async ({ entwurf, ort_ergaenzen }) => {
        try {
          const { text } = await link(entwurf, { ...optionen, ortErgaenzen: ort_ergaenzen, art })
          return { content: [{ type: "text", text }] }
        } catch (e) {
          return { isError: true, content: [{ type: "text", text: e instanceof Error ? e.message : String(e) }] }
        }
      },
    )
  }

  return server
}

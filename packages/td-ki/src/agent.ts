/**
 * Eine Antwort des KI-Moduls (DEFINITION 13.10): Claude Code arbeitet mit den
 * Werkzeugen eines MCP-Servers, wie in VS Code, und alles, was es tut, wird
 * als Ereignis in den Chat gestreamt.
 *
 * Claude Code bekommt hier keine eigenen Werkzeuge (kein Bash, keine Dateien,
 * kein Netz), liest keine Einstellungen von der Platte und speichert keine
 * Sitzung. Es darf allein die Werkzeuge des eingestellten MCP-Servers
 * nutzen. Angemeldet ist es über `CLAUDE_CODE_OAUTH_TOKEN` (ein Abo, kein
 * API-Schlüssel).
 */
import { tmpdir } from "node:os"
import { query, type Options, type SDKMessage } from "@anthropic-ai/claude-agent-sdk"
import { KI_GRENZEN, entwurfAusText, schrittTitel, werkzeugName, type KiEreignis, type KiNachricht } from "@trustdonation/core"

/** Wie die KI arbeitet. Kurz, damit sie sich daran hält. */
export const KI_ANLEITUNG = `Du bist die KI von trustdonation, einem Netzwerk, das Projekte, Stiftungen und Einrichtungen zusammenbringt.
Du hilfst Menschen, ein Profil aufzubauen, aus dem, was sie erzählen (oft gesprochen, darum mit kleinen Fehlern).

So arbeitest du:
1. Kläre mit profil_art_klaeren, ob ein Projekt, eine Stiftung oder eine Einrichtung entsteht. Ist es unklar, frag kurz nach.
2. Hol die Vorgabe der Art und fülle die Felder aus dem Erzählten. Erfinde nichts.
3. Fehlen Kernfelder, frag freundlich nach, höchstens zwei Fragen auf einmal.
4. Prüfe den Entwurf und bessere nach, was verworfen wird.
5. Ist das Profil fertig oder will der Mensch es so, ruf das Link-Werkzeug auf. Nenne den Link nicht; sag in einem Satz, dass die Vorschau unter deiner Nachricht steht und er dort speichert.

Technische Felder, die der Server selbst setzt (etwa kind), erwähnst du nicht.
Schreib auf Deutsch, kurz und warm, ohne Werbesprache. Du speicherst nie selbst; das tut der Mensch.`

/** Der Verlauf als ein Auftrag: zustandslos, jede Anfrage bringt alles mit. */
export function auftrag(verlauf: readonly KiNachricht[]): string {
  const frueher = verlauf.slice(0, -1)
  const neu = verlauf[verlauf.length - 1]?.text ?? ""
  if (!frueher.length) return neu
  const zeilen = frueher.map((n) => `${n.rolle === "mensch" ? "Mensch" : "KI"}: ${n.text}`)
  return `Bisheriges Gespräch:\n${zeilen.join("\n\n")}\n\nNeue Nachricht des Menschen:\n${neu}`
}

/** Die Optionen für Claude Code: nur der eine MCP-Server, nichts sonst. */
export function optionen(mcp: string, abbruch: AbortController): Options {
  return {
    systemPrompt: KI_ANLEITUNG,
    mcpServers: { profil: { type: "http", url: mcp } },
    strictMcpConfig: true,
    tools: [],
    allowedTools: ["mcp__profil__*"],
    permissionMode: "dontAsk",
    settingSources: [],
    persistSession: false,
    maxTurns: KI_GRENZEN.schritte,
    includePartialMessages: true,
    abortController: abbruch,
    cwd: tmpdir(),
    env: { ...process.env, CLAUDE_AGENT_SDK_CLIENT_APP: "trustdonation-ki/0.1" },
  }
}

export type Abfrage = (a: { prompt: string; options: Options }) => AsyncIterable<SDKMessage>

type Block = { type?: string; id?: string; name?: string; text?: string; content?: unknown }

function textVon(inhalt: unknown): string {
  if (typeof inhalt === "string") return inhalt
  if (Array.isArray(inhalt)) return inhalt.map((b: Block) => (typeof b?.text === "string" ? b.text : "")).join("\n")
  return ""
}

/** Eine Antwort als Ereignisse. Wirft nie; ein Fehler kommt als Ereignis. */
export async function* kiAntwort(a: { verlauf: readonly KiNachricht[]; mcp: string; abbruch: AbortController; abfrage?: Abfrage }): AsyncGenerator<KiEreignis> {
  const abfrage = a.abfrage ?? (query as unknown as Abfrage)
  const gesehen = new Set<string>()
  let entwurf = false
  try {
    for await (const m of abfrage({ prompt: auftrag(a.verlauf), options: optionen(a.mcp, a.abbruch) })) {
      if (m.type === "stream_event") {
        const e = m.event as { type?: string; delta?: { type?: string; text?: string } }
        if (!m.parent_tool_use_id && e.type === "content_block_delta" && e.delta?.type === "text_delta" && e.delta.text) yield { typ: "text", text: e.delta.text }
      } else if (m.type === "assistant") {
        for (const b of (m.message.content ?? []) as Block[]) {
          if (b.type === "tool_use" && b.id && b.name && !gesehen.has(b.id)) {
            gesehen.add(b.id)
            yield { typ: "schritt", werkzeug: werkzeugName(b.name), titel: schrittTitel(b.name) }
          }
        }
      } else if (m.type === "user") {
        const inhalt = (m.message as { content?: unknown }).content
        for (const b of (Array.isArray(inhalt) ? inhalt : []) as Block[]) {
          if (b.type !== "tool_result") continue
          const fragment = entwurfAusText(textVon(b.content))
          if (fragment && !entwurf) { entwurf = true; yield { typ: "entwurf", fragment } }
        }
      } else if (m.type === "result" && m.subtype !== "success") {
        yield { typ: "fehler", text: m.subtype === "error_max_turns" ? "Das waren zu viele Schritte für eine Antwort. Schreib einfach weiter, dann geht es weiter." : "Die KI ist an dieser Stelle hängen geblieben. Bitte noch einmal versuchen." }
      }
    }
    yield { typ: "fertig" }
  } catch (e) {
    if (a.abbruch.signal.aborted) return
    const text = e instanceof Error ? e.message : String(e)
    yield { typ: "fehler", text: /auth|login|token|401|403/i.test(text) ? "Die KI ist auf dem Server nicht angemeldet." : "Die KI ist gerade nicht erreichbar." }
  }
}

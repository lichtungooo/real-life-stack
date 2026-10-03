// Das KI-Modul (DEFINITION 13.10, freigegeben von Timo am 03.10.2026), der
// gemeinsame Kern von Dienst und App.
//
// Timo: *"So ähnlich wie GPT … in der Mitte ein Chat-Fenster, wo man
// reinsprechen kann, und dann arbeitet es. Man sieht, wie es arbeitet, und
// nachher steht das fertige ausgefüllte Profil."* Gearbeitet wird wie in VS
// Code: ein Agent (Claude Code) mit den Werkzeugen eines MCP-Servers.
//
// Hier: was im Chat hin und her geht, wie der Datenstrom gelesen wird, wann
// ein Entwurf fertig ist und welche MCP-Adresse erlaubt ist.

/** Eine Nachricht im Verlauf. */
export interface KiNachricht {
  rolle: "mensch" | "ki"
  text: string
}

/** Was der Dienst während einer Antwort schickt. */
export type KiEreignis =
  | { typ: "text"; text: string }
  | { typ: "schritt"; werkzeug: string; titel: string }
  | { typ: "entwurf"; fragment: string }
  | { typ: "fertig" }
  | { typ: "fehler"; text: string }

/** Der MCP-Server des Netzwerks, wenn ein Space keinen eigenen nennt. */
export const KI_MCP_VORGABE = "https://trustdonation.org/mcp"

/** Grenzen je Anfrage (DEFINITION 13.10, Regel 3). */
export const KI_GRENZEN = Object.freeze({ nachrichten: 40, zeichen: 40_000, schritte: 24 })

/** Wie ein Werkzeug im Chat heißt, solange es arbeitet. */
const TITEL: Record<string, string> = {
  profil_art_klaeren: "Klärt, welche Art Profil entsteht",
  projekt_profil_vorgabe: "Holt die Vorlage für ein Projekt",
  stiftung_profil_vorgabe: "Holt die Vorlage für eine Stiftung",
  einrichtung_profil_vorgabe: "Holt die Vorlage für eine Einrichtung",
  projekt_profil_pruefen: "Prüft den Entwurf",
  stiftung_profil_pruefen: "Prüft den Entwurf",
  einrichtung_profil_pruefen: "Prüft den Entwurf",
  projekt_profil_link: "Stellt das Profil fertig",
  stiftung_profil_link: "Stellt das Profil fertig",
  einrichtung_profil_link: "Stellt das Profil fertig",
  person_profil_vorgabe: "Holt die Vorlage für dein Profil",
  person_profil_pruefen: "Prüft den Entwurf",
  person_profil_link: "Stellt das Profil fertig",
}

/** `mcp__profil__stiftung_profil_link` → `stiftung_profil_link`. */
export function werkzeugName(roh: string): string {
  return roh.startsWith("mcp__") ? roh.split("__").slice(2).join("__") : roh
}

export function schrittTitel(werkzeug: string): string {
  const name = werkzeugName(werkzeug)
  return TITEL[name] ?? `Nutzt ${name.replace(/_/g, " ")}`
}

const FRAGMENT = /#((?:projekt|stiftung|einrichtung|person)-entwurf=[A-Za-z0-9_-]+)/

/** Der Entwurf im Ergebnis eines Link-Werkzeugs (der Teil nach `#`), sonst `null`. */
export function entwurfAusText(text: string): string | null {
  return FRAGMENT.exec(text)?.[1] ?? null
}

/**
 * Die MCP-Adresse, mit der die KI arbeiten darf: nur https, kein eigener
 * Rechner, kein privates Netz (der Dienst ruft sie von unserem Server auf).
 * Leer oder ungültig: die Vorgabe des Netzwerks.
 */
export function kiMcpAdresse(roh: unknown): string {
  if (typeof roh !== "string" || !roh.trim()) return KI_MCP_VORGABE
  let u: URL
  try { u = new URL(roh.trim()) } catch { return KI_MCP_VORGABE }
  if (u.protocol !== "https:" || u.username || u.password) return KI_MCP_VORGABE
  const h = u.hostname.toLowerCase().replace(/^\[|\]$/g, "")
  const privat = h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")
    || /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h)
    || h === "::1" || /^f[cd][0-9a-f]{2}:/.test(h) || /^fe80:/.test(h) || !h.includes(".")
  return privat ? KI_MCP_VORGABE : u.toString()
}

/** Den Verlauf für eine Anfrage kürzen: die letzten Nachrichten, höchstens so viele Zeichen. */
export function kiVerlauf(roh: unknown): KiNachricht[] | null {
  if (!Array.isArray(roh)) return null
  const n = roh
    .filter((x): x is KiNachricht => !!x && typeof x === "object" && (x.rolle === "mensch" || x.rolle === "ki") && typeof x.text === "string" && x.text.trim() !== "")
    .map((x) => ({ rolle: x.rolle, text: x.text.slice(0, 8_000) }))
    .slice(-KI_GRENZEN.nachrichten)
  let summe = 0
  const aus: KiNachricht[] = []
  for (let i = n.length - 1; i >= 0; i--) {
    summe += n[i].text.length
    if (summe > KI_GRENZEN.zeichen) break
    aus.unshift(n[i])
  }
  return aus.length && aus[aus.length - 1].rolle === "mensch" ? aus : null
}

/** Ein Ereignis als Zeile im Datenstrom (Server-Sent Events). */
export function kiZeile(e: KiEreignis): string {
  return `data: ${JSON.stringify(e)}\n\n`
}

/**
 * Einen Datenstrom lesen: Stücke hinein, Ereignisse heraus. Unvollständige
 * Zeilen bleiben bis zum nächsten Stück liegen; Unlesbares fällt weg.
 */
export function kiLeser(): (stueck: string) => KiEreignis[] {
  let rest = ""
  return (stueck) => {
    rest += stueck
    const bloecke = rest.split("\n\n")
    rest = bloecke.pop() ?? ""
    const aus: KiEreignis[] = []
    for (const b of bloecke) {
      const zeile = b.split("\n").find((z) => z.startsWith("data: "))
      if (!zeile) continue
      try {
        const e = JSON.parse(zeile.slice(6)) as KiEreignis
        if (e && typeof e === "object" && typeof (e as { typ?: unknown }).typ === "string") aus.push(e)
      } catch { /* unlesbar: fällt weg */ }
    }
    return aus
  }
}

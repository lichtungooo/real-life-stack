// Die Einstellungen des KI-Moduls im Space-Dialog (DEFINITION 13.10).
//
// Der MCP-Server gehört zum Space (`Group.data.ki.mcp`, wer verwaltet,
// ändert ihn über Antons `patchData`). Das Zugangswort gehört zum Menschen
// und bleibt in seinem Browser: Ein Abo gilt für einen Menschen.

import { useEffect, useState } from "react"
import { Bot } from "lucide-react"
import type { AppSpaceSection } from "@real-life-stack/toolkit"
import { KI_MCP_VORGABE, kiMcpAdresse } from "@trustdonation/core"

const SCHLUESSEL = "td-ki-zugang"

/** Der Agent-Dienst; zum Testen lässt sich in diesem Browser ein anderer merken (`td-ki-dienst`). */
export function kiDienst(): string {
  try { return localStorage.getItem("td-ki-dienst") || "https://trustdonation.org/ki" } catch { return "https://trustdonation.org/ki" }
}

/** Das Zugangswort dieses Browsers, sonst `null`. */
export function kiZugang(): string | null {
  try { return localStorage.getItem(SCHLUESSEL) } catch { return null }
}

const EINGABE = "w-full rounded-xl bg-muted/50 px-3 py-2 text-sm font-normal outline-none ring-1 ring-transparent transition focus:bg-background focus:ring-2 focus:ring-ring disabled:opacity-60"

function KiEinstellungen({ mcp, darfAendern, speichern }: { mcp: string | null; darfAendern: boolean; speichern: (mcp: string | null) => Promise<unknown> | void }) {
  const [adresse, setAdresse] = useState(mcp ?? "")
  const [wort, setWort] = useState(kiZugang() ?? "")
  const [meldung, setMeldung] = useState<string | null>(null)
  const [bereit, setBereit] = useState<boolean | null>(null)
  useEffect(() => {
    let aktiv = true
    fetch(`${kiDienst()}/stand`)
      .then((r) => r.json())
      .then((j: { bereit?: boolean }) => { if (aktiv) setBereit(Boolean(j.bereit)) })
      .catch(() => { if (aktiv) setBereit(false) })
    return () => { aktiv = false }
  }, [])
  const gilt = adresse.trim() ? kiMcpAdresse(adresse) : KI_MCP_VORGABE
  const abgelehnt = adresse.trim() !== "" && gilt === KI_MCP_VORGABE && adresse.trim() !== KI_MCP_VORGABE

  const merken = () => {
    try {
      if (wort.trim()) localStorage.setItem(SCHLUESSEL, wort.trim())
      else localStorage.removeItem(SCHLUESSEL)
    } catch { /* ohne Speicher */ }
    setMeldung("Zugangswort gemerkt.")
  }

  return (
    <div className="flex flex-col gap-5 text-sm">
      <p className="leading-relaxed text-muted-foreground">
        Die KI arbeitet wie in VS Code: Claude Code mit den Werkzeugen eines MCP-Servers. Im Reiter „KI“ erzählt man, die KI fragt nach, und am Ende steht das fertige Profil zum Speichern.
      </p>
      <form className="flex flex-col gap-2" onSubmit={async (e) => {
        e.preventDefault()
        if (abgelehnt) return
        await speichern(adresse.trim() ? gilt : null)
        setMeldung("Gespeichert.")
      }}>
        <label className="flex flex-col gap-1 font-semibold">MCP-Server dieses Space
          <input value={adresse} onChange={(e) => { setAdresse(e.target.value); setMeldung(null) }} disabled={!darfAendern} placeholder={KI_MCP_VORGABE} className={EINGABE} />
        </label>
        <p className="text-xs text-muted-foreground">Leer: der Server des Netzwerks ({KI_MCP_VORGABE}). Nur öffentliche https-Adressen.</p>
        {abgelehnt && <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">Diese Adresse ist nicht erlaubt; es gilt der Server des Netzwerks.</p>}
        {darfAendern
          ? <div><button type="submit" disabled={abgelehnt} className="rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">Speichern</button></div>
          : <p className="text-xs text-muted-foreground">Ändern kann, wer den Space verwaltet.</p>}
      </form>
      <div className="flex flex-col gap-2 rounded-2xl bg-muted/40 p-4">
        <label className="flex flex-col gap-1 font-semibold">Zugangswort (nur in diesem Browser)
          <input type="password" value={wort} onChange={(e) => setWort(e.target.value)} autoComplete="off" className={EINGABE} />
        </label>
        <p className="text-xs text-muted-foreground">Die KI läuft über ein persönliches Abo. Das Zugangswort bekommst du von dem, der den Dienst eingerichtet hat. Es bleibt in deinem Browser.</p>
        <div><button type="button" onClick={merken} className="rounded-xl bg-background/80 px-4 py-2 font-medium hover:bg-background">Merken</button></div>
        {bereit === false && <p className="text-xs text-amber-700 dark:text-amber-400">Der Dienst ist auf dem Server noch nicht eingerichtet.</p>}
        {bereit && <p className="text-xs text-emerald-700 dark:text-emerald-400">Der Dienst ist bereit.</p>}
      </div>
      {meldung && <p className="text-emerald-700 dark:text-emerald-400">{meldung}</p>}
    </div>
  )
}

export const KI_ABSCHNITT: AppSpaceSection = {
  id: "ki",
  label: "KI",
  icon: Bot,
  render: ({ group, canEdit, patchData }) => {
    const ki = (group.data as { ki?: { mcp?: unknown } } | undefined)?.ki
    const mcp = typeof ki?.mcp === "string" ? ki.mcp : null
    return <KiEinstellungen key={group.id} mcp={mcp} darfAendern={canEdit} speichern={(neu) => patchData({ ki: { ...(ki ?? {}), mcp: neu } })} />
  },
}

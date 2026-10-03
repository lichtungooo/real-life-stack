// Das KI-Modul (DEFINITION 13.10), die Bindung an den Agent-Dienst.
//
// Der Chat liegt in `@trustdonation/ui/ki` und kennt keinen Dienst. Hier:
// der MCP-Server aus den Einstellungen des Space (`Group.data.ki.mcp`), das
// Zugangswort aus diesem Browser, der Datenstrom von `trustdonation.org/ki`,
// das Reinsprechen wie in Circeling (13.9) und das Öffnen des fertigen
// Entwurfs im Dialog zum Speichern (13.6/13.8).

import { lazy, Suspense, useCallback } from "react"
import { useCurrentGroup } from "@real-life-stack/toolkit"
import { kiLeser, kiMcpAdresse, type KiEreignis, type KiNachricht } from "@trustdonation/core"
import { useDiktat } from "./diktat"
import { kiDienst, kiZugang } from "./ki-abschnitt"

const KiChat = lazy(() => import("@trustdonation/ui/ki"))

async function* senden(verlauf: KiNachricht[], signal: AbortSignal, mcp: string, zugang: string): AsyncGenerator<KiEreignis> {
  const r = await fetch(kiDienst(), {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-KI-Zugang": zugang },
    body: JSON.stringify({ verlauf, mcp }),
    signal,
  })
  if (!r.ok || !r.body) {
    const k = (await r.json().catch(() => ({}))) as { fehler?: string }
    yield { typ: "fehler", text: k.fehler ?? `Die KI ist gerade nicht erreichbar (${r.status}).` }
    return
  }
  const lesen = kiLeser()
  const leser = r.body.pipeThrough(new TextDecoderStream()).getReader()
  for (;;) {
    const { done, value } = await leser.read()
    if (done) break
    for (const e of lesen(value)) yield e
  }
}

export function KiView() {
  const space = useCurrentGroup()
  const diktat = useDiktat()
  const zugang = kiZugang()
  const mcp = kiMcpAdresse((space?.data as { ki?: { mcp?: unknown } } | undefined)?.ki?.mcp)
  const schicken = useCallback((verlauf: KiNachricht[], signal: AbortSignal) => senden(verlauf, signal, mcp, zugang ?? ""), [mcp, zugang])
  const oeffnen = useCallback((fragment: string) => { window.location.hash = fragment }, [])
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Einen Moment …</div>}>
      <KiChat senden={schicken} diktat={diktat} onEntwurf={oeffnen} gesperrt={!zugang}
        hinweis={!zugang && (
          <p className="mb-2 rounded-2xl bg-amber-50/70 px-4 py-3 text-sm dark:bg-amber-950/40">
            Die KI läuft über ein persönliches Abo und braucht ein Zugangswort. Trag es im Space-Dialog unter „Mehr“ → „KI“ ein.
          </p>
        )} />
    </Suspense>
  )
}

// Ein Projektprofil aus dem Entwurf eines Agenten anlegen (DEFINITION 13.6).
//
// Der Link aus dem MCP-Server `td-mcp` trägt den Entwurf im Fragment. Dieser
// Dialog liest ihn, prüft ihn noch einmal mit derselben Schleuse, zeigt die
// Vorschau und den Prüfbericht, und erst der Klick des Menschen legt an.
// Geschrieben wird von der App (über den Connector, mit seiner Identität),
// nie vom Agenten.
//
// Eigener Einstieg `@trustdonation/ui/projekt-entwurf`, nachgeladen nur,
// wenn ein Link einen Entwurf trägt.

import { useMemo, useState } from "react"
import { AlertTriangle, Check, Info, Sparkles, X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@real-life-stack/toolkit"
import { entwurfLesen, projektProfil, type ProjektEntwurf } from "@trustdonation/core"
import { ProjektProfilSeite } from "./projekt-profil.js"

export interface EntwurfSpace {
  id: string
  name: string
  /** Hat der Space das Project Profile schon gewählt? */
  profilAktiv: boolean
}

export interface ProjektEntwurfDialogProps {
  /** `location.hash`, mit oder ohne `#`. */
  fragment: string
  spaces: readonly EntwurfSpace[]
  /** Vorgewählter Space, etwa der offene. */
  startSpace?: string
  /** Demo: gespeichert wird nur im eigenen Browser. */
  beispielwelt?: boolean
  bildUrl?: (pfad: string) => string
  /**
   * Anlegen. `weiter` führt zum neuen Projekt. Ein `hinweis` heißt: angelegt
   * ist es, ein Nebenschritt (Profil einschalten) ging schief. Der Dialog
   * zeigt ihn, statt „nicht angelegt“ zu melden (Kimi, 02.10.2026).
   */
  onAnlegen: (spaceId: string, entwurf: ProjektEntwurf, profilEinschalten: boolean) => Promise<{ weiter: () => void; hinweis?: string }>
  onSchliessen: () => void
}

export function ProjektEntwurfDialog(p: ProjektEntwurfDialogProps) {
  const bericht = useMemo(() => entwurfLesen(p.fragment), [p.fragment])
  // Die Wahl abgeleitet, nicht eingefroren: Laden die Spaces erst nach dem
  // Öffnen, greift die Vorauswahl trotzdem (Kimi, 02.10.2026).
  const [gewaehlt, setSpaceId] = useState<string | null>(null)
  const spaceId = gewaehlt && p.spaces.some((s) => s.id === gewaehlt)
    ? gewaehlt
    : (p.spaces.find((s) => s.id === p.startSpace)?.id ?? p.spaces[0]?.id ?? "")
  const space = p.spaces.find((s) => s.id === spaceId)
  const [fertig, setFertig] = useState<{ weiter: () => void; hinweis: string } | null>(null)
  const [einschalten, setEinschalten] = useState(true)
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)
  const profil = useMemo(() => (bericht ? projektProfil(bericht.entwurf.daten, bericht.entwurf.tags) : null), [bericht])

  const anlegen = async () => {
    if (!bericht || !space) return
    setLaeuft(true)
    setFehler(null)
    try {
      const r = await p.onAnlegen(space.id, bericht.entwurf, einschalten && !space.profilAktiv)
      if (r.hinweis) setFertig({ weiter: r.weiter, hinweis: r.hinweis })
      else r.weiter()
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "Das Projekt ließ sich nicht anlegen.")
      setLaeuft(false)
    }
  }

  return (
    <Dialog open onOpenChange={(an) => { if (!an) p.onSchliessen() }}>
      <DialogContent showCloseButton={false} aria-describedby={undefined}
        className="flex max-h-[92dvh] w-[96vw] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <header className="flex items-center gap-3 border-b px-5 py-3">
          <Sparkles className="h-5 w-5 text-emerald-600" />
          <DialogTitle className="flex-1 text-lg">Projektprofil aus deinem Entwurf</DialogTitle>
          <button type="button" onClick={p.onSchliessen} aria-label="Schließen" className="rounded-full p-1.5 opacity-60 hover:opacity-100"><X className="h-5 w-5" /></button>
        </header>

        {fertig ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <Check className="h-8 w-8 text-emerald-600" />
            <p className="font-semibold">Das Projekt ist angelegt.</p>
            <p className="max-w-md text-sm text-muted-foreground">{fertig.hinweis}</p>
            <button type="button" onClick={fertig.weiter} className="rounded-xl bg-emerald-700 px-4 py-2.5 font-semibold text-white hover:bg-emerald-800">Zum Projekt</button>
          </div>
        ) : !bericht || !profil ? (
          <div className="p-8 text-center">
            <p className="font-semibold">Dieser Link trägt keinen lesbaren Entwurf.</p>
            <p className="mt-2 text-sm text-muted-foreground">Vielleicht wurde er beim Kopieren abgeschnitten. Lass dir den Link von deinem Agenten noch einmal geben.</p>
          </div>
        ) : (
          <div className="grid flex-1 gap-6 overflow-y-auto p-5 md:grid-cols-[minmax(0,1fr)_300px]">
            <section aria-label="Vorschau">
              <h3 className="mb-1 text-xl font-semibold">{profil.titel}</h3>
              <ProjektProfilSeite profil={profil} bildUrl={p.bildUrl} />
            </section>

            <aside className="flex flex-col gap-4 md:sticky md:top-0 md:self-start">
              <section className="rounded-2xl bg-muted/50 p-4 text-sm" aria-label="Prüfbericht">
                <p className="mb-2 font-semibold">Was dein Agent geliefert hat</p>
                <p className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {bericht.zeigt.length ? bericht.zeigt.join(", ") : "noch nichts, was erscheint"}</p>
                {bericht.fehlt.length > 0 && (
                  <div className="mt-3 rounded-xl bg-amber-50/70 p-3 dark:bg-amber-950/40">
                    <p className="flex items-center gap-1.5 font-medium"><Info className="h-4 w-4" /> Es fehlt noch</p>
                    <ul className="mt-1 list-disc pl-5 text-muted-foreground">{bericht.fehlt.map((f) => <li key={f.id}>{f.frage}</li>)}</ul>
                    <p className="mt-1 text-xs text-muted-foreground">Du kannst trotzdem anlegen und später ergänzen.</p>
                  </div>
                )}
                {bericht.verworfen.length > 0 && (
                  <div className="mt-3 rounded-xl bg-rose-50/70 p-3 dark:bg-rose-950/40">
                    <p className="flex items-center gap-1.5 font-medium"><AlertTriangle className="h-4 w-4" /> Weggelassen</p>
                    <ul className="mt-1 list-disc pl-5 text-muted-foreground">{bericht.verworfen.map((v, i) => <li key={i}>{v}</li>)}</ul>
                  </div>
                )}
              </section>

              {p.spaces.length === 0 ? (
                <p className="rounded-2xl bg-amber-50/70 p-4 text-sm dark:bg-amber-950/40">Du bist noch in keinem Space. Lege zuerst einen an oder tritt einem bei, dann öffne den Link noch einmal.</p>
              ) : (
                <section className="flex flex-col gap-3 rounded-2xl bg-emerald-50/60 p-4 text-sm dark:bg-emerald-950/40" aria-label="Anlegen">
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">In welchem Space?</span>
                    <select value={spaceId} onChange={(e) => setSpaceId(e.target.value)} className="rounded-lg bg-background px-3 py-2">
                      {p.spaces.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </label>
                  {space && !space.profilAktiv && (
                    <label className="flex items-start gap-2">
                      <input type="checkbox" checked={einschalten} onChange={(e) => setEinschalten(e.target.checked)} className="mt-0.5" />
                      <span>Das Project Profile in diesem Space einschalten, damit das Projekt so erscheint</span>
                    </label>
                  )}
                  {p.beispielwelt && <p className="text-xs text-muted-foreground">Demo: Das Projekt wird nur in deinem Browser gespeichert.</p>}
                  {fehler && <p className="text-rose-700 dark:text-rose-300">{fehler}</p>}
                  <button type="button" onClick={() => void anlegen()} disabled={laeuft || !space}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
                    <Check className="h-4 w-4" /> {laeuft ? "Wird angelegt …" : "Projekt anlegen"}
                  </button>
                  <p className="text-xs text-muted-foreground">Angelegt wird mit deiner Identität. Dein Agent hat nichts gespeichert.</p>
                </section>
              )}
            </aside>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ProjektEntwurfDialog

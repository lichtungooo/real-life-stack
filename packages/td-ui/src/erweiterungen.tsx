// Die Erweiterungen (DEFINITION Teil 8), die Darstellung.
//
// Timo und Anton, 01.10.2026: kein Reiter oben im Menue, sondern ein Knopf
// in der Modul-Auswahl eines Space, der eine Uebersicht ueber den ganzen
// Bildschirm oeffnet. Zwei Reiter: was geprueft ist und was noch Beta ist.
// Jede Erweiterung als Karte mit Symbol, Name, Beschreibung und klein dem
// Erbauer. Dazu Komponenten (ganze Profile, seit 01.10.2026 das Project
// Profile); Themes kommen.
//
// Ohne Connector und ohne Hooks des Stacks: Was angezeigt wird und wie
// geschrieben wird, reicht die Bindung herein (apps/reference).

import { useState, type ComponentType } from "react"
import { Check, Plus, Puzzle } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@real-life-stack/toolkit"
import type { Erweiterung, Reife } from "@trustdonation/core"

/** Was die Uebersicht von Antons Register-Eintrag braucht. */
export type ErweiterungsModul = { id: string; label: string; icon?: ComponentType<{ className?: string }> }

export interface ErweiterungenProps {
  erweiterungen: readonly Erweiterung<ErweiterungsModul>[]
  /** Die Module und Komponenten, die der Space gerade fuehrt. */
  imSpace: ReadonlySet<string>
  /** Darf dieser Mensch die Module des Space waehlen? Sonst nur schauen. */
  darfAendern: boolean
  onSchalten: (id: string, an: boolean) => Promise<void> | void
}

const REIFEN: { id: Reife; titel: string; hinweis: string }[] = [
  { id: "geprueft", titel: "Geprüft", hinweis: "Durch das Testing gegangen und von den Entwicklern freigegeben." },
  { id: "beta", titel: "Beta", hinweis: "Läuft schon, ist aber noch nicht freigegeben. Hier steht, was gerade durch das Testing geht." },
]

const ARTEN = [
  { id: "modul", titel: "Module" },
  { id: "komponente", titel: "Komponenten" },
  { id: "theme", titel: "Themes" },
] as const

/** Der Abschnitt im Space-Dialog: kurz, was es gibt, und der Weg zur Uebersicht. */
export function ErweiterungenAbschnitt(p: ErweiterungenProps) {
  const [offen, setOffen] = useState(false)
  const zahl = (r: Reife) => p.erweiterungen.filter((e) => e.reife === r).length
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Was dieser Space dazunehmen kann: Module, fertige Komponenten wie ganze Profile, später Themes.
        Jede mit Beschreibung und dem, der sie gebaut hat.
      </p>
      <div className="flex gap-3 text-sm">
        <span className="rounded-lg bg-muted px-3 py-1.5"><strong>{zahl("geprueft")}</strong> geprüft</span>
        <span className="rounded-lg bg-muted px-3 py-1.5"><strong>{zahl("beta")}</strong> in Beta</span>
        <span className="rounded-lg bg-muted px-3 py-1.5"><strong>{p.erweiterungen.filter((e) => p.imSpace.has(e.id)).length}</strong> im Space</span>
      </div>
      <button type="button" onClick={() => setOffen(true)}
        className="flex items-center justify-center gap-2 self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
        <Puzzle className="h-4 w-4" /> Alle Erweiterungen ansehen
      </button>
      <ErweiterungenUebersicht {...p} offen={offen} onOffen={setOffen} />
    </div>
  )
}

/**
 * Die Uebersicht ueber den ganzen Bildschirm. Ein eigener Dialog ueber dem
 * Space-Dialog: Radix stapelt sie, der obere bekommt Fokus und Klicks.
 */
export function ErweiterungenUebersicht(p: ErweiterungenProps & { offen: boolean; onOffen: (an: boolean) => void }) {
  const [art, setArt] = useState<(typeof ARTEN)[number]["id"]>("modul")
  const [reife, setReife] = useState<Reife>("geprueft")
  const [laeuft, setLaeuft] = useState<string | null>(null)
  // Ein Fehler beim Schalten wird gesagt, nicht verschluckt (Kimi, 02.10.2026).
  const [fehler, setFehler] = useState<string | null>(null)
  const sichtbar = p.erweiterungen.filter((e) => e.art === art && e.reife === reife)
  const schalten = async (id: string, an: boolean) => {
    setLaeuft(id)
    setFehler(null)
    try {
      await p.onSchalten(id, an)
    } catch (e) {
      setFehler(`Das ließ sich nicht speichern${e instanceof Error && e.message ? `: ${e.message}` : "."} Noch einmal versuchen.`)
    } finally {
      setLaeuft(null)
    }
  }
  const hinweis = REIFEN.find((r) => r.id === reife)?.hinweis

  return (
    <Dialog open={p.offen} onOpenChange={p.onOffen}>
      <DialogContent className="flex h-[92vh] w-[96vw] max-w-6xl flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl" aria-describedby={undefined}>
        <header className="flex flex-wrap items-center gap-4 border-b px-6 py-4 pr-14">
          <DialogTitle className="flex items-center gap-2 text-xl"><Puzzle className="h-5 w-5" /> Erweiterungen</DialogTitle>
          <nav aria-label="Arten" className="flex gap-1 rounded-lg bg-muted p-1">
            {ARTEN.map((a) => (
              <button key={a.id} type="button" onClick={() => setArt(a.id)} aria-pressed={art === a.id}
                className={`rounded-md px-3 py-1.5 text-sm ${art === a.id ? "bg-card font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {a.titel}
              </button>
            ))}
          </nav>
        </header>

        {art === "theme" ? (
          <div className="flex flex-1 items-center justify-center p-8 text-center">
            <div className="max-w-md">
              <p className="text-lg font-semibold">Themes kommen</p>
              <p className="mt-2 text-sm text-muted-foreground">Das Aussehen eines Space als Ganzes, zum Auswählen.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 px-6 pt-4">
              <div role="tablist" aria-label="Reife" className="flex gap-1">
                {REIFEN.map((r) => (
                  <button key={r.id} type="button" role="tab" aria-selected={reife === r.id} onClick={() => setReife(r.id)}
                    className={`rounded-full px-4 py-1.5 text-sm ${reife === r.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                    {r.titel} <span className="opacity-70">{p.erweiterungen.filter((e) => e.art === art && e.reife === r.id).length}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{hinweis}</p>
              {art === "komponente" && (
                <p className="w-full text-xs text-muted-foreground">Fertige Darstellungen, die man ganz nimmt: Im Space gewählt, zeigt sich jeder passende Eintrag so, sobald man ihn öffnet.</p>
              )}
            </div>
            {fehler && (
              <p role="alert" className="mx-6 mt-3 rounded-lg bg-rose-50/70 px-3 py-2 text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">{fehler}</p>
            )}
            {!p.darfAendern && (
              <p className="mx-6 mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">Nur wer den Space verwaltet, nimmt Erweiterungen dazu. Du kannst dich umsehen.</p>
            )}
            <ul aria-label="Erweiterungen" className="grid flex-1 auto-rows-min grid-cols-1 gap-4 overflow-y-auto p-6 sm:grid-cols-2 lg:grid-cols-3">
              {sichtbar.length === 0 && (
                <li className="col-span-full py-12 text-center text-sm text-muted-foreground">Hier steht gerade nichts.</li>
              )}
              {sichtbar.map((e) => {
                const Symbol = e.modul.icon ?? Puzzle
                const drin = p.imSpace.has(e.id)
                return (
                  <li key={e.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Symbol className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{e.name}</p>
                        <p className="text-[11px] text-muted-foreground">{e.erbauer ? `von ${e.erbauer}` : "Erbauer unbekannt"}</p>
                      </div>
                      {e.reife === "beta" && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Beta</span>}
                    </div>
                    <p className="flex-1 text-sm text-muted-foreground">{e.beschreibung ?? "Noch ohne Beschreibung."}</p>
                    <button type="button" disabled={!p.darfAendern || laeuft === e.id} onClick={() => void schalten(e.id, !drin)}
                      aria-label={drin ? `${e.name} aus dem Space nehmen` : `${e.name} in den Space nehmen`}
                      className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 ${drin ? "bg-muted text-foreground hover:bg-muted/70" : "bg-primary text-primary-foreground hover:opacity-90"}`}>
                      {drin ? <><Check className="h-4 w-4" /> Im Space</> : <><Plus className="h-4 w-4" /> Dazunehmen</>}
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

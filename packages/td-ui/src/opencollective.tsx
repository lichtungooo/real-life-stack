// Der Baustein Open Collective (DEFINITION Teil 8, „Modul Open Collective,
// überall einbindbar“, freigegeben von Timo am 03.10.2026), die Darstellung.
//
// Timo: *"Brauche ich es in einem Projekt, brauche ich es in einer Person …
// integriert in ein Netzwerk … wie so ein Spendenwidget … wenn wir Module
// bauen, muss es in alle Seiten offen sein und integrierbar sein."*
//
// Drei Größen aus einem Guss, jede braucht nur die Adresse der Seite:
// - `OcKnapp`  für eine Profilkarte (gesammelt, Ziel, Unterstützende, Knopf)
// - `OcWidget` für Netzwerk- oder Landingpage (Kopf, Zahlen, Beträge, Knopf)
// - `OcGanz`   über den Bildschirm (dazu Ausgaben und Eingänge)
// Die Zahlen kommen über unseren Dienst (`trustdonation.org/oc/<name>`),
// gerechnet und geprüft in td-core. Bei Eingängen nur Betrag und Datum.
//
// Eigener Einstieg `@trustdonation/ui/opencollective`, nachgeladen.

import { useEffect, useState, type ReactNode } from "react"
import { ArrowUpRight, ExternalLink, HandHeart, Loader2, Receipt, Users, Wallet, X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@real-life-stack/toolkit"
import { ocBetrag, ocName, ocStandAus, ocZiel, type OcStand } from "@trustdonation/core"

/** Unser Dienst; eine andere Instanz setzt ihre eigene Adresse. */
export const OC_DIENST = "https://trustdonation.org/oc"

// Ein Stand gilt fünf Minuten im Browser; mehrere Größen derselben Seite fragen einmal.
const zwischen = new Map<string, { bis: number; stand: Promise<OcStand | null> }>()

function abrufen(name: string, dienst: string): Promise<OcStand | null> {
  const schluessel = `${dienst}/${name}`
  const da = zwischen.get(schluessel)
  if (da && da.bis > Date.now()) return da.stand
  const stand = fetch(`${dienst}/${encodeURIComponent(name)}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => (j ? ocStandAus(j) : null))
    .catch(() => null)
  zwischen.set(schluessel, { bis: Date.now() + 5 * 60_000, stand })
  return stand
}

/** Der Stand einer Seite, aus ihrer Adresse. Ohne gültige Adresse bleibt er `null`. */
export function useOcStand(adresse: string | null | undefined, dienst: string = OC_DIENST): { stand: OcStand | null; laedt: boolean } {
  const name = ocName(adresse)
  const [stand, setStand] = useState<OcStand | null>(null)
  const [laedt, setLaedt] = useState(Boolean(name))
  useEffect(() => {
    if (!name) { setStand(null); setLaedt(false); return }
    let aktiv = true
    setLaedt(true)
    void abrufen(name, dienst).then((s) => { if (aktiv) { setStand(s); setLaedt(false) } })
    return () => { aktiv = false }
  }, [name, dienst])
  return { stand, laedt }
}

const uhrzeit = (iso: string) => new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
const tag = (iso: string) => new Date(iso).toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" })
const spendenAdresse = (s: OcStand, betrag?: number | null) => `${s.adresse}/donate${betrag ? `?amount=${Math.round(betrag)}` : ""}`

function Balken({ anteil }: { anteil: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/60" role="progressbar"
      aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(anteil * 100)} aria-label="Anteil am Ziel">
      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700" style={{ width: `${Math.max(2, anteil * 100)}%` }} />
    </div>
  )
}

function Knopf({ s, betrag, schmal = false }: { s: OcStand; betrag?: number | null; schmal?: boolean }) {
  return (
    <a href={spendenAdresse(s, betrag)} target="_blank" rel="noopener noreferrer"
      className={`flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 ${schmal ? "py-2.5" : "py-3"} text-sm font-semibold text-white shadow-sm hover:bg-emerald-800`}>
      <HandHeart className="h-4 w-4" /> {betrag ? `Mit ${ocBetrag(betrag, s.waehrung)} unterstützen` : "Über Open Collective unterstützen"} <ArrowUpRight className="h-4 w-4" />
    </a>
  )
}

function Stand({ s }: { s: OcStand }) {
  return (
    <p className="text-center text-[11px] text-muted-foreground">
      Stand bei <a href={s.adresse} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Open Collective</a>, {uhrzeit(s.stand)} Uhr. Das Geld läuft offen und nachvollziehbar.
    </p>
  )
}

// ── Knapp: in einer Profilkarte ─────────────────────────────────────────────

/** Gesammelt, Ziel, Unterstützende, Knopf. Ohne Stand zeigt es `ersatz` (etwa die Zahlen des Eintrags). */
export function OcKnapp({ adresse, ziel, dienst, ersatz, mehr = true }: {
  adresse: string | null | undefined
  ziel?: number | null
  dienst?: string
  ersatz?: ReactNode
  mehr?: boolean
}) {
  const { stand: s, laedt } = useOcStand(adresse, dienst)
  const [ganz, setGanz] = useState(false)
  if (!s) return laedt ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Stand bei Open Collective …</p> : <>{ersatz}</>
  const z = ocZiel(s, ziel)
  return (
    <div className="flex flex-col gap-3">
      {s.eingegangen !== null && (
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-3xl font-bold tracking-tight text-emerald-800 dark:text-emerald-200">{ocBetrag(s.eingegangen, s.waehrung)}</span>
          {ziel ? <span className="text-sm text-muted-foreground">von {ocBetrag(ziel, s.waehrung)}</span> : <span className="text-sm text-muted-foreground">gesammelt</span>}
        </p>
      )}
      {z && <Balken anteil={z.anteil} />}
      <div className="flex flex-wrap justify-between gap-2 text-sm text-muted-foreground">
        {s.unterstuetzende !== null && <span><strong className="text-foreground">{s.unterstuetzende}</strong> Menschen geben schon</span>}
        {z && z.offen > 0 && <span>noch <strong className="text-foreground">{ocBetrag(z.offen, s.waehrung)}</strong> offen</span>}
      </div>
      <Knopf s={s} schmal />
      {mehr && (
        <button type="button" onClick={() => setGanz(true)} className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-200">
          Wohin das Geld geht
        </button>
      )}
      <Stand s={s} />
      <OcGanz stand={s} ziel={ziel} offen={ganz} onOffen={setGanz} />
    </div>
  )
}

// ── Widget: für Netzwerk- und Landingpage ───────────────────────────────────

/** Kopf mit Logo, Zahlen, Beträge zur Wahl, Knopf. */
export function OcWidget({ adresse, ziel, betraege = [10, 25, 50, 100], dienst }: {
  adresse: string | null | undefined
  ziel?: number | null
  betraege?: number[]
  dienst?: string
}) {
  const { stand: s, laedt } = useOcStand(adresse, dienst)
  const [betrag, setBetrag] = useState<number | null>(betraege[1] ?? null)
  const [ganz, setGanz] = useState(false)
  if (!s) {
    if (!laedt) return null
    return <div className="flex h-40 items-center justify-center rounded-3xl bg-card text-sm text-muted-foreground shadow-xl shadow-black/5"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Open Collective …</div>
  }
  const z = ocZiel(s, ziel)
  return (
    <section aria-label={`Spenden für ${s.titel}`} className="flex flex-col gap-4 rounded-3xl bg-card p-6 shadow-xl shadow-black/5 dark:shadow-black/30">
      <header className="flex items-center gap-3">
        {s.bild && <img src={s.bild} alt="" className="h-12 w-12 rounded-xl bg-white object-contain p-1 shadow-sm" />}
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unterstützen</p>
          <p className="truncate text-lg font-semibold">{s.titel}</p>
        </div>
      </header>
      <ul className="grid grid-cols-2 gap-2 text-sm">
        {s.eingegangen !== null && <li className="rounded-2xl bg-emerald-50/70 p-3 dark:bg-emerald-950/40"><p className="text-lg font-bold">{ocBetrag(s.eingegangen, s.waehrung)}</p><p className="text-xs text-muted-foreground">gesammelt</p></li>}
        {s.unterstuetzende !== null && <li className="rounded-2xl bg-emerald-50/70 p-3 dark:bg-emerald-950/40"><p className="text-lg font-bold">{s.unterstuetzende}</p><p className="text-xs text-muted-foreground">Unterstützende</p></li>}
      </ul>
      {z && <Balken anteil={z.anteil} />}
      <div role="radiogroup" aria-label="Betrag wählen" className="grid grid-cols-4 gap-2">
        {betraege.map((b) => (
          <button key={b} type="button" role="radio" aria-checked={betrag === b} onClick={() => setBetrag(b)}
            className={`rounded-xl py-2 text-sm font-semibold transition-colors ${betrag === b ? "bg-emerald-700 text-white" : "bg-emerald-50/70 hover:bg-emerald-100 dark:bg-emerald-950/40"}`}>
            {ocBetrag(b, s.waehrung)}
          </button>
        ))}
      </div>
      <Knopf s={s} betrag={betrag} />
      <button type="button" onClick={() => setGanz(true)} className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-200">Wohin das Geld geht</button>
      <Stand s={s} />
      <OcGanz stand={s} ziel={ziel} offen={ganz} onOffen={setGanz} />
    </section>
  )
}

// ── Ganz: über den Bildschirm ───────────────────────────────────────────────

/** Kopf, Zahlen, wohin das Geld geht, woher es kommt. */
export function OcGanz({ stand: s, ziel, offen, onOffen }: { stand: OcStand; ziel?: number | null; offen: boolean; onOffen: (an: boolean) => void }) {
  const z = ocZiel(s, ziel)
  const zahlen: [string, string][] = []
  if (s.kontostand !== null) zahlen.push([ocBetrag(s.kontostand, s.waehrung), "auf dem Konto"])
  if (s.eingegangen !== null) zahlen.push([ocBetrag(s.eingegangen, s.waehrung), "eingegangen"])
  if (s.ausgegeben !== null) zahlen.push([ocBetrag(s.ausgegeben, s.waehrung), "ausgegeben"])
  if (s.unterstuetzende !== null) zahlen.push([String(s.unterstuetzende), "Unterstützende"])
  return (
    <Dialog open={offen} onOpenChange={onOffen}>
      <DialogContent showCloseButton={false} aria-describedby={undefined}
        className="block h-[100dvh] w-screen max-w-none overflow-y-auto rounded-none border-0 bg-background p-0 sm:max-w-none">
        <header className="relative bg-gradient-to-br from-emerald-800 to-emerald-600 px-5 pb-16 pt-14 text-white sm:px-8">
          <div className="mx-auto flex max-w-5xl items-center gap-4">
            {s.bild && <img src={s.bild} alt="" className="h-16 w-16 rounded-2xl bg-white object-contain p-1.5 shadow-lg" />}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/80">Open Collective</p>
              <DialogTitle className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{s.titel}</DialogTitle>
              {s.beschreibung && <p className="mt-2 max-w-2xl text-white/90">{s.beschreibung}</p>}
            </div>
          </div>
          <button type="button" onClick={() => onOffen(false)} aria-label="Schließen" className="absolute right-4 top-4 rounded-full bg-black/25 p-2.5 backdrop-blur hover:bg-black/45"><X className="h-5 w-5" /></button>
        </header>
        {zahlen.length > 0 && (
          <ul className={`relative z-10 mx-auto -mt-10 grid max-w-5xl gap-3 px-5 sm:px-8 ${zahlen.length > 2 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2"}`}>
            {zahlen.map(([wert, was]) => (
              <li key={was} className="rounded-2xl bg-card p-4 shadow-lg shadow-black/5 dark:shadow-black/30">
                <p className="text-xl font-bold tracking-tight text-emerald-700 sm:text-2xl dark:text-emerald-300">{wert}</p>
                <p className="text-sm text-muted-foreground">{was}</p>
              </li>
            ))}
          </ul>
        )}
        <div className="mx-auto grid max-w-5xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-6">
            <section aria-label="Wohin das Geld geht" className="rounded-3xl bg-orange-50/60 p-6 dark:bg-orange-950/40">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><Receipt className="h-4 w-4" /> Wohin das Geld geht</h3>
              {s.ausgaben.length === 0 ? <p className="text-sm text-muted-foreground">Noch keine bezahlten Ausgaben.</p> : (
                <ul className="flex flex-col gap-3">
                  {s.ausgaben.map((a, i) => (
                    <li key={`${i}-${a.wann}`} className="flex items-start justify-between gap-4 text-sm">
                      <span><span className="block">{a.was}</span><span className="text-xs text-muted-foreground">{tag(a.wann)}</span></span>
                      <span className="shrink-0 font-semibold tabular-nums">{ocBetrag(a.betrag, s.waehrung)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section aria-label="Woher es kommt" className="rounded-3xl bg-emerald-50/60 p-6 dark:bg-emerald-950/40">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><Wallet className="h-4 w-4" /> Woher es kommt</h3>
              {s.eingaenge.length === 0 ? <p className="text-sm text-muted-foreground">Noch keine Eingänge.</p> : (
                <ul className="flex flex-col gap-2">
                  {s.eingaenge.map((e, i) => (
                    <li key={`${i}-${e.wann}`} className="flex justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">{tag(e.wann)}</span>
                      <span className="font-semibold tabular-nums">{ocBetrag(e.betrag, s.waehrung)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs text-muted-foreground">Ohne Namen; wer gibt, steht bei Open Collective selbst.</p>
            </section>
          </div>
          <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
            <section className="flex flex-col gap-3 rounded-3xl bg-card p-6 shadow-xl shadow-black/5 dark:shadow-black/30">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><Users className="h-4 w-4" /> Mitmachen</h3>
              {z && <Balken anteil={z.anteil} />}
              <Knopf s={s} />
              <a href={s.adresse} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ExternalLink className="h-4 w-4" /> Seite bei Open Collective</a>
              <Stand s={s} />
            </section>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  )
}

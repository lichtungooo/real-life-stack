// Das Stiftungsprofil (DEFINITION Teil 8), die Darstellung.
//
// Für ein Projekt, das Förderung sucht. Seine Fragen in dieser Reihenfolge:
// Wie beantrage ich? Passt mein Vorhaben? Wie viel? Wen spreche ich an?
// Darum steht der Weg zum Antrag oben, und statt eines großen Fotos trägt
// der Kopf das Logo oder ein Monogramm in der Hausfarbe der Stiftung.
//
// Aus einem Guss mit dem Project Profile (gleiche Flächen, gleiche
// Überschriften, zwei Ansichten), im Aufbau eigen. Gerechnet wird in
// `@trustdonation/core` (`stiftungsProfil`); hier wird nur gezeigt.
//
// Eigener Einstieg `@trustdonation/ui/stiftungs-profil`, nachgeladen.

import { useState, type ComponentType, type CSSProperties, type ReactNode } from "react"
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ClipboardList,
  Globe,
  HandHeart,
  Landmark,
  Mail,
  MapPin,
  Maximize2,
  Search,
  Sparkles,
  Target,
  X,
} from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@real-life-stack/toolkit"
import { stiftungsProfil, type StiftungsProfil } from "@trustdonation/core"

type Symbol = ComponentType<{ className?: string }>

/**
 * Text in der Hausfarbe, der in beiden Ansichten lesbar bleibt: Eine
 * Hausfarbe ist für hellen Grund gewählt, dunkel greift der Vordergrund
 * (wie in der Profil-Collage).
 */
const HAUSFARBE = "text-[color:var(--td-hausfarbe)] dark:text-foreground"
const hausfarbe = (farbe: string) => ({ "--td-hausfarbe": farbe }) as CSSProperties

/** Wohin „Profil übernehmen“ führt, bis es einen Weg in der App gibt. */
const UEBERNAHME_MAIL = "mail@reallife.network"

function Ueberschrift({ icon: Icon, children }: { icon: Symbol; children: ReactNode }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      <Icon className="h-4 w-4" /> {children}
    </h3>
  )
}

/** Logo oder Monogramm in der Hausfarbe: der Platzhalter für ein fehlendes Bild. */
function Zeichen({ p, gross = false }: { p: StiftungsProfil; gross?: boolean }) {
  const groesse = gross ? "h-24 w-24 text-3xl" : "h-16 w-16 text-xl"
  if (p.bild) {
    return (
      <span className={`${groesse} flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-md`}>
        <img src={p.bild} alt={`Zeichen von ${p.titel}`} className="max-h-full max-w-full object-contain" />
      </span>
    )
  }
  return (
    <span className={`${groesse} flex shrink-0 items-center justify-center rounded-2xl font-bold tracking-tight text-white shadow-md`}
      style={{ background: `linear-gradient(135deg, ${p.farbe}, ${p.farbe}bb)` }} aria-hidden>
      {p.monogramm}
    </span>
  )
}

function Chips({ werte, ton = "sky" }: { werte: string[]; ton?: "sky" | "green" | "violet" }) {
  const farbe = {
    sky: "bg-sky-100/70 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100",
    green: "bg-green-100/70 text-green-900 dark:bg-green-900/40 dark:text-green-100",
    violet: "bg-violet-100/70 text-violet-900 dark:bg-violet-900/40 dark:text-violet-100",
  }[ton]
  return (
    <ul className="flex flex-wrap gap-1.5">
      {werte.map((w, i) => <li key={`${i}-${w}`} className={`rounded-full px-2.5 py-1 text-xs font-medium ${farbe}`}>{w}</li>)}
    </ul>
  )
}

function JaNein({ wert }: { wert: boolean }) {
  return wert
    ? <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white">ja</span>
    : <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">nein</span>
}

function AntragKnopf({ p, schmal = false }: { p: StiftungsProfil; schmal?: boolean }) {
  const ziel = p.antrag?.ziel ?? p.kontakt?.website
  if (!ziel) return null
  return (
    <a href={ziel} target="_blank" rel="noopener noreferrer"
      className={`flex items-center justify-center gap-2 rounded-xl px-4 ${schmal ? "py-2.5" : "py-3"} text-sm font-semibold text-white shadow-sm hover:opacity-90`}
      style={{ background: p.farbe } as CSSProperties}>
      {p.antrag?.portal ? "Zum Antragsportal" : p.antrag ? "Zur Stiftung und zum Antrag" : "Zur Website der Stiftung"} <ArrowUpRight className="h-4 w-4" />
    </a>
  )
}

function Herkunft({ p }: { p: StiftungsProfil }) {
  if (p.muster) {
    return <p className="text-xs text-muted-foreground">Musterstiftung mit erfundenen Angaben: So sieht ein vollständig gepflegtes Profil aus.</p>
  }
  if (!p.quelle) return null
  const betreff = encodeURIComponent(`Profil übernehmen: ${p.titel}`)
  return (
    <p className="text-xs leading-relaxed text-muted-foreground">
      <Search className="mr-1 inline h-3.5 w-3.5" />
      Aus öffentlicher Recherche ({p.quelle}). Ist das Ihre Stiftung?{" "}
      <a href={`mailto:${UEBERNAHME_MAIL}?subject=${betreff}`} className="font-medium underline underline-offset-2">Profil übernehmen</a>
    </p>
  )
}

function Kontakt({ p }: { p: StiftungsProfil }) {
  const k = p.kontakt
  if (!k) return null
  return (
    <div className="flex flex-col gap-2 text-sm">
      {k.ansprache && <p className="font-medium">{k.ansprache}</p>}
      {k.anschrift && (
        <p className="flex items-start gap-1.5 text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{k.anschrift}{k.anschriftQuelle && <> · <a href={k.anschriftQuelle} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Quelle</a></>}</span>
        </p>
      )}
      <div className="mt-1 flex flex-wrap gap-2">
        {k.mail && <a href={`mailto:${k.mail}`} className="flex items-center gap-2 rounded-xl bg-violet-700 px-3 py-2 text-sm font-medium text-white hover:bg-violet-800"><Mail className="h-4 w-4" /> Schreiben</a>}
        {k.website && <a href={k.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl bg-background/80 px-3 py-2 text-sm font-medium hover:bg-background"><Globe className="h-4 w-4" /> Website</a>}
      </div>
    </div>
  )
}

// ── Die Karte in der Detail-Leiste ──────────────────────────────────────────

export function StiftungsProfilSeite({ profil: p }: { profil: StiftungsProfil }) {
  const [voll, setVoll] = useState(false)
  return (
    <article className="flex flex-col gap-4" aria-label={`Stiftungsprofil ${p.titel}`}>
      <header className="flex items-start gap-3">
        <Zeichen p={p} />
        <div className="min-w-0 flex-1">
          <p className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider ${HAUSFARBE}`} style={hausfarbe(p.farbe)}>
            <Landmark className="h-3.5 w-3.5" /> {p.art[0] ?? "Stiftung"}{p.muster ? " · Muster" : ""}
          </p>
          {p.art.length > 1 && <p className="text-sm text-muted-foreground">{p.art.slice(1).join(" · ")}</p>}
          {p.sitz && <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{p.sitz}</p>}
        </div>
      </header>

      {(p.antrag || p.summe) && (
        <section className="rounded-2xl bg-sky-50/60 p-4 dark:bg-sky-950/40" aria-label="So kommst du zur Förderung">
          <Ueberschrift icon={ClipboardList}>So kommst du zur Förderung</Ueberschrift>
          {p.summe && <p className="mb-2 text-lg font-bold tracking-tight">{p.summe}</p>}
          {p.antrag?.weg && <p className="line-clamp-4 text-sm leading-relaxed">{p.antrag.weg}</p>}
          {p.antrag && p.antrag.fristen.length > 0 && (
            <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />{p.antrag.fristen.join(" · ")}</p>
          )}
          <div className="mt-3"><AntragKnopf p={p} schmal /></div>
        </section>
      )}
      {!p.antrag && !p.summe && <AntragKnopf p={p} schmal />}

      {p.foerderbereiche.length > 0 && (
        <section aria-label="Wofür sie fördert">
          <Ueberschrift icon={Target}>Wofür sie fördert</Ueberschrift>
          <Chips werte={p.foerderbereiche} ton="green" />
        </section>
      )}

      {p.kontakt && (
        <section className="rounded-2xl bg-violet-50/60 p-4 dark:bg-violet-950/40" aria-label="Kontakt">
          <Ueberschrift icon={Mail}>Kontakt</Ueberschrift>
          <Kontakt p={p} />
        </section>
      )}

      <Herkunft p={p} />

      <button type="button" onClick={() => setVoll(true)}
        className="flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background shadow-sm transition-opacity hover:opacity-90">
        <Maximize2 className="h-4 w-4" /> Ganzes Profil öffnen
      </button>

      <StiftungsProfilVoll profil={p} offen={voll} onOffen={setVoll} />
    </article>
  )
}

// ── Die ganze Ansicht über den Bildschirm ───────────────────────────────────

export function StiftungsProfilVoll({ profil: p, offen, onOffen }: { profil: StiftungsProfil; offen: boolean; onOffen: (an: boolean) => void }) {
  const zahlen: { wert: string; was: string }[] = []
  if (p.summe) zahlen.push({ wert: p.summe, was: "je Vorhaben" })
  if (p.volumenJahr) zahlen.push({ wert: p.volumenJahr, was: "Fördervolumen" })
  if (p.foerderbereiche.length) zahlen.push({ wert: String(p.foerderbereiche.length), was: p.foerderbereiche.length === 1 ? "Förderbereich" : "Förderbereiche" })
  if (p.reichweite.length) zahlen.push({ wert: p.reichweite.join(", "), was: "Reichweite" })
  const spalten = ["", "grid-cols-1", "grid-cols-2", "grid-cols-2 md:grid-cols-3", "grid-cols-2 md:grid-cols-4"][Math.min(zahlen.length, 4)]
  const g = p.geben

  return (
    <Dialog open={offen} onOpenChange={onOffen}>
      <DialogContent showCloseButton={false} aria-describedby={undefined}
        className="block h-[100dvh] w-screen max-w-none overflow-y-auto rounded-none border-0 bg-background p-0 sm:max-w-none">
        <header className="relative w-full overflow-hidden pb-16 pt-14" style={{ background: `linear-gradient(135deg, ${p.farbe}, ${p.farbe}cc 60%, ${p.farbe}99)` }}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-white/5" />
          <div className="relative mx-auto flex max-w-6xl flex-col gap-5 px-5 sm:flex-row sm:items-end sm:px-8">
            <Zeichen p={p} gross />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/80">
                <Landmark className="h-4 w-4" /> {p.art.join(" · ") || "Stiftung"}{p.muster ? " · Musterstiftung" : ""}
              </p>
              <DialogTitle className="mt-1 text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">{p.titel}</DialogTitle>
              {p.sitz && <p className="mt-2 flex items-center gap-1.5 text-white/90"><MapPin className="h-4 w-4" />{p.sitz}</p>}
            </div>
          </div>
          <button type="button" onClick={() => onOffen(false)} aria-label="Profil schließen"
            className="absolute right-4 top-4 rounded-full bg-black/25 p-2.5 text-white backdrop-blur hover:bg-black/45">
            <X className="h-5 w-5" />
          </button>
        </header>

        {zahlen.length > 0 && (
          <ul className={`relative z-10 mx-auto -mt-10 grid max-w-6xl gap-3 px-5 sm:px-8 ${spalten}`} aria-label="Kennzahlen">
            {zahlen.map((z) => (
              <li key={z.was} className="rounded-2xl bg-card p-4 shadow-lg shadow-black/5 dark:shadow-black/30">
                <p className={`text-xl font-bold tracking-tight sm:text-2xl ${HAUSFARBE}`} style={hausfarbe(p.farbe)}>{z.wert}</p>
                <p className="text-sm text-muted-foreground">{z.was}</p>
              </li>
            ))}
          </ul>
        )}

        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 pb-28 sm:px-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:pb-12">
          <div className="grid auto-rows-min grid-cols-1 gap-4 sm:grid-cols-6">
            {p.antrag && (
              <section className="rounded-3xl bg-sky-50/60 p-6 sm:col-span-6 sm:p-8 dark:bg-sky-950/40" aria-label="So kommst du zur Förderung">
                <Ueberschrift icon={ClipboardList}>So kommst du zur Förderung</Ueberschrift>
                {p.antrag.weg && <p className="text-lg font-medium leading-relaxed sm:text-xl">{p.antrag.weg}</p>}
                {(p.antrag.fristen.length > 0 || p.antrag.unterlagen.length > 0) && (
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    {p.antrag.fristen.length > 0 && (
                      <div>
                        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><CalendarDays className="h-4 w-4" /> Fristen</p>
                        <ul className="flex flex-col gap-1 text-sm">{p.antrag.fristen.map((f, i) => <li key={`${i}-${f}`}>{f}</li>)}</ul>
                      </div>
                    )}
                    {p.antrag.unterlagen.length > 0 && (
                      <div>
                        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><ClipboardList className="h-4 w-4" /> Was du einreichst</p>
                        <ul className="flex flex-col gap-1.5 text-sm">
                          {p.antrag.unterlagen.map((u, i) => <li key={`${i}-${u}`} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />{u}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {(p.zweck || p.foerderbereiche.length > 0 || p.zielgruppen.length > 0) && (
              <section className={`rounded-3xl bg-green-50/60 p-6 dark:bg-green-950/40 ${p.hinweis ? "sm:col-span-4" : "sm:col-span-6"}`} aria-label="Wofür sie fördert">
                <Ueberschrift icon={Target}>Wofür sie fördert</Ueberschrift>
                {p.zweck && <p className="mb-4 leading-relaxed">{p.zweck}</p>}
                {p.foerderbereiche.length > 0 && <Chips werte={p.foerderbereiche} ton="green" />}
                {p.zielgruppen.length > 0 && (
                  <div className="mt-4"><p className="mb-2 text-xs font-semibold text-muted-foreground">Für wen</p><Chips werte={p.zielgruppen} ton="sky" /></div>
                )}
              </section>
            )}
            {p.hinweis && (
              <section className="rounded-3xl bg-amber-50/60 p-6 dark:bg-amber-950/40 sm:col-span-2" aria-label="Woran du erkennst, dass du passt">
                <Ueberschrift icon={Sparkles}>Woran du erkennst, dass du passt</Ueberschrift>
                <p className="leading-relaxed">{p.hinweis}</p>
              </section>
            )}

            {p.bisherGefoerdert.length > 0 && (
              <section className="rounded-3xl bg-muted/40 p-6 sm:col-span-3" aria-label="Schon gefördert">
                <Ueberschrift icon={Check}>Schon gefördert</Ueberschrift>
                <ul className="flex flex-col gap-2 text-sm">{p.bisherGefoerdert.map((b, i) => <li key={`${i}-${b}`} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />{b}</li>)}</ul>
              </section>
            )}
            {g && (
              <section className={`rounded-3xl bg-emerald-50/60 p-6 dark:bg-emerald-950/40 ${p.bisherGefoerdert.length ? "sm:col-span-3" : "sm:col-span-6"}`} aria-label="Geben">
                <Ueberschrift icon={HandHeart}>Du willst selbst beitragen?</Ueberschrift>
                <ul className="flex flex-col gap-2 text-sm">
                  {g.zustiftung !== null && <li className="flex items-center justify-between gap-3">Zustiftung möglich <JaNein wert={g.zustiftung} /></li>}
                  {g.spende !== null && <li className="flex items-center justify-between gap-3">Spenden willkommen <JaNein wert={g.spende} /></li>}
                  {g.treuhand !== null && <li className="flex items-center justify-between gap-3">Treuhandstiftung unter ihrem Dach <JaNein wert={g.treuhand} /></li>}
                </ul>
              </section>
            )}
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
            <section className="rounded-3xl bg-card p-6 shadow-xl shadow-black/5 dark:shadow-black/30" aria-label="Antrag">
              <Ueberschrift icon={ClipboardList}>Antrag</Ueberschrift>
              {p.summe && <p className={`text-2xl font-bold tracking-tight ${HAUSFARBE}`} style={hausfarbe(p.farbe)}>{p.summe}</p>}
              {p.summe && <p className="mb-4 text-sm text-muted-foreground">Förderung je Vorhaben</p>}
              <AntragKnopf p={p} />
              {!p.antrag && <p className="mt-2 text-xs text-muted-foreground">Wie beantragt wird, steht noch nicht im Profil. Die Website hilft weiter.</p>}
            </section>
            {p.kontakt && (
              <section className="rounded-3xl bg-violet-50/60 p-6 dark:bg-violet-950/40" aria-label="Kontakt">
                <Ueberschrift icon={Mail}>Kontakt</Ueberschrift>
                <Kontakt p={p} />
              </section>
            )}
            <div className="rounded-3xl bg-muted/40 p-5"><Herkunft p={p} /></div>
          </aside>
        </div>

        {(p.antrag?.ziel ?? p.kontakt?.website) && (
          <div className="fixed inset-x-0 bottom-0 z-20 bg-background/90 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
            <AntragKnopf p={p} schmal />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** Der Einstieg für die App: rohe Daten hinein, die Aufbereitung im nachgeladenen Stück. */
export function StiftungsProfilAusDaten({ daten }: { daten: Record<string, unknown> }) {
  return <StiftungsProfilSeite profil={stiftungsProfil(daten)} />
}

export default StiftungsProfilAusDaten

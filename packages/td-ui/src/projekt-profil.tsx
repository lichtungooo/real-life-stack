// Das Project Profile (DEFINITION Teil 8), die Darstellung.
//
// Timo am 01.10.2026: *"ein richtig cooles Projektprofil … mit Kontaktdaten
// … ein Spendenbereich, der über Open Collective läuft"*, und dazu: *"ganz
// neue und unterschiedliche UX, die sich ähnlich anfühlen, jedoch vom Aufbau
// her verschieden sind … modernes UX/UI-Design in Perfektion"*.
//
// Zwei Ansichten aus einem Guss:
// - **Karte** in Antons Detail-Leiste: Titelbild, ein Satz, Spendenstand,
//   Knopf und der Weg zur ganzen Ansicht.
// - **Ganze Ansicht** über den Bildschirm, nach dem Muster heutiger
//   Kampagnenseiten: grosses Titelbild, Kennzahlen, die Geschichte als
//   Bento-Raster, rechts eine mitlaufende Spendenkarte mit Betraegen und
//   ihrer Wirkung, auf dem Handy eine feste Spendenleiste unten.
//
// Gerechnet wird in `@trustdonation/core` (`projektProfil`); hier wird nur
// gezeigt. Was fehlt, erscheint nicht. Design-Doktrin: Farbflaechen und
// Schatten statt Rahmen, `rounded-2xl`, Atemraum statt Trennstriche.
//
// Eigener Einstieg `@trustdonation/ui/projekt-profil`: Die App laedt das
// erst, wenn jemand ein Projekt oeffnet.

import { useEffect, useState, type ComponentType, type ReactNode } from "react"
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Globe,
  HandHeart,
  Images,
  Mail,
  MapPin,
  Maximize2,
  Phone,
  Sprout,
  Target,
  Users,
  Wallet,
  X,
} from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@real-life-stack/toolkit"
import { euro, projektProfil, spendenLink, type ProjektProfil, type ProjektSpende } from "@trustdonation/core"

export interface ProjektProfilSeiteProps {
  profil: ProjektProfil
  /** Macht aus einem Pfad der Instanz (`muster/garten.svg`) eine ladbare Adresse. */
  bildUrl?: (pfad: string) => string
}

type Symbol = ComponentType<{ className?: string }>

// Die Kennzahlen füllen die Breite, wie viele es auch sind (eine bis vier).
const KENNZAHL_SPALTEN: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-4",
}

const FARBEN = ["bg-emerald-600", "bg-amber-600", "bg-sky-600", "bg-rose-600", "bg-violet-600", "bg-teal-600"]

function Ueberschrift({ icon: Icon, children }: { icon: Symbol; children: ReactNode }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      <Icon className="h-4 w-4" /> {children}
    </h3>
  )
}

function MusterEtikett() {
  return (
    <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-800 shadow-sm backdrop-blur">
      Musterprojekt
    </span>
  )
}

function Fortschritt({ anteil, dick = false }: { anteil: number; dick?: boolean }) {
  return (
    <div className={`${dick ? "h-3" : "h-2"} overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/60`}
      role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(anteil * 100)} aria-label="Anteil gesammelt">
      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700 transition-[width] duration-700" style={{ width: `${Math.max(2, anteil * 100)}%` }} />
    </div>
  )
}

/** Gesammelt, Ziel, Balken und wer schon gibt. Von Karte und ganzer Ansicht geteilt. */
function SpendenStand({ s, gross = false }: { s: ProjektSpende; gross?: boolean }) {
  return (
    <>
      {s.gesammelt !== null && (
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className={`${gross ? "text-4xl" : "text-3xl"} font-bold tracking-tight text-emerald-800 dark:text-emerald-200`}>{euro(s.gesammelt)}</span>
          {s.ziel !== null && <span className="text-sm text-muted-foreground">von {euro(s.ziel)}</span>}
        </p>
      )}
      {s.gesammelt === null && s.ziel !== null && <p className="text-lg font-semibold">Ziel: {euro(s.ziel)}</p>}
      {s.anteil !== null && <div className="mt-3"><Fortschritt anteil={s.anteil} dick={gross} /></div>}
      {(s.unterstuetzende !== null || s.offen !== null) && (
        <div className="mt-2 flex flex-wrap justify-between gap-2 text-sm text-muted-foreground">
          {s.unterstuetzende !== null && <span><strong className="text-foreground">{s.unterstuetzende}</strong> Menschen geben schon</span>}
          {s.offen !== null && s.offen > 0 && <span>noch <strong className="text-foreground">{euro(s.offen)}</strong> offen</span>}
          {s.offen === 0 && <span className="font-medium text-emerald-700 dark:text-emerald-300">Ziel erreicht</span>}
        </div>
      )}
    </>
  )
}

function SpendenKnopf({ s, betrag, schmal = false }: { s: ProjektSpende; betrag?: number | null; schmal?: boolean }) {
  const link = spendenLink(s.opencollective, betrag)
  const klasse = `flex items-center justify-center gap-2 rounded-xl px-4 ${schmal ? "py-2.5" : "py-3"} text-sm font-semibold text-white shadow-sm`
  if (!link) {
    return (
      <button type="button" disabled className={`${klasse} w-full bg-emerald-700/50`} title="Die Seite bei Open Collective wird gerade eingerichtet">
        <HandHeart className="h-4 w-4" /> {betrag ? `${euro(betrag)} geben` : "Unterstützen"} · Spendenseite folgt
      </button>
    )
  }
  return (
    <a href={link} target="_blank" rel="noopener noreferrer" className={`${klasse} bg-emerald-700 hover:bg-emerald-800`}>
      <HandHeart className="h-4 w-4" /> {betrag ? `Mit ${euro(betrag)} unterstützen` : "Über Open Collective unterstützen"} <ArrowUpRight className="h-4 w-4" />
    </a>
  )
}

function SpendenHinweis({ s }: { s: ProjektSpende }) {
  return (
    <p className="mt-2 text-center text-[11px] text-muted-foreground">
      {s.beispiel ? "Beispielzahlen. " : ""}Das Geld läuft offen und nachvollziehbar über Open Collective.
    </p>
  )
}

/** Die Bildansicht über allem, mit Escape oder Klick zu schliessen. */
function Grossbild({ src, onZu }: { src: string; onZu: () => void }) {
  useEffect(() => {
    const zu = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onZu() } }
    window.addEventListener("keydown", zu, true)
    return () => window.removeEventListener("keydown", zu, true)
  }, [onZu])
  return (
    <div role="dialog" aria-label="Bild" className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4" onClick={onZu}>
      <img src={src} alt="" className="max-h-full max-w-full rounded-xl shadow-2xl" />
      <button type="button" onClick={onZu} aria-label="Schließen" className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"><X className="h-5 w-5" /></button>
    </div>
  )
}

// ── Die Karte in der Detail-Leiste ──────────────────────────────────────────

export function ProjektProfilSeite({ profil: p, bildUrl = (x) => x }: ProjektProfilSeiteProps) {
  const [voll, setVoll] = useState(false)
  const s = p.spende
  return (
    <article className="flex flex-col gap-4" aria-label={`Projektprofil ${p.titel}`}>
      <button type="button" onClick={() => setVoll(true)} aria-label="Ganzes Profil öffnen"
        className="group relative block overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 to-lime-500">
        {p.titelbild ? (
          <img src={bildUrl(p.titelbild)} alt="" className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <span className="flex aspect-[16/9] w-full items-center justify-center"><Sprout className="h-14 w-14 text-white/70" /></span>
        )}
        {p.muster && <span className="absolute left-3 top-3"><MusterEtikett /></span>}
        <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
          <Maximize2 className="h-3.5 w-3.5" /> Ganzes Profil
        </span>
      </button>

      {p.kurz && <p className="text-base font-semibold leading-snug">{p.kurz}</p>}

      {(p.ort || p.zeitraum) && (
        <div className="-mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {p.ort && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{p.ort}</span>}
          {p.zeitraum && <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{p.zeitraum}</span>}
        </div>
      )}

      {s && (
        <section className="rounded-2xl bg-emerald-50/60 p-4 dark:bg-emerald-950/40" aria-label="Unterstützen">
          <SpendenStand s={s} />
          <div className="mt-4"><SpendenKnopf s={s} schmal /></div>
          <SpendenHinweis s={s} />
        </section>
      )}

      {p.beduerfnis && (
        <section className="rounded-2xl bg-amber-50/60 p-4 dark:bg-amber-950/40" aria-label="Was fehlt">
          <Ueberschrift icon={Target}>Was ohne dieses Projekt fehlt</Ueberschrift>
          <p className="line-clamp-4 text-sm leading-relaxed">{p.beduerfnis}</p>
        </section>
      )}

      <button type="button" onClick={() => setVoll(true)}
        className="flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background shadow-sm transition-opacity hover:opacity-90">
        <Maximize2 className="h-4 w-4" /> Ganzes Profil öffnen
      </button>

      <ProjektProfilVoll profil={p} bildUrl={bildUrl} offen={voll} onOffen={setVoll} />
    </article>
  )
}

// ── Die ganze Ansicht über den Bildschirm ───────────────────────────────────

export function ProjektProfilVoll({
  profil: p,
  bildUrl = (x) => x,
  offen,
  onOffen,
}: ProjektProfilSeiteProps & { offen: boolean; onOffen: (an: boolean) => void }) {
  const s = p.spende
  const k = p.kontakt
  const [gross, setGross] = useState<string | null>(null)
  // Vorgewaehlt: der zweite Betrag, wie es Kampagnenseiten tun. Nicht der
  // kleinste, nicht der groesste.
  const [betrag, setBetrag] = useState<number | null>(s?.stufen[1]?.betrag ?? s?.stufen[0]?.betrag ?? null)
  const [titelbildDaneben, ...galerie] = p.galerie

  return (
    <Dialog open={offen} onOpenChange={onOffen}>
      <DialogContent showCloseButton={false} aria-describedby={undefined}
        className="block h-[100dvh] w-screen max-w-none overflow-y-auto rounded-none border-0 bg-background p-0 sm:max-w-none">
        {/* Kopf */}
        <header className="relative h-[46vh] min-h-[300px] w-full overflow-hidden bg-gradient-to-br from-emerald-800 to-lime-600">
          {p.titelbild && <img src={bildUrl(p.titelbild)} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-6xl flex-col gap-3 px-5 pb-16 sm:px-8">
            {p.muster && <span><MusterEtikett /></span>}
            <DialogTitle className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">{p.titel}</DialogTitle>
            {p.kurz && <p className="max-w-3xl text-base leading-relaxed text-white/90 sm:text-lg">{p.kurz}</p>}
            {(p.ort || p.zeitraum || p.tags.length > 0) && (
              <div className="flex flex-wrap gap-2 text-xs text-white/90">
                {p.ort && <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 backdrop-blur"><MapPin className="h-3.5 w-3.5" />{p.ort}</span>}
                {p.zeitraum && <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 backdrop-blur"><CalendarDays className="h-3.5 w-3.5" />{p.zeitraum}</span>}
                {p.tags.map((t) => <span key={t} className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">#{t}</span>)}
              </div>
            )}
          </div>
          <button type="button" onClick={() => onOffen(false)} aria-label="Profil schließen"
            className="absolute right-4 top-4 rounded-full bg-black/35 p-2.5 text-white backdrop-blur hover:bg-black/55">
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Kennzahlen, halb über dem Kopf */}
        {p.kennzahlen.length > 0 && (
          <ul className={`relative z-10 mx-auto -mt-10 grid max-w-6xl gap-3 px-5 sm:px-8 ${KENNZAHL_SPALTEN[p.kennzahlen.length] ?? KENNZAHL_SPALTEN[4]}`} aria-label="Kennzahlen">
            {p.kennzahlen.map((z) => (
              <li key={`${z.wert}-${z.was}`} className="rounded-2xl bg-card p-4 shadow-lg shadow-black/5 dark:shadow-black/30">
                <p className="text-2xl font-bold tracking-tight text-emerald-700 sm:text-3xl dark:text-emerald-300">{z.wert}</p>
                <p className="text-sm text-muted-foreground">{z.was}</p>
              </li>
            ))}
          </ul>
        )}

        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 pb-28 sm:px-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:pb-12">
          {/* Die Geschichte als Bento-Raster */}
          <div className="grid auto-rows-min grid-cols-1 gap-4 sm:grid-cols-6">
            {p.beduerfnis && (
              <section className="rounded-3xl bg-amber-50/60 p-6 sm:col-span-6 sm:p-8 dark:bg-amber-950/40" aria-label="Was fehlt">
                <Ueberschrift icon={Target}>Was ohne dieses Projekt fehlt</Ueberschrift>
                <p className="text-xl font-medium leading-relaxed sm:text-2xl">{p.beduerfnis}</p>
              </section>
            )}

            {p.beschreibung && (
              <section className={`rounded-3xl bg-muted/40 p-6 ${titelbildDaneben ? "sm:col-span-4" : "sm:col-span-6"}`} aria-label="Worum es geht">
                <Ueberschrift icon={Sprout}>Worum es geht</Ueberschrift>
                <p className="whitespace-pre-line leading-relaxed">{p.beschreibung}</p>
              </section>
            )}
            {titelbildDaneben && (
              <button type="button" onClick={() => setGross(titelbildDaneben)} aria-label="Bild groß zeigen"
                className={`group overflow-hidden rounded-3xl ${p.beschreibung ? "sm:col-span-2" : "sm:col-span-6"}`}>
                <img src={bildUrl(titelbildDaneben)} alt="" className="h-full min-h-[220px] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </button>
            )}

            {p.wirkung.length > 0 && (
              <section className="rounded-3xl bg-green-50/60 p-6 sm:col-span-6 dark:bg-green-950/40" aria-label="Was sich ändert">
                <Ueberschrift icon={Check}>Was sich ändert</Ueberschrift>
                <ul className="grid gap-4 sm:grid-cols-2">
                  {p.wirkung.map((w, i) => (
                    <li key={`${i}-${w}`} className="flex gap-3">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-600 text-white"><Check className="h-4 w-4" /></span>
                      <span className="leading-relaxed">{w}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {p.bedarfe.length > 0 && (
              <section className={`rounded-3xl bg-orange-50/60 p-6 dark:bg-orange-950/40 ${p.schritte.length ? "sm:col-span-3" : "sm:col-span-6"}`} aria-label="Wohin das Geld geht">
                <Ueberschrift icon={Wallet}>Wohin das Geld geht</Ueberschrift>
                <ul className="flex flex-col gap-3">
                  {p.bedarfe.map((b, i) => (
                    <li key={`${i}-${b.wofuer}`}>
                      <div className="flex justify-between gap-3 text-sm">
                        <span>{b.wofuer}</span>
                        {b.betrag !== null && <span className="font-semibold tabular-nums">{euro(b.betrag)}</span>}
                      </div>
                      {b.anteil !== null && (
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-orange-100 dark:bg-orange-900/50">
                          <div className="h-full rounded-full bg-orange-500" style={{ width: `${b.anteil * 100}%` }} />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                {p.bedarfSumme !== null && (
                  <p className="mt-4 flex justify-between text-sm font-semibold"><span>Zusammen</span><span className="tabular-nums">{euro(p.bedarfSumme)}</span></p>
                )}
              </section>
            )}

            {p.schritte.length > 0 && (
              <section className={`rounded-3xl bg-sky-50/60 p-6 dark:bg-sky-950/40 ${p.bedarfe.length ? "sm:col-span-3" : "sm:col-span-6"}`} aria-label="Schritte">
                <Ueberschrift icon={CalendarDays}>Schritte</Ueberschrift>
                <ol className="relative ml-2.5 flex flex-col gap-4 before:absolute before:bottom-2 before:left-0 before:top-2 before:w-0.5 before:bg-sky-200 dark:before:bg-sky-900">
                  {p.schritte.map((st, i) => {
                    const jetzt = i === p.naechsterSchritt
                    return (
                      <li key={`${i}-${st.titel}`} className="relative pl-6">
                        <span className={`absolute -left-[9px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full ${st.erledigt ? "bg-sky-600 text-white" : jetzt ? "bg-background ring-4 ring-sky-500" : "bg-muted"}`}>
                          {st.erledigt && <Check className="h-3 w-3" />}
                        </span>
                        <p className={`text-sm ${jetzt ? "font-semibold" : st.erledigt ? "text-muted-foreground" : ""}`}>
                          {st.titel}
                          {jetzt && <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-sky-800 dark:bg-sky-900 dark:text-sky-100">jetzt</span>}
                        </p>
                        {st.wann && <p className="text-xs text-muted-foreground">{st.wann}</p>}
                      </li>
                    )
                  })}
                </ol>
              </section>
            )}

            {p.team.length > 0 && (
              <section className="rounded-3xl bg-muted/40 p-6 sm:col-span-6" aria-label="Wer dahinter steht">
                <Ueberschrift icon={Users}>Wer dahinter steht</Ueberschrift>
                <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {p.team.map((m, i) => (
                    <li key={`${i}-${m.name}`} className="flex items-center gap-3 rounded-2xl bg-background/70 p-3">
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${FARBEN[i % FARBEN.length]}`}>{m.kuerzel}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{m.name}</span>
                        {m.rolle && <span className="block truncate text-xs text-muted-foreground">{m.rolle}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {galerie.length > 0 && (
              <section className="sm:col-span-6" aria-label="Bilder">
                <Ueberschrift icon={Images}>Bilder</Ueberschrift>
                <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {galerie.map((b, i) => (
                    <li key={`${i}-${b}`} className={i === 0 && galerie.length > 2 ? "col-span-2 row-span-2" : ""}>
                      <button type="button" onClick={() => setGross(b)} className="group block h-full w-full overflow-hidden rounded-2xl" aria-label="Bild groß zeigen">
                        <img src={bildUrl(b)} alt="" loading="lazy" className="aspect-[4/3] h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Rechts, mitlaufend: Spenden und Kontakt */}
          <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
            {s && (
              <section id="projekt-spenden" className="rounded-3xl bg-card p-6 shadow-xl shadow-black/5 dark:shadow-black/30" aria-label="Unterstützen">
                <Ueberschrift icon={HandHeart}>Unterstützen</Ueberschrift>
                <SpendenStand s={s} gross />
                {s.stufen.length > 0 && (
                  <div role="radiogroup" aria-label="Betrag wählen" className="mt-5 grid grid-cols-2 gap-2">
                    {s.stufen.map((st, i) => {
                      const an = betrag === st.betrag
                      return (
                        <button key={`${i}-${st.betrag}`} type="button" role="radio" aria-checked={an} onClick={() => setBetrag(st.betrag)}
                          className={`flex flex-col items-start gap-0.5 rounded-2xl p-3 text-left transition-colors ${an ? "bg-emerald-700 text-white shadow-md" : "bg-emerald-50/70 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50"}`}>
                          <span className="text-lg font-bold">{euro(st.betrag)}</span>
                          {st.bewirkt && <span className={`text-xs leading-snug ${an ? "text-white/85" : "text-muted-foreground"}`}>{st.bewirkt}</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
                <div className="mt-4"><SpendenKnopf s={s} betrag={betrag} /></div>
                <SpendenHinweis s={s} />
              </section>
            )}

            {k && (
              <section className="rounded-3xl bg-violet-50/60 p-6 dark:bg-violet-950/40" aria-label="Kontakt">
                <Ueberschrift icon={Mail}>Kontakt</Ueberschrift>
                {k.person && <p className="font-semibold">{k.person}</p>}
                {k.rolle && <p className="text-sm text-muted-foreground">{k.rolle}</p>}
                {k.adresse && <p className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{k.adresse}</p>}
                <div className="mt-4 flex flex-col gap-2">
                  {k.mail && <a href={`mailto:${k.mail}`} className="flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-800"><Mail className="h-4 w-4" /> Schreiben</a>}
                  <div className="flex gap-2">
                    {k.telefon && <a href={`tel:${k.telefon.replace(/[^\d+]/g, "")}`} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-background/80 px-3 py-2.5 text-sm font-medium hover:bg-background"><Phone className="h-4 w-4" /> Anrufen</a>}
                    {k.website && <a href={k.website} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-background/80 px-3 py-2.5 text-sm font-medium hover:bg-background"><Globe className="h-4 w-4" /> Website</a>}
                  </div>
                </div>
              </section>
            )}
          </aside>
        </div>

        {/* Auf dem Handy: die Spendenleiste bleibt unten in Reichweite */}
        {s && (
          <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 bg-background/90 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
            <div className="min-w-0 flex-1">
              {s.gesammelt !== null && <p className="text-sm font-bold">{euro(s.gesammelt)}{s.ziel !== null && <span className="font-normal text-muted-foreground"> von {euro(s.ziel)}</span>}</p>}
              {s.anteil !== null && <div className="mt-1"><Fortschritt anteil={s.anteil} /></div>}
            </div>
            <button type="button" onClick={() => document.getElementById("projekt-spenden")?.scrollIntoView({ behavior: "smooth", block: "center" })}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white">
              <HandHeart className="h-4 w-4" /> Unterstützen
            </button>
          </div>
        )}

        {gross && <Grossbild src={bildUrl(gross)} onZu={() => setGross(null)} />}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Der Einstieg fuer die App: rohe Daten des Eintrags hinein. Die Aufbereitung
 * liegt damit im nachgeladenen Stueck, nicht im Hauptteil (Budget).
 */
export function ProjektProfilAusDaten({ daten, tags, bildUrl }: { daten: Record<string, unknown>; tags?: readonly string[]; bildUrl?: (pfad: string) => string }) {
  return <ProjektProfilSeite profil={projektProfil(daten, tags ?? [])} bildUrl={bildUrl} />
}

export default ProjektProfilAusDaten

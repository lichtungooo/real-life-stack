// Das Stiftungsprofil (DEFINITION Teil 8), die Darstellung.
//
// Im Auftritt der Stiftung (Logo, Hausfarben) und seit dem 02.10.2026 das
// große Ganze statt des Antrags. Timo: *"Das fördernd bringt gar nichts …
// wirklich in die Förderbereiche näher reingehen … Zahlen oder Beispiele für
// Projekte … auf der kleinen Seite stichpunktartig … auf der großen das
// große Ganze schön gegliedert, mit Bildern dazwischen."*
//
// - Karte in der Leiste: knapp. Logo, Satz, Schwerpunkte als Stichpunkte,
//   woher sie kommt, Website und Kontakt.
// - Ganze Ansicht: Kopf mit Schlagworten, Zahlen, je Schwerpunkt eine Karte
//   mit eigenem Bildmotiv, Beispiele, Herkunft, für wen, Kontakt; ganz unten
//   der Hinweis zur Herkunft der Angaben.
//
// Kein Antrag in der Anzeige (die Daten bleiben). Gerechnet wird in
// `@trustdonation/core` (`stiftungsProfil`, Kontrast, Motive); hier wird nur
// gezeigt. Eigener Einstieg `@trustdonation/ui/stiftungs-profil`, nachgeladen.

import { useEffect, useMemo, useState, type ComponentType, type CSSProperties, type ReactNode } from "react"
import {
  ArrowUpRight,
  Globe,
  HandHeart,
  History,
  Info,
  Landmark,
  Lightbulb,
  Mail,
  MapPin,
  Maximize2,
  Pencil,
  Search,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@real-life-stack/toolkit"
import { STIFTUNGS_PROFIL_FELDER, motivFuer, stiftungsProfil, type StiftungsProfil, type StiftungsSchwerpunkt } from "@trustdonation/core"
import {
  Bearbeitbar,
  BearbeitenKnopf,
  BearbeitenRahmen,
  OffenesFormular,
  StiftKnopf,
  useProfilBearbeiten,
  type ProfilBearbeitung,
} from "./profil-bearbeiten"
import { Motiv } from "./stiftungs-motive"

type Symbol = ComponentType<{ className?: string }>

/** Wohin „Profil übernehmen“ und Hinweise zur Herkunft führen. */
const UEBERNAHME_MAIL = "mail@reallife.network"

/** Die Farben des Auftritts als Variablen; alle Flächen mischen daraus. */
const auftritt = (p: StiftungsProfil) => ({ "--td-haus": p.farbe, "--td-akzent": p.akzent, "--td-haus-text": p.farbeText }) as CSSProperties

// Zart gemischt mit Karte und Hintergrund: hell wie dunkel lesbar, kein reines Weiß.
const GRUND = "bg-[color-mix(in_oklab,var(--td-haus)_5%,var(--background))]"
const FLAECHE = "bg-[color-mix(in_oklab,var(--td-haus)_8%,var(--card))]"
const FLAECHE_AKZENT = "bg-[color-mix(in_oklab,var(--td-akzent)_10%,var(--card))]"
const BILDGRUND = "bg-[color-mix(in_oklab,var(--td-haus)_10%,var(--card))]"
const KARTE = "bg-card shadow-[0_24px_60px_-24px_color-mix(in_oklab,var(--td-haus)_55%,transparent)]"
const SCHATTEN = "shadow-[0_18px_40px_-22px_color-mix(in_oklab,var(--td-haus)_50%,transparent)]"
/** Text in der Hausfarbe; dunkel trägt der Vordergrund (eine Hausfarbe ist für hellen Grund gewählt). */
const HAUSTEXT = "text-[color:var(--td-haus-text)] dark:text-foreground"
const CHIP = "bg-[color-mix(in_oklab,var(--td-haus)_12%,var(--card))] text-[color:var(--td-haus-text)] dark:text-foreground"

function Ueberschrift({ icon: Icon, children }: { icon: Symbol; children: ReactNode }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      <Icon className="h-4 w-4" /> {children}
    </h3>
  )
}

/** Die Schwerpunkte, sonst die Förderbereiche als Schwerpunkte ohne Text. */
function schwerpunkteVon(p: StiftungsProfil): StiftungsSchwerpunkt[] {
  if (p.schwerpunkte.length) return p.schwerpunkte
  return p.foerderbereiche.slice(0, 6).map((titel) => ({ titel, text: null, motiv: motivFuer(titel) }))
}

/** Der erste Satz der Herkunft, für die Karte. */
function ersterSatz(t: string): string {
  const m = /^(.+?[.!?])(\s|$)/.exec(t)
  return m ? m[1] : t
}

/** Logo auf heller Kachel oder Monogramm im Verlauf der Hausfarben. */
function Zeichen({ p, bildUrl, gross = false }: { p: StiftungsProfil; bildUrl: (x: string) => string; gross?: boolean }) {
  const groesse = gross ? "h-24 w-24 text-3xl sm:h-28 sm:w-28" : "h-16 w-16 text-xl"
  if (p.bild) {
    return (
      <span className={`${groesse} flex shrink-0 items-center justify-center overflow-hidden rounded-2xl p-2.5 shadow-xl shadow-black/15 ${p.bildHell ? "" : "bg-white"}`}
        style={p.bildHell ? { background: `linear-gradient(135deg, ${p.farbe}, ${p.akzent})` } : undefined}>
        <img src={bildUrl(p.bild)} alt={`Zeichen von ${p.titel}`} className="max-h-full max-w-full object-contain" />
      </span>
    )
  }
  return (
    <span className={`${groesse} flex shrink-0 items-center justify-center rounded-2xl font-bold tracking-tight shadow-xl shadow-black/15`}
      style={{ background: `linear-gradient(135deg, ${p.farbe}, ${p.akzent})`, color: p.textAufFarbe }} aria-hidden>
      {p.monogramm}
    </span>
  )
}

function Schlagworte({ werte, klein = false }: { werte: string[]; klein?: boolean }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {werte.map((w, i) => (
        <li key={`${i}-${w}`} className={`rounded-full font-medium ${CHIP} ${klein ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"}`}>#{w}</li>
      ))}
    </ul>
  )
}

function JaNein({ wert }: { wert: boolean }) {
  return wert
    ? <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white">ja</span>
    : <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">nein</span>
}

function WebsiteKnopf({ p, schmal = false }: { p: StiftungsProfil; schmal?: boolean }) {
  const ziel = p.kontakt?.website
  if (!ziel) return null
  return (
    <a href={ziel} target="_blank" rel="noopener noreferrer"
      className={`flex items-center justify-center gap-2 rounded-xl px-4 ${schmal ? "py-2.5" : "py-3"} text-sm font-semibold shadow-md hover:opacity-90`}
      style={{ background: `linear-gradient(135deg, ${p.farbe}, ${p.akzent})`, color: p.textAufFarbe }}>
      <Globe className="h-4 w-4" /> Zur Website der Stiftung <ArrowUpRight className="h-4 w-4" />
    </a>
  )
}

function Herkunft({ p }: { p: StiftungsProfil }) {
  if (p.muster) {
    return <p className="text-xs text-muted-foreground">Musterstiftung mit erfundenen Angaben: So sieht ein vollständig gepflegtes Profil aus.</p>
  }
  if (!p.quelle && !p.auftritt) return null
  const betreff = encodeURIComponent(`Profil übernehmen: ${p.titel}`)
  return (
    <p className="text-xs leading-relaxed text-muted-foreground">
      <Search className="mr-1 inline h-3.5 w-3.5" />
      Aus öffentlicher Recherche. Ist das Ihre Stiftung?{" "}
      <a href={`mailto:${UEBERNAHME_MAIL}?subject=${betreff}`} className="font-medium underline underline-offset-2">Profil übernehmen</a>
    </p>
  )
}

/** Ganz unten: woher die Angaben stammen, wem Name, Logo und Farben gehören. */
function Hinweis({ p }: { p: StiftungsProfil }) {
  if (p.muster) return null
  const stand = p.auftritt?.stand ? new Date(p.auftritt.stand).toLocaleDateString("de-DE") : null
  const betreff = encodeURIComponent(`Profil ${p.titel}`)
  return (
    <footer className="mx-auto max-w-6xl px-5 pb-28 sm:px-8 lg:pb-10">
      <p className="flex gap-2 rounded-2xl bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Angaben aus öffentlichen Quellen
          {p.auftritt?.quelle ? <> (<a href={p.auftritt.quelle} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Website der Stiftung</a>{stand ? `, Stand ${stand}` : ""})</> : p.quelle ? ` (${p.quelle})` : ""}.
          {" "}Name, Logo und Farben gehören der Stiftung; trustdonation ist nicht mit ihr verbunden. Die Bilder sind eigene Zeichnungen.
          {" "}Fehler oder Wunsch nach Entfernung: <a href={`mailto:${UEBERNAHME_MAIL}?subject=${betreff}`} className="underline underline-offset-2">{UEBERNAHME_MAIL}</a>.
        </span>
      </p>
    </footer>
  )
}

function Kontakt({ p, mitWebsite = true }: { p: StiftungsProfil; mitWebsite?: boolean }) {
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
      {(k.mail || (mitWebsite && k.website)) && (
        <div className="mt-1 flex flex-wrap gap-2">
          {k.mail && <a href={`mailto:${k.mail}`} className="flex items-center gap-2 rounded-xl bg-background/80 px-3 py-2 text-sm font-medium hover:bg-background"><Mail className="h-4 w-4" /> Schreiben</a>}
          {mitWebsite && k.website && <a href={k.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl bg-background/80 px-3 py-2 text-sm font-medium hover:bg-background"><Globe className="h-4 w-4" /> Website</a>}
        </div>
      )}
    </div>
  )
}

// ── Die Karte in der Detail-Leiste ──────────────────────────────────────────

export function StiftungsProfilSeite({ profil: p, bearbeitung, bildUrl = (x) => x }: {
  profil: StiftungsProfil
  bearbeitung?: ProfilBearbeitung
  bildUrl?: (pfad: string) => string
}) {
  const [voll, setVoll] = useState(false)
  const [bearbeiten, setBearbeiten] = useState(false)
  const punkte = schwerpunkteVon(p)
  return (
    <article className="flex flex-col gap-4" aria-label={`Stiftungsprofil ${p.titel}`} style={auftritt(p)}>
      <header className={`flex flex-col gap-3 rounded-2xl p-4 ${FLAECHE}`}>
        <div className="flex items-center gap-3">
          <Zeichen p={p} bildUrl={bildUrl} />
          <div className="min-w-0 flex-1">
            <p className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider ${HAUSTEXT}`}>
              <Landmark className="h-3.5 w-3.5" /> {p.art[0] ?? "Stiftung"}{p.muster ? " · Muster" : ""}
            </p>
            {p.sitz && <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{p.sitz}</p>}
          </div>
        </div>
        {p.kurz && <p className="text-sm leading-relaxed">{p.kurz}</p>}
      </header>

      {punkte.length > 0 && (
        <section aria-label="Was sie fördert">
          <Ueberschrift icon={Target}>Was sie fördert</Ueberschrift>
          <ul className="flex flex-col gap-1.5 text-sm">
            {punkte.map((s, i) => (
              <li key={`${i}-${s.titel}`} className="flex items-start gap-2">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: i % 2 ? p.akzent : p.farbe }} />
                <span>{s.titel}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {p.herkunft && (
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <History className="mt-0.5 h-4 w-4 shrink-0" />{ersterSatz(p.herkunft)}
        </p>
      )}

      <WebsiteKnopf p={p} schmal />
      {p.kontakt && (p.kontakt.anschrift || p.kontakt.mail) && (
        <section className={`rounded-2xl p-4 ${FLAECHE}`} aria-label="Kontakt">
          <Ueberschrift icon={Mail}>Kontakt</Ueberschrift>
          <Kontakt p={p} mitWebsite={false} />
        </section>
      )}

      <Herkunft p={p} />

      <button type="button" onClick={() => setVoll(true)}
        className="flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background shadow-sm transition-opacity hover:opacity-90">
        <Maximize2 className="h-4 w-4" /> Ganzes Profil öffnen
      </button>
      {bearbeitung && (
        <button type="button" onClick={() => { setBearbeiten(true); setVoll(true) }}
          className="-mt-2 flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
          <Pencil className="h-4 w-4" /> Profil bearbeiten
        </button>
      )}

      <StiftungsProfilVoll profil={p} bildUrl={bildUrl} offen={voll} onOffen={(x) => { setVoll(x); if (!x) setBearbeiten(false) }}
        bearbeitung={bearbeitung} startBearbeiten={bearbeiten} />
    </article>
  )
}

// ── Die ganze Ansicht über den Bildschirm ───────────────────────────────────

export function StiftungsProfilVoll({ profil, offen, onOffen, bearbeitung, startBearbeiten = false, bildUrl = (x) => x }: {
  profil: StiftungsProfil
  offen: boolean
  onOffen: (an: boolean) => void
  /** Nur wenn der Mensch bearbeiten darf (Antons Regel); sonst kein Knopf. */
  bearbeitung?: ProfilBearbeitung
  startBearbeiten?: boolean
  bildUrl?: (pfad: string) => string
}) {
  const b = useProfilBearbeiten(STIFTUNGS_PROFIL_FELDER, bearbeitung)
  // Während der Arbeit zeigt die Seite die Arbeitskopie: Sie ist die Vorschau.
  const p = useMemo(() => (b.vorschau ? stiftungsProfil(b.vorschau) : profil), [b.vorschau, profil])
  const { setAn } = b
  useEffect(() => { if (offen && startBearbeiten) setAn(true) }, [offen, startBearbeiten]) // eslint-disable-line react-hooks/exhaustive-deps
  const zahlen = p.kennzahlen
  const spalten = ["", "grid-cols-1", "grid-cols-2", "grid-cols-2 md:grid-cols-3", "grid-cols-2 md:grid-cols-4"][Math.min(zahlen.length, 4)]
  const g = p.geben
  const auf = p.textAufFarbe
  const punkte = schwerpunkteVon(p)

  return (
    <Dialog open={offen} onOpenChange={(x) => { if (!x) setAn(false); onOffen(x) }}>
      <DialogContent showCloseButton={false} aria-describedby={undefined}
        onEscapeKeyDown={(e) => { if (b.offen) e.preventDefault() }}
        style={auftritt(p)}
        className={`block h-[100dvh] w-screen max-w-none overflow-y-auto rounded-none border-0 p-0 sm:max-w-none ${GRUND}`}>
        <BearbeitenRahmen wert={b.kontext}>
        {/* Kopf im Verlauf der Hausfarben: wer sie ist, was sie tut, was sie fördert */}
        <header className="relative w-full overflow-hidden pb-16 pt-14" style={{ background: `linear-gradient(135deg, ${p.farbe} 0%, ${p.farbe} 35%, ${p.akzent} 100%)`, color: auf }}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-black/5" />
          <div className="relative mx-auto flex max-w-6xl flex-col gap-5 px-5 sm:flex-row sm:items-start sm:px-8">
            <Zeichen p={p} bildUrl={bildUrl} gross />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider opacity-80">
                <Landmark className="h-4 w-4" /> {p.art[0] ?? "Stiftung"}{p.muster ? " · Musterstiftung" : ""}
              </p>
              <DialogTitle className="mt-1 text-3xl font-bold leading-tight tracking-tight sm:text-5xl" style={{ color: auf }}>{p.titel}</DialogTitle>
              {p.sitz && <p className="mt-2 flex items-center gap-1.5 opacity-90"><MapPin className="h-4 w-4" />{p.sitz}</p>}
              {p.kurz && <p className="mt-4 max-w-3xl text-lg leading-relaxed sm:text-xl">{p.kurz}</p>}
              {p.foerderbereiche.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2" aria-label="Förderbereiche">
                  {p.foerderbereiche.map((w, i) => (
                    <li key={`${i}-${w}`} className={`rounded-full px-3 py-1 text-sm font-medium backdrop-blur ${auf === "#ffffff" ? "bg-white/15" : "bg-black/10"}`}>#{w}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <StiftKnopf abschnitt="kopf" name="Kopf" className="absolute bottom-16 right-5 sm:right-8" />
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <BearbeitenKnopf an={b.an} onAn={setAn} />
            <button type="button" onClick={() => onOffen(false)} aria-label="Profil schließen"
              className="rounded-full bg-black/25 p-2.5 text-white backdrop-blur hover:bg-black/45">
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {(zahlen.length > 0 || b.an) && (
          <div className={`relative z-10 mx-auto max-w-6xl px-5 sm:px-8 ${zahlen.length ? "-mt-10" : "mt-6"}`}>
            <Bearbeitbar abschnitt="zahlen" name="Zahlen" da={zahlen.length > 0}>
              <ul className={`grid gap-3 ${spalten}`} aria-label="Zahlen">
                {zahlen.map((z, i) => (
                  <li key={`${i}-${z.was}`} className={`rounded-2xl p-4 ${KARTE}`}>
                    <p className={`text-xl font-bold tracking-tight sm:text-2xl ${HAUSTEXT}`}>{z.wert}</p>
                    <p className="text-sm text-muted-foreground">{z.was}</p>
                  </li>
                ))}
              </ul>
            </Bearbeitbar>
          </div>
        )}

        {b.offen === "kopf" && <div className="mx-auto max-w-6xl px-5 pt-6 sm:px-8"><OffenesFormular abschnitt="kopf" name="Kopf" /></div>}

        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-8">
            {/* Was sie fördert: der Kern der Seite */}
            <Bearbeitbar abschnitt="schwerpunkte" name="Was sie fördert" da={punkte.length > 0 || Boolean(p.zweck)}>
              <section aria-label="Was sie fördert">
                <Ueberschrift icon={Target}>Was sie fördert</Ueberschrift>
                {p.zweck && <p className="mb-5 max-w-3xl text-lg leading-relaxed">{p.zweck}</p>}
                <ul className="grid gap-4 sm:grid-cols-2">
                  {punkte.map((s, i) => (
                    <li key={`${i}-${s.titel}`} className={`overflow-hidden rounded-3xl ${FLAECHE} ${SCHATTEN}`}>
                      <div className={BILDGRUND}><Motiv name={s.motiv} className="aspect-[16/9] w-full" /></div>
                      <div className="p-5">
                        <h4 className={`text-lg font-semibold leading-snug ${HAUSTEXT}`}>{s.titel}</h4>
                        {s.text && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.text}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </Bearbeitbar>

            <Bearbeitbar abschnitt="beispiele" name="Beispiele" da={p.beispiele.length > 0}>
              <section aria-label="Beispiele">
                <Ueberschrift icon={Lightbulb}>Beispiele aus der Förderung</Ueberschrift>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {p.beispiele.map((x, i) => (
                    <li key={`${i}-${x.titel}`} className={`rounded-2xl p-5 ${FLAECHE_AKZENT}`}>
                      <p className="font-semibold leading-snug">{x.titel}</p>
                      {(x.ort || x.jahr) && <p className="mt-0.5 text-xs text-muted-foreground">{[x.ort, x.jahr].filter(Boolean).join(" · ")}</p>}
                      {x.text && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{x.text}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            </Bearbeitbar>

            <Bearbeitbar abschnitt="herkunft" name="Woher sie kommt" da={Boolean(p.herkunft || p.zielgruppen.length || p.hinweis)}>
              <section className={`grid gap-6 rounded-3xl p-6 sm:grid-cols-2 sm:p-8 ${FLAECHE} ${SCHATTEN}`} aria-label="Woher sie kommt">
                {p.herkunft && (
                  <div className={p.zielgruppen.length || p.hinweis ? "" : "sm:col-span-2"}>
                    <Ueberschrift icon={History}>Woher sie kommt</Ueberschrift>
                    <p className="leading-relaxed">{p.herkunft}</p>
                  </div>
                )}
                {(p.zielgruppen.length > 0 || p.hinweis) && (
                  <div className={`flex flex-col gap-5 ${p.herkunft ? "" : "sm:col-span-2"}`}>
                    {p.zielgruppen.length > 0 && (
                      <div><Ueberschrift icon={Users}>Für wen</Ueberschrift><Schlagworte werte={p.zielgruppen} klein /></div>
                    )}
                    {p.hinweis && (
                      <div><Ueberschrift icon={Sparkles}>Woran du erkennst, dass du passt</Ueberschrift><p className="text-sm leading-relaxed">{p.hinweis}</p></div>
                    )}
                  </div>
                )}
              </section>
            </Bearbeitbar>

            <Bearbeitbar abschnitt="geben" name="Du willst selbst beitragen?" da={g !== null}>
              {g && (
              <section className={`rounded-3xl p-6 ${FLAECHE}`} aria-label="Geben">
                <Ueberschrift icon={HandHeart}>Du willst selbst beitragen?</Ueberschrift>
                <ul className="flex flex-col gap-2 text-sm">
                  {g.zustiftung !== null && <li className="flex items-center justify-between gap-3">Zustiftung möglich <JaNein wert={g.zustiftung} /></li>}
                  {g.spende !== null && <li className="flex items-center justify-between gap-3">Spenden willkommen <JaNein wert={g.spende} /></li>}
                  {g.treuhand !== null && <li className="flex items-center justify-between gap-3">Treuhandstiftung unter ihrem Dach <JaNein wert={g.treuhand} /></li>}
                </ul>
              </section>
              )}
            </Bearbeitbar>
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
            <Bearbeitbar abschnitt="kontakt" name="Kontakt" da={p.kontakt !== null}>
              <section className={`flex flex-col gap-4 rounded-3xl p-6 ${KARTE}`} aria-label="Kontakt">
                <Ueberschrift icon={Mail}>Kontakt</Ueberschrift>
                <WebsiteKnopf p={p} />
                <Kontakt p={p} mitWebsite={false} />
              </section>
            </Bearbeitbar>
            <div className="rounded-3xl bg-muted/40 p-5"><Herkunft p={p} /></div>
          </aside>
        </div>

        <Hinweis p={p} />
        {p.muster && <div className="pb-28 lg:pb-10" />}

        {p.kontakt?.website && !b.an && (
          <div className="sticky bottom-0 z-20 bg-background/90 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
            <WebsiteKnopf p={p} schmal />
          </div>
        )}
        </BearbeitenRahmen>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Der Einstieg für die App: rohe Daten hinein, die Aufbereitung im
 * nachgeladenen Stück. Mit `bearbeitung` (nur wenn Antons Regel es erlaubt)
 * trägt die ganze Ansicht den Knopf „Profil bearbeiten“. `bildUrl` macht aus
 * einem Pfad der Instanz (`stiftungen/<id>.svg`) eine ladbare Adresse.
 */
export function StiftungsProfilAusDaten({ daten, bearbeitung, bildUrl }: {
  daten: Record<string, unknown>
  bearbeitung?: ProfilBearbeitung
  bildUrl?: (pfad: string) => string
}) {
  return <StiftungsProfilSeite profil={stiftungsProfil(daten)} bearbeitung={bearbeitung} bildUrl={bildUrl} />
}

export default StiftungsProfilAusDaten

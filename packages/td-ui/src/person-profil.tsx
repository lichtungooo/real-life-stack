// Das Profil eines Menschen (DEFINITION 9.1, freigegeben von Timo am
// 03.10.2026), die Darstellung.
//
// Timo: *"Was will ich von mir eintragen? Und was soll die Öffentlichkeit
// sehen, wenn sie auf mein Profil klicken? Das ist ganz, ganz wichtig."*
//
// Derselbe Aufbau wie Project Profile und Stiftungsprofil: Kopf, Abschnitte,
// Bearbeiten je Abschnitt. Dazu je Angabe eine Stufe (öffentlich, Kontakte,
// nur ich), ein Umschalter „So sehen mich andere“ und bei jeder Angabe die
// ehrliche Zeile, wer sie heute wirklich sieht. Gerechnet wird in td-core.
// Eigener Einstieg `@trustdonation/ui/person-profil`, nachgeladen.

import { useMemo, useState, type ComponentType, type ReactNode } from "react"
import { Check, Copy, Eye, Globe, HandHeart, Handshake, KeyRound, Link2, Lock, Mail, MapPin, Phone, Search, Sparkles, UserRound, Users, X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@real-life-stack/toolkit"
import {
  NIE_OEFFENTLICH,
  PERSON_PROFIL_FELDER,
  SICHTBARKEIT_NAME,
  personProfil,
  sichtbarkeit,
  werSiehtHeute,
  type Sichtbarkeit,
} from "@trustdonation/core"
import { Bearbeitbar, BearbeitenKnopf, BearbeitenRahmen, OffenesFormular, StiftKnopf, useProfilBearbeiten, type ProfilBearbeitung } from "./profil-bearbeiten"

type Roh = Record<string, unknown>
type Symbol = ComponentType<{ className?: string }>

const STUFE_SYMBOL: Record<Sichtbarkeit, Symbol> = { oeffentlich: Globe, kontakte: Users, privat: Lock }
const KARTE = "rounded-3xl bg-card p-6 shadow-xl shadow-black/5 dark:shadow-black/30"

function Stufe({ stufe }: { stufe: Sichtbarkeit }) {
  const S = STUFE_SYMBOL[stufe]
  return (
    <span title={`Sichtbar: ${SICHTBARKEIT_NAME[stufe]}`} className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium normal-case tracking-normal text-muted-foreground">
      <S className="h-3 w-3" /> {SICHTBARKEIT_NAME[stufe]}
    </span>
  )
}

function Ueberschrift({ icon: Icon, children, stufe }: { icon: Symbol; children: ReactNode; stufe?: Sichtbarkeit }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      <Icon className="h-4 w-4" /> <span className="flex-1">{children}</span> {stufe && <Stufe stufe={stufe} />}
    </h3>
  )
}

function Punkte({ werte }: { werte: string[] }) {
  return <ul className="flex flex-col gap-1.5 text-sm">{werte.map((w, i) => <li key={i} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />{w}</li>)}</ul>
}

/** Wer sieht was: je Angabe drei Stufen und die ehrliche Zeile für heute. */
function WerSiehtWas({ daten, onSichtbarkeit }: { daten: Roh; onSichtbarkeit: (feld: string, stufe: Sichtbarkeit) => Promise<unknown> }) {
  const [laeuft, setLaeuft] = useState<string | null>(null)
  const [fehler, setFehler] = useState<string | null>(null)
  const gefuellt = PERSON_PROFIL_FELDER.filter((f) => {
    const v = daten[f.id]
    return Array.isArray(v) ? v.length > 0 : typeof v === "string" ? v.trim() !== "" : v != null
  })
  const setzen = async (feld: string, stufe: Sichtbarkeit) => {
    setLaeuft(feld)
    setFehler(null)
    try { await onSichtbarkeit(feld, stufe) } catch { setFehler("Das ließ sich nicht speichern. Bitte noch einmal versuchen.") } finally { setLaeuft(null) }
  }
  return (
    <section className={KARTE} aria-label="Wer sieht was">
      <Ueberschrift icon={Eye}>Wer sieht was</Ueberschrift>
      {gefuellt.length === 0 && <p className="text-sm text-muted-foreground">Sobald du etwas einträgst, entscheidest du hier, wer es sieht.</p>}
      <ul className="flex flex-col gap-4">
        {gefuellt.map((f) => {
          const stufe = sichtbarkeit(daten, f.id)
          const heute = werSiehtHeute(f.id, stufe)
          return (
            <li key={f.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{f.name}</span>
                {laeuft === f.id && <span className="text-xs text-muted-foreground">speichert …</span>}
              </div>
              <div role="radiogroup" aria-label={`Wer sieht „${f.name}“`} className="grid grid-cols-3 gap-1 rounded-xl bg-muted/60 p-1">
                {(["oeffentlich", "kontakte", "privat"] as const).map((s) => {
                  const S = STUFE_SYMBOL[s]
                  const gesperrt = s === "oeffentlich" && NIE_OEFFENTLICH.includes(f.id)
                  return (
                    <button key={s} type="button" role="radio" aria-checked={stufe === s} disabled={gesperrt || laeuft !== null}
                      onClick={() => void setzen(f.id, s)} title={gesperrt ? "Telefon wird nie öffentlich" : SICHTBARKEIT_NAME[s]}
                      className={`flex items-center justify-center gap-1 rounded-lg px-1.5 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-40 ${stufe === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                      <S className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{s === "kontakte" ? "Kontakte" : SICHTBARKEIT_NAME[s]}</span>
                    </button>
                  )
                })}
              </div>
              <p className={`text-xs ${heute === "alle" ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}>
                Sieht heute: {heute === "alle" ? "alle, auch ohne Anmeldung" : "nur du"}
                {stufe === "kontakte" && " · das Teilen mit Kontakten baut Anton gerade"}
                {stufe === "oeffentlich" && heute === "nur du" && " · der Profil-Server trägt heute nur Name, Über mich und Bild"}
              </p>
            </li>
          )
        })}
      </ul>
      {fehler && <p role="alert" className="mt-3 text-sm text-rose-700 dark:text-rose-300">{fehler}</p>}
    </section>
  )
}

function Kopierbar({ name, wert, icon: Icon }: { name: string; wert: string; icon: Symbol }) {
  const [kopiert, setKopiert] = useState(false)
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="shrink-0 text-muted-foreground">{name}</span>
      <code className="min-w-0 flex-1 truncate rounded-lg bg-muted/60 px-2 py-1 text-xs">{wert}</code>
      <button type="button" aria-label={`${name} kopieren`} onClick={async () => { try { await navigator.clipboard.writeText(wert); setKopiert(true); setTimeout(() => setKopiert(false), 2000) } catch { /* ohne Zwischenablage */ } }}
        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">{kopiert ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button>
    </div>
  )
}

export interface PersonProfilVollProps {
  daten: Roh
  offen: boolean
  onOffen: (an: boolean) => void
  /** Nur für das eigene Profil: Bearbeiten je Abschnitt. */
  bearbeitung?: ProfilBearbeitung
  /** Nur für das eigene Profil: eine Stufe setzen. */
  onSichtbarkeit?: (feld: string, stufe: Sichtbarkeit) => Promise<unknown>
  /** Der eigene Schlüssel (DID) und der Link zum Profil, wie bei Antons Profil. */
  did?: string
  profilLink?: string
  /** Ein Hinweis unter dem Kopf, etwa in der Beispielwelt. */
  hinweis?: ReactNode
}

export function PersonProfilVoll({ daten, offen, onOffen, bearbeitung, onSichtbarkeit, did, profilLink, hinweis }: PersonProfilVollProps) {
  const b = useProfilBearbeiten(PERSON_PROFIL_FELDER, bearbeitung)
  const [ansicht, setAnsicht] = useState<"ich" | "andere">("ich")
  const roh = (b.vorschau ?? daten) as Roh
  const eigen = Boolean(bearbeitung || onSichtbarkeit)
  const fuerAndere = ansicht === "andere"
  const p = useMemo(() => personProfil(roh, fuerAndere ? "oeffentlich" : "ich"), [roh, fuerAndere])
  const stufe = (feld: string) => (eigen && !fuerAndere ? sichtbarkeit(roh, feld) : undefined)
  const initialen = p.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()
  const kontakt = p.kontakt.website || p.kontakt.mail || p.kontakt.telefon || p.kontakt.links.length > 0

  return (
    <Dialog open={offen} onOpenChange={(x) => { if (!x) b.setAn(false); onOffen(x) }}>
      <DialogContent showCloseButton={false} aria-describedby={undefined}
        onEscapeKeyDown={(e) => { if (b.offen) e.preventDefault() }}
        className="block h-[100dvh] w-screen max-w-none overflow-y-auto rounded-none border-0 bg-[color-mix(in_oklab,var(--muted)_45%,var(--background))] p-0 sm:max-w-none">
        <BearbeitenRahmen wert={fuerAndere ? null : b.kontext}>
          <header className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 pb-16 pt-14 text-white">
            <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10" />
            <div className="absolute right-4 top-4 z-10 flex flex-wrap items-center justify-end gap-2">
              {eigen && (
                <div role="radiogroup" aria-label="Ansicht" className="flex rounded-full bg-black/25 p-1 text-sm backdrop-blur">
                  <button type="button" role="radio" aria-checked={!fuerAndere} onClick={() => setAnsicht("ich")}
                    className={`rounded-full px-3 py-1.5 font-medium ${!fuerAndere ? "bg-white text-foreground" : "text-white/90"}`}>Ich</button>
                  <button type="button" role="radio" aria-checked={fuerAndere} onClick={() => { b.setAn(false); setAnsicht("andere") }}
                    className={`rounded-full px-3 py-1.5 font-medium ${fuerAndere ? "bg-white text-foreground" : "text-white/90"}`}>So sehen mich andere</button>
                </div>
              )}
              {!fuerAndere && <BearbeitenKnopf an={b.an} onAn={b.setAn} />}
              <button type="button" onClick={() => onOffen(false)} aria-label="Schließen" className="rounded-full bg-black/25 p-2 text-white backdrop-blur hover:bg-black/45"><X className="h-5 w-5" /></button>
            </div>
            <div className="relative mx-auto flex max-w-5xl flex-col gap-5 px-5 pt-6 sm:flex-row sm:items-end sm:px-8">
              <div className="relative">
                {p.bild
                  ? <img src={p.bild} alt="" className="h-28 w-28 rounded-3xl object-cover shadow-xl ring-4 ring-white/30" />
                  : <span className="flex h-28 w-28 items-center justify-center rounded-3xl bg-white/15 text-4xl font-bold shadow-xl ring-4 ring-white/30">{initialen || <UserRound className="h-12 w-12" />}</span>}
                <StiftKnopf abschnitt="kopf" name="Kopf" className="absolute -right-2 -top-2" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-3xl font-bold tracking-tight sm:text-4xl">{p.name}</DialogTitle>
                {p.kurz && <p className="mt-2 max-w-2xl text-lg text-white/90">{p.kurz}</p>}
                {p.ort && <p className="mt-2 flex items-center gap-1.5 text-sm text-white/80"><MapPin className="h-4 w-4" /> {p.ort}</p>}
                {fuerAndere && <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 text-xs"><Eye className="h-3.5 w-3.5" /> So sehen dich andere: nur, was auf „Öffentlich“ steht</p>}
              </div>
            </div>
          </header>

          <div className="mx-auto grid max-w-5xl gap-5 px-5 pb-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="relative z-10 -mt-8 flex flex-col gap-5">
              {hinweis}
              <OffenesFormular abschnitt="kopf" name="Kopf" />
              <Bearbeitbar abschnitt="ueber" name="Über mich" da={Boolean(p.ueber)}>
                <section className={KARTE}><Ueberschrift icon={UserRound} stufe={stufe("bio")}>Über mich</Ueberschrift>
                  {p.ueber?.split(/\n\s*\n/).map((a, i) => <p key={i} className="mb-3 leading-relaxed last:mb-0">{a}</p>)}</section>
              </Bearbeitbar>
              <Bearbeitbar abschnitt="kann" name="Was ich kann" da={p.kann.length > 0}>
                <section className={KARTE}><Ueberschrift icon={Sparkles} stufe={stufe("kann")}>Was ich kann</Ueberschrift>
                  <ul className="flex flex-wrap gap-2">{p.kann.map((k, i) => <li key={i} className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">{k}</li>)}</ul></section>
              </Bearbeitbar>
              <div className="grid gap-5 sm:grid-cols-2">
                <Bearbeitbar abschnitt="bietet" name="Was ich anbiete" da={p.bietet.length > 0}>
                  <section className={`${KARTE} h-full`}><Ueberschrift icon={HandHeart} stufe={stufe("bietet")}>Was ich anbiete</Ueberschrift><Punkte werte={p.bietet} /></section>
                </Bearbeitbar>
                <Bearbeitbar abschnitt="sucht" name="Was ich suche" da={p.sucht.length > 0}>
                  <section className={`${KARTE} h-full`}><Ueberschrift icon={Search} stufe={stufe("sucht")}>Was ich suche</Ueberschrift><Punkte werte={p.sucht} /></section>
                </Bearbeitbar>
              </div>
              <Bearbeitbar abschnitt="mitmachen" name="Wo ich mitmache" da={p.mitmachen.length > 0}>
                <section className={KARTE}><Ueberschrift icon={Handshake} stufe={stufe("mitmachen")}>Wo ich mitmache</Ueberschrift><Punkte werte={p.mitmachen} /></section>
              </Bearbeitbar>
              <Bearbeitbar abschnitt="ort" name="Wo ich wirke" da={Boolean(p.ort)}>
                <section className={KARTE}><Ueberschrift icon={MapPin} stufe={stufe("locationName")}>Wo ich wirke</Ueberschrift><p>{p.ort}</p></section>
              </Bearbeitbar>
            </div>

            <aside className="relative z-10 flex flex-col gap-5 lg:sticky lg:top-6 lg:-mt-8 lg:self-start">
              <Bearbeitbar abschnitt="kontakt" name="Kontakt" da={Boolean(kontakt)}>
                <section className={KARTE} aria-label="Kontakt"><Ueberschrift icon={Mail}>Kontakt</Ueberschrift>
                  <ul className="flex flex-col gap-2 text-sm">
                    {p.kontakt.website && <li className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground" /><a href={p.kontakt.website} target="_blank" rel="noopener noreferrer" className="truncate underline underline-offset-2">{p.kontakt.website.replace(/^https?:\/\//, "")}</a>{stufe("website") && <Stufe stufe={stufe("website")!} />}</li>}
                    {p.kontakt.mail && <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><a href={`mailto:${p.kontakt.mail}`} className="truncate underline underline-offset-2">{p.kontakt.mail}</a>{stufe("mail") && <Stufe stufe={stufe("mail")!} />}</li>}
                    {p.kontakt.telefon && <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{p.kontakt.telefon}</span>{stufe("telefon") && <Stufe stufe={stufe("telefon")!} />}</li>}
                    {p.kontakt.links.map((l, i) => <li key={i} className="flex items-center gap-2"><Link2 className="h-4 w-4 text-muted-foreground" /><a href={l} target="_blank" rel="noopener noreferrer" className="truncate underline underline-offset-2">{l.replace(/^https?:\/\//, "")}</a></li>)}
                  </ul></section>
              </Bearbeitbar>
              {eigen && !fuerAndere && onSichtbarkeit && <WerSiehtWas daten={roh} onSichtbarkeit={onSichtbarkeit} />}
              {eigen && !fuerAndere && (did || profilLink) && (
                <section className={KARTE} aria-label="Dein Schlüssel"><Ueberschrift icon={KeyRound}>Deine Identität</Ueberschrift>
                  <div className="flex flex-col gap-2">
                    {did && <Kopierbar name="Schlüssel" wert={did} icon={KeyRound} />}
                    {profilLink && <Kopierbar name="Profil-Link" wert={profilLink} icon={Link2} />}
                  </div></section>
              )}
            </aside>
          </div>
        </BearbeitenRahmen>
      </DialogContent>
    </Dialog>
  )
}

export default PersonProfilVoll

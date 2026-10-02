// Profile bearbeiten (DEFINITION Teil 8): der Abschnitts-Editor für
// Project Profile und Stiftungsprofil.
//
// Timo am 02.10.2026: Knopf „Profil bearbeiten“ in der ganzen Ansicht, je
// Abschnitt ein Stift, das Formular öffnet an Ort und Stelle mit sofortiger
// Vorschau, gespeichert wird je Abschnitt.
//
// Das Formular baut sich aus der Feldliste in td-core (`EingabeFeld`); hier
// steht keine eigene Liste. Die Vorschau ist die Seite selbst: Sie zeigt
// während der Arbeit die Arbeitskopie statt der gespeicherten Daten.
// Gespeichert wird über `abschnittSpeichern`, immer mit den ganzen Daten.

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { ArrowDown, ArrowUp, Check, Loader2, MapPin, Pencil, Plus, Search, Trash2, X } from "lucide-react"
import { nominatimGeocode, type GeocodeResult } from "@real-life-stack/toolkit"
import {
  abschnittSpeichern,
  arbeitskopie,
  feldHinweise,
  felderIm,
  ortAus,
  type EingabeFeld,
  type EingabeTeil,
} from "@trustdonation/core"

type Roh = Record<string, unknown>

/** Was die App einer Komponente zum Bearbeiten gibt. Ohne Recht gibt sie nichts. */
export interface ProfilBearbeitung {
  /** Die gespeicherten Daten des Eintrags, aktuell. */
  daten: Roh
  /** Die Felder am Eintrag selbst, etwa `{ tags }`. */
  eintrag?: Roh
  /** Schreibt `{ data, ...eintrag }` mit `updateItem`. */
  speichern: (aenderung: Roh) => Promise<unknown>
}

interface Bearbeiten {
  /** Steht die Seite im Bearbeiten-Modus? */
  an: boolean
  /** Der Abschnitt, dessen Formular offen ist. */
  offen: string | null
  oeffnen: (abschnitt: string) => void
  felder: readonly EingabeFeld[]
  arbeit: Roh
  setzen: (id: string, wert: unknown) => void
  abbrechen: () => void
  sichern: () => void
  laeuft: boolean
  fehler: string | null
}

const Kontext = createContext<Bearbeiten | null>(null)

/**
 * Der Zustand des Bearbeitens für eine Seite. `vorschau` sind die Daten,
 * die die Seite zeigen soll: die Arbeitskopie, solange ein Abschnitt offen
 * ist, danach das Gespeicherte, bis die App es zurückmeldet.
 */
export function useProfilBearbeiten(felder: readonly EingabeFeld[], b: ProfilBearbeitung | undefined) {
  const [an, setAn] = useState(false)
  const [offen, setOffen] = useState<string | null>(null)
  const [arbeit, setArbeit] = useState<Roh>({})
  const [gespeichert, setGespeichert] = useState<Roh | null>(null)
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)

  // Kommen neue Daten aus der App, gilt wieder das Gespeicherte von dort.
  useEffect(() => setGespeichert(null), [b?.daten])

  const stand = gespeichert ?? (b ? arbeitskopie(felder, b.daten, b.eintrag) : null)

  const kontext: Bearbeiten | null = b ? {
    an,
    offen,
    felder,
    arbeit,
    laeuft,
    fehler,
    oeffnen: (abschnitt) => {
      setArbeit(stand ?? {})
      setFehler(null)
      setOffen(abschnitt)
    },
    setzen: (id, wert) => setArbeit((a) => ({ ...a, [id]: wert })),
    abbrechen: () => { setOffen(null); setFehler(null) },
    sichern: () => {
      if (!offen || laeuft) return
      // Die aktuellen Daten aus der App, nicht die vom Öffnen: Was andere
      // inzwischen in anderen Abschnitten geschrieben haben, bleibt.
      const basis = gespeichert ?? b.daten
      const { data, eintrag } = abschnittSpeichern(felder, offen, basis, arbeit)
      setLaeuft(true)
      setFehler(null)
      b.speichern({ data, ...eintrag })
        .then(() => {
          setGespeichert(arbeitskopie(felder, data, Object.keys(eintrag).length ? eintrag : b.eintrag))
          setOffen(null)
        })
        .catch((e: unknown) => setFehler(e instanceof Error ? e.message : String(e)))
        .finally(() => setLaeuft(false))
    },
  } : null

  return {
    kontext,
    vorschau: offen ? arbeit : gespeichert,
    an,
    setAn: (x: boolean) => { setAn(x); if (!x) { setOffen(null); setFehler(null) } },
    offen,
  }
}

export function BearbeitenRahmen({ wert, children }: { wert: Bearbeiten | null; children: ReactNode }) {
  return <Kontext.Provider value={wert}>{children}</Kontext.Provider>
}

/** Der Knopf „Profil bearbeiten“, nur wenn die App das Recht gegeben hat. */
export function BearbeitenKnopf({ an, onAn, hell = false }: { an: boolean; onAn: (x: boolean) => void; hell?: boolean }) {
  const k = useContext(Kontext)
  if (!k) return null
  return (
    <button type="button" onClick={() => onAn(!an)} aria-pressed={an}
      className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium backdrop-blur transition-colors ${an
        ? "bg-white text-foreground shadow-md"
        : hell ? "bg-black/35 text-white hover:bg-black/55" : "bg-black/25 text-white hover:bg-black/45"}`}>
      {an ? <><Check className="h-4 w-4" /> Fertig</> : <><Pencil className="h-4 w-4" /> Profil bearbeiten</>}
    </button>
  )
}

/**
 * Ein Abschnitt der Seite, der sich bearbeiten lässt. Ohne Bearbeiten zeigt
 * er nur, was da ist. Im Bearbeiten-Modus trägt er einen Stift; ein leerer
 * Abschnitt erscheint als Fläche zum Ergänzen; offen steht das Formular über
 * der Vorschau.
 */
export function Bearbeitbar({ abschnitt, name, da, spalten = "", offenSpalten = "sm:col-span-6", children }: {
  abschnitt: string
  name: string
  /** Hat der Abschnitt Inhalt? */
  da: boolean
  /** Die Rasterklassen (`sm:col-span-3`), die sonst der Abschnitt selbst trägt. */
  spalten?: string
  /** Die Rasterklassen, solange das Formular offen ist; meist die ganze Breite. */
  offenSpalten?: string
  children: ReactNode
}) {
  const k = useContext(Kontext)
  if (!k?.an) return da ? <div className={spalten}>{children}</div> : null
  if (k.offen === abschnitt) {
    return (
      <div className={`flex flex-col gap-3 ${offenSpalten}`}>
        <AbschnittFormular abschnitt={abschnitt} name={name} />
        {da && <div aria-label="Vorschau" className="opacity-90">{children}</div>}
      </div>
    )
  }
  if (!da) {
    return (
      <button type="button" onClick={() => k.oeffnen(abschnitt)} disabled={k.offen !== null}
        className={`flex min-h-[96px] items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-muted-foreground/25 p-6 text-sm font-medium text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:text-foreground disabled:opacity-40 ${spalten}`}>
        <Plus className="h-4 w-4" /> {name} ergänzen
      </button>
    )
  }
  return (
    <div className={`group relative ${spalten}`}>
      {children}
      <StiftKnopf abschnitt={abschnitt} name={name} />
    </div>
  )
}

/** Der Stift für einen Abschnitt, auch für Stellen außerhalb des Rasters (Kopf). */
export function StiftKnopf({ abschnitt, name, className = "absolute -right-2 -top-2" }: { abschnitt: string; name: string; className?: string }) {
  const k = useContext(Kontext)
  if (!k?.an || k.offen === abschnitt) return null
  return (
    <button type="button" onClick={() => k.oeffnen(abschnitt)} disabled={k.offen !== null} aria-label={`${name} bearbeiten`} title={`${name} bearbeiten`}
      className={`${className} z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background text-foreground shadow-lg ring-1 ring-black/5 transition-transform hover:scale-105 disabled:opacity-40`}>
      <Pencil className="h-4 w-4" />
    </button>
  )
}

/** Das Formular des offenen Abschnitts, wo immer es stehen soll (Kopf). */
export function OffenesFormular({ abschnitt, name }: { abschnitt: string; name: string }) {
  const k = useContext(Kontext)
  if (!k?.an || k.offen !== abschnitt) return null
  return <AbschnittFormular abschnitt={abschnitt} name={name} />
}

// ── Das Formular ────────────────────────────────────────────────────────────

const EINGABE = "w-full rounded-xl bg-muted/50 px-3 py-2 text-sm outline-none ring-1 ring-transparent transition focus:bg-background focus:ring-2 focus:ring-ring"
const KLEIN = "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"

function AbschnittFormular({ abschnitt, name }: { abschnitt: string; name: string }) {
  const k = useContext(Kontext)!
  const felder = felderIm(k.felder, abschnitt)
  return (
    <section aria-label={`${name} bearbeiten`} className="@container rounded-3xl bg-card p-5 shadow-xl shadow-black/10 ring-2 ring-ring/30 sm:p-6 dark:shadow-black/40">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><Pencil className="h-4 w-4" /> {name}</h3>
        <button type="button" onClick={k.abbrechen} aria-label="Abbrechen" className={KLEIN}><X className="h-4 w-4" /></button>
      </div>
      <div className="flex flex-col gap-5">
        {felder.map((f) => <FeldEingabe key={f.id} feld={f} />)}
      </div>
      {k.fehler && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">Speichern ging nicht: {k.fehler}</p>}
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={k.abbrechen} className="rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-muted">Abbrechen</button>
        <button type="button" onClick={k.sichern} disabled={k.laeuft}
          className="flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-60">
          {k.laeuft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Speichern
        </button>
      </div>
    </section>
  )
}

function FeldEingabe({ feld }: { feld: EingabeFeld }) {
  const k = useContext(Kontext)!
  const wert = k.arbeit[feld.id]
  const hinweise = useMemo(() => feldHinweise(feld, wert), [feld, wert])
  const id = `feld-${feld.id}`
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">{feld.name ?? feld.frage}</label>
      <p className="-mt-1 text-xs text-muted-foreground">{feld.frage}{(feld.hilfe ?? feld.hinweis) ? ` · ${feld.hilfe ?? feld.hinweis}` : ""}</p>
      {feld.form === "ort"
        ? <OrtEingabe id={id} feld={feld} />
        : <Eingabe id={id} teil={feld} wert={wert} setzen={(v) => k.setzen(feld.id, v)} />}
      {hinweise.map((h) => <p key={h} className="text-xs text-amber-800 dark:text-amber-300">{h}</p>)}
    </div>
  )
}

type Form = Pick<EingabeTeil, "form" | "teile"> & { name?: string }

/** Eine Eingabe nach ihrer Form, auch für Teile in Listen und Objekten. */
function Eingabe({ id, teil, wert, setzen }: { id?: string; teil: Form; wert: unknown; setzen: (v: unknown) => void }) {
  switch (teil.form) {
    case "longtext":
      return <textarea id={id} rows={4} value={typeof wert === "string" ? wert : ""} onChange={(e) => setzen(e.target.value)} className={`${EINGABE} resize-y leading-relaxed`} />
    case "geld":
    case "zahl":
      return (
        <div className="relative">
          <input id={id} type="number" min={0} step={1} inputMode="numeric" value={typeof wert === "number" ? wert : ""}
            onChange={(e) => setzen(e.target.value === "" ? undefined : Number(e.target.value))} className={`${EINGABE} ${teil.form === "geld" ? "pr-8" : ""} tabular-nums`} />
          {teil.form === "geld" && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>}
        </div>
      )
    case "janein":
      return <JaNeinEingabe id={id} wert={wert} setzen={setzen} />
    case "tags":
      return <TagsEingabe id={id} wert={wert} setzen={setzen} />
    case "zeitraum":
      return <ZeitraumEingabe id={id} wert={wert} setzen={setzen} />
    case "list":
      return <ListenEingabe id={id} teil={teil} wert={wert} setzen={setzen} />
    case "objekt": {
      const o = wert && typeof wert === "object" && !Array.isArray(wert) ? (wert as Roh) : {}
      return (
        <div id={id} className="grid gap-3 rounded-2xl bg-muted/30 p-3 @lg:grid-cols-2">
          {(teil.teile ?? []).map((t) => (
            <label key={t.id} className={`flex flex-col gap-1 text-xs font-medium text-muted-foreground ${t.form === "list" || t.form === "longtext" ? "@lg:col-span-2" : ""}`}>
              {t.name}
              <Eingabe teil={t} wert={o[t.id]} setzen={(v) => setzen({ ...o, [t.id]: v })} />
            </label>
          ))}
        </div>
      )
    }
    default:
      return <input id={id} type="text" value={typeof wert === "string" ? wert : wert === undefined || wert === null ? "" : String(wert)} onChange={(e) => setzen(e.target.value)} className={EINGABE} />
  }
}

function JaNeinEingabe({ id, wert, setzen }: { id?: string; wert: unknown; setzen: (v: unknown) => void }) {
  const wahl: [string, boolean | undefined][] = [["ja", true], ["nein", false], ["keine Angabe", undefined]]
  return (
    <div id={id} role="radiogroup" className="flex w-fit gap-1 rounded-xl bg-muted/50 p-1">
      {wahl.map(([text, v]) => {
        const an = v === undefined ? typeof wert !== "boolean" : wert === v
        return (
          <button key={text} type="button" role="radio" aria-checked={an} onClick={() => setzen(v)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-colors ${an ? "bg-background font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {text}
          </button>
        )
      })}
    </div>
  )
}

function TagsEingabe({ id, wert, setzen }: { id?: string; wert: unknown; setzen: (v: unknown) => void }) {
  const tags = Array.isArray(wert) ? wert.filter((t): t is string => typeof t === "string") : []
  const [neu, setNeu] = useState("")
  const dazu = () => {
    const t = neu.trim().replace(/^#/, "").replace(/,$/, "")
    if (t && !tags.includes(t)) setzen([...tags, t])
    setNeu("")
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-muted/50 p-1.5">
      {tags.map((t) => (
        <span key={t} className="flex items-center gap-1 rounded-full bg-background py-1 pl-3 pr-1 text-sm shadow-sm">
          {t}
          <button type="button" onClick={() => setzen(tags.filter((x) => x !== t))} aria-label={`${t} entfernen`} className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
        </span>
      ))}
      <input id={id} value={neu} onChange={(e) => setNeu(e.target.value)} onBlur={dazu}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); dazu() }
          if (e.key === "Backspace" && !neu && tags.length) setzen(tags.slice(0, -1))
        }}
        placeholder={tags.length ? "" : "Wort, dann Enter"} className="min-w-[8rem] flex-1 bg-transparent px-2 py-1 text-sm outline-none" />
    </div>
  )
}

function ZeitraumEingabe({ id, wert, setzen }: { id?: string; wert: unknown; setzen: (v: unknown) => void }) {
  // Ein Zeitraum als Satz bleibt ein Satz; sonst von und bis.
  if (typeof wert === "string" && wert.trim()) {
    return <input id={id} type="text" value={wert} onChange={(e) => setzen(e.target.value)} className={EINGABE} />
  }
  const o = wert && typeof wert === "object" ? (wert as Roh) : {}
  return (
    <div className="grid grid-cols-2 gap-2">
      <input id={id} aria-label="von" placeholder="von, etwa März 2027" value={typeof o.von === "string" ? o.von : ""} onChange={(e) => setzen({ ...o, von: e.target.value })} className={EINGABE} />
      <input aria-label="bis" placeholder="bis" value={typeof o.bis === "string" ? o.bis : ""} onChange={(e) => setzen({ ...o, bis: e.target.value })} className={EINGABE} />
    </div>
  )
}

function ListenEingabe({ id, teil, wert, setzen }: { id?: string; teil: Form; wert: unknown; setzen: (v: unknown) => void }) {
  const eintraege = Array.isArray(wert) ? wert : []
  const mitTeilen = Boolean(teil.teile?.length)
  const tauschen = (i: number, j: number) => {
    const l = [...eintraege]
    ;[l[i], l[j]] = [l[j], l[i]]
    setzen(l)
  }
  return (
    <div id={id} className="flex flex-col gap-2">
      <ol className="flex flex-col gap-2">
        {eintraege.map((e, i) => (
          <li key={i} className={`flex items-start gap-1 ${mitTeilen ? "rounded-2xl bg-muted/30 p-2" : ""}`}>
            <div className="min-w-0 flex-1">
              {mitTeilen ? (
                <Eingabe teil={{ form: "objekt", teile: teil.teile, name: teil.name }} wert={e} setzen={(v) => setzen(eintraege.map((x, j) => (j === i ? v : x)))} />
              ) : (
                <input aria-label={`${teil.name ?? "Eintrag"} ${i + 1}`} value={typeof e === "string" ? e : ""} onChange={(ev) => setzen(eintraege.map((x, j) => (j === i ? ev.target.value : x)))} className={EINGABE} />
              )}
            </div>
            <div className={`flex ${mitTeilen ? "flex-col" : ""}`}>
              <button type="button" onClick={() => tauschen(i, i - 1)} disabled={i === 0} aria-label="Nach oben" className={KLEIN}><ArrowUp className="h-4 w-4" /></button>
              <button type="button" onClick={() => tauschen(i, i + 1)} disabled={i === eintraege.length - 1} aria-label="Nach unten" className={KLEIN}><ArrowDown className="h-4 w-4" /></button>
              <button type="button" onClick={() => setzen(eintraege.filter((_, j) => j !== i))} aria-label="Entfernen" className={KLEIN}><Trash2 className="h-4 w-4" /></button>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" onClick={() => setzen([...eintraege, mitTeilen ? {} : ""])}
        className="flex w-fit items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
        <Plus className="h-4 w-4" /> Eintrag hinzufügen
      </button>
    </div>
  )
}

/** Der Punkt auf der Karte: aus der Anschrift gesucht, über OpenStreetMap. */
function OrtEingabe({ id, feld }: { id: string; feld: EingabeFeld }) {
  const k = useContext(Kontext)!
  const punkt = ortAus(k.arbeit[feld.id])
  const anschrift = feld.anschrift ? k.arbeit[feld.anschrift] : null
  const [treffer, setTreffer] = useState<GeocodeResult[] | null>(null)
  const [sucht, setSucht] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)
  const suchen = () => {
    if (typeof anschrift !== "string" || !anschrift.trim()) { setFehler("Erst die Anschrift eintragen."); return }
    setSucht(true)
    setFehler(null)
    nominatimGeocode(anschrift)
      .then((t) => { setTreffer(t); if (!t.length) setFehler("Nichts gefunden. Steht die Anschrift vollständig da?") })
      .catch(() => setFehler("Die Suche bei OpenStreetMap ging gerade nicht."))
      .finally(() => setSucht(false))
  }
  return (
    <div id={id} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-xl bg-muted/50 px-3 py-2 text-sm tabular-nums">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          {punkt ? `${punkt.coordinates[1].toFixed(5)}, ${punkt.coordinates[0].toFixed(5)}` : "noch kein Punkt"}
        </span>
        <button type="button" onClick={suchen} disabled={sucht} className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-sm font-medium hover:bg-muted/70 disabled:opacity-60">
          {sucht ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Auf der Karte suchen
        </button>
        {punkt && <button type="button" onClick={() => k.setzen(feld.id, undefined)} className="rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted">Punkt entfernen</button>}
      </div>
      {fehler && <p className="text-xs text-amber-800 dark:text-amber-300">{fehler}</p>}
      {treffer && treffer.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-2xl bg-muted/30 p-1.5" aria-label="Gefundene Orte">
          {treffer.map((t) => (
            <li key={`${t.lat},${t.lng}`}>
              <button type="button" className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-background"
                onClick={() => {
                  k.setzen(feld.id, { type: "Point", coordinates: [t.lng, t.lat] })
                  if (feld.anschrift) k.setzen(feld.anschrift, t.label)
                  setTreffer(null)
                }}>
                <span className="font-medium">{t.label}</span>
                {t.detail && t.detail !== t.label && <span className="block truncate text-xs text-muted-foreground">{t.detail}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[11px] text-muted-foreground">Suche über OpenStreetMap (Nominatim).</p>
    </div>
  )
}

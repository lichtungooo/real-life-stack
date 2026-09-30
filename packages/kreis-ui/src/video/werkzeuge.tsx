// Die kleinen Werkzeuge der Konferenz: geteilte Notizen (linke Spalte),
// Umfrage (Tool in der Mitte), Kurzzeitwecker und Los (Anzeigen ueber der
// Buehne). Alles fluechtig, es endet mit der Sitzung.

import { useEffect, useRef, useState } from "react"
import { BarChart3, Timer, X } from "lucide-react"
import { ergebnis, type NachDerRedezeit, type Regeln } from "@kreis/core"
import type { KreisKontext } from "../raum-kontext"

const uhrzeit = (wann: number) => new Date(wann).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })

// --- Geteilte Notizen --------------------------------------------------------

/**
 * Ein Text fuer alle. Wer schreibt, schickt nach einer kurzen Pause; es gilt
 * der zuletzt geschriebene Stand. Solange das Feld den Fokus hat, bleibt der
 * eigene Entwurf stehen, damit einem niemand die Buchstaben unter den Fingern
 * wegzieht.
 */
export function GeteilteNotizen({ kreis }: { kreis: KreisKontext }) {
  const { notiz, notizSetzen } = kreis.neben
  const [entwurf, setEntwurf] = useState(notiz.text)
  const [fokus, setFokus] = useState(false)
  const warte = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { if (!fokus) setEntwurf(notiz.text) }, [notiz.text, fokus])
  useEffect(() => () => { if (warte.current) clearTimeout(warte.current) }, [])

  const schreiben = (text: string) => {
    setEntwurf(text)
    if (warte.current) clearTimeout(warte.current)
    warte.current = setTimeout(() => notizSetzen(text), 400)
  }

  return (
    <div className="flex h-full flex-col gap-2 px-3 pb-3">
      <textarea
        id="geteilte-notizen"
        aria-label="Geteilte Notizen"
        value={entwurf}
        onChange={(e) => schreiben(e.target.value)}
        onFocus={() => setFokus(true)}
        onBlur={() => { setFokus(false); notizSetzen(entwurf) }}
        placeholder="Hier schreiben alle zusammen: Tagesordnung, Beschlüsse, Ideen."
        className="min-h-0 flex-1 resize-none rounded-xl bg-white/10 p-3 text-[13px] leading-relaxed text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
      />
      <p className="text-[11px] text-slate-500">
        {notiz.v > 0 ? `zuletzt von ${notiz.name}, ${uhrzeit(notiz.wann)}` : "Noch leer. Endet mit der Sitzung, außer ihr übertragt es."}
      </p>
    </div>
  )
}

// --- Umfrage ------------------------------------------------------------------

export function UmfrageWerkzeug({ kreis }: { kreis: KreisKontext }) {
  const { umfrage, umfrageStarten, abstimmen, umfrageBeenden, umfrageVerwerfen } = kreis.neben
  const ich = kreis.ich ?? ""
  const [frage, setFrage] = useState("")
  const [antworten, setAntworten] = useState<string[]>(["", ""])
  const [fehlt, setFehlt] = useState(false)

  if (!umfrage) {
    const starten = (f: string, a: readonly string[]) => {
      if (umfrageStarten(f, a)) { setFrage(""); setAntworten(["", ""]); setFehlt(false) } else setFehlt(true)
    }
    return (
      <form className="mx-auto flex h-full max-w-lg flex-col gap-3 overflow-y-auto p-4"
        onSubmit={(e) => { e.preventDefault(); starten(frage, antworten) }}>
        <h3 className="flex items-center gap-2 text-base font-semibold"><BarChart3 className="h-4 w-4" /> Eine Umfrage an alle</h3>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Frage</span>
          <input id="umfrage-frage" value={frage} onChange={(e) => setFrage(e.target.value)} placeholder="Wann treffen wir uns wieder?"
            className="rounded-lg border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary" />
        </label>
        <div className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Antworten</span>
          {antworten.map((a, i) => (
            <input key={i} id={`umfrage-antwort-${i}`} aria-label={`Antwort ${i + 1}`} value={a}
              onChange={(e) => setAntworten(antworten.map((x, j) => (j === i ? e.target.value : x)))}
              placeholder={`Antwort ${i + 1}`}
              className="rounded-lg border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary" />
          ))}
          {antworten.length < 6 && (
            <button type="button" onClick={() => setAntworten([...antworten, ""])} className="self-start text-xs text-muted-foreground hover:text-foreground">+ weitere Antwort</button>
          )}
        </div>
        {fehlt && <p className="text-sm text-rose-600">Eine Frage und mindestens zwei Antworten, dann geht es los.</p>}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Umfrage starten</button>
          <button type="button" onClick={() => starten(frage || "Stimmst du zu?", ["Ja", "Nein", "Enthaltung"])}
            className="rounded-lg bg-muted px-3 py-2 text-sm hover:bg-muted/70">Schnell: Ja · Nein · Enthaltung</button>
        </div>
      </form>
    )
  }

  const zahlen = ergebnis(umfrage)
  const summe = zahlen.reduce((a, b) => a + b, 0)
  const meine = umfrage.stimmen[ich]?.wahl
  return (
    <div className="mx-auto flex h-full max-w-lg flex-col gap-3 overflow-y-auto p-4">
      <div className="flex items-start gap-2">
        <h3 className="flex-1 text-lg font-semibold leading-tight">{umfrage.frage}</h3>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${umfrage.offen ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>
          {umfrage.offen ? "läuft" : "beendet"}
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {umfrage.antworten.map((a, i) => {
          const anteil = summe ? Math.round((zahlen[i] / summe) * 100) : 0
          return (
            <li key={i}>
              <button type="button" disabled={!umfrage.offen} onClick={() => abstimmen(i)} aria-pressed={meine === i}
                className={`relative w-full overflow-hidden rounded-xl border px-3 py-2.5 text-left text-sm transition disabled:cursor-default ${meine === i ? "border-primary" : "border-border hover:bg-muted/60"}`}>
                <span className="absolute inset-y-0 left-0 bg-primary/15" style={{ width: `${anteil}%` }} aria-hidden="true" />
                <span className="relative flex items-center justify-between gap-2">
                  <span className="font-medium">{a}{meine === i ? " ✓" : ""}</span>
                  <span className="tabular-nums text-muted-foreground">{zahlen[i]} · {anteil} %</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-muted-foreground">{summe} {summe === 1 ? "Stimme" : "Stimmen"}{umfrage.offen ? ". Wer seine Meinung ändert, klickt einfach neu." : ""}</p>
      <div className="flex gap-2">
        {umfrage.offen
          ? <button type="button" onClick={umfrageBeenden} className="rounded-lg bg-muted px-3 py-2 text-sm hover:bg-muted/70">Umfrage beenden</button>
          : <button type="button" onClick={umfrageVerwerfen} className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Neue Umfrage</button>}
      </div>
    </div>
  )
}

// --- Kurzzeitwecker und Los ----------------------------------------------------

function mmss(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

export function WeckerAnzeige({ bis, jetzt, onAus }: { bis: number; jetzt: number; onAus: () => void }) {
  const rest = bis - jetzt
  return (
    <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums ${rest > 0 ? "bg-sky-500/20 text-sky-200" : "animate-pulse bg-amber-500/30 text-amber-100 motion-reduce:animate-none"}`}>
      <Timer className="h-3.5 w-3.5" />
      {rest > 0 ? mmss(rest) : "Die Zeit ist um"}
      <button type="button" onClick={onAus} aria-label="Kurzzeitwecker aus" className="rounded-full p-0.5 hover:bg-white/10"><X className="h-3 w-3" /></button>
    </span>
  )
}

/** Das Los steht acht Sekunden gross ueber der Buehne, bei allen. */
export function LosAnzeige({ los }: { los: { nr: number; name: string } | null | undefined }) {
  const [zeige, setZeige] = useState<{ nr: number; name: string } | null>(null)
  const gesehen = useRef(los?.nr ?? 0)
  useEffect(() => {
    if (!los || los.nr <= gesehen.current) return
    gesehen.current = los.nr
    setZeige(los)
    const t = setTimeout(() => setZeige(null), 8000)
    return () => clearTimeout(t)
  }, [los])
  if (!zeige) return null
  return (
    <div role="status" className="pointer-events-none absolute inset-x-0 top-16 z-40 flex justify-center px-4">
      <span className="rounded-2xl bg-amber-400 px-6 py-3 text-lg font-semibold text-slate-900 shadow-2xl">Das Los fällt auf {zeige.name}</span>
    </div>
  )
}

// --- Einstellungen des Raums ---------------------------------------------------

/** Die Stufen der Redezeit in Minuten (Timo, 30.09.2026). 0 heisst: keine. */
export const REDEZEIT_STUFEN = [0, 1, 2, 3, 5, 10, 15, 20, 30] as const
/** Stille nach der Klangschale, in Sekunden (Timo: 15 Sekunden sind zu kurz). */
export const STILLE_STUFEN = [15, 30, 60, 120] as const
/** Wie lange das Treffen dauert, in Minuten. 0 heisst: offen. */
export const SITZUNG_STUFEN = [0, 30, 60, 90, 120, 180] as const

const stilleText = (s: number) => (s < 60 ? `${s} Sek.` : `${s / 60} Min.`)
const dauerText = (m: number) => (m === 0 ? "offen" : m < 60 ? `${m} Min.` : m % 60 === 0 ? `${m / 60} Std.` : `${Math.floor(m / 60)},5 Std.`)

/**
 * Die Regeln des Raums, fuer alle gleich: Redezeit und was danach geschieht.
 * Wer den Stab haelt, sieht seine Restzeit; ist sie um, klingt ein Gong bei
 * allen, und der Stab wandert von selbst.
 */
export function Einstellungen({
  regeln, stilleVorgabe, onSpeichern, onZu,
}: {
  regeln: Regeln
  /** Die Stille, die ohne eigene Regel gilt (aus dem Prozess). */
  stilleVorgabe: number
  onSpeichern: (r: Regeln) => void
  onZu: () => void
}) {
  const [redezeit, setRedezeit] = useState(regeln.redezeit)
  const [danach, setDanach] = useState<NachDerRedezeit>(regeln.danach)
  const [stille, setStille] = useState<number>(regeln.stille ?? stilleVorgabe)
  const [dauer, setDauer] = useState<number>(regeln.sitzungsdauer ?? 0)
  return (
    <div role="dialog" aria-modal="true" aria-label="Einstellungen des Raums" className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onZu}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5 text-slate-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center">
          <h3 className="text-lg font-semibold">Einstellungen des Raums</h3>
          <button type="button" onClick={onZu} aria-label="Schließen" className="ml-auto rounded-lg p-1.5 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <p className="mb-4 text-sm text-slate-500">Diese Regeln gelten für alle im Raum.</p>

        <fieldset className="mb-5">
          <legend className="mb-2 text-sm font-semibold">Redezeit mit dem Redestab</legend>
          <div className="flex flex-wrap gap-1.5">
            {REDEZEIT_STUFEN.map((m) => (
              <button key={m} type="button" onClick={() => setRedezeit(m)} aria-pressed={redezeit === m}
                className={`rounded-lg px-3 py-1.5 text-sm ${redezeit === m ? "bg-sky-600 text-white" : "bg-slate-100 hover:bg-slate-200"}`}>
                {m === 0 ? "keine" : `${m} Min.`}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mb-5" disabled={redezeit === 0}>
          <legend className="mb-2 text-sm font-semibold">Ist die Zeit um, klingt der Gong, und dann …</legend>
          <label className="mb-1.5 flex items-center gap-2 text-sm">
            <input type="radio" name="danach" checked={danach === "weiter"} onChange={() => setDanach("weiter")} />
            geht der Stab an den Nächsten im Kreis
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="danach" checked={danach === "mitte"} onChange={() => setDanach("mitte")} />
            kehrt der Stab in die Mitte zurück, und wer mag, nimmt ihn
          </label>
        </fieldset>

        <fieldset className="mb-5">
          <legend className="mb-2 text-sm font-semibold">Stille nach der Klangschale</legend>
          <div className="flex flex-wrap gap-1.5">
            {STILLE_STUFEN.map((sek) => (
              <button key={sek} type="button" onClick={() => setStille(sek)} aria-pressed={stille === sek}
                className={`rounded-lg px-3 py-1.5 text-sm ${stille === sek ? "bg-sky-600 text-white" : "bg-slate-100 hover:bg-slate-200"}`}>
                {stilleText(sek)}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mb-6">
          <legend className="mb-2 text-sm font-semibold">Dauer des Treffens</legend>
          <div className="flex flex-wrap gap-1.5">
            {SITZUNG_STUFEN.map((m) => (
              <button key={m} type="button" onClick={() => setDauer(m)} aria-pressed={dauer === m}
                className={`rounded-lg px-3 py-1.5 text-sm ${dauer === m ? "bg-sky-600 text-white" : "bg-slate-100 hover:bg-slate-200"}`}>
                {dauerText(m)}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">Ist sie um, klingt der Gong: Zeit für die Abschlussrunde. Das Treffen läuft weiter.</p>
        </fieldset>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onZu} className="rounded-lg px-4 py-2 text-sm hover:bg-slate-100">Abbrechen</button>
          <button type="button" onClick={() => { onSpeichern({ redezeit, danach, stille, sitzungsdauer: dauer }); onZu() }} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500">Für alle übernehmen</button>
        </div>
      </div>
    </div>
  )
}

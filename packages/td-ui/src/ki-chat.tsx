// Das KI-Modul (DEFINITION 13.10, freigegeben von Timo am 03.10.2026), der Chat.
//
// Timo: *"So ähnlich wie GPT, nicht so mit so viel Schnickschnack, ganz
// normal in der Mitte ein Chat-Fenster, wo man reinsprechen kann, und dann
// arbeitet es. Man sieht, wie es arbeitet, und nachher steht das fertige
// ausgefüllte Profil."*
//
// Die Fläche kennt keinen Dienst: `senden` liefert die Ereignisse (Text,
// Schritte, Entwurf), `diktat` das Reinsprechen (13.9), `onEntwurf` öffnet
// Vorschau und Speichern (13.6/13.8). Eigener Einstieg `@trustdonation/ui/ki`.

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react"
import { ArrowUp, Check, Loader2, Mic, Sparkles, Square, Wand2 } from "lucide-react"
import type { KiEreignis, KiNachricht } from "@trustdonation/core"
import type { Diktat } from "./begleiter-gespraech.js"

interface Schritt { werkzeug: string; titel: string }
interface Eintrag {
  rolle: "mensch" | "ki"
  text: string
  schritte: Schritt[]
  entwurf: string | null
  fehler: string | null
  laeuft: boolean
}

export interface KiChatProps {
  senden: (verlauf: KiNachricht[], signal: AbortSignal) => AsyncIterable<KiEreignis>
  diktat: Diktat
  onEntwurf: (fragment: string) => void
  /** Ein Hinweis über dem Eingabefeld, etwa wenn das Zugangswort fehlt. */
  hinweis?: ReactNode
  /** Kann gerade nicht gesendet werden (etwa ohne Zugangswort)? */
  gesperrt?: boolean
}

const BEISPIELE = [
  "Wir sind ein Verein und wollen unseren Space vorstellen.",
  "Wir planen ein Projekt und suchen Unterstützung.",
  "Ich möchte das Profil unserer Stiftung anlegen.",
]

/** Etwas Markdown, wie es KI schreibt: **fett** und Listen mit „- “. */
function Formatiert({ text }: { text: string }) {
  const fett = (zeile: string) => zeile.split(/(\*\*[^*]+\*\*)/g).map((t, i) =>
    t.startsWith("**") && t.endsWith("**") && t.length > 4 ? <strong key={i}>{t.slice(2, -2)}</strong> : <Fragment key={i}>{t}</Fragment>)
  const bloecke: ReactNode[] = []
  let liste: string[] = []
  const listeZu = () => {
    if (liste.length) bloecke.push(<ul key={`l${bloecke.length}`} className="my-2 list-disc space-y-1 pl-5">{liste.map((l, i) => <li key={i}>{fett(l)}</li>)}</ul>)
    liste = []
  }
  for (const zeile of text.split("\n")) {
    const m = /^\s*[-*]\s+(.*)$/.exec(zeile)
    if (m) { liste.push(m[1]); continue }
    listeZu()
    if (zeile.trim()) bloecke.push(<p key={`p${bloecke.length}`} className="my-1.5">{fett(zeile)}</p>)
  }
  listeZu()
  return <>{bloecke}</>
}

function Arbeit({ schritte, laeuft }: { schritte: Schritt[]; laeuft: boolean }) {
  if (!schritte.length) return null
  return (
    <ul className="mb-2 flex flex-col gap-1" aria-label="Was die KI tut">
      {schritte.map((s, i) => {
        const aktiv = laeuft && i === schritte.length - 1
        return (
          <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
            {aktiv ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 text-emerald-600" />}
            {s.titel}
          </li>
        )
      })}
    </ul>
  )
}

export function KiChat({ senden, diktat, onEntwurf, hinweis, gesperrt = false }: KiChatProps) {
  const [eintraege, setEintraege] = useState<Eintrag[]>([])
  const [text, setText] = useState("")
  const laufend = useRef<AbortController | null>(null)
  const unten = useRef<HTMLDivElement>(null)
  const feld = useRef<HTMLTextAreaElement>(null)
  const arbeitet = eintraege.some((e) => e.laeuft)
  const hoert = diktat.zustand !== "aus"

  const { stoppen } = diktat
  useEffect(() => () => { stoppen(); laufend.current?.abort() }, [stoppen])
  useEffect(() => { unten.current?.scrollIntoView?.({ block: "end" }) }, [eintraege])
  useEffect(() => {
    const f = feld.current
    if (!f) return
    f.style.height = "auto"
    f.style.height = `${Math.min(f.scrollHeight, 220)}px`
  }, [text])

  const aendern = (i: number, f: (e: Eintrag) => Eintrag) => setEintraege((alt) => alt.map((e, j) => (j === i ? f(e) : e)))

  const abschicken = async (inhalt = text) => {
    const nachricht = inhalt.trim()
    if (!nachricht || arbeitet || gesperrt) return
    if (hoert) diktat.stoppen()
    const verlauf: KiNachricht[] = [...eintraege.filter((e) => e.text.trim()).map((e) => ({ rolle: e.rolle, text: e.text })), { rolle: "mensch", text: nachricht }]
    const index = eintraege.length + 1
    setEintraege((alt) => [...alt, { rolle: "mensch", text: nachricht, schritte: [], entwurf: null, fehler: null, laeuft: false }, { rolle: "ki", text: "", schritte: [], entwurf: null, fehler: null, laeuft: true }])
    setText("")
    const abbruch = new AbortController()
    laufend.current = abbruch
    try {
      for await (const e of senden(verlauf, abbruch.signal)) {
        if (e.typ === "text") aendern(index, (x) => ({ ...x, text: x.text + e.text }))
        else if (e.typ === "schritt") aendern(index, (x) => ({ ...x, schritte: [...x.schritte, { werkzeug: e.werkzeug, titel: e.titel }] }))
        else if (e.typ === "entwurf") aendern(index, (x) => ({ ...x, entwurf: e.fragment }))
        else if (e.typ === "fehler") aendern(index, (x) => ({ ...x, fehler: e.text }))
      }
    } catch (e) {
      if (!abbruch.signal.aborted) aendern(index, (x) => ({ ...x, fehler: e instanceof Error ? e.message : "Die KI ist gerade nicht erreichbar." }))
    } finally {
      aendern(index, (x) => ({ ...x, laeuft: false }))
      laufend.current = null
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
          {eintraege.length === 0 && (
            <div className="flex flex-col items-center gap-4 pt-[12vh] text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg"><Sparkles className="h-7 w-7" /></span>
              <h2 className="text-2xl font-semibold">Erzähl, wer ihr seid</h2>
              <p className="max-w-md text-sm text-muted-foreground">Sprich oder schreib einfach los. Ich frage nach, was fehlt, und baue euer Profil. Am Ende siehst du die Vorschau und speicherst selbst.</p>
              <div className="flex flex-wrap justify-center gap-2">
                {BEISPIELE.map((b) => (
                  <button key={b} type="button" disabled={gesperrt} onClick={() => setText(b)}
                    className="rounded-full bg-muted/60 px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50">{b}</button>
                ))}
              </div>
            </div>
          )}
          {eintraege.map((e, i) => e.rolle === "mensch" ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-wrap rounded-3xl bg-muted px-4 py-2.5 text-sm leading-relaxed">{e.text}</p>
            </div>
          ) : (
            <div key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white"><Sparkles className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1 text-sm leading-relaxed">
                <Arbeit schritte={e.schritte} laeuft={e.laeuft} />
                {e.text ? <Formatiert text={e.text} /> : e.laeuft && !e.schritte.length && <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Denkt nach …</p>}
                {e.entwurf && (
                  <div className="mt-3 flex flex-col gap-3 rounded-2xl bg-emerald-50/70 p-4 dark:bg-emerald-950/40 sm:flex-row sm:items-center">
                    <Wand2 className="h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300" />
                    <p className="flex-1 font-medium">Das Profil ist fertig.</p>
                    <button type="button" onClick={() => onEntwurf(e.entwurf!)}
                      className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800">
                      Vorschau ansehen und speichern
                    </button>
                  </div>
                )}
                {e.fehler && <p role="alert" className="mt-2 text-rose-700 dark:text-rose-300">{e.fehler}</p>}
              </div>
            </div>
          ))}
          <div ref={unten} />
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 pb-4">
        {hinweis}
        {(diktat.zustand === "hoert" && diktat.live) && <p className="mb-2 px-2 text-sm text-muted-foreground" aria-live="polite">{diktat.live}</p>}
        {diktat.fehler && <p role="alert" className="mb-2 px-2 text-sm text-rose-700 dark:text-rose-300">{diktat.fehler}</p>}
        <form onSubmit={(ev) => { ev.preventDefault(); void abschicken() }}
          className="flex items-end gap-2 rounded-3xl bg-card p-2 shadow-xl shadow-black/5 ring-1 ring-black/5 dark:shadow-black/30 dark:ring-white/10">
          <textarea ref={feld} value={text} onChange={(ev) => setText(ev.target.value)} rows={1} aria-label="Nachricht an die KI"
            onKeyDown={(ev) => { if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); void abschicken() } }}
            placeholder={hoert ? "Ich höre zu …" : "Erzähl, wer ihr seid, was ihr macht, was fehlt …"} disabled={gesperrt}
            className="max-h-56 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none disabled:opacity-60" />
          <button type="button" onClick={() => (hoert ? diktat.stoppen() : diktat.starten((t) => setText((alt) => (alt.trim() ? `${alt.trimEnd()} ${t}` : t))))}
            aria-label={hoert ? "Mikrofon aus" : "Reinsprechen"} aria-pressed={hoert} disabled={gesperrt}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-50 ${hoert ? "bg-rose-600 text-white" : "bg-muted hover:bg-muted/70"}`}>
            {diktat.zustand === "verbindet" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />}
          </button>
          {arbeitet ? (
            <button type="button" onClick={() => laufend.current?.abort()} aria-label="Anhalten"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background"><Square className="h-4 w-4" /></button>
          ) : (
            <button type="submit" aria-label="Senden" disabled={!text.trim() || gesperrt}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-40"><ArrowUp className="h-5 w-5" /></button>
          )}
        </form>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">Die KI entwirft, du speicherst. Gespeichert wird hier nichts vom Gespräch.</p>
      </div>
    </div>
  )
}

export default KiChat

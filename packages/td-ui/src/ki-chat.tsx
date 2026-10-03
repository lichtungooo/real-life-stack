// Das KI-Modul (DEFINITION 13.10, freigegeben von Timo am 03.10.2026), der Chat.
//
// Timo: *"Dass es wirklich genau so aussieht wie GPT, damit die Leute sich
// abgeholt fühlen, zu Hause fühlen."* Darum das vertraute Bild: leer eine
// Frage in der Mitte mit dem Eingabefeld darunter; danach der Verlauf, eigene
// Nachrichten als graue Blase rechts, die Antwort der KI ohne Blase über die
// ganze Breite, unten das runde Eingabefeld mit Mikrofon und schwarzem
// Senden-Knopf. Während sie arbeitet: „Denkt nach“, die Schritte aufklappbar.
//
// Die Fläche kennt keinen Dienst: `senden` liefert die Ereignisse (Text,
// Schritte, Entwurf), `diktat` das Reinsprechen (13.9), `onEntwurf` öffnet
// Vorschau und Speichern (13.6/13.8). Eigener Einstieg `@trustdonation/ui/ki`.

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react"
import { ArrowUp, Check, ChevronDown, Copy, FileCheck2, Loader2, Mic, Square } from "lucide-react"
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

/** Etwas Markdown, wie es KI schreibt: **fett**, Listen mit „- “ oder „1.“, Überschriften mit „#“. */
function Formatiert({ text }: { text: string }) {
  const fett = (zeile: string) => zeile.split(/(\*\*[^*]+\*\*)/g).map((t, i) =>
    t.startsWith("**") && t.endsWith("**") && t.length > 4 ? <strong key={i} className="font-semibold">{t.slice(2, -2)}</strong> : <Fragment key={i}>{t}</Fragment>)
  const bloecke: ReactNode[] = []
  let liste: { geordnet: boolean; punkte: string[] } | null = null
  const listeZu = () => {
    if (!liste) return
    const Tag = liste.geordnet ? "ol" : "ul"
    bloecke.push(<Tag key={`l${bloecke.length}`} className={`my-3 space-y-1.5 pl-6 ${liste.geordnet ? "list-decimal" : "list-disc"}`}>{liste.punkte.map((l, i) => <li key={i} className="pl-1">{fett(l)}</li>)}</Tag>)
    liste = null
  }
  for (const zeile of text.split("\n")) {
    const punkt = /^\s*[-*]\s+(.*)$/.exec(zeile)
    const zahl = /^\s*\d+[.)]\s+(.*)$/.exec(zeile)
    if (punkt || zahl) {
      const geordnet = Boolean(zahl)
      if (liste && liste.geordnet !== geordnet) listeZu()
      liste ??= { geordnet, punkte: [] }
      liste.punkte.push((punkt ?? zahl)![1])
      continue
    }
    listeZu()
    const ueber = /^\s*#{1,4}\s+(.*)$/.exec(zeile)
    if (ueber) bloecke.push(<p key={`h${bloecke.length}`} className="mb-1 mt-4 font-semibold">{fett(ueber[1])}</p>)
    else if (zeile.trim()) bloecke.push(<p key={`p${bloecke.length}`} className="my-2">{fett(zeile)}</p>)
  }
  listeZu()
  return <>{bloecke}</>
}

/** „Denkt nach“ mit schimmernder Schrift, wie man es von KI-Chats kennt. */
function DenktNach({ text = "Denkt nach" }: { text?: string }) {
  return (
    <span className="animate-pulse bg-gradient-to-r from-muted-foreground via-foreground to-muted-foreground bg-clip-text font-medium text-transparent">
      {text} …
    </span>
  )
}

function Arbeit({ schritte, laeuft }: { schritte: Schritt[]; laeuft: boolean }) {
  const [offen, setOffen] = useState(false)
  if (!schritte.length) return null
  const letzter = schritte[schritte.length - 1]
  return (
    <div className="mb-2">
      <button type="button" onClick={() => setOffen((x) => !x)} aria-expanded={offen}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        {laeuft ? <DenktNach text={letzter.titel} /> : <span>{schritte.length === 1 ? "Ein Arbeitsschritt" : `${schritte.length} Arbeitsschritte`}</span>}
        <ChevronDown className={`h-4 w-4 transition-transform ${offen ? "rotate-180" : ""}`} />
      </button>
      {offen && (
        <ul className="mt-2 flex flex-col gap-1.5 border-l-2 border-muted pl-4" aria-label="Was die KI tut">
          {schritte.map((s, i) => {
            const aktiv = laeuft && i === schritte.length - 1
            return (
              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                {aktiv ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                {s.titel}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function Kopieren({ text }: { text: string }) {
  const [kopiert, setKopiert] = useState(false)
  return (
    <button type="button" aria-label={kopiert ? "Kopiert" : "Antwort kopieren"} title="Kopieren"
      onClick={async () => { try { await navigator.clipboard.writeText(text); setKopiert(true); setTimeout(() => setKopiert(false), 2000) } catch { /* ohne Zwischenablage */ } }}
      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
      {kopiert ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
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
  const leer = eintraege.length === 0

  const { stoppen } = diktat
  useEffect(() => () => { stoppen(); laufend.current?.abort() }, [stoppen])
  useEffect(() => { unten.current?.scrollIntoView?.({ block: "end" }) }, [eintraege])
  useEffect(() => {
    const f = feld.current
    if (!f) return
    f.style.height = "auto"
    f.style.height = `${Math.min(f.scrollHeight, 240)}px`
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

  const eingabe = (
    <div className="w-full">
      {hinweis}
      {(diktat.zustand === "hoert" && diktat.live) && <p className="mb-2 px-4 text-sm text-muted-foreground" aria-live="polite">{diktat.live}</p>}
      {diktat.fehler && <p role="alert" className="mb-2 px-4 text-sm text-rose-700 dark:text-rose-300">{diktat.fehler}</p>}
      <form onSubmit={(ev) => { ev.preventDefault(); void abschicken() }}
        className="flex flex-col rounded-[28px] border border-black/10 bg-background px-3 pb-2.5 pt-3 shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-muted/40">
        <textarea ref={feld} value={text} onChange={(ev) => setText(ev.target.value)} rows={1} aria-label="Nachricht an die KI"
          onKeyDown={(ev) => { if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); void abschicken() } }}
          placeholder={hoert ? "Ich höre zu …" : "Frag oder erzähl einfach los"} disabled={gesperrt}
          className="max-h-60 min-h-[28px] w-full resize-none bg-transparent px-2 text-[15px] leading-7 outline-none placeholder:text-muted-foreground disabled:opacity-60" />
        <div className="mt-2 flex items-center justify-end gap-1.5">
          <button type="button" onClick={() => (hoert ? diktat.stoppen() : diktat.starten((t) => setText((alt) => (alt.trim() ? `${alt.trimEnd()} ${t}` : t))))}
            aria-label={hoert ? "Mikrofon aus" : "Reinsprechen"} aria-pressed={hoert} disabled={gesperrt} title={hoert ? "Mikrofon aus" : "Reinsprechen"}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors disabled:opacity-40 ${hoert ? "bg-rose-600 text-white" : "text-foreground hover:bg-muted"}`}>
            {diktat.zustand === "verbindet" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />}
          </button>
          {arbeitet ? (
            <button type="button" onClick={() => laufend.current?.abort()} aria-label="Anhalten" title="Anhalten"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background"><Square className="h-3.5 w-3.5 fill-current" /></button>
          ) : (
            <button type="submit" aria-label="Senden" title="Senden" disabled={!text.trim() || gesperrt}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background transition-opacity disabled:opacity-25"><ArrowUp className="h-5 w-5" /></button>
          )}
        </div>
      </form>
    </div>
  )

  if (leer) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center overflow-y-auto px-4">
        <div className="flex w-full max-w-3xl flex-col items-center gap-8 pb-[8vh]">
          <h2 className="text-center text-[28px] font-medium tracking-tight sm:text-[32px]">Woran arbeitet ihr gerade?</h2>
          {eingabe}
          <div className="flex flex-wrap justify-center gap-2">
            {BEISPIELE.map((b) => (
              <button key={b} type="button" disabled={gesperrt} onClick={() => { setText(b); feld.current?.focus() }}
                className="rounded-full border border-black/10 px-3.5 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 dark:border-white/10">{b}</button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pb-8 pt-6">
          {eintraege.map((e, i) => e.rolle === "mensch" ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[80%] whitespace-pre-wrap rounded-3xl bg-muted px-5 py-2.5 text-[15px] leading-7">{e.text}</p>
            </div>
          ) : (
            <div key={i} className="text-[15px] leading-7">
              <Arbeit schritte={e.schritte} laeuft={e.laeuft} />
              {e.text ? <Formatiert text={e.text} /> : e.laeuft && !e.schritte.length && <DenktNach />}
              {e.entwurf && (
                <div className="my-4 flex flex-col gap-3 rounded-2xl border border-black/10 p-4 dark:border-white/10 sm:flex-row sm:items-center">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white"><FileCheck2 className="h-5 w-5" /></span>
                  <div className="flex-1">
                    <p className="font-semibold">Das Profil ist fertig.</p>
                    <p className="text-sm text-muted-foreground">Sieh es dir an und speichere es in deinem Space.</p>
                  </div>
                  <button type="button" onClick={() => onEntwurf(e.entwurf!)}
                    className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90">
                    Vorschau ansehen und speichern
                  </button>
                </div>
              )}
              {e.fehler && <p role="alert" className="my-2 text-rose-700 dark:text-rose-300">{e.fehler}</p>}
              {!e.laeuft && e.text && <div className="-ml-1.5 mt-1 flex"><Kopieren text={e.text} /></div>}
            </div>
          ))}
          <div ref={unten} />
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl px-4 pb-3">
        {eingabe}
        <p className="mt-2 text-center text-xs text-muted-foreground">Die KI kann Fehler machen. Du prüfst und speicherst selbst.</p>
      </div>
    </div>
  )
}

export default KiChat

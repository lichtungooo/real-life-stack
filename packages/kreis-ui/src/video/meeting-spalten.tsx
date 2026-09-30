// Tagesordnung und Ergebnisse, zwei Spalten der linken Leiste (Spec video,
// "Tagesordnung, Aufgaben und Beschluesse"). Timo, 30.09.2026: Aus dem
// Meeting heraus eine Aufgabe ins Kanban der Gruppe oder einen Beschluss in
// den Feed, dazu eine Tagesordnung mit Zeiten. Das kann nur ein Meeting im
// Real Life Stack.

import { useState } from "react"
import { ArrowDown, ArrowUp, Check, CheckSquare, Gavel, Play, Square, Trash2 } from "lucide-react"
import {
  punktAbhaken, punktAufrufen, punktDazu, punktVerschieben, punktWeg, tagesordnungVon,
} from "@kreis/core"
import type { KreisKontext } from "../raum-kontext"
import type { Ergebnis } from "../use-neben"

/** Das Ergebnis in der Gruppe ablegen (Aufgabe als Item `task`, Beschluss als `post`). Kommt von der App. */
export type ErgebnisAblegen = (e: Ergebnis) => Promise<void>

const mmss = (ms: number) => {
  const neg = ms < 0
  const s = Math.floor(Math.abs(ms) / 1000)
  return `${neg ? "+" : ""}${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

const kurzId = () => Math.random().toString(36).slice(2, 10)

export function TagesordnungSpalte({ kreis }: { kreis: KreisKontext }) {
  const { sitzung, handle, ich, jetzt } = kreis
  const wer = ich ?? ""
  const t = tagesordnungVon(sitzung)
  const [titel, setTitel] = useState("")
  const [minuten, setMinuten] = useState(10)
  const geplant = t.punkte.reduce((summe, p) => summe + p.minuten, 0)

  return (
    <div className="flex h-full flex-col">
      <ol className="flex-1 space-y-1.5 overflow-y-auto px-3 pb-3" aria-label="Punkte der Tagesordnung">
        {t.punkte.length === 0 && <li className="py-8 text-center text-xs italic text-slate-500">Noch keine Punkte.</li>}
        {t.punkte.map((p, i) => {
          const aktiv = t.aktiv === p.id
          const rest = aktiv && p.minuten && t.seit !== null ? t.seit + p.minuten * 60_000 - jetzt : null
          return (
            <li key={p.id} className={`group rounded-xl px-3 py-2 ${aktiv ? "bg-sky-600/25 ring-1 ring-sky-400/60" : "bg-white/5"}`}>
              <div className="flex items-start gap-2">
                <button type="button" aria-label={p.erledigt ? `${p.titel}: wieder offen` : `${p.titel}: erledigt`}
                  onClick={() => handle((s) => punktAbhaken(s, p.id, !p.erledigt, wer))} className="mt-0.5 text-slate-300 hover:text-white">
                  {p.erledigt ? <CheckSquare className="h-4 w-4 text-emerald-400" /> : <Square className="h-4 w-4" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${p.erledigt ? "text-slate-500 line-through" : "text-slate-100"}`}>{i + 1}. {p.titel}</p>
                  <p className="text-[11px] tabular-nums text-slate-400">
                    {p.minuten ? `${p.minuten} Min.` : "ohne Zeit"}
                    {rest !== null && <span className={rest < 0 ? " text-amber-300" : " text-sky-300"}> · {rest < 0 ? "überzogen " : "noch "}{mmss(rest)}</span>}
                  </p>
                </div>
                {!aktiv && (
                  <button type="button" aria-label={`${p.titel} aufrufen`} title="Jetzt dran"
                    onClick={() => handle((s, j) => punktAufrufen(s, p.id, wer, j))} className="rounded p-1 text-slate-300 hover:bg-white/10 hover:text-white">
                    <Play className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="mt-1 hidden gap-1 group-hover:flex group-focus-within:flex">
                <button type="button" aria-label="Nach oben" onClick={() => handle((s) => punktVerschieben(s, p.id, -1, wer))} className="rounded p-1 text-slate-400 hover:bg-white/10"><ArrowUp className="h-3 w-3" /></button>
                <button type="button" aria-label="Nach unten" onClick={() => handle((s) => punktVerschieben(s, p.id, 1, wer))} className="rounded p-1 text-slate-400 hover:bg-white/10"><ArrowDown className="h-3 w-3" /></button>
                <button type="button" aria-label={`${p.titel} entfernen`} onClick={() => handle((s) => punktWeg(s, p.id, wer))} className="ml-auto rounded p-1 text-slate-400 hover:bg-white/10 hover:text-rose-300"><Trash2 className="h-3 w-3" /></button>
              </div>
            </li>
          )
        })}
      </ol>
      {t.aktiv && (
        <button type="button" onClick={() => handle((s, j) => punktAufrufen(s, null, wer, j))}
          className="mx-3 mb-2 flex items-center justify-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20">
          <Check className="h-3.5 w-3.5" /> Punkt abschließen
        </button>
      )}
      <form className="space-y-2 border-t border-white/10 p-3"
        onSubmit={(e) => { e.preventDefault(); handle((s) => punktDazu(s, titel, minuten, wer, kurzId())); setTitel("") }}>
        <input value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="Neuer Punkt" aria-label="Neuer Punkt"
          className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-sky-500" />
        <div className="flex items-center gap-2">
          <select value={minuten} onChange={(e) => setMinuten(Number(e.target.value))} aria-label="Zeit für den Punkt"
            className="rounded-lg bg-white/10 px-2 py-1.5 text-xs text-white">
            {[0, 5, 10, 15, 20, 30, 45, 60].map((m) => <option key={m} value={m} className="text-slate-900">{m ? `${m} Min.` : "ohne Zeit"}</option>)}
          </select>
          <button type="submit" disabled={!titel.trim()} className="ml-auto rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium hover:bg-sky-500 disabled:opacity-40">Dazu</button>
        </div>
        {geplant > 0 && <p className="text-[11px] text-slate-500">Geplant: {geplant} Min.</p>}
      </form>
    </div>
  )
}

export function ErgebnisseSpalte({ kreis, ablegen }: { kreis: KreisKontext; ablegen?: ErgebnisAblegen }) {
  const { neben, teilnehmer, ich } = kreis
  const meinName = teilnehmer.find((t) => t.id === ich)?.name ?? "Jemand"
  const [art, setArt] = useState<Ergebnis["art"]>("aufgabe")
  const [text, setText] = useState("")
  const [wer, setWer] = useState("")
  const [bis, setBis] = useState("")
  const [status, setStatus] = useState<Record<string, "liegt" | "fehler">>({})

  const festhalten = async () => {
    if (!text.trim()) return
    const e: Ergebnis = {
      id: kurzId(), art, text: text.trim().slice(0, 500), von: meinName, wann: Date.now(),
      ...(art === "aufgabe" && wer.trim() ? { wer: wer.trim() } : {}),
      ...(art === "aufgabe" && bis ? { bis } : {}),
    }
    neben.ergebnisDazu(e)
    setText(""); setWer(""); setBis("")
    // Nur wer festhaelt, legt ab: So entsteht jedes Item genau einmal.
    if (!ablegen) return
    try { await ablegen(e); setStatus((s) => ({ ...s, [e.id]: "liegt" })) } catch { setStatus((s) => ({ ...s, [e.id]: "fehler" })) }
  }

  return (
    <div className="flex h-full flex-col">
      <ul className="flex-1 space-y-1.5 overflow-y-auto px-3 pb-3" aria-label="Ergebnisse">
        {neben.ergebnisse.length === 0 && <li className="py-8 text-center text-xs italic text-slate-500">Noch nichts festgehalten.</li>}
        {neben.ergebnisse.map((e) => (
          <li key={e.id} className="rounded-xl bg-white/5 px-3 py-2">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {e.art === "aufgabe" ? <CheckSquare className="h-3.5 w-3.5 text-sky-300" /> : <Gavel className="h-3.5 w-3.5 text-amber-300" />}
              {e.art === "aufgabe" ? "Aufgabe" : "Beschluss"}
            </p>
            <p className="mt-0.5 text-sm text-slate-100">{e.text}</p>
            {(e.wer || e.bis) && <p className="text-[11px] text-slate-400">{e.wer ? `übernimmt ${e.wer}` : ""}{e.wer && e.bis ? " · " : ""}{e.bis ? `bis ${new Date(e.bis).toLocaleDateString("de-DE")}` : ""}</p>}
            <p className="text-[10px] text-slate-500">
              festgehalten von {e.von}
              {status[e.id] === "liegt" && (e.art === "aufgabe" ? " · liegt als Aufgabe in der Gruppe" : " · liegt im Feed der Gruppe")}
              {status[e.id] === "fehler" && " · konnte nicht in der Gruppe abgelegt werden"}
            </p>
          </li>
        ))}
      </ul>
      <form className="space-y-2 border-t border-white/10 p-3" onSubmit={(ev) => { ev.preventDefault(); void festhalten() }}>
        <div className="flex gap-1 rounded-lg bg-white/5 p-0.5" role="radiogroup" aria-label="Art">
          {(["aufgabe", "beschluss"] as const).map((a) => (
            <button key={a} type="button" role="radio" aria-checked={art === a} onClick={() => setArt(a)}
              className={`flex-1 rounded-md px-2 py-1 text-xs ${art === a ? "bg-sky-600 font-medium" : "hover:bg-white/10"}`}>
              {a === "aufgabe" ? "Aufgabe" : "Beschluss"}
            </button>
          ))}
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} aria-label="Was festhalten"
          placeholder={art === "aufgabe" ? "Was ist zu tun?" : "Was haben wir beschlossen?"}
          className="w-full resize-none rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-sky-500" />
        {art === "aufgabe" && (
          <div className="flex gap-2">
            <input value={wer} onChange={(e) => setWer(e.target.value)} list="kreis-namen" placeholder="Wer?" aria-label="Wer übernimmt"
              className="min-w-0 flex-1 rounded-lg bg-white/10 px-2 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none" />
            <datalist id="kreis-namen">{teilnehmer.map((t) => <option key={t.id} value={t.name} />)}</datalist>
            <input type="date" value={bis} onChange={(e) => setBis(e.target.value)} aria-label="Bis wann"
              className="rounded-lg bg-white/10 px-2 py-1.5 text-xs text-white" />
          </div>
        )}
        <button type="submit" disabled={!text.trim()} className="w-full rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium hover:bg-sky-500 disabled:opacity-40">
          Festhalten{ablegen ? (art === "aufgabe" ? " und ins Kanban" : " und in den Feed") : ""}
        </button>
      </form>
    </div>
  )
}

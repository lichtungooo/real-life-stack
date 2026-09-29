// Die linke Seite der Konferenz: Menschen mit Namen, Chat, Protokoll.

import { useCallback, useEffect, useRef, useState } from "react"
import { AlertTriangle, CircleDot, Hand, MicOff, MonitorUp, Save, Send, Trash2 } from "lucide-react"
import type { KreisTeilnehmer } from "@kreis/core"
import type { KreisKontext } from "../raum-kontext"

export type ProtokollSpeichern = (text: string, teilnehmer: readonly string[]) => Promise<void> | void

export function Menschen({ teilnehmer, haende, stab, medien }: { teilnehmer: readonly KreisTeilnehmer[]; haende: ReadonlySet<string>; stab: string | null; medien: boolean }) {
  return (
    <ul className="h-full space-y-0.5 overflow-y-auto px-2 pb-3">
      {teilnehmer.map((p) => (
        <li key={p.id} className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-white/5">
          <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{p.name}{p.ichSelbst && <span className="text-slate-500"> (ich)</span>}</span>
          {stab === p.id && <CircleDot className="h-3.5 w-3.5 text-amber-400" aria-label="hält den Stab" />}
          {haende.has(p.id) && <Hand className="h-3.5 w-3.5 text-amber-400" aria-label="Hand oben" />}
          {p.teiltBildschirm && <MonitorUp className="h-3.5 w-3.5 text-sky-400" aria-label="teilt den Bildschirm" />}
          {p.spricht && <span className="h-2 w-2 rounded-full bg-emerald-400" aria-label="spricht" />}
          {medien && !p.mikroAn && <MicOff className="h-3.5 w-3.5 text-rose-400" aria-label="stumm" />}
        </li>
      ))}
    </ul>
  )
}

const uhrzeit = (wann: number) => new Date(wann).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })

export function Chat({ kreis }: { kreis: KreisKontext }) {
  const [entwurf, setEntwurf] = useState("")
  const kasten = useRef<HTMLDivElement | null>(null)
  useEffect(() => { const k = kasten.current; if (k) k.scrollTop = k.scrollHeight }, [kreis.neben.chat.length])
  const senden = useCallback(() => { kreis.neben.chatSenden(entwurf); setEntwurf("") }, [kreis.neben, entwurf])
  return (
    <div className="flex h-full flex-col">
      <div ref={kasten} className="flex-1 space-y-3 overflow-y-auto px-4 pb-3">
        {kreis.neben.chat.length === 0 ? (
          <p className="py-10 text-center text-xs italic text-slate-500">Noch nichts geschrieben.</p>
        ) : kreis.neben.chat.map((z) => (
          <div key={z.id}>
            <div className="flex items-baseline gap-2">
              <span className="text-[11px] font-semibold text-sky-400">{z.name}</span>
              <span className="text-[10px] text-slate-500">{uhrzeit(z.wann)}</span>
            </div>
            <p className="mt-0.5 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-slate-200">{z.text}</p>
          </div>
        ))}
      </div>
      <div className="flex items-end gap-2 p-3">
        <textarea
          id="video-chat"
          value={entwurf}
          onChange={(e) => setEntwurf(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); senden() } }}
          placeholder="Schreiben, Enter schickt"
          aria-label="Nachricht"
          rows={1}
          className="max-h-28 min-h-9 flex-1 resize-none rounded-xl bg-white/10 px-3 py-2 text-[13px] text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
        <button type="button" onClick={senden} disabled={!entwurf.trim()} aria-label="Senden" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-30">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function Protokoll({ kreis, speichern }: { kreis: KreisKontext; speichern?: ProtokollSpeichern }) {
  const n = kreis.neben
  const [gespeichert, setGespeichert] = useState(false)
  return (
    <div className="flex h-full flex-col">
      {!n.protokollLaeuft && n.protokoll.length === 0 && (
        <p className="mx-3 mb-2 rounded-xl bg-amber-500/15 p-3 text-[11px] leading-relaxed text-amber-200">
          <AlertTriangle className="mb-0.5 mr-1 inline h-3 w-3" />
          Jeder schreibt sein eigenes Mikrofon mit, darum stimmt die Zuordnung von selbst. Die Spracherkennung läuft dabei über den Browser-Hersteller. Für einen Kreis trägt das. Für Gesundheitsdaten nicht, dort greift Art. 9 DSGVO.
        </p>
      )}
      {n.protokollFehler && <p className="mx-3 mb-2 rounded-xl bg-rose-500/15 p-2.5 text-[11px] text-rose-300">{n.protokollFehler}</p>}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-3">
        {n.protokoll.length === 0 ? (
          <p className="py-10 text-center text-xs italic text-slate-500">{n.protokollLaeuft ? "Hört zu." : "Noch nichts gesagt."}</p>
        ) : n.protokoll.map((z) => (
          <div key={z.id} className={z.vorlaeufig ? "opacity-45" : ""}>
            <div className="flex items-baseline gap-2">
              <span className="text-[11px] font-semibold text-emerald-400">{z.name}</span>
              <span className="text-[10px] text-slate-500">{uhrzeit(z.wann)}</span>
            </div>
            <p className="mt-0.5 text-[13px] leading-relaxed text-slate-200">{z.text}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 p-3">
        <button type="button" onClick={() => (n.protokollLaeuft ? n.protokollHalten() : n.protokollStarten())}
          className={`flex-1 rounded-xl px-3 py-2 text-xs font-medium ${n.protokollLaeuft ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-slate-200 hover:bg-white/20"}`}>
          {n.protokollLaeuft ? "läuft mit, anhalten" : "mitlaufen lassen"}
        </button>
        {n.protokoll.length > 0 && speichern && (
          <button type="button" title="Als Beitrag im Space ablegen" aria-label="Protokoll speichern"
            onClick={async () => { await speichern(n.protokollAlsText(), kreis.teilnehmer.map((t) => t.name)); setGespeichert(true); setTimeout(() => setGespeichert(false), 2500) }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white hover:bg-sky-700">
            <Save className="h-4 w-4" />
          </button>
        )}
        {n.protokoll.length > 0 && (
          <button type="button" onClick={n.protokollLeeren} title="Protokoll leeren" aria-label="Protokoll leeren" className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-white/10 hover:text-white">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      {gespeichert && <p className="px-4 pb-3 text-center text-[11px] text-emerald-400">Liegt im Space.</p>}
    </div>
  )
}

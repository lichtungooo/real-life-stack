// Die linke Seite der Konferenz: Menschen mit Namen, Chat, Protokoll.

import { dauerText, moderationVon, redezeiten } from "@kreis/core"
import { useCallback, useEffect, useRef, useState } from "react"
import { CircleDot, Download, Hand, MicOff, MonitorUp, Save, ScrollText, Send, Trash2, Users } from "lucide-react"
import type { KreisTeilnehmer } from "@kreis/core"
import type { KreisKontext } from "../raum-kontext"

export type ProtokollSpeichern = (text: string, teilnehmer: readonly string[]) => Promise<void> | void

export function Menschen({ teilnehmer, haende, stab, medien, mitschreibende }: { teilnehmer: readonly KreisTeilnehmer[]; haende: ReadonlySet<string>; stab: string | null; medien: boolean; mitschreibende?: ReadonlySet<string> }) {
  return (
    <ul className="h-full space-y-0.5 overflow-y-auto px-2 pb-3">
      {teilnehmer.map((p) => (
        <li key={p.id} className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-white/5">
          <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{p.name}{p.ichSelbst && <span className="text-slate-500"> (ich)</span>}</span>
          {stab === p.id && <CircleDot className="h-3.5 w-3.5 text-amber-400" aria-label="hält den Stab" />}
          {haende.has(p.id) && <Hand className="h-3.5 w-3.5 text-amber-400" aria-label="Hand oben" />}
          {p.teiltBildschirm && <MonitorUp className="h-3.5 w-3.5 text-sky-400" aria-label="teilt den Bildschirm" />}
          {mitschreibende?.has(p.id) && <span title="wird mitgeschrieben"><ScrollText className="h-3.5 w-3.5 text-emerald-400" aria-label="wird mitgeschrieben" /></span>}
          {p.spricht && <span className="h-2 w-2 rounded-full bg-emerald-400" aria-label="spricht" />}
          {medien && !p.mikroAn && <MicOff className="h-3.5 w-3.5 text-rose-400" aria-label="stumm" />}
        </li>
      ))}
    </ul>
  )
}

const uhrzeit = (wann: number) => new Date(wann).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })

export function Chat({ kreis }: { kreis: KreisKontext }) {
  // Moderation: "Rechte der Zuschauenden einschraenken" schliesst den Chat.
  const chatOffen = moderationVon(kreis.sitzung).chat
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
          placeholder={chatOffen ? "Schreiben, Enter schickt" : "Der Chat ist gerade geschlossen."}
          disabled={!chatOffen}
          aria-label="Nachricht"
          rows={1}
          className="max-h-28 min-h-9 flex-1 resize-none rounded-xl bg-white/10 px-3 py-2 text-[13px] text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
        <button type="button" onClick={senden} disabled={!chatOffen || !entwurf.trim()} aria-label="Senden" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-30">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

const uhrzeitGenau = (wann: number) => new Date(wann).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })

/**
 * Das Protokoll (Spec video, "Mitschrift"): jede Zeile mit Name, Uhrzeit und
 * Dauer, darunter die Redezeit je Mensch. Ablegen als Beitrag im Space oder
 * als Datei (.md).
 */
export function Protokoll({ kreis, speichern }: { kreis: KreisKontext; speichern?: ProtokollSpeichern }) {
  const n = kreis.neben
  const [gespeichert, setGespeichert] = useState(false)
  const [redezeitOffen, setRedezeitOffen] = useState(false)
  const kasten = useRef<HTMLDivElement | null>(null)
  useEffect(() => { const k = kasten.current; if (k) k.scrollTop = k.scrollHeight }, [n.protokoll.length])
  const raum = kreis.raumTitel ?? kreis.raumName ?? "Konferenz"
  const fest = n.protokoll.filter((z) => !z.vorlaeufig)
  const rz = redezeiten(n.protokoll)
  const andere = kreis.teilnehmer.filter((t) => !t.ichSelbst)
  const ohneMitschrift = andere.filter((t) => !n.mitschreibende.has(t.id))

  const herunterladen = () => {
    const md = n.protokollAlsMarkdown(raum)
    const url = URL.createObjectURL(new Blob([md], { type: "text/markdown;charset=utf-8" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `Protokoll ${raum.replace(/[^\p{L}\p{N} _-]+/gu, "").trim() || "Konferenz"} ${new Date().toLocaleDateString("de-DE")}.md`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="flex h-full flex-col">
      {!n.protokollLaeuft && n.protokoll.length === 0 && (
        <p className="mx-3 mb-2 rounded-xl bg-emerald-500/10 p-3 text-[11px] leading-relaxed text-emerald-100">
          <ScrollText className="mb-0.5 mr-1 inline h-3 w-3" />
          Jeder schreibt nur sein eigenes Mikrofon mit, darum steht immer der richtige Name dabei, mit Uhrzeit und Dauer. Erkannt wird auf unserem eigenen Server mit freier Software; der Ton bleibt nirgends liegen. Mitgeschrieben wird nur, wer es selbst einschaltet.
        </p>
      )}
      {n.protokollFehler && <p className="mx-3 mb-2 rounded-xl bg-rose-500/15 p-2.5 text-[11px] text-rose-300">{n.protokollFehler}</p>}
      {n.mitschreibende.size > 0 && (
        <p className="mx-3 mb-2 text-[11px] text-slate-400">
          Mitgeschrieben: {kreis.teilnehmer.filter((t) => n.mitschreibende.has(t.id)).map((t) => t.name).join(", ")}
        </p>
      )}
      <div ref={kasten} className="flex-1 space-y-3 overflow-y-auto px-4 pb-3">
        {n.protokoll.length === 0 ? (
          <p className="py-10 text-center text-xs italic text-slate-500">{n.protokollLaeuft ? "Hört zu." : "Noch nichts gesagt."}</p>
        ) : n.protokoll.map((z) => (
          <div key={z.id} className={z.vorlaeufig ? "opacity-45" : ""}>
            <div className="flex items-baseline gap-2">
              <span className="text-[11px] font-semibold text-emerald-400">{z.name}</span>
              <span className="text-[10px] text-slate-500">{uhrzeitGenau(z.wann)}</span>
              {z.bis && z.bis > z.wann && <span className="text-[10px] text-slate-500">· {dauerText(z.bis - z.wann)}</span>}
            </div>
            <p className="mt-0.5 text-[13px] leading-relaxed text-slate-200">{z.text}</p>
          </div>
        ))}
      </div>
      {rz.length > 0 && (
        <div className="mx-3 mb-1 rounded-xl bg-white/5">
          <button type="button" onClick={() => setRedezeitOffen(!redezeitOffen)} aria-expanded={redezeitOffen}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Redezeit <span className="ml-auto normal-case tracking-normal text-slate-500">{fest.length} Beiträge</span>
          </button>
          {redezeitOffen && (
            <ul className="space-y-1.5 px-3 pb-3" aria-label="Redezeit">
              {rz.map((r) => (
                <li key={r.name} className="text-[12px] text-slate-200">
                  <div className="flex items-baseline gap-2">
                    <span className="min-w-0 flex-1 truncate">{r.name}</span>
                    <span className="text-slate-400">{r.beitraege} ×</span>
                    <span className="w-12 text-right tabular-nums">{dauerText(r.ms)}</span>
                  </div>
                  <div className="mt-1 h-1 rounded-full bg-white/10"><div className="h-1 rounded-full bg-emerald-400" style={{ width: `${Math.round(r.anteil * 100)}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {n.protokollLaeuft && ohneMitschrift.length > 0 && (
        <button type="button" onClick={n.mitschriftErbitten}
          className="mx-3 mt-1 flex items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-[11px] text-slate-300 hover:bg-white/10">
          <Users className="h-3.5 w-3.5" /> Alle bitten, sich mitschreiben zu lassen
        </button>
      )}
      <div className="flex items-center gap-2 p-3">
        <button type="button" onClick={() => (n.protokollLaeuft ? n.protokollHalten() : n.protokollStarten())}
          className={`flex-1 rounded-xl px-3 py-2 text-xs font-medium ${n.protokollLaeuft ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-slate-200 hover:bg-white/20"}`}>
          {n.protokollLaeuft ? "Ich werde mitgeschrieben, anhalten" : "Mich mitschreiben lassen"}
        </button>
        {fest.length > 0 && speichern && (
          <button type="button" title="Als Beitrag im Space ablegen" aria-label="Protokoll speichern"
            onClick={async () => {
              // Der Beitrag traegt den Titel selbst; die Ueberschrift der Datei faellt weg.
              await speichern(n.protokollAlsMarkdown(raum).replace(/^# .*\n+/, ""), kreis.teilnehmer.map((t) => t.name))
              setGespeichert(true); setTimeout(() => setGespeichert(false), 2500)
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white hover:bg-sky-700">
            <Save className="h-4 w-4" />
          </button>
        )}
        {fest.length > 0 && (
          <button type="button" onClick={herunterladen} title="Als Datei herunterladen (.md)" aria-label="Protokoll herunterladen"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-300 hover:bg-white/10 hover:text-white">
            <Download className="h-4 w-4" />
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

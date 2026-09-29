// Die Konferenz als Flaeche, ohne das Toolkit (Spec: docs/spec/modules/video.md).
//
// Kopfzeile mit der Kreis-Leiste (Prozess, Schritt, Redestab, Klangschale),
// Buehne, Seitenleiste (Menschen, Chat, Protokoll, Module) und Steuerleiste
// unten im Muster, das Menschen aus Zoom kennen. Andere Module kommen von
// aussen herein (`module`, `modulZeigen`): Diese Flaeche kennt keines beim Namen.

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import {
  AlertTriangle, Bell, Blocks, CircleDot, FileText, Hand, LayoutGrid, LogOut, MessageSquare,
  Mic, MicOff, MonitorUp, Save, Send, Smile, Trash2, User, Users, Video, VideoOff, X,
} from "lucide-react"
import { aktuellerSchritt, schaleSchlagen, stilleLaeuft, type KreisTeilnehmer } from "@kreis/core"
import { useKreisVerbindung, type KreisKontext } from "../raum-kontext"
import { AndererRaum, OhneRaum, Vorraum } from "../kreis-raum-flaeche"
import { ZEICHEN, spracherkennungVorhanden, type ZeichenArt } from "../use-neben"
import { VideoBuehne, type Ansicht } from "./video-buehne"

type Blatt = "menschen" | "chat" | "protokoll" | "module"

export interface ModulWahl { id: string; label: string }

export interface VideoRaumFlaecheProps {
  raumName: string
  vorschlagName?: string
  /** Die Module des Space, die sich in die Konferenz holen lassen. */
  module?: readonly ModulWahl[]
  /** Zeigt ein Modul in der Seitenleiste. Kommt von der App (Antons ModuleOutlet). */
  modulZeigen?: (id: string) => ReactNode
  /** Weg in den Kreis, ohne die Verbindung zu trennen. */
  zumKreis?: () => void
  /** Das Protokoll als Item ablegen. Fehlt es, gibt es keinen Knopf dafuer. */
  protokollSpeichern?: (text: string, teilnehmer: readonly string[]) => Promise<void> | void
}

const STILLE_OHNE_PROZESS = 20

function dauer(seit: number | null, jetzt: number): string {
  if (!seit) return "0:00"
  const s = Math.max(0, Math.floor((jetzt - seit) / 1000))
  const std = Math.floor(s / 3600), min = Math.floor((s % 3600) / 60), sek = s % 60
  return std > 0 ? `${std}:${String(min).padStart(2, "0")}:${String(sek).padStart(2, "0")}` : `${min}:${String(sek).padStart(2, "0")}`
}

function Knopf({ an, warnung, titel, beschriftung, onClick, children, zahl }: {
  an?: boolean; warnung?: boolean; titel: string; beschriftung: string; onClick: () => void; children: ReactNode; zahl?: number
}) {
  const grund = warnung
    ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
    : an ? "bg-white/15 text-white hover:bg-white/25" : "text-slate-300 hover:bg-white/10 hover:text-white"
  return (
    <button type="button" onClick={onClick} title={titel} aria-pressed={an} className={`relative flex min-w-[56px] flex-col items-center gap-1 rounded-xl px-2.5 py-2 transition ${grund}`}>
      {children}
      <span className="text-[10px] font-medium leading-none">{beschriftung}</span>
      {zahl !== undefined && zahl > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[9px] font-bold text-white">{zahl > 99 ? "99" : zahl}</span>
      )}
    </button>
  )
}

export function VideoRaumFlaeche(props: VideoRaumFlaecheProps) {
  const kreis = useKreisVerbindung()
  if (!kreis) return <OhneRaum />
  if (kreis.zustand === "drin" && kreis.raumName !== props.raumName) {
    return <AndererRaum kreis={kreis} hier={props.raumName} vorschlagName={props.vorschlagName} />
  }
  if (kreis.zustand !== "drin") {
    return (
      <Vorraum
        kreis={kreis}
        raumName={props.raumName}
        vorschlagName={props.vorschlagName}
        titel="Konferenz"
        einleitung="Bild, Ton und Bildschirm für alle im Space. Holt euch andere Module dazu, den Kreis mit dem Redestab, das Kanban, die Karte."
        knopf="Der Konferenz beitreten"
      />
    )
  }
  return <InDerKonferenz kreis={kreis} {...props} />
}

function InDerKonferenz({ kreis, raumName, module = [], modulZeigen, zumKreis, protokollSpeichern }: VideoRaumFlaecheProps & { kreis: KreisKontext }) {
  const { raum, teilnehmer, ich, sitzung, prozess, jetzt, handle, neben } = kreis
  const [ansicht, setAnsicht] = useState<Ansicht>("galerie")
  const [blatt, setBlatt] = useState<Blatt | null>(null)
  const [modul, setModul] = useState<string | null>(null)
  const [seit] = useState(() => Date.now())
  const [gelesen, setGelesen] = useState(0)
  const [zeichenOffen, setZeichenOffen] = useState(false)
  const [leertaste, setLeertaste] = useState(false)
  const warStummRef = useRef(false)
  const mich = teilnehmer.find((t) => t.ichSelbst) ?? null
  const schritt = aktuellerSchritt(sitzung, prozess)
  const stille = stilleLaeuft(sitzung, jetzt)
  const halterDa = sitzung.stab.halter !== null && teilnehmer.some((t) => t.id === sitzung.stab.halter)

  useEffect(() => { if (blatt === "chat") setGelesen(neben.chat.length) }, [blatt, neben.chat.length])
  const ungelesen = blatt === "chat" ? 0 : Math.max(0, neben.chat.length - gelesen)

  // Leertaste haelt das Mikrofon offen, solange sie gedrueckt ist.
  // ⚠ Nicht, waehrend jemand in ein Feld schreibt: sonst oeffnete jedes
  // Leerzeichen im Chat das Mikrofon.
  useEffect(() => {
    if (!raum.traegtMedien) return
    const schreibt = () => {
      const el = document.activeElement as HTMLElement | null
      return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)
    }
    const runter = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || schreibt()) return
      e.preventDefault()
      warStummRef.current = !mich?.mikroAn
      if (warStummRef.current) void raum.mikro(true)
      setLeertaste(true)
    }
    const hoch = (e: KeyboardEvent) => {
      if (e.code !== "Space" || !leertaste) return
      e.preventDefault()
      if (warStummRef.current) void raum.mikro(false)
      setLeertaste(false)
    }
    window.addEventListener("keydown", runter)
    window.addEventListener("keyup", hoch)
    return () => { window.removeEventListener("keydown", runter); window.removeEventListener("keyup", hoch) }
  }, [raum, mich?.mikroAn, leertaste])

  const umschalten = (b: Blatt) => setBlatt(blatt === b ? null : b)
  const schale = () => handle((s, t) => schaleSchlagen(s, ich ?? "", prozess?.stilleSekunden ?? STILLE_OHNE_PROZESS, t))

  return (
    <div className="relative flex h-full w-full flex-col gap-2.5 bg-slate-950 p-2.5 text-white">
      {/* Kopfzeile: Raum, Dauer, Kreis-Leiste, Ansicht */}
      <header className="flex shrink-0 flex-wrap items-center gap-3 px-1.5">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{raumName}</h2>
          <p className="text-[11px] tabular-nums text-slate-400">
            {dauer(seit, jetzt)} · {teilnehmer.length} {teilnehmer.length === 1 ? "Mensch" : "Menschen"}
          </p>
        </div>

        {/* Die Bruecke zum Kreis: was dort laeuft, steht hier */}
        <div className="flex min-w-0 items-center gap-2 rounded-xl bg-slate-900 px-3 py-1.5 text-xs">
          <CircleDot className="h-3.5 w-3.5 shrink-0 text-amber-400" />
          <span className="truncate text-slate-300">
            {stille ? "Stille" : prozess && schritt ? `${prozess.name} · ${schritt.titel}` : "Kein Prozess"}
            {halterDa && !stille && <> · <span className="text-amber-300">{sitzung.stab.name} hält den Stab</span></>}
          </span>
          <button type="button" onClick={schale} title="Die Klangschale schlagen: Stille für alle" className="flex shrink-0 items-center gap-1 rounded-lg px-1.5 py-0.5 text-slate-300 hover:bg-white/10 hover:text-white">
            <Bell className="h-3.5 w-3.5" /> Schale
          </button>
          {zumKreis && (
            <button type="button" onClick={zumKreis} className="shrink-0 rounded-lg px-1.5 py-0.5 text-slate-300 hover:bg-white/10 hover:text-white">
              zum Kreis
            </button>
          )}
        </div>

        <div className="ml-auto flex rounded-xl bg-slate-900 p-1">
          {([["sprecher", "Sprecher", User], ["galerie", "Galerie", LayoutGrid]] as const).map(([id, text, Icon]) => (
            <button key={id} type="button" onClick={() => setAnsicht(id)} aria-pressed={ansicht === id}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition ${ansicht === id ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"}`}>
              <Icon className="h-3.5 w-3.5" /> {text}
            </button>
          ))}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 lg:flex-row">
        <div className={`min-h-0 min-w-0 ${blatt === "module" && modul ? "h-40 shrink-0 lg:h-auto lg:w-[34%]" : "flex-1"}`}>
          <VideoBuehne
            teilnehmer={teilnehmer}
            raum={raum}
            ansicht={blatt === "module" && modul ? "sprecher" : ansicht}
            stabHalter={halterDa ? sitzung.stab.halter : null}
            haende={neben.haende}
            zeichen={neben.zeichen}
          />
        </div>

        {blatt && (
          <aside className={`flex min-h-0 w-full shrink-0 flex-col overflow-hidden rounded-2xl ${blatt === "module" && modul ? "flex-1 bg-background text-foreground" : "bg-slate-900 lg:w-[340px]"}`}>
            <header className="flex items-center gap-2 px-4 py-3">
              <h3 className="text-sm font-semibold">
                {blatt === "menschen" ? "Wer ist da" : blatt === "chat" ? "Geschriebenes" : blatt === "protokoll" ? "Protokoll"
                  : modul ? module.find((m) => m.id === modul)?.label ?? modul : "Module holen"}
              </h3>
              {blatt === "module" && modul && (
                <button type="button" onClick={() => setModul(null)} className="text-xs opacity-70 hover:opacity-100">andere Module</button>
              )}
              <button type="button" onClick={() => setBlatt(null)} aria-label="Schließen" className="ml-auto rounded-lg p-1.5 opacity-70 hover:bg-white/10 hover:opacity-100">
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-hidden">
              {blatt === "menschen" && <Menschen teilnehmer={teilnehmer} haende={neben.haende} stab={halterDa ? sitzung.stab.halter : null} medien={raum.traegtMedien} />}
              {blatt === "chat" && <Chat kreis={kreis} />}
              {blatt === "protokoll" && <Protokoll kreis={kreis} speichern={protokollSpeichern} />}
              {blatt === "module" && (modul && modulZeigen
                ? <div className="h-full overflow-hidden">{modulZeigen(modul)}</div>
                : <ModulListe module={module} onWaehlen={setModul} />)}
            </div>
          </aside>
        )}
      </div>

      {raum.traegtMedien && mich && !mich.mikroAn && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[84px] flex justify-center">
          <span className="flex items-center gap-2 rounded-xl bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-slate-200 shadow-lg">
            <MicOff className="h-3.5 w-3.5 text-rose-400" /> Du bist stumm <span className="text-slate-400">· Leertaste halten zum Sprechen</span>
          </span>
        </div>
      )}

      {/* Steuerleiste im Muster, das Menschen aus Zoom kennen */}
      <footer className="flex shrink-0 flex-wrap items-center justify-center gap-1 rounded-2xl bg-slate-900 px-3 py-2 sm:justify-between">
        <div className="flex items-center gap-1">
          {raum.traegtMedien && mich && (
            <>
              <Knopf an={mich.mikroAn} warnung={!mich.mikroAn} titel={mich.mikroAn ? "Stummschalten" : "Stummschaltung aufheben"} beschriftung={mich.mikroAn ? "Ton an" : "stumm"} onClick={() => void raum.mikro(!mich.mikroAn)}>
                {mich.mikroAn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Knopf>
              <Knopf an={mich.kameraAn} warnung={!mich.kameraAn} titel={mich.kameraAn ? "Kamera aus" : "Kamera an"} beschriftung={mich.kameraAn ? "Bild an" : "kein Bild"} onClick={() => void raum.kamera(!mich.kameraAn)}>
                {mich.kameraAn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Knopf>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1">
          <Knopf an={blatt === "menschen"} titel="Wer ist da" beschriftung="Menschen" onClick={() => umschalten("menschen")} zahl={teilnehmer.length}><Users className="h-5 w-5" /></Knopf>
          <Knopf an={blatt === "chat"} titel="Geschriebenes" beschriftung="Chat" onClick={() => umschalten("chat")} zahl={ungelesen}><MessageSquare className="h-5 w-5" /></Knopf>
          {raum.bildschirm && mich && (
            <Knopf an={!!mich.teiltBildschirm} titel={mich.teiltBildschirm ? "Teilen beenden" : "Bildschirm teilen"} beschriftung="teilen" onClick={() => void raum.bildschirm?.(!mich.teiltBildschirm)}><MonitorUp className="h-5 w-5" /></Knopf>
          )}
          <div className="relative">
            <Knopf an={zeichenOffen} titel="Ein Zeichen geben" beschriftung="Zeichen" onClick={() => setZeichenOffen(!zeichenOffen)}><Smile className="h-5 w-5" /></Knopf>
            {zeichenOffen && (
              <div className="absolute bottom-full left-1/2 z-50 mb-2 flex -translate-x-1/2 gap-1 rounded-xl bg-slate-800 p-1.5 shadow-2xl">
                {(Object.keys(ZEICHEN) as ZeichenArt[]).map((art) => (
                  <button key={art} type="button" onClick={() => { neben.zeichenGeben(art); setZeichenOffen(false) }} className="flex h-9 w-9 items-center justify-center rounded-lg text-lg hover:scale-110 hover:bg-white/10">
                    {ZEICHEN[art]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Knopf an={!!ich && neben.haende.has(ich)} titel="Hand heben oder senken" beschriftung="Hand" onClick={neben.handUmschalten}><Hand className="h-5 w-5" /></Knopf>
          {spracherkennungVorhanden() && (
            <Knopf an={neben.protokollLaeuft || blatt === "protokoll"} titel="Protokoll" beschriftung={neben.protokollLaeuft ? "läuft" : "Protokoll"} onClick={() => umschalten("protokoll")}><FileText className="h-5 w-5" /></Knopf>
          )}
          <Knopf an={blatt === "module"} titel="Andere Module in die Konferenz holen" beschriftung="Module" onClick={() => umschalten("module")}><Blocks className="h-5 w-5" /></Knopf>
        </div>

        <div className="flex items-center gap-2">
          {leertaste && <span className="hidden rounded-lg bg-emerald-500/20 px-2.5 py-1 text-[10px] font-medium text-emerald-300 sm:block">Leertaste: du sprichst</span>}
          <button type="button" onClick={() => void kreis.verlassen()} title="Die Konferenz verlassen" className="flex min-w-[56px] flex-col items-center gap-1 rounded-xl bg-rose-600 px-3 py-2 text-white hover:bg-rose-700">
            <LogOut className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-none">gehen</span>
          </button>
        </div>
      </footer>
    </div>
  )
}

function Menschen({ teilnehmer, haende, stab, medien }: { teilnehmer: readonly KreisTeilnehmer[]; haende: ReadonlySet<string>; stab: string | null; medien: boolean }) {
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

function Chat({ kreis }: { kreis: KreisKontext }) {
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

function Protokoll({ kreis, speichern }: { kreis: KreisKontext; speichern?: VideoRaumFlaecheProps["protokollSpeichern"] }) {
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

function ModulListe({ module, onWaehlen }: { module: readonly ModulWahl[]; onWaehlen: (id: string) => void }) {
  if (module.length === 0) {
    return <p className="px-4 py-10 text-center text-xs italic text-slate-500">Dieser Space führt keine weiteren Module.</p>
  }
  return (
    <div className="space-y-2 overflow-y-auto px-3 pb-3">
      <p className="px-1 text-xs text-slate-400">Holt ein Modul in die Konferenz. Bild und Ton laufen weiter.</p>
      {module.map((m) => (
        <button key={m.id} type="button" onClick={() => onWaehlen(m.id)} className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-left text-sm text-slate-100 hover:bg-white/10">
          {m.label}
        </button>
      ))}
    </div>
  )
}

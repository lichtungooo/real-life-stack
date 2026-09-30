// Die Konferenz als Flaeche, ohne das Toolkit (Spec: docs/spec/modules/video.md).
//
// Aufbau nach Big Blue Button (Timo, 30.09.2026, mit Bildern):
//
//   LINKS    eine Leiste: Nachrichten (Gemeinsamer Chat), Notizen (Protokoll),
//            Teilnehmer mit Namen. Ein Eintrag klappt eine Spalte daneben auf;
//            der Pfeil klappt sie wieder zu.
//   OBEN     die Menschen mit Bild, als Streifen.
//   MITTE    die Buehne. Dort liegt ein "Tool im Modul" fuer alle: der Kreis
//            mit Redestab und Prozess, die Tafel, ein anderes Modul. Unten
//            links der Aktions-Knopf (+), oben rechts "Alle zeigen".
//   UNTEN    Ton, Bild, Bildschirm, Hand, Zeichen, Klangschale.
//
// Der Kreis ist hier ein Tool im Modul, kein eigener Reiter: Anton nennt das
// eine Module Component (docs/spec/modules/README.md, Regel 7).

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import {
  Bell, ChevronLeft, ChevronRight, CircleDot, FileText, Hand, LogOut, Maximize2, MessageSquare,
  Mic, MicOff, MonitorUp, MoreVertical, PanelLeft, Plus, Settings, Smile, UserPlus, Users, Video, VideoOff, X, ListOrdered, ClipboardCheck,
} from "lucide-react"
import {
  PROZESSE, aktuellerSchritt, gruppenraeumeStarten, istUnterraumVon, layoutFuerAlle, moderationSetzen, moderationVon, namensliste, punktRest, tagesordnungVon, losZiehen, mitteSetzen, padOeffnen, prozessWaehlen, redezeitRest, regelnSetzen, regelnVon,
  schaleSchlagen, sitzungRest, stabNehmen, stabZuruecklegen, stilleLaeuft, stilleSekundenVon, weckerAus, weckerStellen, type KreisTeilnehmer,
} from "@kreis/core"
import { hinweisTon, meetingEnde, schaleAnschlagen } from "../klangschale"
import { istLayout, useVorlieben, vorliebenSetzen, type HinweisArt, type LayoutArt } from "../vorlieben"
import { LAYOUT_NAMEN, LayoutDialog } from "./layouts"
import { ErgebnisseSpalte, TagesordnungSpalte, type ErgebnisAblegen } from "./meeting-spalten"
import { GruppenraeumeDialog, GruppenraeumeHinweis } from "./gruppenraeume"
import { UeberblickDialog, useUeberblick } from "./ueberblick"
import { EinstellungenDialog } from "./einstellungen-dialog"
import { useKreisVerbindung, type KreisKontext } from "../raum-kontext"
import { AndererRaum, KreisWerkzeug, OhneRaum, Vorraum } from "../kreis-raum-flaeche"
import { ZEICHEN, spracherkennungVorhanden, type ZeichenArt } from "../use-neben"
import { VideoBuehne } from "./video-buehne"
import { VideoKachel } from "./video-kachel"
import { Tafel } from "./tafel"
import { Chat, Menschen, Protokoll, type ProtokollSpeichern } from "./video-seiten"
import { GeteilteNotizen, LosAnzeige, UmfrageWerkzeug, WeckerAnzeige } from "./werkzeuge"
import { SITZUNG_STUFEN, dauerText } from "../regeln-formular"
import { EinladenDialog, NeuImRaum, type KonferenzEinladen } from "./einladen"
import { ZeichenPad } from "./zeichenpad"

/** Die Tools, die das Video selbst mitbringt. Module kommen aus dem Register dazu. */
export const TOOL_KREIS = "kreis"
export const TOOL_TAFEL = "tafel"
/** Das Zeichenpad (Excalidraw); ersetzt die einfache Tafel. */
export const TOOL_PAD = "pad"
export const TOOL_UMFRAGE = "umfrage"

const WECKER_MINUTEN = [1, 3, 5, 10, 15, 20, 30] as const

function mmss(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

type Spalte = "chat" | "notizen" | "protokoll" | "tagesordnung" | "ergebnisse" | null

export interface ModulWahl { id: string; label: string }

export interface VideoRaumFlaecheProps {
  /** Wie die Konferenz heisst (der Name der Gruppe). */
  raumName: string
  /**
   * Der Schluessel des Raums: die Id der Gruppe. Ein Name laesst sich
   * erraten, eine Id nicht; der Link ist so der Schluessel. Fehlt sie, gilt
   * der Name (Probe-Raum, Tests).
   */
  raumId?: string
  /** Einladen per Link und aus den Kontakten. Fehlt es, gibt es keinen Knopf dafuer. */
  einladen?: KonferenzEinladen
  /** Aufgaben und Beschluesse in der Gruppe ablegen. Fehlt es, bleiben sie in der Sitzung. */
  ergebnisAblegen?: ErgebnisAblegen
  vorschlagName?: string
  /** Die Module des Space, die sich als Tool in die Mitte legen lassen. */
  module?: readonly ModulWahl[]
  /** Zeigt ein Modul in der Mitte. Kommt von der App (Antons ModuleOutlet). */
  modulZeigen?: (id: string) => ReactNode
  /** Das Protokoll als Item ablegen. Fehlt es, gibt es keinen Knopf dafuer. */
  protokollSpeichern?: ProtokollSpeichern
}

function dauer(seit: number, jetzt: number): string {
  const s = Math.max(0, Math.floor((jetzt - seit) / 1000))
  const std = Math.floor(s / 3600), min = Math.floor((s % 3600) / 60), sek = s % 60
  return std > 0 ? `${std}:${String(min).padStart(2, "0")}:${String(sek).padStart(2, "0")}` : `${min}:${String(sek).padStart(2, "0")}`
}

function Rund({ an, warnung, titel, onClick, children }: { an?: boolean; warnung?: boolean; titel: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={titel} aria-label={titel} aria-pressed={an}
      className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
        warnung ? "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30" : an ? "bg-sky-600 text-white hover:bg-sky-500" : "bg-white/10 text-slate-200 hover:bg-white/20"
      }`}>
      {children}
    </button>
  )
}

function Menue({ offen, onZu, className, children, fest = false }: { offen: boolean; onZu: () => void; className: string; children: ReactNode; fest?: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!offen) return
    const zu = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onZu() }
    const t = setTimeout(() => document.addEventListener("click", zu))
    return () => { clearTimeout(t); document.removeEventListener("click", zu) }
  }, [offen, onZu])
  if (!offen) return null
  return <div ref={ref} className={`${fest ? "fixed" : "absolute"} z-50 max-h-[70vh] w-72 overflow-y-auto rounded-xl bg-white p-1.5 text-slate-800 shadow-2xl ${className}`}>{children}</div>
}

/** Ein Aufklappfeld im Menue: zu, bis man es braucht. */
function Aufklapp({ titel, zeichen, children }: { titel: string; zeichen: ReactNode; children: ReactNode }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 [&::-webkit-details-marker]:hidden">
        {zeichen} <span className="flex-1">{titel}</span>
        <ChevronRight className="h-4 w-4 text-slate-400 transition group-open:rotate-90" />
      </summary>
      <div className="pl-3">{children}</div>
    </details>
  )
}

function Eintrag({ onClick, children, aktiv }: { onClick: () => void; children: ReactNode; aktiv?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 ${aktiv ? "font-semibold text-sky-700" : ""}`}>
      {children}
    </button>
  )
}

export function VideoRaumFlaeche(props: VideoRaumFlaecheProps) {
  const kreis = useKreisVerbindung()
  if (!kreis) return <OhneRaum />
  const schluessel = props.raumId ?? props.raumName
  if (kreis.zustand === "drin" && kreis.raumName !== schluessel && !istUnterraumVon(kreis.raumName, schluessel)) {
    return <AndererRaum kreis={kreis} hier={schluessel} hierTitel={props.raumName} vorschlagName={props.vorschlagName} />
  }
  if (kreis.zustand !== "drin") {
    return (
      <Vorraum
        kreis={kreis}
        raumName={props.raumName}
        raumSchluessel={schluessel}
        vorschlagName={props.vorschlagName}
        titel="Konferenz"
        einleitung="Bild, Ton und Bildschirm für alle im Space. In der Mitte legt ihr ein Tool für alle hinein: den Kreis mit dem Redestab, die Tafel, ein Modul."
        knopf="Der Konferenz beitreten"
      />
    )
  }
  return <InDerKonferenz kreis={kreis} {...props} />
}

function InDerKonferenz({ kreis, raumName, raumId, module = [], modulZeigen, protokollSpeichern, einladen, ergebnisAblegen }: VideoRaumFlaecheProps & { kreis: KreisKontext }) {
  const { raum, teilnehmer, ich, sitzung, prozess, jetzt, handle, neben } = kreis
  const [leisteOffen, setLeisteOffen] = useState(true)
  const [spalte, setSpalte] = useState<Spalte>(null)
  const [aktionOffen, setAktionOffen] = useState(false)
  const [mehrOffen, setMehrOffen] = useState(false)
  const [einstellungenOffen, setEinstellungenOffen] = useState(false)
  const [einladenOffen, setEinladenOffen] = useState(false)
  const [layoutOffen, setLayoutOffen] = useState(false)
  const [moderationOffen, setModerationOffen] = useState(false)
  const [gruppenOffen, setGruppenOffen] = useState(false)
  const [ueberblickOffen, setUeberblickOffen] = useState(false)
  const ueberblick = useUeberblick(kreis)
  const vorlieben = useVorlieben()
  // Hinweise wie in Big Blue Button: je Anlass ein Ton und eine Einblendung.
  const [einblendungen, setEinblendungen] = useState<{ id: number; text: string }[]>([])
  // Die eigene Ansicht aller: nur fuer mich, das Tool bleibt fuer die anderen
  // in der Mitte (Timo: man muss nicht immer das Redekreisfenster sehen).
  const [nurMenschen, setNurMenschen] = useState(false)
  const [abschlussGesehen, setAbschlussGesehen] = useState(false)
  const [zeichenOffen, setZeichenOffen] = useState(false)
  const [seit] = useState(() => Date.now())
  const [gelesen, setGelesen] = useState(0)
  const [leertaste, setLeertaste] = useState(false)
  const [meldung, setMeldung] = useState<string | null>(null)
  const huelle = useRef<HTMLDivElement | null>(null)
  const warStummRef = useRef(false)
  const mich = teilnehmer.find((t) => t.ichSelbst) ?? null
  const schritt = aktuellerSchritt(sitzung, prozess)
  const stille = stilleLaeuft(sitzung, jetzt)
  const halterDa = sitzung.stab.halter !== null && teilnehmer.some((t) => t.id === sitzung.stab.halter)
  const mitte = sitzung.mitte ?? null
  const toolName = mitte === TOOL_KREIS ? (prozess ? `Kreis · ${prozess.name}` : "Kreis")
    : mitte === TOOL_PAD ? "Zeichenpad" : mitte === TOOL_TAFEL ? "Tafel" : mitte === TOOL_UMFRAGE ? "Umfrage" : mitte ? module.find((m) => m.id === mitte)?.label ?? mitte : null

  useEffect(() => { if (spalte === "chat") setGelesen(neben.chat.length) }, [spalte, neben.chat.length])
  const ungelesen = spalte === "chat" ? 0 : Math.max(0, neben.chat.length - gelesen)

  /** Scheitert Kamera, Mikrofon oder Bildschirm, sagt die Flaeche es und nennt den Weg. */
  const medien = useCallback(async (was: string, fn: () => Promise<void> | undefined) => {
    try {
      await fn()
    } catch (e) {
      const grund = e instanceof Error ? e.message : String(e)
      setMeldung(/permission|allowed|denied/i.test(grund)
        ? `${was}: Der Browser gibt den Zugriff nicht frei. Im Schloss links neben der Adresse lässt er sich erlauben.`
        : `${was} ging nicht: ${grund}`)
      setTimeout(() => setMeldung(null), 8000)
    }
  }, [])

  // Leertaste haelt das Mikrofon offen. ⚠ Nicht beim Schreiben in ein Feld.
  useEffect(() => {
    if (!raum.traegtMedien || !vorlieben.pushToTalk) return
    const schreibt = () => {
      const el = document.activeElement as HTMLElement | null
      return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)
    }
    const runter = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || schreibt()) return
      e.preventDefault()
      warStummRef.current = !mich?.mikroAn
      if (warStummRef.current) void medien("Mikrofon", () => raum.mikro(true))
      setLeertaste(true)
    }
    const hoch = (e: KeyboardEvent) => {
      if (e.code !== "Space" || !leertaste) return
      e.preventDefault()
      if (warStummRef.current) void medien("Mikrofon", () => raum.mikro(false))
      setLeertaste(false)
    }
    window.addEventListener("keydown", runter)
    window.addEventListener("keyup", hoch)
    return () => { window.removeEventListener("keydown", runter); window.removeEventListener("keyup", hoch) }
  }, [raum, mich?.mikroAn, leertaste, medien, vorlieben.pushToTalk])

  // "Fuer alle uebernehmen": jede neue Nummer einmal in die eigene Vorliebe.
  const layoutGesehen = useRef(0)
  useEffect(() => {
    const l = sitzung.layout
    if (!l || l.nr <= layoutGesehen.current) return
    layoutGesehen.current = l.nr
    if (istLayout(l.art) && l.art !== vorlieben.layout) vorliebenSetzen({ ...vorlieben, layout: l.art })
  }, [sitzung.layout, vorlieben])
  const layoutSetzen = (art: LayoutArt, fuerAlle: boolean) => {
    vorliebenSetzen({ ...vorlieben, layout: art })
    if (fuerAlle) handle((s) => layoutFuerAlle(s, art, wer))
  }

  // Moderation "Neue Teilnehmer stumm": wer hereinkommt, schaltet sich einmal
  // selbst stumm, sobald der Stand des Raums bei ihm ist.
  const moderation = moderationVon(sitzung)
  const stummGeprueft = useRef(false)
  useEffect(() => {
    if (stummGeprueft.current || sitzung.v === 0 || !mich) return
    stummGeprueft.current = true
    if (moderation.neueStumm && mich.mikroAn && Date.now() - seit < 20_000) void raum.mikro(false)
  }, [sitzung.v, moderation.neueStumm, mich, raum, seit])

  // Der Audiofilter des Mikrofons folgt der Vorliebe.
  useEffect(() => { void raum.mikroFilter?.(vorlieben.audiofilter) }, [raum, vorlieben.audiofilter])

  // Hinweise: neue Chatzeilen der anderen, wer kommt, wer geht, wer die Hand hebt.
  const melde = useCallback((art: HinweisArt, text: string) => {
    const h = vorlieben.hinweise[art]
    if (h.ton) hinweisTon()
    if (!h.popup) return
    const id = Date.now() + Math.random()
    setEinblendungen((e) => [...e.slice(-3), { id, text }])
    setTimeout(() => setEinblendungen((e) => e.filter((x) => x.id !== id)), 4500)
  }, [vorlieben.hinweise])
  const chatBisher = useRef(neben.chat.length)
  useEffect(() => {
    const neu = neben.chat.slice(chatBisher.current).filter((z) => z.wer !== ich)
    chatBisher.current = neben.chat.length
    if (neu.length > 0) melde("chat", `${neu[neu.length - 1].name}: ${neu[neu.length - 1].text.slice(0, 80)}`)
  }, [neben.chat, ich, melde])
  const anwesendBisher = useRef<Map<string, string> | null>(null)
  useEffect(() => {
    const jetztDa = new Map(teilnehmer.map((t) => [t.id, t.name]))
    const vorher = anwesendBisher.current
    anwesendBisher.current = jetztDa
    if (!vorher) return
    for (const [id, name] of jetztDa) if (!vorher.has(id)) melde("beitritt", `${name} ist dazugekommen`)
    for (const [id, name] of vorher) if (!jetztDa.has(id)) melde("gehen", `${name} ist gegangen`)
  }, [teilnehmer, melde])
  const haendeBisher = useRef<ReadonlySet<string>>(neben.haende)
  useEffect(() => {
    for (const id of neben.haende) {
      if (!haendeBisher.current.has(id) && id !== ich) melde("hand", `${teilnehmer.find((t) => t.id === id)?.name ?? "Jemand"} hebt die Hand`)
    }
    haendeBisher.current = neben.haende
  }, [neben.haende, ich, teilnehmer, melde])

  // Die Zeit ist um: einmal ein leiser, hoher Klang, bei allen.
  const weckerGeklungen = useRef(0)
  const wecker = sitzung.wecker ?? null
  useEffect(() => {
    if (!wecker || jetzt < wecker.bis || weckerGeklungen.current === wecker.bis) return
    weckerGeklungen.current = wecker.bis
    schaleAnschlagen(392, 0.25)
  }, [wecker, jetzt])

  // Kommt ein neues Tool in die Mitte, zeigt die Buehne es wieder.
  useEffect(() => { setNurMenschen(false) }, [mitte])

  // Das Ende des Meetings: einmal ein eigener Klang (kein Gong, keine
  // Schale), bei jedem selbst, und ein Hinweis auf die Abschlussrunde. Das
  // Meeting laeuft weiter.
  const sitzungUebrig = sitzungRest(sitzung, jetzt)
  const sitzungsEnde = sitzungUebrig !== null && sitzungUebrig <= 0
  const endeGeklungen = useRef(0)
  useEffect(() => {
    const seit = sitzung.regeln?.sitzungSeit ?? 0
    if (!sitzungsEnde || endeGeklungen.current === seit) return
    endeGeklungen.current = seit
    setAbschlussGesehen(false)
    meetingEnde()
  }, [sitzungsEnde, sitzung.regeln?.sitzungSeit])

  const wer = ich ?? ""
  const rest = redezeitRest(sitzung, jetzt)
  const laufenderPunkt = tagesordnungVon(sitzung).punkte.find((p) => p.id === tagesordnungVon(sitzung).aktiv) ?? null
  const punktUebrig = punktRest(sitzung, jetzt)
  const ichHalte = !!ich && sitzung.stab.halter === ich
  const tool = (was: string | null) => { handle((s) => mitteSetzen(s, was, wer)); setAktionOffen(false) }
  const kreisMitProzess = (id: string) => {
    const p = PROZESSE.find((x) => x.id === id)
    if (!p) return
    handle((s, t) => mitteSetzen(prozessWaehlen(s, p, wer, t), TOOL_KREIS, wer))
    setAktionOffen(false)
  }
  const schale = () => handle((s, t) => schaleSchlagen(s, wer, stilleSekundenVon(s, prozess), t))
  const spalteZeigen = (b: Exclude<Spalte, null>) => setSpalte(spalte === b ? null : b)

  // Selbstansicht aus: das eigene Bild faellt weg, ausser man ist allein.
  const sichtbar = vorlieben.selbstansicht || teilnehmer.length <= 1 ? teilnehmer : teilnehmer.filter((t) => !t.ichSelbst)
  const kachel = (p: KreisTeilnehmer) => (
    <VideoKachel person={p} raum={raum} handOben={neben.haende.has(p.id)}
      zeichen={neben.zeichen.get(p.id)?.art ?? null} haeltStab={halterDa && sitzung.stab.halter === p.id} />
  )

  return (
    <div ref={huelle} data-ruhig={vorlieben.animationen ? undefined : ""}
      style={vorlieben.schrift !== 100 ? { zoom: vorlieben.schrift / 100 } : undefined}
      className="relative flex h-full w-full overflow-hidden bg-slate-950 text-white">
      {!vorlieben.animationen && <style>{"[data-ruhig] *, [data-ruhig] *::before, [data-ruhig] *::after { animation: none !important; transition: none !important; }"}</style>}
      {/* LINKS: die Leiste wie bei Big Blue Button */}
      {leisteOffen && (
        <nav aria-label="Konferenz" className="flex w-56 shrink-0 flex-col overflow-y-auto bg-slate-900 text-sm">
          <p className="px-4 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Nachrichten</p>
          <button type="button" onClick={() => spalteZeigen("chat")} aria-pressed={spalte === "chat"}
            className={`mx-2 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left ${spalte === "chat" ? "bg-white/10" : "hover:bg-white/5"}`}>
            <MessageSquare className="h-4 w-4 text-slate-300" /> Gemeinsamer Chat
            {ungelesen > 0 && <span className="ml-auto rounded-full bg-sky-500 px-1.5 text-[10px] font-bold">{ungelesen}</span>}
          </button>
          <p className="px-4 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Meeting</p>
          <button type="button" onClick={() => spalteZeigen("tagesordnung")} aria-pressed={spalte === "tagesordnung"}
            className={`mx-2 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left ${spalte === "tagesordnung" ? "bg-white/10" : "hover:bg-white/5"}`}>
            <ListOrdered className="h-4 w-4 text-slate-300" /> Tagesordnung
            {tagesordnungVon(sitzung).punkte.length > 0 && <span className="ml-auto text-[10px] text-slate-400">{tagesordnungVon(sitzung).punkte.filter((p) => p.erledigt).length}/{tagesordnungVon(sitzung).punkte.length}</span>}
          </button>
          <button type="button" onClick={() => spalteZeigen("ergebnisse")} aria-pressed={spalte === "ergebnisse"}
            className={`mx-2 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left ${spalte === "ergebnisse" ? "bg-white/10" : "hover:bg-white/5"}`}>
            <ClipboardCheck className="h-4 w-4 text-slate-300" /> Aufgaben und Beschlüsse
            {neben.ergebnisse.length > 0 && <span className="ml-auto text-[10px] text-slate-400">{neben.ergebnisse.length}</span>}
          </button>
          <p className="px-4 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Notizen</p>
          <button type="button" onClick={() => spalteZeigen("notizen")} aria-pressed={spalte === "notizen"}
            className={`mx-2 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left ${spalte === "notizen" ? "bg-white/10" : "hover:bg-white/5"}`}>
            <FileText className="h-4 w-4 text-slate-300" /> Geteilte Notizen
          </button>
          {spracherkennungVorhanden() && (
            <>
              <button type="button" onClick={() => spalteZeigen("protokoll")} aria-pressed={spalte === "protokoll"}
                className={`mx-2 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left ${spalte === "protokoll" ? "bg-white/10" : "hover:bg-white/5"}`}>
                <FileText className="h-4 w-4 text-slate-300" /> Protokoll
                {neben.protokollLaeuft && <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-emerald-400" aria-label="läuft" />}
              </button>
            </>
          )}
          <div className="relative flex items-center px-4 pb-1 pt-4">
            <p className="flex-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Teilnehmer ({teilnehmer.length})</p>
            <button type="button" onClick={() => setModerationOffen(!moderationOffen)} aria-label="Moderation" title="Moderation"
              className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"><Settings className="h-4 w-4" /></button>
            <Menue offen={moderationOffen} onZu={() => setModerationOffen(false)} className="bottom-4 left-3 w-80" fest>
              <Eintrag aktiv={moderation.neueStumm} onClick={() => handle((s) => moderationSetzen(s, { neueStumm: !moderation.neueStumm }, wer))}>
                <MicOff className="h-4 w-4" /> {moderation.neueStumm ? "Neue Teilnehmer stumm: an" : "Neue Teilnehmer stumm schalten"}
              </Eintrag>
              <Eintrag onClick={() => { neben.alleStumm(sitzung.pad?.praesentiert ?? sitzung.stab.halter ?? wer); setModerationOffen(false) }}>
                <MicOff className="h-4 w-4" /> Alle stumm schalten bis auf die Person, die präsentiert
              </Eintrag>
              <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Rechte der Zuschauenden</p>
              <Eintrag aktiv={!moderation.chat} onClick={() => handle((s) => moderationSetzen(s, { chat: !moderation.chat }, wer))}>
                <span className="w-4 text-center">{moderation.chat ? "○" : "●"}</span> Chat {moderation.chat ? "schließen" : "ist geschlossen, öffnen"}
              </Eintrag>
              <Eintrag aktiv={!moderation.notizen} onClick={() => handle((s) => moderationSetzen(s, { notizen: !moderation.notizen }, wer))}>
                <span className="w-4 text-center">{moderation.notizen ? "○" : "●"}</span> Notizen {moderation.notizen ? "nur zum Lesen" : "sind nur zum Lesen, freigeben"}
              </Eintrag>
              <Eintrag aktiv={!moderation.bildschirm} onClick={() => handle((s) => moderationSetzen(s, { bildschirm: !moderation.bildschirm }, wer))}>
                <span className="w-4 text-center">{moderation.bildschirm ? "○" : "●"}</span> Bildschirm teilen {moderation.bildschirm ? "sperren" : "ist gesperrt, erlauben"}
              </Eintrag>
              <Eintrag aktiv={moderation.warteraum} onClick={() => handle((s) => moderationSetzen(s, { warteraum: !moderation.warteraum }, wer))}>
                <span className="w-4 text-center">⌂</span> Gastzugang: {moderation.warteraum ? "Warteraum an" : "offen, Warteraum einschalten"}
              </Eintrag>
              <div className="my-1 border-t border-slate-200" />
              <Eintrag onClick={() => {
                const url = URL.createObjectURL(new Blob([namensliste(raumName, teilnehmer.map((t) => t.name), Date.now())], { type: "text/plain;charset=utf-8" }))
                const a = document.createElement("a"); a.href = url; a.download = `Teilnehmende ${raumName}.txt`; a.click()
                setTimeout(() => URL.revokeObjectURL(url), 1000); setModerationOffen(false)
              }}>
                <span className="w-4 text-center">⤓</span> Teilnehmernamen speichern
              </Eintrag>
              <Eintrag onClick={() => { neben.reaktionenLoeschen(); setModerationOffen(false) }}>
                <span className="w-4 text-center">✕</span> Alle Reaktionen löschen
              </Eintrag>
              <div className="my-1 border-t border-slate-200" />
              <Eintrag onClick={() => { setModerationOffen(false); setGruppenOffen(true) }}>
                <span className="w-4 text-center">⊞</span> Gruppenräume erstellen
              </Eintrag>
              <Eintrag onClick={() => { setModerationOffen(false); setUeberblickOffen(true) }}>
                <span className="w-4 text-center">▥</span> Meeting-Überblick
              </Eintrag>
              <p className="px-3 pb-2 pt-1 text-[11px] text-slate-500">Auf Augenhöhe: Jeder darf das, und jedes Gerät hält sich selbst daran.</p>
            </Menue>
          </div>
          <Menschen teilnehmer={teilnehmer} haende={neben.haende} stab={halterDa ? sitzung.stab.halter : null} medien={raum.traegtMedien} />
          {einladen && <NeuImRaum kreis={kreis} einladen={einladen} />}
        </nav>
      )}

      {/* Daneben die Spalte, die ein Eintrag aufklappt */}
      {leisteOffen && spalte && (
        <aside className="flex w-80 shrink-0 flex-col border-l border-white/5 bg-slate-900/70">
          <header className="flex items-center gap-1 px-2 py-3">
            <button type="button" onClick={() => setSpalte(null)} aria-label="Spalte schließen" className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h3 className="text-sm font-semibold">{spalte === "chat" ? "Gemeinsamer Chat" : spalte === "notizen" ? "Geteilte Notizen" : spalte === "tagesordnung" ? "Tagesordnung" : spalte === "ergebnisse" ? "Aufgaben und Beschlüsse" : "Protokoll"}</h3>
          </header>
          <div className="min-h-0 flex-1 overflow-hidden">
            {spalte === "chat" ? <Chat kreis={kreis} /> : spalte === "notizen" ? <GeteilteNotizen kreis={kreis} />
              : spalte === "tagesordnung" ? <TagesordnungSpalte kreis={kreis} />
              : spalte === "ergebnisse" ? <ErgebnisseSpalte kreis={kreis} ablegen={ergebnisAblegen} />
              : <Protokoll kreis={kreis} speichern={protokollSpeichern} />}
          </div>
        </aside>
      )}

      {/* HAUPTFENSTER */}
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-2">
        <header className="flex shrink-0 items-center gap-2 px-1">
          <button type="button" onClick={() => setLeisteOffen(!leisteOffen)} title={leisteOffen ? "Leiste zuklappen" : "Teilnehmer und Chat zeigen"} aria-label="Leiste auf und zu"
            className="relative rounded-lg p-2 text-slate-300 hover:bg-white/10">
            {leisteOffen ? <PanelLeft className="h-5 w-5" /> : <Users className="h-5 w-5" />}
            {!leisteOffen && ungelesen > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-sky-500" />}
          </button>
          <div className="min-w-0 flex-1 text-center">
            <h2 className="truncate text-sm font-semibold">{raumName}</h2>
            <p className="truncate text-[11px] text-slate-400">
              {dauer(seit, jetzt)} · {teilnehmer.length} {teilnehmer.length === 1 ? "Mensch" : "Menschen"}
              {stille ? " · Stille" : prozess && schritt ? ` · ${prozess.name}: ${schritt.titel}` : ""}
              {halterDa && !stille ? ` · ${sitzung.stab.name} hält den Stab` : ""}
              {halterDa && !stille && rest !== null ? ` · noch ${mmss(rest)}` : ""}
              {laufenderPunkt ? ` · TOP: ${laufenderPunkt.titel}${punktUebrig !== null ? (punktUebrig < 0 ? " (überzogen)" : ` noch ${mmss(punktUebrig)}`) : ""}` : ""}
              {sitzungUebrig !== null && sitzungUebrig > 0 ? ` · Meeting noch ${sitzungUebrig >= 3_600_000 ? `${Math.floor(sitzungUebrig / 3_600_000)} Std. ${Math.floor((sitzungUebrig % 3_600_000) / 60_000)} Min.` : `${Math.max(1, Math.round(sitzungUebrig / 60_000))} Min.`}` : ""}
            </p>
          </div>
          {wecker && <WeckerAnzeige bis={wecker.bis} jetzt={jetzt} onAus={() => handle((s) => weckerAus(s, wer))} />}
          {einladen && (
            <button type="button" onClick={() => setEinladenOffen(true)} title="Menschen einladen: Link teilen oder aus den Kontakten"
              className="flex h-9 items-center gap-1.5 rounded-full bg-sky-600 px-3 text-xs font-medium hover:bg-sky-500">
              <UserPlus className="h-4 w-4" /> Einladen
            </button>
          )}
          <button type="button" onClick={() => void kreis.verlassen()} title="Die Konferenz verlassen" aria-label="gehen"
            className="flex h-9 items-center gap-1.5 rounded-full bg-rose-600 px-3 text-xs font-medium hover:bg-rose-700">
            <LogOut className="h-4 w-4" /> gehen
          </button>
          <div className="relative">
            <button type="button" onClick={() => setMehrOffen(!mehrOffen)} aria-label="Mehr" className="rounded-lg p-2 text-slate-300 hover:bg-white/10">
              <MoreVertical className="h-5 w-5" />
            </button>
            <Menue offen={mehrOffen} onZu={() => setMehrOffen(false)} className="right-0 top-full mt-1">
              <Eintrag onClick={() => { setMehrOffen(false); setEinstellungenOffen(true) }}>
                <span className="w-4 text-center">⚙</span> Einstellungen
              </Eintrag>
              <Eintrag onClick={() => { setMehrOffen(false); setLayoutOffen(true) }}>
                <span className="w-4 text-center">▦</span> Layout: {LAYOUT_NAMEN[vorlieben.layout]}
              </Eintrag>
              <Eintrag onClick={() => { setMehrOffen(false); void huelle.current?.requestFullscreen?.().catch(() => {}) }}>
                <Maximize2 className="h-4 w-4" /> Vollbild
              </Eintrag>
              <p className="px-3 py-2 text-xs text-slate-500">Leertaste halten: sprechen, solange sie gedrückt ist.</p>
            </Menue>
          </div>
        </header>

        <GruppenraeumeHinweis kreis={kreis} hauptSchluessel={kreis.unterraum?.haupt ?? raumId ?? raumName} hauptTitel={kreis.unterraum?.hauptTitel ?? raumName} />
        {mitte === null || nurMenschen ? (
          // Alle zeigen: die Menschen gross. Liegt ein Tool in der Mitte und
          // ich schaue nur auf die Menschen, fuehrt oben ein Weg zurueck.
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            {mitte !== null && nurMenschen && (
              <button type="button" onClick={() => setNurMenschen(false)}
                className="flex shrink-0 items-center gap-2 self-center rounded-full bg-sky-600 px-4 py-1.5 text-sm font-medium hover:bg-sky-500">
                <ChevronLeft className="h-4 w-4" /> Zurück zu {toolName}
              </button>
            )}
            <div className="min-h-0 flex-1">
            <VideoBuehne teilnehmer={sichtbar} raum={raum} ansicht="galerie"
              stabHalter={halterDa ? sitzung.stab.halter : null} haende={neben.haende} zeichen={neben.zeichen} />
            </div>
          </div>
        ) : (
          <LayoutFlaeche
            art={vorlieben.layout}
            streifen={(form) => (
              <div aria-label="Die Menschen" className={
                form === "quer" ? "flex shrink-0 gap-2 overflow-x-auto pb-1"
                : form === "hoch" ? "flex w-40 shrink-0 flex-col gap-2 overflow-y-auto"
                : "absolute bottom-3 left-3 z-10 flex max-w-[60%] gap-1.5 overflow-x-auto rounded-xl bg-slate-950/60 p-1.5"}>
                {sichtbar.map((p) => <div key={p.id} className={form === "klein" ? "w-24 shrink-0" : form === "hoch" ? "w-full" : "w-32 shrink-0"}>{kachel(p)}</div>)}
              </div>
            )}
            galerie={
              <VideoBuehne teilnehmer={sichtbar} raum={raum} ansicht="galerie"
                stabHalter={halterDa ? sitzung.stab.halter : null} haende={neben.haende} zeichen={neben.zeichen} />
            }
            toolKlein={
              <button type="button" onClick={() => vorliebenSetzen({ ...vorlieben, layout: "oben" })}
                className="absolute bottom-3 left-3 z-10 flex w-56 flex-col items-start gap-0.5 rounded-xl bg-background p-3 text-left text-foreground shadow-xl hover:ring-2 hover:ring-primary">
                <span className="text-xs text-muted-foreground">In der Mitte, für alle</span>
                <span className="text-sm font-semibold">{toolName}</span>
                <span className="text-xs text-primary">groß zeigen</span>
              </button>
            }
            werkzeug={
            <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-background text-foreground">
              <header className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2">
                <span className="text-sm font-semibold">{toolName}</span>
                <span className="text-xs text-muted-foreground">liegt in der Mitte, für alle</span>
                <button type="button" onClick={() => setNurMenschen(true)} title="Nur für dich: alle Menschen groß, das Tool bleibt für die anderen"
                  className="ml-auto flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium hover:bg-muted/70">
                  <Users className="h-3.5 w-3.5" /> Alle zeigen
                </button>
              </header>
              <div className="min-h-0 flex-1 overflow-hidden">
                {mitte === TOOL_KREIS ? <div className="h-full overflow-hidden"><KreisWerkzeug kreis={kreis} /></div>
                  : mitte === TOOL_UMFRAGE ? <UmfrageWerkzeug kreis={kreis} />
                  : mitte === TOOL_PAD ? <ZeichenPad kreis={kreis} />
                  : mitte === TOOL_TAFEL ? <div className="h-full p-3"><Tafel striche={neben.tafel} ich={wer} onStrich={neben.tafelStrich} onLeeren={neben.tafelLeeren} /></div>
                  : modulZeigen ? <div className="h-full overflow-hidden">{modulZeigen(mitte)}</div> : null}
              </div>
            </section>
            }
          />
        )}

        {/* UNTEN: der Aktions-Knopf links, die Medien in der Mitte */}
        <footer className="relative flex shrink-0 items-center justify-center gap-2 py-1">
          <div className="absolute left-1">
            <button type="button" onClick={() => setAktionOffen(!aktionOffen)} title="Ein Tool in die Mitte legen" aria-label="Aktionen"
              className={`flex h-11 w-11 items-center justify-center rounded-full ${aktionOffen ? "bg-sky-500" : "bg-sky-600 hover:bg-sky-500"}`}>
              <Plus className="h-5 w-5" />
            </button>
            <Menue offen={aktionOffen} onZu={() => setAktionOffen(false)} className="bottom-full left-0 mb-2">
              <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">In die Mitte, für alle</p>
              <Eintrag aktiv={mitte === null} onClick={() => tool(null)}><Users className="h-4 w-4" /> Alle zeigen, für alle</Eintrag>
              <Eintrag aktiv={mitte === TOOL_PAD} onClick={() => { handle((s) => padOeffnen(s, TOOL_PAD, wer)); setAktionOffen(false) }}><span className="w-4 text-center">✎</span> Zeichenpad</Eintrag>
              <Eintrag aktiv={mitte === TOOL_UMFRAGE} onClick={() => tool(TOOL_UMFRAGE)}><span className="w-4 text-center">▤</span> Umfrage</Eintrag>
              {/* Ein Eintrag fuer den Kreis (Timo, 30.09.2026: "nicht trennen,
                  einfach Kreisprozess"). Ohne ihn ist es ein normales Meeting. */}
              <Aufklapp titel="Kreisprozess" zeichen={<CircleDot className="h-4 w-4" />}>
                <Eintrag aktiv={mitte === TOOL_KREIS && !prozess} onClick={() => tool(TOOL_KREIS)}>
                  <span className="w-4" /> Freier Kreis mit Redestab
                </Eintrag>
                {PROZESSE.map((p) => (
                  <Eintrag key={p.id} aktiv={mitte === TOOL_KREIS && prozess?.id === p.id} onClick={() => kreisMitProzess(p.id)}>
                    <span className="w-4" /> {p.name}
                  </Eintrag>
                ))}
              </Aufklapp>
              <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Für alle</p>
              <Aufklapp titel={`Dauer des Meetings${sitzung.regeln?.sitzungsdauer ? `: ${dauerText(sitzung.regeln.sitzungsdauer)}` : ""}`} zeichen={<span className="w-4 text-center">⌛</span>}>
                <div className="grid grid-cols-4 gap-1 px-3 pb-2 pt-1">
                  {SITZUNG_STUFEN.map((m) => (
                    <button key={m} type="button" aria-pressed={(sitzung.regeln?.sitzungsdauer ?? 0) === m}
                      onClick={() => { handle((s, t) => regelnSetzen(s, { ...regelnVon(s), sitzungsdauer: m }, wer, t)); setAktionOffen(false) }}
                      className={`rounded-md px-1.5 py-1 text-xs ${(sitzung.regeln?.sitzungsdauer ?? 0) === m ? "bg-sky-600 text-white" : "bg-slate-100 hover:bg-slate-200"}`}>{dauerText(m)}</button>
                  ))}
                </div>
                <p className="px-3 pb-2 text-[11px] text-slate-500">Am Ende klingt ein eigener Ton, das Meeting läuft weiter.</p>
              </Aufklapp>
              <Eintrag onClick={() => { handle((s, t) => losZiehen(s, teilnehmer.map((p) => ({ id: p.id, name: p.name })), wer, t)); setAktionOffen(false) }}>
                <span className="w-4 text-center">🎲</span> Zufällig jemanden wählen
              </Eintrag>
              <Aufklapp titel="Kurzzeitwecker" zeichen={<span className="w-4 text-center">⏱</span>}>
                <p className="px-3 pt-1 text-[11px] text-slate-500">Für eine Pause oder eine Übung. Die Redezeit steht unter ⋮ Einstellungen.</p>
                <div className="grid grid-cols-4 gap-1 px-3 pb-2 pt-1">
                  {WECKER_MINUTEN.map((m) => (
                    <button key={m} type="button" onClick={() => { handle((s, t) => weckerStellen(s, m, wer, t)); setAktionOffen(false) }}
                      className="rounded-md bg-slate-100 px-1.5 py-1 text-xs hover:bg-slate-200">{m} Min.</button>
                  ))}
                </div>
              </Aufklapp>
              {module.length > 0 && (
                <>
                  <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Module</p>
                  {module.map((m) => (
                    <Eintrag key={m.id} aktiv={mitte === m.id} onClick={() => tool(m.id)}><span className="w-4" /> {m.label}</Eintrag>
                  ))}
                </>
              )}
            </Menue>
          </div>

          {raum.traegtMedien && mich && (
            <>
              <Rund an={mich.mikroAn} warnung={!mich.mikroAn} titel={mich.mikroAn ? "Stummschalten" : "Stummschaltung aufheben"} onClick={() => void medien("Mikrofon", () => raum.mikro(!mich.mikroAn))}>
                {mich.mikroAn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Rund>
              <Rund an={mich.kameraAn} titel={mich.kameraAn ? "Kamera aus" : "Kamera an"} onClick={() => void medien("Kamera", () => raum.kamera(!mich.kameraAn))}>
                {mich.kameraAn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Rund>
              {raum.bildschirm && (
                <Rund an={!!mich.teiltBildschirm} titel={mich.teiltBildschirm ? "Teilen beenden" : moderation.bildschirm ? "Bildschirm teilen" : "Bildschirm teilen ist gerade gesperrt"}
                  onClick={() => { if (mich.teiltBildschirm || moderation.bildschirm) void medien("Bildschirm", () => raum.bildschirm?.(!mich.teiltBildschirm)) }}>
                  <MonitorUp className="h-5 w-5" />
                </Rund>
              )}
            </>
          )}
          <button type="button" disabled={!ichHalte && (halterDa || stille)}
            onClick={() => handle((s, t) => ichHalte ? stabZuruecklegen(s, wer, t) : stabNehmen(s, wer, mich?.name ?? "Gast", teilnehmer.map((p) => p.id), t))}
            title={ichHalte ? "Das Wort abgeben: der Stab kehrt in die Mitte" : "Das Wort nehmen: den Redestab halten"}
            className={`flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition disabled:opacity-40 ${ichHalte ? "bg-amber-400 text-slate-900 hover:bg-amber-300" : "bg-white/10 text-slate-100 hover:bg-white/20"}`}>
            <CircleDot className="h-4 w-4" />
            {ichHalte ? (rest !== null ? `Wort abgeben · ${mmss(rest)}` : "Wort abgeben") : "Wort nehmen"}
          </button>
          <Rund an={!!ich && neben.haende.has(ich)} titel="Hand heben oder senken" onClick={neben.handUmschalten}><Hand className="h-5 w-5" /></Rund>
          <div className="relative">
            <Rund an={zeichenOffen} titel="Ein Zeichen geben" onClick={() => setZeichenOffen(!zeichenOffen)}><Smile className="h-5 w-5" /></Rund>
            {zeichenOffen && (
              <div className="absolute bottom-full left-1/2 z-50 mb-2 flex -translate-x-1/2 gap-1 rounded-xl bg-slate-800 p-1.5 shadow-2xl">
                {(Object.keys(ZEICHEN) as ZeichenArt[]).map((art) => (
                  <button key={art} type="button" onClick={() => { neben.zeichenGeben(art); if (vorlieben.reaktionenSchliessen) setZeichenOffen(false) }} aria-label={art} className="flex h-9 w-9 items-center justify-center rounded-lg text-lg hover:scale-110 hover:bg-white/10">
                    {ZEICHEN[art]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Rund titel="Die Klangschale schlagen: Stille für alle" onClick={schale}><Bell className="h-5 w-5" /></Rund>
          {leertaste && <span className="absolute right-1 hidden rounded-lg bg-emerald-500/20 px-2.5 py-1 text-[10px] font-medium text-emerald-300 sm:block">Leertaste: du sprichst</span>}
        </footer>

        <LosAnzeige los={sitzung.los} />
        {einladen && einladenOffen && <EinladenDialog gruppe={raumName} einladen={einladen} onZu={() => setEinladenOffen(false)} />}
        {sitzungsEnde && !abschlussGesehen && (
          <div role="status" className="absolute inset-x-0 top-16 z-40 flex justify-center px-4">
            <span className="flex items-center gap-3 rounded-2xl bg-amber-400 px-5 py-3 text-slate-900 shadow-2xl">
              <span className="font-semibold">Die Zeit des Meetings ist um. Zeit für die Abschlussrunde.</span>
              <button type="button" onClick={() => setAbschlussGesehen(true)} aria-label="Hinweis schließen" className="rounded-full p-1 hover:bg-black/10"><X className="h-4 w-4" /></button>
            </span>
          </div>
        )}
        {ueberblickOffen && <UeberblickDialog kreis={kreis} raumName={raumName} zahlen={ueberblick} seit={seit} onZu={() => setUeberblickOffen(false)} />}
        {gruppenOffen && (
          <GruppenraeumeDialog teilnehmer={teilnehmer} onZu={() => setGruppenOffen(false)}
            onStarten={(r, min, selbst) => handle((s, t) => gruppenraeumeStarten(s, r, min, selbst, wer, t))} />
        )}
        {layoutOffen && <LayoutDialog aktuell={vorlieben.layout} onUebernehmen={layoutSetzen} onZu={() => setLayoutOffen(false)} />}
        {einstellungenOffen && (
          <EinstellungenDialog regeln={regelnVon(sitzung)} stilleVorgabe={stilleSekundenVon({ ...sitzung, regeln: undefined }, prozess)}
            onZu={() => setEinstellungenOffen(false)} onRegelnSpeichern={(r) => handle((s, t) => regelnSetzen(s, r, wer, t))} />
        )}
        {einblendungen.length > 0 && (
          <div aria-live="polite" className="pointer-events-none absolute right-3 top-14 z-40 flex w-72 flex-col gap-2">
            {einblendungen.map((e) => (
              <div key={e.id} role="status" className="rounded-xl bg-slate-800/95 px-3.5 py-2.5 text-sm text-slate-100 shadow-xl ring-1 ring-white/10">{e.text}</div>
            ))}
          </div>
        )}
        {meldung && (
          <div role="alert" className="pointer-events-none absolute inset-x-0 bottom-20 flex justify-center px-4">
            <span className="max-w-xl rounded-xl bg-rose-600/95 px-4 py-2 text-sm text-white shadow-lg">{meldung}</span>
          </div>
        )}
        {!meldung && raum.traegtMedien && mich && !mich.mikroAn && (
          <div className="pointer-events-none absolute inset-x-0 bottom-20 flex justify-center">
            <span className="flex items-center gap-2 rounded-xl bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-slate-200 shadow-lg">
              <MicOff className="h-3.5 w-3.5 text-rose-400" /> Du bist stumm <span className="text-slate-400">· Leertaste halten zum Sprechen</span>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Ordnet Menschen und Tool nach dem Layout (wie in Big Blue Button). Die
 * Teile kommen fertig herein; hier steht nur die Anordnung.
 */
function LayoutFlaeche({ art, streifen, werkzeug, galerie, toolKlein }: {
  art: LayoutArt
  streifen: (form: "quer" | "hoch" | "klein") => ReactNode
  werkzeug: ReactNode
  galerie: ReactNode
  toolKlein: ReactNode
}) {
  if (art === "rechts") return <div className="flex min-h-0 flex-1 gap-2">{werkzeug}{streifen("hoch")}</div>
  if (art === "praesentation") return <div className="relative flex min-h-0 flex-1 flex-col">{werkzeug}{streifen("klein")}</div>
  if (art === "video") return <div className="relative min-h-0 flex-1">{galerie}{toolKlein}</div>
  return <>{streifen("quer")}{werkzeug}</>
}

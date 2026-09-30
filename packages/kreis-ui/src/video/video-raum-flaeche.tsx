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
  Bell, ChevronLeft, CircleDot, FileText, Hand, LogOut, Maximize2, MessageSquare,
  Mic, MicOff, MonitorUp, MoreVertical, PanelLeft, Plus, Smile, Users, Video, VideoOff,
} from "lucide-react"
import {
  PROZESSE, aktuellerSchritt, losZiehen, mitteSetzen, prozessWaehlen, schaleSchlagen, stilleLaeuft,
  weckerAus, weckerStellen, type KreisTeilnehmer,
} from "@kreis/core"
import { schaleAnschlagen } from "../klangschale"
import { useKreisVerbindung, type KreisKontext } from "../raum-kontext"
import { AndererRaum, KreisWerkzeug, OhneRaum, Vorraum } from "../kreis-raum-flaeche"
import { ZEICHEN, spracherkennungVorhanden, type ZeichenArt } from "../use-neben"
import { VideoBuehne } from "./video-buehne"
import { VideoKachel } from "./video-kachel"
import { Tafel } from "./tafel"
import { Chat, Menschen, Protokoll, type ProtokollSpeichern } from "./video-seiten"
import { GeteilteNotizen, LosAnzeige, UmfrageWerkzeug, WeckerAnzeige } from "./werkzeuge"

/** Die Tools, die das Video selbst mitbringt. Module kommen aus dem Register dazu. */
export const TOOL_KREIS = "kreis"
export const TOOL_TAFEL = "tafel"
export const TOOL_UMFRAGE = "umfrage"

const WECKER_MINUTEN = [1, 3, 5, 10, 15] as const

type Spalte = "chat" | "notizen" | "protokoll" | null

export interface ModulWahl { id: string; label: string }

export interface VideoRaumFlaecheProps {
  raumName: string
  vorschlagName?: string
  /** Die Module des Space, die sich als Tool in die Mitte legen lassen. */
  module?: readonly ModulWahl[]
  /** Zeigt ein Modul in der Mitte. Kommt von der App (Antons ModuleOutlet). */
  modulZeigen?: (id: string) => ReactNode
  /** Das Protokoll als Item ablegen. Fehlt es, gibt es keinen Knopf dafuer. */
  protokollSpeichern?: ProtokollSpeichern
}

const STILLE_OHNE_PROZESS = 20

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

function Menue({ offen, onZu, className, children }: { offen: boolean; onZu: () => void; className: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!offen) return
    const zu = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onZu() }
    const t = setTimeout(() => document.addEventListener("click", zu))
    return () => { clearTimeout(t); document.removeEventListener("click", zu) }
  }, [offen, onZu])
  if (!offen) return null
  return <div ref={ref} className={`absolute z-50 max-h-[70vh] w-72 overflow-y-auto rounded-xl bg-white p-1.5 text-slate-800 shadow-2xl ${className}`}>{children}</div>
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
        einleitung="Bild, Ton und Bildschirm für alle im Space. In der Mitte legt ihr ein Tool für alle hinein: den Kreis mit dem Redestab, die Tafel, ein Modul."
        knopf="Der Konferenz beitreten"
      />
    )
  }
  return <InDerKonferenz kreis={kreis} {...props} />
}

function InDerKonferenz({ kreis, raumName, module = [], modulZeigen, protokollSpeichern }: VideoRaumFlaecheProps & { kreis: KreisKontext }) {
  const { raum, teilnehmer, ich, sitzung, prozess, jetzt, handle, neben } = kreis
  const [leisteOffen, setLeisteOffen] = useState(true)
  const [spalte, setSpalte] = useState<Spalte>(null)
  const [aktionOffen, setAktionOffen] = useState(false)
  const [mehrOffen, setMehrOffen] = useState(false)
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
    : mitte === TOOL_TAFEL ? "Tafel" : mitte === TOOL_UMFRAGE ? "Umfrage" : mitte ? module.find((m) => m.id === mitte)?.label ?? mitte : null

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
    if (!raum.traegtMedien) return
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
  }, [raum, mich?.mikroAn, leertaste, medien])

  // Die Zeit ist um: einmal ein leiser, hoher Klang, bei allen.
  const weckerGeklungen = useRef(0)
  const wecker = sitzung.wecker ?? null
  useEffect(() => {
    if (!wecker || jetzt < wecker.bis || weckerGeklungen.current === wecker.bis) return
    weckerGeklungen.current = wecker.bis
    schaleAnschlagen(392, 0.25)
  }, [wecker, jetzt])

  const wer = ich ?? ""
  const tool = (was: string | null) => { handle((s) => mitteSetzen(s, was, wer)); setAktionOffen(false) }
  const kreisMitProzess = (id: string) => {
    const p = PROZESSE.find((x) => x.id === id)
    if (!p) return
    handle((s, t) => mitteSetzen(prozessWaehlen(s, p, wer, t), TOOL_KREIS, wer))
    setAktionOffen(false)
  }
  const schale = () => handle((s, t) => schaleSchlagen(s, wer, prozess?.stilleSekunden ?? STILLE_OHNE_PROZESS, t))
  const spalteZeigen = (b: Exclude<Spalte, null>) => setSpalte(spalte === b ? null : b)

  const kachel = (p: KreisTeilnehmer) => (
    <VideoKachel person={p} raum={raum} handOben={neben.haende.has(p.id)}
      zeichen={neben.zeichen.get(p.id)?.art ?? null} haeltStab={halterDa && sitzung.stab.halter === p.id} />
  )

  return (
    <div ref={huelle} className="relative flex h-full w-full overflow-hidden bg-slate-950 text-white">
      {/* LINKS: die Leiste wie bei Big Blue Button */}
      {leisteOffen && (
        <nav aria-label="Konferenz" className="flex w-56 shrink-0 flex-col overflow-y-auto bg-slate-900 text-sm">
          <p className="px-4 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Nachrichten</p>
          <button type="button" onClick={() => spalteZeigen("chat")} aria-pressed={spalte === "chat"}
            className={`mx-2 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left ${spalte === "chat" ? "bg-white/10" : "hover:bg-white/5"}`}>
            <MessageSquare className="h-4 w-4 text-slate-300" /> Gemeinsamer Chat
            {ungelesen > 0 && <span className="ml-auto rounded-full bg-sky-500 px-1.5 text-[10px] font-bold">{ungelesen}</span>}
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
          <p className="px-4 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Teilnehmer ({teilnehmer.length})</p>
          <Menschen teilnehmer={teilnehmer} haende={neben.haende} stab={halterDa ? sitzung.stab.halter : null} medien={raum.traegtMedien} />
        </nav>
      )}

      {/* Daneben die Spalte, die ein Eintrag aufklappt */}
      {leisteOffen && spalte && (
        <aside className="flex w-80 shrink-0 flex-col border-l border-white/5 bg-slate-900/70">
          <header className="flex items-center gap-1 px-2 py-3">
            <button type="button" onClick={() => setSpalte(null)} aria-label="Spalte schließen" className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h3 className="text-sm font-semibold">{spalte === "chat" ? "Gemeinsamer Chat" : spalte === "notizen" ? "Geteilte Notizen" : "Protokoll"}</h3>
          </header>
          <div className="min-h-0 flex-1 overflow-hidden">
            {spalte === "chat" ? <Chat kreis={kreis} /> : spalte === "notizen" ? <GeteilteNotizen kreis={kreis} /> : <Protokoll kreis={kreis} speichern={protokollSpeichern} />}
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
            </p>
          </div>
          {wecker && <WeckerAnzeige bis={wecker.bis} jetzt={jetzt} onAus={() => handle((s) => weckerAus(s, wer))} />}
          <button type="button" onClick={() => void kreis.verlassen()} title="Die Konferenz verlassen" aria-label="gehen"
            className="flex h-9 items-center gap-1.5 rounded-full bg-rose-600 px-3 text-xs font-medium hover:bg-rose-700">
            <LogOut className="h-4 w-4" /> gehen
          </button>
          <div className="relative">
            <button type="button" onClick={() => setMehrOffen(!mehrOffen)} aria-label="Mehr" className="rounded-lg p-2 text-slate-300 hover:bg-white/10">
              <MoreVertical className="h-5 w-5" />
            </button>
            <Menue offen={mehrOffen} onZu={() => setMehrOffen(false)} className="right-0 top-full mt-1">
              <Eintrag onClick={() => { setMehrOffen(false); void huelle.current?.requestFullscreen?.().catch(() => {}) }}>
                <Maximize2 className="h-4 w-4" /> Vollbild
              </Eintrag>
              <p className="px-3 py-2 text-xs text-slate-500">Leertaste halten: sprechen, solange sie gedrückt ist.</p>
            </Menue>
          </div>
        </header>

        {mitte === null ? (
          // Alle zeigen: die Menschen gross, ohne Tool
          <div className="min-h-0 flex-1">
            <VideoBuehne teilnehmer={teilnehmer} raum={raum} ansicht="galerie"
              stabHalter={halterDa ? sitzung.stab.halter : null} haende={neben.haende} zeichen={neben.zeichen} />
          </div>
        ) : (
          <>
            {/* OBEN: die Menschen mit Bild */}
            <div className="flex shrink-0 gap-2 overflow-x-auto pb-1" aria-label="Die Menschen">
              {teilnehmer.map((p) => <div key={p.id} className="w-32 shrink-0">{kachel(p)}</div>)}
            </div>
            {/* MITTE: das Tool im Modul, fuer alle */}
            <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-background text-foreground">
              <header className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2">
                <span className="text-sm font-semibold">{toolName}</span>
                <span className="text-xs text-muted-foreground">liegt in der Mitte, für alle</span>
                <button type="button" onClick={() => tool(null)} className="ml-auto flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium hover:bg-muted/70">
                  <Users className="h-3.5 w-3.5" /> Alle zeigen
                </button>
              </header>
              <div className="min-h-0 flex-1 overflow-hidden">
                {mitte === TOOL_KREIS ? <div className="h-full overflow-hidden"><KreisWerkzeug kreis={kreis} /></div>
                  : mitte === TOOL_UMFRAGE ? <UmfrageWerkzeug kreis={kreis} />
                  : mitte === TOOL_TAFEL ? <div className="h-full p-3"><Tafel striche={neben.tafel} ich={wer} onStrich={neben.tafelStrich} onLeeren={neben.tafelLeeren} /></div>
                  : modulZeigen ? <div className="h-full overflow-hidden">{modulZeigen(mitte)}</div> : null}
              </div>
            </section>
          </>
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
              <Eintrag aktiv={mitte === null} onClick={() => tool(null)}><Users className="h-4 w-4" /> Alle zeigen</Eintrag>
              <Eintrag aktiv={mitte === TOOL_TAFEL} onClick={() => tool(TOOL_TAFEL)}><span className="w-4 text-center">✎</span> Tafel</Eintrag>
              <Eintrag aktiv={mitte === TOOL_UMFRAGE} onClick={() => tool(TOOL_UMFRAGE)}><span className="w-4 text-center">▤</span> Umfrage</Eintrag>
              <Eintrag aktiv={mitte === TOOL_KREIS && !prozess} onClick={() => tool(TOOL_KREIS)}><CircleDot className="h-4 w-4" /> Kreis mit Redestab</Eintrag>
              <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Kreis mit Prozess</p>
              {PROZESSE.map((p) => (
                <Eintrag key={p.id} aktiv={mitte === TOOL_KREIS && prozess?.id === p.id} onClick={() => kreisMitProzess(p.id)}>
                  <span className="w-4" /> {p.name}
                </Eintrag>
              ))}
              <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Für alle</p>
              <Eintrag onClick={() => { handle((s, t) => losZiehen(s, teilnehmer.map((p) => ({ id: p.id, name: p.name })), wer, t)); setAktionOffen(false) }}>
                <span className="w-4 text-center">🎲</span> Zufällig jemanden wählen
              </Eintrag>
              <div className="flex flex-wrap items-center gap-1 px-3 py-2 text-sm">
                <span className="mr-1">Kurzzeitwecker:</span>
                {WECKER_MINUTEN.map((m) => (
                  <button key={m} type="button" onClick={() => { handle((s, t) => weckerStellen(s, m, wer, t)); setAktionOffen(false) }}
                    className="rounded-md bg-slate-100 px-2 py-0.5 text-xs hover:bg-slate-200">{m} Min.</button>
                ))}
              </div>
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
                <Rund an={!!mich.teiltBildschirm} titel={mich.teiltBildschirm ? "Teilen beenden" : "Bildschirm teilen"} onClick={() => void medien("Bildschirm", () => raum.bildschirm?.(!mich.teiltBildschirm))}>
                  <MonitorUp className="h-5 w-5" />
                </Rund>
              )}
            </>
          )}
          <Rund an={!!ich && neben.haende.has(ich)} titel="Hand heben oder senken" onClick={neben.handUmschalten}><Hand className="h-5 w-5" /></Rund>
          <div className="relative">
            <Rund an={zeichenOffen} titel="Ein Zeichen geben" onClick={() => setZeichenOffen(!zeichenOffen)}><Smile className="h-5 w-5" /></Rund>
            {zeichenOffen && (
              <div className="absolute bottom-full left-1/2 z-50 mb-2 flex -translate-x-1/2 gap-1 rounded-xl bg-slate-800 p-1.5 shadow-2xl">
                {(Object.keys(ZEICHEN) as ZeichenArt[]).map((art) => (
                  <button key={art} type="button" onClick={() => { neben.zeichenGeben(art); setZeichenOffen(false) }} aria-label={art} className="flex h-9 w-9 items-center justify-center rounded-lg text-lg hover:scale-110 hover:bg-white/10">
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

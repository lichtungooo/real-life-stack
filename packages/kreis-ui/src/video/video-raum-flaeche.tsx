// Die Konferenz als Flaeche, ohne das Toolkit (Spec: docs/spec/modules/video.md).
//
// Aufbau nach Big Blue Button (Timo, 29.09.2026): In der MITTE liegt, was
// fuer alle dort liegt (die Menschen, die Tafel oder ein Modul). OBEN stehen
// die Menschen mit Bild als Streifen, sobald etwas in der Mitte liegt. LINKS
// die Menschen nur mit Namen, darunter Chat oder Protokoll, auf- und
// zuklappbar. Unten die Steuerleiste.
//
// Andere Module kommen von aussen herein (`module`, `modulZeigen`): Diese
// Flaeche kennt keines beim Namen.

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import {
  Bell, Blocks, CircleDot, Hand, LayoutGrid, LogOut, MessageSquare,
  Mic, MicOff, MonitorUp, Smile, User, Users, Video, VideoOff, X,
} from "lucide-react"
import { aktuellerSchritt, mitteSetzen, schaleSchlagen, stilleLaeuft, type KreisTeilnehmer } from "@kreis/core"
import { useKreisVerbindung, type KreisKontext } from "../raum-kontext"
import { AndererRaum, OhneRaum, Vorraum } from "../kreis-raum-flaeche"
import { ZEICHEN, spracherkennungVorhanden, type ZeichenArt } from "../use-neben"
import { VideoBuehne, type Ansicht } from "./video-buehne"
import { VideoKachel } from "./video-kachel"
import { Tafel } from "./tafel"
import { Chat, Menschen, Protokoll, type ProtokollSpeichern } from "./video-seiten"

type LinkesBlatt = "chat" | "protokoll"

export interface ModulWahl { id: string; label: string }

export interface VideoRaumFlaecheProps {
  raumName: string
  vorschlagName?: string
  /** Die Module des Space, die sich in die Mitte legen lassen. */
  module?: readonly ModulWahl[]
  /** Zeigt ein Modul in der Mitte. Kommt von der App (Antons ModuleOutlet). */
  modulZeigen?: (id: string) => ReactNode
  /** Weg in den Kreis, ohne die Verbindung zu trennen. */
  zumKreis?: () => void
  /** Das Protokoll als Item ablegen. Fehlt es, gibt es keinen Knopf dafuer. */
  protokollSpeichern?: ProtokollSpeichern
}

const STILLE_OHNE_PROZESS = 20

function dauer(seit: number, jetzt: number): string {
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
        einleitung="Bild, Ton und Bildschirm für alle im Space. In der Mitte eine Tafel für alle, oder ein Modul: der Kreis mit dem Redestab, das Kanban, die Karte."
        knopf="Der Konferenz beitreten"
      />
    )
  }
  return <InDerKonferenz kreis={kreis} {...props} />
}

function InDerKonferenz({ kreis, raumName, module = [], modulZeigen, zumKreis, protokollSpeichern }: VideoRaumFlaecheProps & { kreis: KreisKontext }) {
  const { raum, teilnehmer, ich, sitzung, prozess, jetzt, handle, neben } = kreis
  const [ansicht, setAnsicht] = useState<Ansicht>("galerie")
  const [links, setLinks] = useState<LinkesBlatt>("chat")
  const [linksOffen, setLinksOffen] = useState(true)
  const [mitteWahlOffen, setMitteWahlOffen] = useState(false)
  const [seit] = useState(() => Date.now())
  const [gelesen, setGelesen] = useState(0)
  const [zeichenOffen, setZeichenOffen] = useState(false)
  const [leertaste, setLeertaste] = useState(false)
  const [meldung, setMeldung] = useState<string | null>(null)
  const warStummRef = useRef(false)
  const mich = teilnehmer.find((t) => t.ichSelbst) ?? null
  const schritt = aktuellerSchritt(sitzung, prozess)
  const stille = stilleLaeuft(sitzung, jetzt)
  const halterDa = sitzung.stab.halter !== null && teilnehmer.some((t) => t.id === sitzung.stab.halter)
  const mitte = sitzung.mitte ?? null
  const mitteName = mitte === "tafel" ? "Tafel" : mitte ? module.find((m) => m.id === mitte)?.label ?? mitte : null

  const chatSichtbar = linksOffen && links === "chat"
  useEffect(() => { if (chatSichtbar) setGelesen(neben.chat.length) }, [chatSichtbar, neben.chat.length])
  const ungelesen = chatSichtbar ? 0 : Math.max(0, neben.chat.length - gelesen)

  /**
   * Kamera, Mikrofon, Bildschirm: Scheitert es, sagt die Flaeche es, statt
   * dass ein Knopf still bleibt (Timo, 29.09.2026: "Stumm schalten kann ich
   * nicht wegmachen").
   */
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

  const schale = () => handle((s, t) => schaleSchlagen(s, ich ?? "", prozess?.stilleSekunden ?? STILLE_OHNE_PROZESS, t))
  const inDieMitte = (was: string | null) => { handle((s) => mitteSetzen(s, was, ich ?? "")); setMitteWahlOffen(false) }
  const linksZeigen = (b: LinkesBlatt) => {
    if (linksOffen && links === b) setLinksOffen(false)
    else { setLinks(b); setLinksOffen(true) }
  }

  const kachel = (p: KreisTeilnehmer) => (
    <VideoKachel
      person={p}
      raum={raum}
      handOben={neben.haende.has(p.id)}
      zeichen={neben.zeichen.get(p.id)?.art ?? null}
      haeltStab={halterDa && sitzung.stab.halter === p.id}
    />
  )

  const mitteWahl = [{ id: null as string | null, label: "Die Menschen" }, { id: "tafel" as string | null, label: "Tafel" }, ...module]

  return (
    <div className="relative flex h-full w-full flex-col gap-2 bg-slate-950 p-2 text-white">
      {/* Kopfzeile: Raum, Dauer, die Bruecke zum Kreis */}
      <header className="flex shrink-0 flex-wrap items-center gap-3 px-1.5">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{raumName}</h2>
          <p className="text-[11px] tabular-nums text-slate-400">
            {dauer(seit, jetzt)} · {teilnehmer.length} {teilnehmer.length === 1 ? "Mensch" : "Menschen"}
          </p>
        </div>
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
            <button type="button" onClick={zumKreis} className="shrink-0 rounded-lg px-1.5 py-0.5 text-slate-300 hover:bg-white/10 hover:text-white">zum Kreis</button>
          )}
        </div>
        {mitte === null && (
          <div className="ml-auto flex rounded-xl bg-slate-900 p-1">
            {([["sprecher", "Sprecher", User], ["galerie", "Galerie", LayoutGrid]] as const).map(([id, text, Icon]) => (
              <button key={id} type="button" onClick={() => setAnsicht(id)} aria-pressed={ansicht === id}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition ${ansicht === id ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"}`}>
                <Icon className="h-3.5 w-3.5" /> {text}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="flex min-h-0 flex-1 gap-2">
        {/* Links wie bei Big Blue Button: die Menschen nur mit Namen, darunter Chat oder Protokoll */}
        {linksOffen && (
          <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-2xl bg-slate-900 sm:w-64">
            <div className="max-h-[40%] shrink-0 overflow-y-auto border-b border-white/5 pb-1">
              <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Menschen · {teilnehmer.length}</p>
              <Menschen teilnehmer={teilnehmer} haende={neben.haende} stab={halterDa ? sitzung.stab.halter : null} medien={raum.traegtMedien} />
            </div>
            <div className="flex shrink-0 gap-1 px-3 pt-2">
              <button type="button" onClick={() => setLinks("chat")} aria-pressed={links === "chat"} className={`rounded-lg px-2.5 py-1 text-xs font-medium ${links === "chat" ? "bg-white/15" : "text-slate-400 hover:text-white"}`}>Chat</button>
              {spracherkennungVorhanden() && (
                <button type="button" onClick={() => setLinks("protokoll")} aria-pressed={links === "protokoll"} className={`rounded-lg px-2.5 py-1 text-xs font-medium ${links === "protokoll" ? "bg-white/15" : "text-slate-400 hover:text-white"}`}>
                  Protokoll{neben.protokollLaeuft ? " ·" : ""}
                </button>
              )}
              <button type="button" onClick={() => setLinksOffen(false)} aria-label="Seite schließen" className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden pt-1">
              {links === "chat" ? <Chat kreis={kreis} /> : <Protokoll kreis={kreis} speichern={protokollSpeichern} />}
            </div>
          </aside>
        )}

        <main className={`min-h-0 min-w-0 flex-1 flex-col gap-2 ${linksOffen ? "hidden sm:flex" : "flex"}`}>
          {mitte === null ? (
            <div className="min-h-0 flex-1">
              <VideoBuehne
                teilnehmer={teilnehmer}
                raum={raum}
                ansicht={ansicht}
                stabHalter={halterDa ? sitzung.stab.halter : null}
                haende={neben.haende}
                zeichen={neben.zeichen}
              />
            </div>
          ) : (
            <>
              {/* Oben die Menschen mit Bild, als Streifen */}
              <div className="flex shrink-0 gap-2 overflow-x-auto pb-1" aria-label="Die Menschen">
                {teilnehmer.map((p) => <div key={p.id} className="w-36 shrink-0">{kachel(p)}</div>)}
              </div>
              {/* In der Mitte, was fuer alle dort liegt */}
              <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-background text-foreground">
                <header className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2">
                  <span className="text-sm font-semibold">{mitteName}</span>
                  <span className="text-xs text-muted-foreground">liegt in der Mitte, für alle</span>
                  <button type="button" onClick={() => inDieMitte(null)} className="ml-auto rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">zurück zu den Menschen</button>
                </header>
                <div className="min-h-0 flex-1 overflow-hidden p-3">
                  {mitte === "tafel"
                    ? <Tafel striche={neben.tafel} ich={ich ?? ""} onStrich={neben.tafelStrich} onLeeren={neben.tafelLeeren} />
                    : modulZeigen ? <div className="h-full overflow-hidden">{modulZeigen(mitte)}</div> : null}
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      {meldung && (
        <div role="alert" className="absolute inset-x-0 bottom-[84px] flex justify-center px-4">
          <span className="max-w-xl rounded-xl bg-rose-600/95 px-4 py-2 text-sm text-white shadow-lg">{meldung}</span>
        </div>
      )}
      {!meldung && raum.traegtMedien && mich && !mich.mikroAn && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[84px] flex justify-center">
          <span className="flex items-center gap-2 rounded-xl bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-slate-200 shadow-lg">
            <MicOff className="h-3.5 w-3.5 text-rose-400" /> Du bist stumm <span className="text-slate-400">· Leertaste halten zum Sprechen</span>
          </span>
        </div>
      )}

      {/* Steuerleiste */}
      <footer className="flex shrink-0 flex-wrap items-center justify-center gap-1 rounded-2xl bg-slate-900 px-3 py-2 sm:justify-between">
        <div className="flex items-center gap-1">
          {raum.traegtMedien && mich && (
            <>
              <Knopf an={mich.mikroAn} warnung={!mich.mikroAn} titel={mich.mikroAn ? "Stummschalten" : "Stummschaltung aufheben"} beschriftung={mich.mikroAn ? "Ton an" : "stumm"} onClick={() => void medien("Mikrofon", () => raum.mikro(!mich.mikroAn))}>
                {mich.mikroAn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Knopf>
              <Knopf an={mich.kameraAn} warnung={!mich.kameraAn} titel={mich.kameraAn ? "Kamera aus" : "Kamera an"} beschriftung={mich.kameraAn ? "Bild an" : "kein Bild"} onClick={() => void medien("Kamera", () => raum.kamera(!mich.kameraAn))}>
                {mich.kameraAn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Knopf>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1">
          <Knopf an={linksOffen && links === "chat"} titel="Chat auf und zu" beschriftung="Chat" onClick={() => linksZeigen("chat")} zahl={ungelesen}><MessageSquare className="h-5 w-5" /></Knopf>
          <div className="relative">
            <Knopf an={mitteWahlOffen || mitte !== null} titel="Etwas in die Mitte legen, für alle" beschriftung="Mitte" onClick={() => setMitteWahlOffen(!mitteWahlOffen)}><Blocks className="h-5 w-5" /></Knopf>
            {mitteWahlOffen && (
              <div className="absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-xl bg-slate-800 p-1.5 shadow-2xl">
                <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">In die Mitte, für alle</p>
                {mitteWahl.map((m) => (
                  <button key={m.id ?? "menschen"} type="button" onClick={() => inDieMitte(m.id)}
                    className={`flex w-full items-center rounded-lg px-2.5 py-2 text-left text-sm hover:bg-white/10 ${mitte === m.id ? "text-amber-300" : "text-slate-200"}`}>
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {raum.bildschirm && mich && (
            <Knopf an={!!mich.teiltBildschirm} titel={mich.teiltBildschirm ? "Teilen beenden" : "Bildschirm teilen"} beschriftung="teilen" onClick={() => void medien("Bildschirm", () => raum.bildschirm?.(!mich.teiltBildschirm))}><MonitorUp className="h-5 w-5" /></Knopf>
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
          {!linksOffen && (
            <Knopf titel="Menschen und Chat links zeigen" beschriftung="Menschen" onClick={() => setLinksOffen(true)} zahl={teilnehmer.length}><Users className="h-5 w-5" /></Knopf>
          )}
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

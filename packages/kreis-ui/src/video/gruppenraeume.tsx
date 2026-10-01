// Gruppenraeume, wie in Big Blue Button (Timo, 30.09.2026, mit Bildschirm-
// foto): Anzahl, Dauer, selbst aussuchen, Menschen per Ziehen zuordnen oder
// zufaellig, dann Erstellen. Im Raum ein Hinweis mit Countdown; wer
// eingeteilt ist, wechselt selbst hinueber und kommt zur Zeit selbst zurueck.

import { useEffect, useRef, useState, type DragEvent } from "react"
import { Shuffle, X } from "lucide-react"
import {
  gruppenraeumeBeenden, meinGruppenraum, raeumePruefen, unterraumSchluessel, zufaelligVerteilen,
  type Gruppenraum, type KreisTeilnehmer,
} from "@kreis/core"
import type { KreisKontext } from "../raum-kontext"

const FEHLER: Record<string, string> = {
  "zu-wenige-raeume": "Es braucht wenigstens zwei Räume.",
  "raum-leer": "Jedem Gruppenraum muss wenigstens eine Person zugeordnet sein.",
  dauer: "Die Dauer liegt zwischen 1 und 240 Minuten.",
}

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

export function GruppenraeumeDialog({ teilnehmer, onStarten, onZu }: {
  teilnehmer: readonly KreisTeilnehmer[]
  onStarten: (raeume: Gruppenraum[], minuten: number, selbstWaehlen: boolean) => void
  onZu: () => void
}) {
  const [anzahl, setAnzahl] = useState(2)
  const [minuten, setMinuten] = useState(15)
  const [selbst, setSelbst] = useState(false)
  // Wer in welchem Raum ist: Id -> Raumnummer (0 = nicht zugewiesen).
  const [zuordnung, setZuordnung] = useState<Record<string, number>>({})
  const raumVon = (id: string) => Math.min(zuordnung[id] ?? 0, anzahl)
  const raeume: Gruppenraum[] = Array.from({ length: anzahl }, (_, i) => ({
    name: `Raum ${i + 1}`,
    mitglieder: teilnehmer.filter((t) => raumVon(t.id) === i + 1).map((t) => t.id),
  }))
  const fehler = raeumePruefen(raeume, minuten, selbst)

  const zuordnen = (id: string, raum: number) => setZuordnung((z) => ({ ...z, [id]: raum }))
  const zufaellig = () => {
    const verteilt = zufaelligVerteilen(teilnehmer.map((t) => t.id), anzahl)
    const z: Record<string, number> = {}
    verteilt.forEach((ids, i) => ids.forEach((id) => { z[id] = i + 1 }))
    setZuordnung(z)
  }
  const ablegen = (raum: number) => (e: DragEvent) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if (id) zuordnen(id, raum) }

  const spalte = (raum: number, titel: string) => (
    <div key={raum} className="flex min-w-[9rem] flex-1 flex-col gap-2">
      <p className="rounded-lg border border-border bg-muted/40 py-1.5 text-center text-sm font-semibold">{titel}</p>
      <ul onDragOver={(e) => e.preventDefault()} onDrop={ablegen(raum)} aria-label={titel}
        className="min-h-40 flex-1 space-y-1 rounded-lg border border-dashed border-border p-2">
        {teilnehmer.filter((t) => raumVon(t.id) === raum).map((t) => (
          <li key={t.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", t.id)}
            className="flex cursor-grab items-center gap-1 rounded-md bg-card px-2 py-1 text-sm shadow-sm">
            <span className="min-w-0 flex-1 truncate">{t.name}{t.ichSelbst ? " (ich)" : ""}</span>
            <select aria-label={`${t.name}: Raum`} value={raumVon(t.id)} onChange={(e) => zuordnen(t.id, Number(e.target.value))}
              className="rounded bg-muted px-1 text-xs">
              <option value={0}>–</option>
              {raeume.map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
            </select>
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <div role="dialog" aria-modal="true" aria-label="Gruppenräume" className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onZu}>
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-card text-foreground shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center gap-3 border-b px-6 py-4">
          <h3 className="flex-1 text-xl font-semibold">Gruppenräume</h3>
          <button type="button" onClick={onZu} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">Schließen</button>
          <button type="button" disabled={!!fehler} onClick={() => { onStarten(raeume, minuten, selbst); onZu() }}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40">Erstellen</button>
        </header>
        <div className="overflow-y-auto px-6 py-4">
          <p className="mb-4 text-sm text-muted-foreground">Tipp: Menschen lassen sich per Ziehen einem Raum zuordnen, oder über die Auswahl neben dem Namen.</p>
          <div className="mb-5 flex flex-wrap items-end gap-6">
            <label className="flex flex-col gap-1 text-sm">Anzahl der Räume
              <select value={anzahl} onChange={(e) => setAnzahl(Number(e.target.value))} className="rounded-lg border border-input bg-background px-3 py-2">
                {[2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">Dauer (Minuten)
              <input type="number" min={1} max={240} value={minuten} onChange={(e) => setMinuten(Number(e.target.value))}
                className="w-28 rounded-lg border border-input bg-background px-3 py-2" />
            </label>
            <label className="flex max-w-xs items-start gap-2 text-sm font-medium">
              <input type="checkbox" checked={selbst} onChange={(e) => setSelbst(e.target.checked)} className="mt-1" />
              Den Teilnehmenden erlauben, sich selbst einen Gruppenraum auszusuchen
            </label>
          </div>
          <div className="mb-3 flex items-center gap-3 border-t pt-4">
            <h4 className="text-lg font-semibold">Räume verwalten</h4>
            <button type="button" onClick={zufaellig} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              <Shuffle className="h-4 w-4" /> Zufällig zuordnen
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {spalte(0, `Nicht zugewiesen (${teilnehmer.filter((t) => raumVon(t.id) === 0).length})`)}
            {raeume.map((r, i) => spalte(i + 1, r.name))}
          </div>
          {fehler && <p className="mt-2 text-sm text-rose-600">{FEHLER[fehler]}</p>}
        </div>
      </div>
    </div>
  )
}

/**
 * Was die Gruppenraeume im Raum zeigen: im Hauptraum den Countdown, die Wahl
 * oder die Restzeit; im Gruppenraum die Restzeit und den Weg zurueck.
 * Wechsel und Rueckkehr geschehen hier, auf jedem Geraet selbst.
 */
export function GruppenraeumeHinweis({ kreis, hauptSchluessel, hauptTitel }: { kreis: KreisKontext; hauptSchluessel: string; hauptTitel: string }) {
  const { sitzung, ich, jetzt, handle, teilnehmer, unterraum } = kreis
  const meinName = teilnehmer.find((t) => t.id === ich)?.name ?? "Gast"
  const g = sitzung.gruppenraeume ?? null
  const laeuft = !!g && jetzt < g.bis
  const mein = ich ? meinGruppenraum(g, ich) : null
  const gefolgt = useRef(0)
  const [countdown, setCountdown] = useState<number | null>(null)

  const gehen = (nr: number) => {
    if (!g) return
    gefolgt.current = g.nr
    setCountdown(null)
    void kreis.inUnterraum(hauptSchluessel, hauptTitel, unterraumSchluessel(hauptSchluessel, nr), `${hauptTitel} · ${g.raeume[nr - 1]?.name ?? `Raum ${nr}`}`, g.bis, meinName)
  }

  // Eingeteilt: nach fuenf Sekunden von selbst hinueber (einmal je Start).
  useEffect(() => {
    if (unterraum || !g || !laeuft || g.selbstWaehlen || !mein || gefolgt.current === g.nr) return
    setCountdown(5)
  }, [unterraum, g, laeuft, mein])
  useEffect(() => {
    if (countdown === null) return
    if (countdown <= 0) { if (mein) gehen(mein); return }
    const t = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown])

  // Im Gruppenraum: zur Zeit von selbst zurueck, einmal je Gruppenraum
  // (Pruefkreis Kimi, 01.10.2026, Befund 9: der Sekundentakt loeste sonst
  // mehrfach Gehen und Betreten aus).
  const zurueckFuer = useRef<number | null>(null)
  useEffect(() => {
    if (!unterraum || jetzt < unterraum.bis || zurueckFuer.current === unterraum.bis) return
    zurueckFuer.current = unterraum.bis
    void kreis.zurueckInHauptraum(meinName)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unterraum, jetzt])

  const leiste = "flex shrink-0 flex-wrap items-center gap-3 rounded-xl bg-violet-600/90 px-4 py-2 text-sm text-white"

  if (unterraum) {
    return (
      <div role="status" className={leiste}>
        <span className="min-w-0 flex-1"><span className="font-semibold">{unterraum.titel}</span> · noch {mmss(unterraum.bis - jetzt)}</span>
        <button type="button" onClick={() => void kreis.zurueckInHauptraum(meinName)} className="rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30">
          Zurück in den Hauptraum
        </button>
      </div>
    )
  }
  if (!g || !laeuft) return null
  if (g.selbstWaehlen && gefolgt.current !== g.nr) {
    return (
      <div role="status" className={leiste}>
        <span className="font-semibold">Gruppenräume sind offen, noch {mmss(g.bis - jetzt)}. Wähle deinen Raum:</span>
        {g.raeume.map((r, i) => (
          <button key={r.name} type="button" onClick={() => gehen(i + 1)} className="rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30">{r.name}</button>
        ))}
      </div>
    )
  }
  if (countdown !== null && mein) {
    return (
      <div role="status" className={leiste}>
        <span className="min-w-0 flex-1">Du gehst gleich in <span className="font-semibold">{g.raeume[mein - 1]?.name}</span> ({countdown} s)</span>
        <button type="button" onClick={() => gehen(mein)} className="rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30">Jetzt gehen</button>
      </div>
    )
  }
  return (
    <div role="status" className={leiste}>
      <span className="min-w-0 flex-1">Gruppenräume laufen, noch {mmss(g.bis - jetzt)}. Alle kommen zur Zeit von selbst zurück.</span>
      <button type="button" onClick={() => handle((s) => gruppenraeumeBeenden(s, ich ?? ""))} className="rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30">
        <X className="mr-1 inline h-3 w-3" /> Hier beenden
      </button>
    </div>
  )
}

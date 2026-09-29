// Die Buehne: ein Mensch gross mit Streifen, oder alle als Galerie.
//
// Wer den Bildschirm teilt, kommt immer gross. Danach eine angeheftete
// Person, danach wer den Redestab haelt, danach wer spricht.
//
// ⚠ Der Sprecherwechsel ist gebremst (HALTEZEIT). `spricht` flattert
// mehrmals pro Sekunde; ohne Bremse wandert die Kachel zwischen Buehne und
// Streifen, React montiert sie neu, und das frische video-Element zeigt
// Schwarz, bis der Browser wieder dekodiert (Lehre aus dem RLN-Kreis).

import { useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { KreisRaum, KreisTeilnehmer } from "@kreis/core"
import type { ZeichenArt } from "../use-neben"
import { VideoKachel } from "./video-kachel"

export type Ansicht = "sprecher" | "galerie"

const HALTEZEIT = 2000
/** So viele Kacheln zeigt die Galerie auf einer Seite. */
export const JE_SEITE = 12

export function spaltenFuer(anzahl: number): string {
  if (anzahl <= 1) return "grid-cols-1"
  if (anzahl <= 4) return "grid-cols-1 sm:grid-cols-2"
  if (anzahl <= 9) return "grid-cols-2 lg:grid-cols-3"
  return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
}

export function VideoBuehne({
  teilnehmer, raum, ansicht, stabHalter, haende, zeichen,
}: {
  teilnehmer: readonly KreisTeilnehmer[]
  raum: KreisRaum
  ansicht: Ansicht
  stabHalter: string | null
  haende: ReadonlySet<string>
  zeichen: ReadonlyMap<string, { art: ZeichenArt }>
}) {
  const [angeheftet, setAngeheftet] = useState<string | null>(null)
  const [seite, setSeite] = useState(0)
  const grosserRef = useRef<{ id: string | null; seit: number }>({ id: null, seit: 0 })
  const teilend = teilnehmer.find((p) => p.teiltBildschirm) ?? null

  const grosse = useMemo(() => {
    const fest = angeheftet ? teilnehmer.find((p) => p.id === angeheftet) : undefined
    if (fest) return fest
    const stab = stabHalter ? teilnehmer.find((p) => p.id === stabHalter && !p.ichSelbst) : undefined
    if (stab) return stab
    const jetzt = Date.now()
    const stand = grosserRef.current
    const bisher = teilnehmer.find((p) => p.id === stand.id)
    const redet = teilnehmer.find((p) => p.spricht && !p.ichSelbst)
    if (redet) {
      if (redet.id === stand.id) stand.seit = jetzt
      else if (!bisher || jetzt - stand.seit > HALTEZEIT) {
        grosserRef.current = { id: redet.id, seit: jetzt }
        return redet
      }
    }
    if (bisher) return bisher
    const erster = teilnehmer.find((p) => !p.ichSelbst) ?? teilnehmer[0] ?? null
    if (erster) grosserRef.current = { id: erster.id, seit: jetzt }
    return erster
  }, [teilnehmer, angeheftet, stabHalter])

  const kachel = (p: KreisTeilnehmer, gross = false, bildschirm = false) => (
    <VideoKachel
      key={(bildschirm ? "b-" : "") + p.id}
      person={p}
      raum={raum}
      gross={gross}
      bildschirm={bildschirm}
      handOben={haende.has(p.id)}
      zeichen={zeichen.get(p.id)?.art ?? null}
      haeltStab={stabHalter === p.id}
      angeheftet={angeheftet === p.id}
      onAnheften={bildschirm ? undefined : () => setAngeheftet(angeheftet === p.id ? null : p.id)}
    />
  )

  if (ansicht === "galerie" && !teilend) {
    const seiten = Math.max(1, Math.ceil(teilnehmer.length / JE_SEITE))
    const aktuell = Math.min(seite, seiten - 1)
    const sichtbar = teilnehmer.slice(aktuell * JE_SEITE, (aktuell + 1) * JE_SEITE)
    return (
      <div className="flex h-full w-full flex-col gap-2">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className={`grid gap-2.5 ${spaltenFuer(sichtbar.length)}`}>{sichtbar.map((p) => kachel(p))}</div>
        </div>
        {seiten > 1 && (
          <div className="flex shrink-0 items-center justify-center gap-3 text-xs text-slate-300">
            <button type="button" onClick={() => setSeite(Math.max(0, aktuell - 1))} disabled={aktuell === 0} aria-label="Vorige Seite" className="rounded-lg p-1.5 hover:bg-white/10 disabled:opacity-30">
              <ChevronLeft className="h-4 w-4" />
            </button>
            Seite {aktuell + 1} von {seiten}
            <button type="button" onClick={() => setSeite(Math.min(seiten - 1, aktuell + 1))} disabled={aktuell >= seiten - 1} aria-label="Nächste Seite" className="rounded-lg p-1.5 hover:bg-white/10 disabled:opacity-30">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    )
  }

  // Beim Bildschirmteilen bleiben alle Gesichter im Streifen.
  const uebrige = teilend ? teilnehmer : teilnehmer.filter((p) => p.id !== grosse?.id)
  return (
    <div className="flex h-full w-full flex-col gap-2.5">
      <div className="min-h-0 flex-1">
        {teilend ? kachel(teilend, true, true) : grosse ? kachel(grosse, true) : null}
      </div>
      {uebrige.length > 0 && (
        <div className="flex shrink-0 gap-2.5 overflow-x-auto pb-1">
          {uebrige.map((p) => <div key={p.id} className="w-40 shrink-0 sm:w-48">{kachel(p)}</div>)}
        </div>
      )}
    </div>
  )
}

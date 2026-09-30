// Die Regeln, nach denen der Kreis tickt: Redezeit, was danach geschieht,
// wie lange die Stille nach der Klangschale waehrt, wie lange das Treffen
// dauert. Ein Formular fuer zwei Orte: den Dialog der Konferenz (⋮) und die
// Spalte des Kreises (Timo, 30.09.2026: "da muss es dann auch diese
// Einstellung geben, nach welchen Regeln der Kreis tickt").

import { useEffect, useId, useState, type ReactNode } from "react"
import { X } from "lucide-react"
import type { NachDerRedezeit, Regeln } from "@kreis/core"

export const REDEZEIT_STUFEN = [0, 1, 2, 3, 5, 10, 15, 20, 30] as const
/** Stille nach der Klangschale, in Sekunden (Timo: 15 Sekunden sind zu kurz). */
export const STILLE_STUFEN = [15, 30, 60, 120] as const
/** Wie lange das Meeting dauert, in Minuten. 0 heisst: offen. */
export const SITZUNG_STUFEN = [0, 30, 45, 60, 90, 120, 180] as const

const stilleText = (s: number) => (s < 60 ? `${s} Sek.` : `${s / 60} Min.`)
export const dauerText = (m: number) => (m === 0 ? "offen" : m < 60 ? `${m} Min.` : m % 60 === 0 ? `${m / 60} Std.` : `${Math.floor(m / 60)},5 Std.`)

function Stufen<T extends number>({ legende, stufen, wert, setzen, text }: {
  legende: string
  stufen: readonly T[]
  wert: number
  setzen: (w: T) => void
  text: (w: T) => string
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-semibold text-foreground">{legende}</legend>
      <div className="flex flex-wrap gap-1">
        {stufen.map((s) => (
          <button key={s} type="button" onClick={() => setzen(s)} aria-pressed={wert === s}
            className={`rounded-lg px-2.5 py-1 text-sm ${wert === s ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/70"}`}>
            {text(s)}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

/**
 * Das Formular selbst. `mitDauer` zeigt die Dauer des Treffens; im Kreis
 * fehlt sie, die gehoert zur Konferenz. Was nicht gezeigt wird, bleibt, wie
 * es ist.
 */
export function RegelnFormular({
  regeln, stilleVorgabe, mitDauer = true, onSpeichern, fuss,
}: {
  regeln: Regeln
  /** Die Stille, die ohne eigene Regel gilt (aus dem Prozess). */
  stilleVorgabe: number
  mitDauer?: boolean
  onSpeichern: (r: Regeln) => void
  /** Knoepfe neben „Für alle übernehmen“, etwa „Abbrechen“. */
  fuss?: ReactNode
}) {
  const [redezeit, setRedezeit] = useState(regeln.redezeit)
  const [danach, setDanach] = useState<NachDerRedezeit>(regeln.danach)
  const [stille, setStille] = useState<number>(regeln.stille ?? stilleVorgabe)
  const [dauer, setDauer] = useState<number>(regeln.sitzungsdauer ?? 0)
  // Zwei Formulare koennen zugleich offen sein (Kreis und Dialog): eigene Gruppe.
  const gruppe = `danach-${useId()}`

  // Aendert jemand anderes die Regeln, zeigt das Formular den neuen Stand.
  useEffect(() => {
    setRedezeit(regeln.redezeit)
    setDanach(regeln.danach)
    setStille(regeln.stille ?? stilleVorgabe)
    setDauer(regeln.sitzungsdauer ?? 0)
  }, [regeln.redezeit, regeln.danach, regeln.stille, regeln.sitzungsdauer, stilleVorgabe])

  return (
    <div className="flex flex-col gap-4">
      <Stufen legende="Redezeit mit dem Redestab" stufen={REDEZEIT_STUFEN} wert={redezeit} setzen={setRedezeit}
        text={(m) => (m === 0 ? "keine" : `${m} Min.`)} />

      <fieldset disabled={redezeit === 0} className="disabled:opacity-50">
        <legend className="mb-1.5 text-sm font-semibold text-foreground">Ist die Zeit um, klingt der Gong, und dann …</legend>
        <label className="mb-1 flex items-center gap-2 text-sm text-foreground">
          <input type="radio" name={gruppe} checked={danach === "weiter"} onChange={() => setDanach("weiter")} />
          geht der Stab an den Nächsten im Kreis
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="radio" name={gruppe} checked={danach === "mitte"} onChange={() => setDanach("mitte")} />
          kehrt der Stab in die Mitte zurück
        </label>
      </fieldset>

      <Stufen legende="Stille nach der Klangschale" stufen={STILLE_STUFEN} wert={stille} setzen={setStille} text={stilleText} />

      {mitDauer && (
        <div>
          <Stufen legende="Dauer des Meetings" stufen={SITZUNG_STUFEN} wert={dauer} setzen={setDauer} text={dauerText} />
          <p className="mt-1.5 text-xs text-muted-foreground">Ist sie um, klingt ein eigener Ton, und ein Hinweis ruft zur Abschlussrunde. Das Meeting läuft weiter.</p>
        </div>
      )}

      <div className="flex justify-end gap-2">
        {fuss}
        <button type="button"
          onClick={() => onSpeichern({ ...regeln, redezeit, danach, stille, sitzungsdauer: mitDauer ? dauer : regeln.sitzungsdauer })}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          Für alle übernehmen
        </button>
      </div>
    </div>
  )
}

/** Der Dialog der Konferenz (⋮ → Einstellungen). */
export function Einstellungen({
  regeln, stilleVorgabe, onSpeichern, onZu,
}: {
  regeln: Regeln
  stilleVorgabe: number
  onSpeichern: (r: Regeln) => void
  onZu: () => void
}) {
  return (
    <div role="dialog" aria-modal="true" aria-label="Einstellungen des Raums" className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onZu}>
      <div className="w-full max-w-md rounded-2xl bg-card p-5 text-foreground shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 flex items-center">
          <h3 className="text-lg font-semibold">Einstellungen des Raums</h3>
          <button type="button" onClick={onZu} aria-label="Schließen" className="ml-auto rounded-lg p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">Diese Regeln gelten für alle im Raum.</p>
        <RegelnFormular regeln={regeln} stilleVorgabe={stilleVorgabe}
          onSpeichern={(r) => { onSpeichern(r); onZu() }}
          fuss={<button type="button" onClick={onZu} className="rounded-lg px-4 py-2 text-sm hover:bg-muted">Abbrechen</button>} />
      </div>
    </div>
  )
}

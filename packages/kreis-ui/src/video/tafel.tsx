// Die Tafel in der Mitte der Konferenz: alle zeichnen, alle sehen es.
//
// Die Flaeche hat ein festes Seitenverhaeltnis (16:9), damit ein Kreis auf
// jedem Bildschirm ein Kreis bleibt; Punkte reisen in Anteilen der Flaeche
// (`@kreis/core`, tafel.ts). Ein Strich geht beim Loslassen an alle.

import { useCallback, useEffect, useRef, useState } from "react"
import { Trash2 } from "lucide-react"
import { punktRunden, TAFEL_FARBEN, type Strich } from "@kreis/core"

const STAERKEN = [{ breite: 0.003, name: "fein" }, { breite: 0.008, name: "kräftig" }] as const

function zeichne(ctx: CanvasRenderingContext2D, s: { farbe: string; breite: number; punkte: readonly (readonly [number, number])[] }, w: number, h: number) {
  if (s.punkte.length === 0) return
  ctx.strokeStyle = s.farbe
  ctx.fillStyle = s.farbe
  ctx.lineWidth = Math.max(1, s.breite * w)
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  if (s.punkte.length === 1) {
    const [x, y] = s.punkte[0]
    ctx.beginPath(); ctx.arc(x * w, y * h, ctx.lineWidth / 2, 0, Math.PI * 2); ctx.fill()
    return
  }
  ctx.beginPath()
  ctx.moveTo(s.punkte[0][0] * w, s.punkte[0][1] * h)
  for (const [x, y] of s.punkte.slice(1)) ctx.lineTo(x * w, y * h)
  ctx.stroke()
}

export function Tafel({
  striche, ich, onStrich, onLeeren,
}: {
  striche: readonly Strich[]
  ich: string
  onStrich: (s: Strich) => void
  onLeeren: () => void
}) {
  const huelle = useRef<HTMLDivElement | null>(null)
  const leinwand = useRef<HTMLCanvasElement | null>(null)
  const aktuell = useRef<[number, number][] | null>(null)
  const [farbe, setFarbe] = useState<string>(TAFEL_FARBEN[0])
  const [breite, setBreite] = useState<number>(STAERKEN[0].breite)
  const [groesse, setGroesse] = useState({ w: 0, h: 0 })

  // Die Flaeche passt sich dem Platz an, im Verhaeltnis 16:9.
  useEffect(() => {
    const el = huelle.current
    if (!el || typeof ResizeObserver === "undefined") return
    const messen = () => {
      const w = el.clientWidth, h = el.clientHeight
      const passend = Math.min(w, (h * 16) / 9)
      setGroesse({ w: Math.floor(passend), h: Math.floor((passend * 9) / 16) })
    }
    messen()
    const beobachter = new ResizeObserver(messen)
    beobachter.observe(el)
    return () => beobachter.disconnect()
  }, [])

  const allesZeichnen = useCallback(() => {
    const c = leinwand.current
    const ctx = c?.getContext("2d")
    if (!c || !ctx) return
    const dpr = window.devicePixelRatio || 1
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, groesse.w, groesse.h)
    for (const s of striche) zeichne(ctx, s, groesse.w, groesse.h)
    if (aktuell.current) zeichne(ctx, { farbe, breite, punkte: aktuell.current }, groesse.w, groesse.h)
  }, [striche, groesse, farbe, breite])

  useEffect(() => {
    const c = leinwand.current
    if (!c) return
    const dpr = window.devicePixelRatio || 1
    c.width = Math.max(1, groesse.w * dpr)
    c.height = Math.max(1, groesse.h * dpr)
    allesZeichnen()
  }, [groesse, allesZeichnen])

  const punkt = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect()
    return punktRunden((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height)
  }

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <div className="flex gap-1" role="radiogroup" aria-label="Farbe">
          {TAFEL_FARBEN.map((f) => (
            <button key={f} type="button" role="radio" aria-checked={farbe === f} aria-label={`Farbe ${f}`} onClick={() => setFarbe(f)}
              className={`h-6 w-6 rounded-full ring-offset-2 ring-offset-background ${farbe === f ? "ring-2 ring-primary" : ""}`} style={{ background: f }} />
          ))}
        </div>
        <div className="flex gap-1 rounded-lg bg-muted p-0.5">
          {STAERKEN.map((st) => (
            <button key={st.name} type="button" onClick={() => setBreite(st.breite)} aria-pressed={breite === st.breite}
              className={`rounded-md px-2 py-0.5 text-xs ${breite === st.breite ? "bg-background font-medium text-foreground shadow-sm" : "text-muted-foreground"}`}>
              {st.name}
            </button>
          ))}
        </div>
        <button type="button" onClick={onLeeren} className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
          <Trash2 className="h-3.5 w-3.5" /> Tafel leeren
        </button>
      </div>
      <div ref={huelle} className="flex min-h-0 flex-1 items-center justify-center">
        <canvas
          ref={leinwand}
          aria-label="Tafel zum Zeichnen"
          style={{ width: groesse.w, height: groesse.h, touchAction: "none" }}
          className="rounded-xl bg-white shadow-inner"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            aktuell.current = [punkt(e)]
            allesZeichnen()
          }}
          onPointerMove={(e) => {
            if (!aktuell.current) return
            aktuell.current.push(punkt(e))
            allesZeichnen()
          }}
          onPointerUp={() => {
            const punkte = aktuell.current
            aktuell.current = null
            if (!punkte || punkte.length === 0) return
            onStrich({ id: `${ich}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, von: ich, farbe, breite, punkte })
          }}
        />
      </div>
    </div>
  )
}

// Die Leiste zum Prozess: Wahl, Schritt, Anleitung, Fragen, Empfehlungen.

import { ChevronLeft, ChevronRight, Clock, Users, X } from "lucide-react"
import {
  PROZESSE,
  aktuellerSchritt,
  gruppenListe,
  type KreisTeilnehmer,
  type Prozess,
  type Sitzung,
} from "@kreis/core"

function mmss(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const std = Math.floor(s / 3600)
  const min = Math.floor((s % 3600) / 60)
  const sek = s % 60
  return std > 0 ? `${std}:${String(min).padStart(2, "0")}:${String(sek).padStart(2, "0")}` : `${min}:${String(sek).padStart(2, "0")}`
}

const gesamtMinuten = (p: Prozess) => p.schritte.reduce((summe, s) => summe + s.minuten, 0)

function dauerText(minuten: number): string {
  if (minuten < 60) return `${minuten} Min.`
  const std = Math.floor(minuten / 60)
  const rest = minuten % 60
  return rest ? `${std} Std. ${rest} Min.` : `${std} Std.`
}

export function ProzessWahl({
  eigene = [], onWaehlen,
}: {
  eigene?: readonly Prozess[]
  onWaehlen: (p: Prozess) => void
}) {
  const alle = [...eigene, ...PROZESSE.filter((p) => !eigene.some((e) => e.id === p.id))]
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Einen Prozess wählen</h3>
        <p className="text-xs text-muted-foreground">Alle im Kreis sehen ihn. Jeder kann ihn beginnen.</p>
      </div>
      <ul className="flex flex-col gap-2">
        {alle.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onWaehlen(p)}
              className="w-full rounded-xl bg-muted/60 p-3 text-left transition hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-foreground">{p.name}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{dauerText(gesamtMinuten(p))}</span>
              </div>
              <p className="mt-0.5 text-sm text-foreground/80">{p.kurz}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{p.herkunft}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ProzessLeiste({
  prozess, sitzung, jetzt, teilnehmer,
  onSchritt, onBeenden, onGruppenEinteilen, onGruppenAufloesen,
}: {
  prozess: Prozess
  sitzung: Sitzung
  jetzt: number
  teilnehmer: readonly KreisTeilnehmer[]
  onSchritt: (richtung: 1 | -1) => void
  onBeenden: () => void
  onGruppenEinteilen: (groesse: number) => void
  onGruppenAufloesen: () => void
}) {
  const schritt = aktuellerSchritt(sitzung, prozess)
  if (!schritt) return null
  const name = (id: string) => teilnehmer.find((t) => t.id === id)?.name ?? "jemand, der gegangen ist"
  const vergangen = jetzt - sitzung.schrittSeit
  const ueber = vergangen > schritt.minuten * 60_000
  const gruppen = gruppenListe(sitzung.gruppen)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{prozess.name}</p>
          <h3 className="text-lg font-semibold leading-tight text-foreground">{schritt.titel}</h3>
          <p className="text-xs text-muted-foreground">
            Schritt {sitzung.schritt + 1} von {prozess.schritte.length}
          </p>
        </div>
        <button
          type="button"
          onClick={onBeenden}
          title="Prozess beenden"
          aria-label="Prozess beenden"
          className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Die Schritte als Band, damit jeder sieht, wo der Kreis steht */}
      <ol className="flex gap-1" aria-label="Schritte">
        {prozess.schritte.map((s, i) => (
          <li
            key={s.id}
            title={s.titel}
            className={`h-1.5 flex-1 rounded-full ${i < sitzung.schritt ? "bg-primary/50" : i === sitzung.schritt ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </ol>

      <p className={`flex items-center gap-1.5 text-sm tabular-nums ${ueber ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
        <Clock className="h-3.5 w-3.5" />
        {mmss(vergangen)} von {schritt.minuten} Min.
      </p>

      <p className="text-sm leading-relaxed text-foreground">{schritt.anleitung}</p>

      {schritt.fragen && schritt.fragen.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {schritt.fragen.map((f) => (
            <li key={f} className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-foreground">{f}</li>
          ))}
        </ul>
      )}

      {schritt.art === "kleingruppen" && (
        <div className="flex flex-col gap-2 rounded-xl bg-muted/40 p-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Kleingruppen</span>
          </div>
          {gruppen.length === 0 ? (
            <button
              type="button"
              onClick={() => onGruppenEinteilen(schritt.gruppenGroesse ?? 4)}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              In Gruppen zu etwa {schritt.gruppenGroesse ?? 4} einteilen
            </button>
          ) : (
            <>
              <ul className="flex flex-col gap-1.5">
                {gruppen.map((g) => (
                  <li key={g.nr} className="text-sm text-foreground">
                    <span className="font-semibold">Gruppe {g.nr}:</span> {g.ids.map(name).join(", ")}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={onGruppenAufloesen}
                className="self-start text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Einteilung lösen
              </button>
            </>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSchritt(-1)}
          disabled={sitzung.schritt === 0}
          className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2 text-sm text-foreground transition hover:bg-muted/70 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> zurück
        </button>
        <button
          type="button"
          onClick={() => onSchritt(1)}
          disabled={sitzung.schritt >= prozess.schritte.length - 1}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
        >
          nächster Schritt <ChevronRight className="h-4 w-4" />
        </button>
      </div>

    </div>
  )
}

/**
 * Die Empfehlungen des Prozesses, als eigene Spalte links vom Kreis (Timo,
 * 30.09.2026: "auf der linken Seite die Empfehlungen, auf der rechten Seite
 * die Runde").
 */
export function ProzessEmpfehlungen({ prozess }: { prozess: Prozess }) {
  if (prozess.empfehlungen.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{prozess.name}</p>
      <h3 className="text-base font-semibold text-foreground">Die Empfehlungen ({prozess.empfehlungen.length})</h3>
      <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-snug text-foreground/90 marker:text-muted-foreground">
        {prozess.empfehlungen.map((e) => <li key={e}>{e}</li>)}
      </ol>
    </div>
  )
}

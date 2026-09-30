// Der Kreis als Flaeche, ohne das Toolkit (Spec: docs/spec/modules/kreis.md).
//
// Draussen: der Vorraum mit Namen. Drinnen: der Kreis mit Redestab und
// Klangschale in der Mitte, daneben die Leiste zum Prozess, unten die
// Steuerknoepfe. Stille und Pause legen sich ueber den Kreis.

import { useEffect, useMemo, useState } from "react"
import { Coffee, LogOut, Mic, MicOff, Video, VideoOff } from "lucide-react"
import {
  aktuellerSchritt,
  gruppenAufloesen,
  gruppenEinteilen,
  naechsterImKreis,
  pauseBeenden,
  pauseBeginnen,
  pauseLaeuft,
  prozessBeenden,
  prozessWaehlen,
  schaleSchlagen,
  schrittGehen,
  stabArt,
  stabNehmen,
  stabWeitergeben,
  stabZuruecklegen,
  stilleLaeuft,
  redezeitRest,
  regelnSetzen,
  regelnVon,
  stilleSekundenVon,
  type Regeln,
} from "@kreis/core"
import { useKreisVerbindung } from "./raum-kontext"
import type { KreisVerbindung } from "./use-kreis"
import { KreisRund } from "./kreis-rund"
import { ProzessEmpfehlungen, ProzessLeiste, ProzessWahl } from "./prozess-leiste"
import { RegelnFormular } from "./regeln-formular"
import { Klangschale, Redestab } from "./sinnbilder"

/** Wie lange eine Pause dauert, in Minuten. */
const PAUSE_MINUTEN = 10

/**
 * Der Kreis ohne das Toolkit drumherum: Raum-Fabrik und Raumname genuegen.
 * So laesst er sich allein pruefen und in jede Flaeche setzen.
 */
export function KreisRaumFlaeche({
  raumName, vorschlagName, zurKonferenz,
}: {
  raumName: string
  vorschlagName?: string
  /** Fuehrt der Space das Video, fuehrt dieser Weg dorthin, ohne die Verbindung zu trennen. */
  zurKonferenz?: () => void
}) {
  const kreis = useKreisVerbindung()
  if (!kreis) return <OhneRaum />
  if (kreis.zustand === "drin" && kreis.raumName !== raumName) {
    return <AndererRaum kreis={kreis} hier={raumName} vorschlagName={vorschlagName} />
  }
  if (kreis.zustand !== "drin") return <Vorraum kreis={kreis} raumName={raumName} vorschlagName={vorschlagName} />
  return <ImKreis kreis={kreis} raumName={raumName} zurKonferenz={zurKonferenz} />
}

/** Fehlt der Raum-Adapter, degradiert das Modul sichtbar (Spec, Capabilities). */
export function OhneRaum() {
  return (
    <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="font-semibold text-foreground">Für den Kreis fehlt ein Raum.</p>
      <p className="text-sm text-muted-foreground">
        Diese App gibt dem Kreis keinen Raum-Adapter. Mit einem Adapter treffen sich hier die Menschen des Space, im Bild, im Ton und geführt von einem Prozess.
      </p>
    </div>
  )
}

/** Man sitzt schon in einem anderen Kreis: dort bleiben oder hierher wechseln. */
export function AndererRaum({ kreis, hier, vorschlagName }: { kreis: KreisVerbindung; hier: string; vorschlagName?: string }) {
  const meinName = kreis.teilnehmer.find((t) => t.ichSelbst)?.name ?? vorschlagName ?? ""
  return (
    <div className="mx-auto flex h-full max-w-md flex-col justify-center gap-3 p-6">
      <p className="text-sm text-muted-foreground">Du sitzt gerade im Kreis von</p>
      <p className="text-xl font-semibold text-foreground">{kreis.raumName}</p>
      <button
        type="button"
        onClick={async () => { await kreis.verlassen(); await kreis.betreten(hier, meinName) }}
        className="rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:opacity-90"
      >
        In den Kreis von {hier} wechseln
      </button>
    </div>
  )
}

export function Vorraum({
  kreis, raumName, vorschlagName, titel = "Kreis",
  einleitung = "Hier trifft sich der Kreis, auch wenn alle weit verstreut leben. Ein Prozess gibt dem Gespräch seine Form.",
  knopf = "Den Kreis betreten",
}: {
  kreis: KreisVerbindung
  raumName: string
  vorschlagName?: string
  titel?: string
  einleitung?: string
  knopf?: string
}) {
  const [name, setName] = useState(vorschlagName ?? "")
  useEffect(() => {
    if (vorschlagName) setName((jetzt) => jetzt || vorschlagName)
  }, [vorschlagName])

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col justify-center gap-5 p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titel}</p>
        <h2 className="text-2xl font-semibold text-foreground">{raumName}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {einleitung}
        </p>
      </div>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => { e.preventDefault(); void kreis.betreten(raumName, name) }}
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-foreground">Wie heißt du im Kreis?</span>
          <input
            id="kreis-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dein Name"
            maxLength={48}
            className="rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <button
          type="submit"
          disabled={kreis.zustand === "verbindet"}
          className="rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {kreis.zustand === "verbindet" ? "Einen Moment …" : knopf}
        </button>
        {kreis.fehler && <p className="text-sm text-rose-600">{kreis.fehler}</p>}
      </form>
      {!kreis.raum.traegtMedien && (
        <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
          <strong className="text-foreground">Probe-Raum.</strong> Dieser Raum verbindet die Fenster auf diesem Gerät, ohne Bild und Ton. Öffne ein zweites Fenster, und ihr sitzt zu zweit im Kreis. Für echte Treffen braucht es einen Raum-Server.
        </p>
      )}
    </div>
  )
}

function ImKreis({ kreis, raumName, zurKonferenz, nurBuehne = false }: { kreis: KreisVerbindung; raumName: string; zurKonferenz?: () => void; nurBuehne?: boolean }) {
  const { raum, teilnehmer, ich, sitzung, prozess, jetzt, handle } = kreis
  const anwesend = useMemo(() => teilnehmer.map((t) => t.id), [teilnehmer])
  const meinName = teilnehmer.find((t) => t.id === ich)?.name ?? "Gast"
  const mich = teilnehmer.find((t) => t.id === ich)
  const schritt = aktuellerSchritt(sitzung, prozess)
  const reihum = stabArt(schritt) === "reihum"
  const stille = stilleLaeuft(sitzung, jetzt)
  const pause = pauseLaeuft(sitzung, jetzt)
  const halter = sitzung.stab.halter
  const halterDa = halter !== null && anwesend.includes(halter)
  const ichHalte = halter !== null && halter === ich
  const naechster = ich ? naechsterImKreis(anwesend, ich) : null
  const naechsterName = teilnehmer.find((t) => t.id === naechster)?.name

  const wer = ich ?? ""
  const nehmen = () => handle((s, t) => stabNehmen(s, wer, meinName, anwesend, t))
  const zuruecklegen = () => handle((s, t) => stabZuruecklegen(s, wer, t))
  const weitergeben = () => handle((s, t) => stabWeitergeben(s, wer, teilnehmer.map((p) => ({ id: p.id, name: p.name })), t))
  const schale = () => handle((s, t) => schaleSchlagen(s, wer, stilleSekundenVon(s, prozess), t))

  const mitte = (
    <>
      {pause ? (
        <div className="flex flex-col items-center gap-2 text-center">
          <Coffee className="h-8 w-8 text-muted-foreground" />
          <p className="font-semibold text-foreground">Pause</p>
          <p className="text-sm text-muted-foreground">
            zurück um {new Date(sitzung.pause!.bis).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <button type="button" onClick={() => handle((s) => pauseBeenden(s, wer))} className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
            Pause beenden
          </button>
        </div>
      ) : stille ? (
        <div className="flex flex-col items-center gap-1 text-center">
          <Klangschale groesse={72} klingt />
          <p className="font-semibold text-foreground">Stille</p>
          <p className="text-sm tabular-nums text-muted-foreground">noch {Math.ceil((sitzung.schale.stilleBis - jetzt) / 1000)} s</p>
        </div>
      ) : ichHalte ? (
        <div className="flex flex-col items-center gap-1.5 text-center">
          <Redestab groesse={64} />
          <p className="font-semibold text-foreground">Du hältst den Stab</p>
          {redezeitRest(sitzung, jetzt) !== null && (
            <p className="text-sm tabular-nums text-muted-foreground">noch {Math.floor(Math.max(0, redezeitRest(sitzung, jetzt)!) / 60000)}:{String(Math.ceil(Math.max(0, redezeitRest(sitzung, jetzt)!) / 1000) % 60).padStart(2, "0")}</p>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            {reihum && naechsterName && naechster !== ich && (
              <button type="button" onClick={weitergeben} className="rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:opacity-90">
                weiter an {naechsterName}
              </button>
            )}
            <button type="button" onClick={zuruecklegen} className="rounded-lg bg-background/80 px-2.5 py-1 text-xs text-foreground hover:bg-background">
              in die Mitte legen
            </button>
          </div>
        </div>
      ) : halterDa ? (
        <div className="flex flex-col items-center gap-1 text-center">
          <Redestab groesse={64} />
          <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{sitzung.stab.name}</span> hält den Stab</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={nehmen}
          className="group flex flex-col items-center gap-0.5 rounded-2xl px-4 py-2 text-amber-900 transition hover:bg-amber-100/70 dark:text-amber-100 dark:hover:bg-amber-900/40"
        >
          <Redestab groesse={76} className="transition group-hover:-rotate-6 motion-reduce:transition-none" />
          <span className="text-sm font-semibold">{reihum ? "Runde beginnen" : "Den Stab nehmen"}</span>
        </button>
      )}

      {!pause && (
        <button
          type="button"
          onClick={schale}
          title="Die Klangschale schlagen: Stille für alle"
          aria-label="Die Klangschale schlagen: Stille für alle"
          className="group flex flex-col items-center rounded-2xl px-3 py-1 text-[11px] font-medium text-muted-foreground transition hover:bg-amber-100/70 hover:text-foreground dark:hover:bg-amber-900/40"
        >
          <Klangschale groesse={46} className="transition group-hover:scale-105 motion-reduce:transition-none" />
          Klangschale
        </button>
      )}
    </>
  )

  // Die Buehne des Kreises: das Rund mit Redestab und Klangschale und die
  // Leiste zum Prozess. Die Konferenz setzt sie als Tool in ihre Mitte.
  const regeln = regelnVon(sitzung)
  const regelnSpeichern = (r: Regeln) => handle((s, t) => regelnSetzen(s, r, wer, t))
  const regelnTafel = (
    <details className="rounded-xl bg-muted/40 p-3">
      <summary className="cursor-pointer text-sm font-semibold text-foreground">Regeln des Kreises</summary>
      <p className="mt-1 text-xs text-muted-foreground">
        Redezeit {regeln.redezeit === 0 ? "frei" : `${regeln.redezeit} Min., danach ${regeln.danach === "weiter" ? "zum Nächsten" : "in die Mitte"}`}
        {" · "}Stille {stilleSekundenVon(sitzung, prozess)} Sek.
      </p>
      <div className="mt-3">
        <RegelnFormular regeln={regeln} stilleVorgabe={stilleSekundenVon({ ...sitzung, regeln: undefined }, prozess)}
          mitDauer={false} onSpeichern={regelnSpeichern} />
      </div>
    </details>
  )

  // Die Buehne des Kreises (Timo, 30.09.2026): links die Empfehlungen, in der
  // Mitte der Kreis, rechts die Runde mit ihren Regeln. Die Konferenz setzt
  // sie als Tool in ihre Mitte. Schmal stehen die Teile untereinander.
  const buehne = (
    <div className={`grid h-full min-h-0 flex-1 gap-3 overflow-y-auto p-3 lg:overflow-hidden ${
      prozess ? "lg:grid-cols-[minmax(200px,280px)_minmax(0,1fr)_minmax(260px,330px)]" : "lg:grid-cols-[minmax(0,1fr)_minmax(260px,330px)]"}`}>
      {prozess && (
        <aside aria-label="Empfehlungen" className="order-3 min-h-0 min-w-0 overflow-y-auto rounded-2xl bg-card p-4 shadow-sm lg:order-1">
          <ProzessEmpfehlungen prozess={prozess} />
        </aside>
      )}

      <div className="order-1 flex min-h-[300px] min-w-0 lg:order-2 lg:min-h-0">
        <KreisRund
          teilnehmer={teilnehmer}
          ich={ich}
          raum={raum}
          stabHalter={halterDa ? halter : null}
          gruppen={sitzung.gruppen}
          mitte={mitte}
        />
      </div>

      <aside aria-label="Die Runde" className="order-2 flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto rounded-2xl bg-card p-4 shadow-sm lg:order-3">
        {prozess ? (
          <ProzessLeiste
            prozess={prozess}
            sitzung={sitzung}
            jetzt={jetzt}
            teilnehmer={teilnehmer}
            onSchritt={(r) => handle((s, t) => schrittGehen(s, prozess, r, wer, t))}
            onBeenden={() => handle((s, t) => prozessBeenden(s, wer, t))}
            onGruppenEinteilen={(g) => handle((s) => gruppenEinteilen(s, anwesend, g, wer))}
            onGruppenAufloesen={() => handle((s) => gruppenAufloesen(s, wer))}
          />
        ) : null}
        {regelnTafel}
        {!prozess && <ProzessWahl onWaehlen={(p) => handle((s, t) => prozessWaehlen(s, p, wer, t))} />}
      </aside>
    </div>
  )

  if (nurBuehne) return buehne

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <header className="flex shrink-0 items-baseline gap-3 px-4 pt-3">
        <h2 className="truncate text-base font-semibold text-foreground">{raumName}</h2>
        <span className="text-xs text-muted-foreground">
          {teilnehmer.length} {teilnehmer.length === 1 ? "Mensch" : "Menschen"} im Kreis
        </span>
        {zurKonferenz && (
          <button type="button" onClick={zurKonferenz} className="ml-auto flex items-center gap-1.5 self-center rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/70">
            <Video className="h-3.5 w-3.5" /> zur Konferenz
          </button>
        )}
      </header>

      {buehne}

      <footer className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-t border-border px-4 py-2.5">
        {raum.traegtMedien && mich && (
          <>
            <button
              type="button"
              onClick={() => void raum.mikro(!mich.mikroAn)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm ${mich.mikroAn ? "bg-muted text-foreground" : "bg-rose-500/15 text-rose-600"}`}
            >
              {mich.mikroAn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              {mich.mikroAn ? "Ton an" : "stumm"}
            </button>
            <button
              type="button"
              onClick={() => void raum.kamera(!mich.kameraAn)}
              className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm text-foreground"
            >
              {mich.kameraAn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              {mich.kameraAn ? "Bild an" : "kein Bild"}
            </button>
          </>
        )}
        {!pause && (
          <button
            type="button"
            onClick={() => handle((s, t) => pauseBeginnen(s, PAUSE_MINUTEN, wer, t))}
            className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm text-foreground hover:bg-muted/70"
          >
            <Coffee className="h-4 w-4" /> {PAUSE_MINUTEN} Min. Pause
          </button>
        )}
        <button
          type="button"
          onClick={() => void kreis.verlassen()}
          className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700"
        >
          <LogOut className="h-4 w-4" /> gehen
        </button>
      </footer>
    </div>
  )
}

/**
 * Der Kreis als Tool im Modul: nur die Buehne, ohne Kopf und Steuerleiste.
 * Die Konferenz legt ihn in ihre Mitte (Spec video, "Tools im Modul").
 */
export function KreisWerkzeug({ kreis }: { kreis: KreisVerbindung }) {
  return <ImKreis kreis={kreis} raumName={kreis.raumName ?? ""} nurBuehne />
}

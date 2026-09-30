// Die Einstellungen der Konferenz, aufgebaut wie in Big Blue Button (Timo,
// 30.09.2026, mit Bildschirmfotos): links die Reiter, rechts die Schalter,
// oben Schliessen und Speichern. Drei Reiter gelten nur fuer mich (sie
// liegen in diesem Browser), der vierte fuer alle im Raum.

import { useState, type ReactNode } from "react"
import { Bell, Monitor, Scale, Wifi } from "lucide-react"
import type { Regeln } from "@kreis/core"
import { RegelnFormular } from "../regeln-formular"
import { SCHRIFT_STUFEN, vorliebenSetzen, useVorlieben, type HinweisArt, type Vorlieben } from "../vorlieben"

export type EinstellungsReiter = "anwendung" | "hinweise" | "sparen" | "regeln"

const REITER: { id: EinstellungsReiter; titel: string; zeichen: ReactNode }[] = [
  { id: "anwendung", titel: "Anwendung", zeichen: <Monitor className="h-4 w-4" /> },
  { id: "hinweise", titel: "Benachrichtigungen", zeichen: <Bell className="h-4 w-4" /> },
  { id: "sparen", titel: "Datensparmodus", zeichen: <Wifi className="h-4 w-4" /> },
  { id: "regeln", titel: "Regeln des Raums", zeichen: <Scale className="h-4 w-4" /> },
]

const HINWEIS_ZEILEN: { art: HinweisArt; titel: string }[] = [
  { art: "chat", titel: "Chatnachricht" },
  { art: "beitritt", titel: "Jemand tritt bei" },
  { art: "gehen", titel: "Jemand geht" },
  { art: "hand", titel: "Hand heben" },
]

/** Ein Schalter wie in Big Blue Button: AN oder AUS, mit Namen fuer Screenreader. */
export function Schalter({ an, onWechsel, name }: { an: boolean; onWechsel: (an: boolean) => void; name: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="w-8 text-right text-xs font-medium text-muted-foreground">{an ? "AN" : "AUS"}</span>
      <button type="button" role="switch" aria-checked={an} aria-label={name} onClick={() => onWechsel(!an)}
        className={`relative h-7 w-12 rounded-full transition ${an ? "bg-teal-600" : "bg-rose-600"}`}>
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${an ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </span>
  )
}

function Zeile({ titel, hinweis, children }: { titel: string; hinweis?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="text-sm text-foreground">{titel}</p>
        {hinweis && <p className="text-xs text-muted-foreground">{hinweis}</p>}
      </div>
      {children}
    </div>
  )
}

export function EinstellungenDialog({
  regeln, stilleVorgabe, onRegelnSpeichern, onZu, start = "anwendung",
}: {
  regeln: Regeln
  stilleVorgabe: number
  onRegelnSpeichern: (r: Regeln) => void
  onZu: () => void
  start?: EinstellungsReiter
}) {
  const gespeichert = useVorlieben()
  const [entwurf, setEntwurf] = useState<Vorlieben>(gespeichert)
  const [reiter, setReiter] = useState<EinstellungsReiter>(start)
  const setze = <K extends keyof Vorlieben>(k: K, v: Vorlieben[K]) => setEntwurf((e) => ({ ...e, [k]: v }))
  const setzeHinweis = (art: HinweisArt, welcher: "ton" | "popup", v: boolean) =>
    setEntwurf((e) => ({ ...e, hinweise: { ...e.hinweise, [art]: { ...e.hinweise[art], [welcher]: v } } }))
  const speichern = () => { vorliebenSetzen(entwurf); onZu() }

  return (
    <div role="dialog" aria-modal="true" aria-label="Einstellungen" className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onZu}>
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-card text-foreground shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center gap-3 border-b px-6 py-4">
          <h3 className="flex-1 text-xl font-semibold">Einstellungen</h3>
          <button type="button" onClick={onZu} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">Schließen</button>
          {reiter !== "regeln" && (
            <button type="button" onClick={speichern} className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Speichern</button>
          )}
        </header>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <nav className="flex shrink-0 gap-1 overflow-x-auto border-b p-3 sm:w-56 sm:flex-col sm:border-b-0 sm:border-r" aria-label="Bereiche der Einstellungen">
            {REITER.map((r) => (
              <button key={r.id} type="button" onClick={() => setReiter(r.id)} aria-current={reiter === r.id ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm ${reiter === r.id ? "bg-primary font-semibold text-primary-foreground" : "hover:bg-muted"}`}>
                {r.zeichen} {r.titel}
              </button>
            ))}
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {reiter === "anwendung" && (
              <section>
                <h4 className="mb-2 text-lg font-semibold">Anwendung</h4>
                <p className="mb-2 text-xs text-muted-foreground">Gilt nur für dich, auf diesem Gerät.</p>
                <div className="divide-y">
                  <Zeile titel="Animationen"><Schalter name="Animationen" an={entwurf.animationen} onWechsel={(v) => setze("animationen", v)} /></Zeile>
                  <Zeile titel="Audiofilter für das Mikrofon" hinweis="Dämpft Rauschen und Echo, gleicht die Lautstärke an.">
                    <Schalter name="Audiofilter für das Mikrofon" an={entwurf.audiofilter} onWechsel={(v) => setze("audiofilter", v)} />
                  </Zeile>
                  <Zeile titel="Push-to-Talk" hinweis="Leertaste halten, um zu sprechen.">
                    <Schalter name="Push-to-Talk" an={entwurf.pushToTalk} onWechsel={(v) => setze("pushToTalk", v)} />
                  </Zeile>
                  <Zeile titel="Selbstansicht" hinweis="Das eigene Bild bei den anderen zeigen.">
                    <Schalter name="Selbstansicht" an={entwurf.selbstansicht} onWechsel={(v) => setze("selbstansicht", v)} />
                  </Zeile>
                  <Zeile titel="Reaktionsleiste automatisch schließen">
                    <Schalter name="Reaktionsleiste automatisch schließen" an={entwurf.reaktionenSchliessen} onWechsel={(v) => setze("reaktionenSchliessen", v)} />
                  </Zeile>
                  <Zeile titel="Schriftgröße">
                    <span className="flex items-center gap-2">
                      <button type="button" aria-label="Schrift kleiner" disabled={entwurf.schrift <= SCHRIFT_STUFEN[0]}
                        onClick={() => setze("schrift", SCHRIFT_STUFEN[Math.max(0, SCHRIFT_STUFEN.indexOf(entwurf.schrift as never) - 1)])}
                        className="h-9 w-9 rounded-full bg-primary text-lg font-bold text-primary-foreground disabled:opacity-40">−</button>
                      <span className="w-12 text-center text-sm font-semibold tabular-nums">{entwurf.schrift} %</span>
                      <button type="button" aria-label="Schrift größer" disabled={entwurf.schrift >= SCHRIFT_STUFEN[SCHRIFT_STUFEN.length - 1]}
                        onClick={() => setze("schrift", SCHRIFT_STUFEN[Math.min(SCHRIFT_STUFEN.length - 1, SCHRIFT_STUFEN.indexOf(entwurf.schrift as never) + 1)])}
                        className="h-9 w-9 rounded-full bg-primary text-lg font-bold text-primary-foreground disabled:opacity-40">+</button>
                    </span>
                  </Zeile>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Hell und dunkel stellst du oben in der App um.</p>
              </section>
            )}

            {reiter === "hinweise" && (
              <section>
                <h4 className="mb-2 text-lg font-semibold">Benachrichtigungen</h4>
                <p className="mb-3 text-xs text-muted-foreground">Wie und wobei du einen Hinweis bekommst.</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="pb-2 font-medium" />
                      <th className="pb-2 font-semibold">Ton</th>
                      <th className="pb-2 font-semibold">Einblendung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {HINWEIS_ZEILEN.map(({ art, titel }) => (
                      <tr key={art} className="border-t">
                        <td className="py-2.5">{titel}</td>
                        <td className="py-2.5"><Schalter name={`${titel}: Ton`} an={entwurf.hinweise[art].ton} onWechsel={(v) => setzeHinweis(art, "ton", v)} /></td>
                        <td className="py-2.5"><Schalter name={`${titel}: Einblendung`} an={entwurf.hinweise[art].popup} onWechsel={(v) => setzeHinweis(art, "popup", v)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {reiter === "sparen" && (
              <section>
                <h4 className="mb-2 text-lg font-semibold">Datensparmodus</h4>
                <p className="mb-2 text-xs text-muted-foreground">Bei schwacher Leitung: weniger laden, was die anderen zeigen.</p>
                <div className="divide-y">
                  <Zeile titel="Kameras der anderen"><Schalter name="Kameras der anderen" an={entwurf.kamerasAnderer} onWechsel={(v) => setze("kamerasAnderer", v)} /></Zeile>
                  <Zeile titel="Geteilter Bildschirm der anderen"><Schalter name="Geteilter Bildschirm der anderen" an={entwurf.bildschirmAnderer} onWechsel={(v) => setze("bildschirmAnderer", v)} /></Zeile>
                </div>
              </section>
            )}

            {reiter === "regeln" && (
              <section>
                <h4 className="mb-1 text-lg font-semibold">Regeln des Raums</h4>
                <p className="mb-4 text-xs text-muted-foreground">Diese Regeln gelten für alle im Raum.</p>
                <RegelnFormular regeln={regeln} stilleVorgabe={stilleVorgabe} onSpeichern={(r) => { onRegelnSpeichern(r); onZu() }} />
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

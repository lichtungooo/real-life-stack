// Menschen in die Konferenz holen (Spec video, "Einladen").
//
// Timo, 30.09.2026: "dass der, der eine Konferenz startet, Nutzer dafür
// einlädt. Und dass es einen Link gibt, den man verschicken kann, falls noch
// ein Nutzer mit beitreten will, der noch nie drin war." Zwei Wege: aus der
// Kontaktliste direkt, und "Link kopieren" für Telegram oder Signal. Keine
// E-Mail. Wer neu ist, wird richtiges Mitglied: Die Runde sieht ihn als
// "neu" und nimmt ihn mit einem Klick in die Gruppe auf.
//
// Die Konferenz kennt den Stack nicht. Was sie zum Einladen braucht, gibt
// ihr die App über `KonferenzEinladen`: den Link, die Kontakte, und wie man
// einen Menschen einlädt oder aufnimmt.

import { useState } from "react"
import { Check, Copy, Link2, UserPlus, X } from "lucide-react"
import { moderationVon } from "@kreis/core"
import type { KreisKontext } from "../raum-kontext"

export interface EinladbarerKontakt {
  id: string
  name: string
  /** Schon Mitglied der Gruppe: dann gibt es nichts einzuladen. */
  mitglied: boolean
}

export interface KonferenzEinladen {
  /** Der Link zum Weitergeben. Er fuehrt Mitglieder in die Konferenz und Neue durch das Anlegen ihres Zugangs. */
  link: string
  /** Die Kontakte, die sich einladen lassen. */
  kontakte: readonly EinladbarerKontakt[]
  /** Einen Kontakt in die Gruppe einladen. */
  kontaktEinladen: (id: string) => Promise<void>
  /** Ist diese Kennung schon Mitglied der Gruppe? */
  istMitglied: (kennung: string) => boolean
  /** Einen Menschen aus dem Raum in die Gruppe aufnehmen. */
  aufnehmen: (kennung: string, name: string) => Promise<void>
}

/**
 * Der Text, der mit dem Link verschickt wird. Er traegt, was die Vorschau
 * des Messengers nicht weiss: welche Session, wozu, und was Neue erwartet.
 */
export function einladungsText(gruppe: string, link: string, beschreibung?: string): string {
  const teile = [
    `Einladung zur Session „${gruppe}“`,
    beschreibung?.trim() ? beschreibung.trim() : null,
    "Wir treffen uns im Video-Raum der Gruppe: Bild, Ton, Chat und der Kreis mit dem Redestab. Ein Klick führt hinein.",
    link,
    "Zum ersten Mal dabei? Du legst dir deinen eigenen Zugang an, zwölf Wörter, die nur dir gehören. Dann nimmt dich die Runde in die Gruppe auf.",
    "Conferencing ist ein Modul vom Real Life Network.",
  ]
  return teile.filter(Boolean).join("\n\n")
}

async function kopieren(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function EinladenDialog({ gruppe, einladen, onZu }: { gruppe: string; einladen: KonferenzEinladen; onZu: () => void }) {
  const [beschreibung, setBeschreibung] = useState("")
  const [kopiert, setKopiert] = useState<"text" | "link" | "fehler" | null>(null)
  const [suche, setSuche] = useState("")
  const [eingeladen, setEingeladen] = useState<ReadonlySet<string>>(new Set())
  const [fehler, setFehler] = useState<ReadonlyMap<string, string>>(new Map())
  const text = einladungsText(gruppe, einladen.link, beschreibung)
  const liste = einladen.kontakte
    .filter((k) => k.name.toLowerCase().includes(suche.trim().toLowerCase()))
    .sort((a, b) => Number(a.mitglied) - Number(b.mitglied) || a.name.localeCompare(b.name))

  const alsKopiert = async (was: "text" | "link") => setKopiert((await kopieren(was === "text" ? text : einladen.link)) ? was : "fehler")

  const einladenKontakt = async (k: EinladbarerKontakt) => {
    try {
      await einladen.kontaktEinladen(k.id)
      setEingeladen((alt) => new Set(alt).add(k.id))
    } catch (e) {
      setFehler((alt) => new Map(alt).set(k.id, e instanceof Error ? e.message : "Das ging nicht."))
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Einladen" className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onZu}>
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-card text-foreground shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center border-b px-5 py-4">
          <h3 className="text-lg font-semibold">In die Session „{gruppe}“ einladen</h3>
          <button type="button" onClick={onZu} aria-label="Schließen" className="ml-auto rounded-lg p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex min-h-0 flex-col gap-6 overflow-y-auto px-5 py-4">
          <section className="flex flex-col gap-2">
            <h4 className="flex items-center gap-2 text-sm font-semibold"><Link2 className="h-4 w-4" /> Link teilen</h4>
            <p className="text-xs text-muted-foreground">Für Telegram, Signal oder jede andere Gruppe. Auch wer noch nie dabei war, kommt so herein.</p>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs text-muted-foreground">Worum geht es? (wer mag)</span>
              <textarea value={beschreibung} onChange={(e) => { setBeschreibung(e.target.value); setKopiert(null) }} rows={2} maxLength={400}
                placeholder="Zum Beispiel: Wir klären, wie es mit dem Garten weitergeht."
                className="resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
            </label>
            <pre aria-label="Vorschau des Textes" className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted/60 p-3 font-sans text-xs text-foreground/90">{text}</pre>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void alsKopiert("text")}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                {kopiert === "text" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {kopiert === "text" ? "Kopiert" : "Text mit Link kopieren"}
              </button>
              <button type="button" onClick={() => void alsKopiert("link")}
                className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm hover:bg-muted/70">
                {kopiert === "link" ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />} {kopiert === "link" ? "Kopiert" : "Nur den Link"}
              </button>
            </div>
            {kopiert === "fehler" && <p className="text-xs text-rose-600">Der Browser lässt das Kopieren nicht zu. Markiere den Text oben und kopiere ihn von Hand.</p>}
          </section>

          <section className="flex flex-col gap-2">
            <h4 className="flex items-center gap-2 text-sm font-semibold"><UserPlus className="h-4 w-4" /> Aus deinen Kontakten</h4>
            {einladen.kontakte.length === 0 ? (
              <p className="text-xs text-muted-foreground">Noch keine verbundenen Kontakte. Wer über den Link kommt, nimmst du in der Konferenz auf.</p>
            ) : (
              <>
                <input value={suche} onChange={(e) => setSuche(e.target.value)} placeholder="Suchen" aria-label="Kontakte suchen"
                  className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
                <ul className="flex flex-col gap-1">
                  {liste.map((k) => (
                    <li key={k.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50">
                      <span className="min-w-0 flex-1 truncate text-sm">{k.name}</span>
                      {k.mitglied ? (
                        <span className="text-xs text-muted-foreground">in der Gruppe</span>
                      ) : eingeladen.has(k.id) ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-600"><Check className="h-3.5 w-3.5" /> eingeladen</span>
                      ) : (
                        <button type="button" onClick={() => void einladenKontakt(k)} className="rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:opacity-90">
                          Einladen
                        </button>
                      )}
                      {fehler.get(k.id) && <span className="text-xs text-rose-600" title={fehler.get(k.id)}>nicht möglich</span>}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">Eingeladene bekommen die Einladung in die Gruppe und finden die Konferenz dort unter Video.</p>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

/**
 * Wer im Raum ist und noch nicht zur Gruppe gehoert. Jeder Mensch aus der
 * Gruppe kann ihn aufnehmen; die Einladung ist an seinen eigenen Schluessel
 * verschluesselt, nur er kann sie annehmen.
 */
export function NeuImRaum({ kreis, einladen }: { kreis: KreisKontext; einladen: KonferenzEinladen }) {
  const [aufgenommen, setAufgenommen] = useState<ReadonlySet<string>>(new Set())
  const [fehler, setFehler] = useState<string | null>(null)
  const neue = kreis.teilnehmer
    .filter((t) => !t.ichSelbst)
    .map((t) => ({ t, kennung: kreis.neben.kennungVon(t.id) }))
    .filter((x): x is { t: typeof x.t; kennung: string } => !!x.kennung && !einladen.istMitglied(x.kennung))
  const ichBinMitglied = (() => {
    const meine = kreis.ich ? kreis.neben.kennungVon(kreis.ich) : undefined
    return !!meine && einladen.istMitglied(meine)
  })()
  if (neue.length === 0 || !ichBinMitglied) return null
  return (
    <div className="mx-2 mt-3 rounded-xl bg-amber-400/10 p-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-amber-300">Neu im Raum</p>
      <ul className="flex flex-col gap-1.5">
        {neue.map(({ t, kennung }) => (
          <li key={t.id} className="flex items-center gap-2 text-sm">
            <span className="min-w-0 flex-1 truncate">{t.name}</span>
            {moderationVon(kreis.sitzung).warteraum && !kreis.neben.hereingeholt.has(kennung) && (
              <button type="button" onClick={() => kreis.neben.hereinholen(kennung)}
                className="rounded-lg bg-white/15 px-2.5 py-1 text-xs font-semibold hover:bg-white/25">Hereinholen</button>
            )}
            {aufgenommen.has(kennung) ? (
              <span className="flex items-center gap-1 text-xs text-emerald-300"><Check className="h-3.5 w-3.5" /> eingeladen</span>
            ) : (
              <button type="button"
                onClick={async () => {
                  try { await einladen.aufnehmen(kennung, t.name); setAufgenommen((a) => new Set(a).add(kennung)); setFehler(null) }
                  catch (e) { setFehler(e instanceof Error ? e.message : "Das ging nicht.") }
                }}
                className="rounded-lg bg-amber-400 px-2.5 py-1 text-xs font-semibold text-slate-900 hover:bg-amber-300">
                In die Gruppe aufnehmen
              </button>
            )}
          </li>
        ))}
      </ul>
      {fehler && <p className="mt-2 text-xs text-rose-300">{fehler}</p>}
    </div>
  )
}

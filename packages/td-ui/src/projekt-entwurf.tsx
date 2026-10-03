// Ein Profil aus dem Entwurf eines Agenten anlegen (DEFINITION 13.6, seit
// 13.8 für alle drei Arten: Projekt, Stiftung, Einrichtung).
//
// Der Link aus dem MCP-Server `td-mcp` trägt den Entwurf im Fragment. Dieser
// Dialog liest ihn, prüft ihn noch einmal mit derselben Schleuse, zeigt die
// Vorschau und den Prüfbericht, und erst der Klick des Menschen legt an.
// Geschrieben wird von der App (über den Connector, mit seiner Identität),
// nie vom Agenten.
//
// Eigener Einstieg `@trustdonation/ui/projekt-entwurf`, nachgeladen nur,
// wenn ein Link einen Entwurf trägt.

import { useMemo, useState } from "react"
import { AlertTriangle, Check, Info, Sparkles, X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@real-life-stack/toolkit"
import {
  BAUPLAN_PROJEKT,
  profilAufbauen,
  profilEntwurfLesen,
  projektProfil,
  stiftungsProfil,
  personProfil,
  sichtbarkeit,
  SICHTBARKEIT_NAME,
  type ProfilArt,
  type ProjektEntwurf,
} from "@trustdonation/core"
import { ProjektProfilSeite } from "./projekt-profil.js"
import { StiftungsProfilSeite } from "./stiftungs-profil.js"
import { ProfilFlaeche } from "./profil-flaeche.js"

export interface EntwurfSpace {
  id: string
  name: string
  /** Hat der Space die Komponente der Art (Project Profile, Stiftungsprofil) schon gewählt? */
  profilAktiv: boolean
  /** Bei der Einrichtung: trägt der Space schon ein Profil? */
  hatProfil?: boolean
}

export interface ProjektEntwurfDialogProps {
  /** `location.hash`, mit oder ohne `#`. */
  fragment: string
  /** Die Spaces je Art; die Bindung rechnet `profilAktiv` für die Art des Entwurfs. */
  spaces: readonly EntwurfSpace[] | ((art: ProfilArt) => readonly EntwurfSpace[])
  /** Die Spaces laden noch: kein „noch in keinem Space“, solange das gilt (Kimi, 03.10.2026). */
  spacesLaden?: boolean
  /** Vorgewählter Space, etwa der offene. */
  startSpace?: string
  /** Demo: gespeichert wird nur im eigenen Browser. */
  beispielwelt?: boolean
  bildUrl?: (pfad: string) => string
  /**
   * Anlegen. `weiter` führt zum Ergebnis. Ein `hinweis` heißt: angelegt
   * ist es, ein Nebenschritt (Profil einschalten) ging schief. Der Dialog
   * zeigt ihn, statt „nicht angelegt“ zu melden (Kimi, 02.10.2026).
   */
  onAnlegen: (spaceId: string, entwurf: ProjektEntwurf, profilEinschalten: boolean, art: ProfilArt) => Promise<{ weiter: () => void; hinweis?: string }>
  onSchliessen: () => void
}

const WORTE: Record<ProfilArt, { titel: string; knopf: string; laeuft: string; fertig: string; zum: string; komponente: string | null; fehler: string }> = {
  projekt: { titel: "Projektprofil aus deinem Entwurf", knopf: "Projekt anlegen", laeuft: "Wird angelegt …", fertig: "Das Projekt ist angelegt.", zum: "Zum Projekt", komponente: "Project Profile", fehler: "Das Projekt ließ sich nicht anlegen." },
  stiftung: { titel: "Stiftungsprofil aus deinem Entwurf", knopf: "Stiftung anlegen", laeuft: "Wird angelegt …", fertig: "Die Stiftung ist angelegt.", zum: "Zur Stiftung", komponente: "Stiftungsprofil", fehler: "Die Stiftung ließ sich nicht anlegen." },
  einrichtung: { titel: "Profil eurer Einrichtung aus deinem Entwurf", knopf: "Profil im Space speichern", laeuft: "Wird gespeichert …", fertig: "Das Profil ist gespeichert.", zum: "Zum Space", komponente: null, fehler: "Das Profil ließ sich nicht speichern." },
  person: { titel: "Dein Profil aus deinem Entwurf", knopf: "Als mein Profil speichern", laeuft: "Wird gespeichert …", fertig: "Dein Profil ist gespeichert.", zum: "Zu meinem Profil", komponente: null, fehler: "Dein Profil ließ sich nicht speichern." },
}

function Vorschau({ art, entwurf, bildUrl, spaceName }: { art: ProfilArt; entwurf: ProjektEntwurf; bildUrl?: (pfad: string) => string; spaceName?: string }) {
  if (art === "projekt") {
    const p = projektProfil(entwurf.daten, entwurf.tags)
    return <><h3 className="mb-1 text-xl font-semibold">{p.titel}</h3><ProjektProfilSeite profil={p} bildUrl={bildUrl} /></>
  }
  if (art === "stiftung") return <StiftungsProfilSeite profil={stiftungsProfil(entwurf.daten)} bildUrl={bildUrl} />
  if (art === "person") {
    const p = personProfil(entwurf.daten)
    const zeile = (feld: string, name: string, wert: string | null | undefined | string[]) => {
      const w = Array.isArray(wert) ? wert.join(" · ") : wert
      if (!w) return null
      return (
        <li key={feld} className="flex flex-col gap-0.5 rounded-2xl bg-muted/40 p-3">
          <span className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{name}<span className="normal-case tracking-normal">{SICHTBARKEIT_NAME[sichtbarkeit(entwurf.daten, feld)]}</span></span>
          <span className="whitespace-pre-line text-sm">{w}</span>
        </li>
      )
    }
    return (
      <div className="flex flex-col gap-3">
        <h3 className="text-xl font-semibold">{p.name}</h3>
        {p.kurz && <p className="text-muted-foreground">{p.kurz}</p>}
        <ul className="flex flex-col gap-2">
          {zeile("bio", "Über mich", p.ueber)}
          {zeile("kann", "Was ich kann", p.kann)}
          {zeile("bietet", "Was ich anbiete", p.bietet)}
          {zeile("sucht", "Was ich suche", p.sucht)}
          {zeile("mitmachen", "Wo ich mitmache", p.mitmachen)}
          {zeile("locationName", "Wo ich wirke", p.ort)}
          {zeile("website", "Website", p.kontakt.website)}
          {zeile("mail", "Mail", p.kontakt.mail)}
          {zeile("telefon", "Telefon", p.kontakt.telefon)}
        </ul>
        <p className="text-xs text-muted-foreground">Neben jeder Angabe steht, wer sie sehen soll. Ändern kannst du das jederzeit in deinem Profil unter „Wer sieht was“.</p>
      </div>
    )
  }
  return <ProfilFlaeche name={spaceName} profil={profilAufbauen(entwurf.daten, BAUPLAN_PROJEKT)} ordnungsId="entwurf-einrichtung" />
}

export function ProjektEntwurfDialog(p: ProjektEntwurfDialogProps) {
  const gelesen = useMemo(() => profilEntwurfLesen(p.fragment), [p.fragment])
  const art: ProfilArt = gelesen?.art ?? "projekt"
  const bericht = gelesen?.bericht ?? null
  const w = WORTE[art]
  const spaces = typeof p.spaces === "function" ? p.spaces(art) : p.spaces
  // Die Wahl abgeleitet, nicht eingefroren: Laden die Spaces erst nach dem
  // Öffnen, greift die Vorauswahl trotzdem (Kimi, 02.10.2026).
  const [gewaehlt, setSpaceId] = useState<string | null>(null)
  const spaceId = gewaehlt && spaces.some((s) => s.id === gewaehlt)
    ? gewaehlt
    : (spaces.find((s) => s.id === p.startSpace)?.id ?? spaces[0]?.id ?? "")
  const space = spaces.find((s) => s.id === spaceId)
  const [fertig, setFertig] = useState<{ weiter: () => void; hinweis: string } | null>(null)
  const [einschalten, setEinschalten] = useState(true)
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)

  const anlegen = async () => {
    if (!bericht || (!space && art !== "person")) return
    setLaeuft(true)
    setFehler(null)
    try {
      const r = await p.onAnlegen(space?.id ?? "", bericht.entwurf, Boolean(w.komponente) && einschalten && !space?.profilAktiv, art)
      if (r.hinweis) setFertig({ weiter: r.weiter, hinweis: r.hinweis })
      else r.weiter()
    } catch (e) {
      setFehler(e instanceof Error ? e.message : w.fehler)
      setLaeuft(false)
    }
  }

  return (
    <Dialog open onOpenChange={(an) => { if (!an) p.onSchliessen() }}>
      <DialogContent showCloseButton={false} aria-describedby={undefined}
        className="flex max-h-[92dvh] w-[96vw] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <header className="flex items-center gap-3 border-b px-5 py-3">
          <Sparkles className="h-5 w-5 text-emerald-600" />
          <DialogTitle className="flex-1 text-lg">{w.titel}</DialogTitle>
          <button type="button" onClick={p.onSchliessen} aria-label="Schließen" className="rounded-full p-1.5 opacity-60 hover:opacity-100"><X className="h-5 w-5" /></button>
        </header>

        {fertig ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <Check className="h-8 w-8 text-emerald-600" />
            <p className="font-semibold">{w.fertig}</p>
            <p className="max-w-md text-sm text-muted-foreground">{fertig.hinweis}</p>
            <button type="button" onClick={fertig.weiter} className="rounded-xl bg-emerald-700 px-4 py-2.5 font-semibold text-white hover:bg-emerald-800">{w.zum}</button>
          </div>
        ) : !bericht ? (
          <div className="p-8 text-center">
            <p className="font-semibold">Dieser Link trägt keinen lesbaren Entwurf.</p>
            <p className="mt-2 text-sm text-muted-foreground">Vielleicht wurde er beim Kopieren abgeschnitten. Lass dir den Link von deinem Agenten noch einmal geben.</p>
          </div>
        ) : (
          <div className="grid flex-1 gap-6 overflow-y-auto p-5 md:grid-cols-[minmax(0,1fr)_300px]">
            <section aria-label="Vorschau">
              <Vorschau art={art} entwurf={bericht.entwurf} bildUrl={p.bildUrl} spaceName={art === "einrichtung" ? space?.name : undefined} />
            </section>

            <aside className="flex flex-col gap-4 md:sticky md:top-0 md:self-start">
              <section className="rounded-2xl bg-muted/50 p-4 text-sm" aria-label="Prüfbericht">
                <p className="mb-2 font-semibold">Was dein Agent geliefert hat</p>
                <p className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {bericht.zeigt.length ? bericht.zeigt.join(", ") : "noch nichts, was erscheint"}</p>
                {bericht.fehlt.length > 0 && (
                  <div className="mt-3 rounded-xl bg-amber-50/70 p-3 dark:bg-amber-950/40">
                    <p className="flex items-center gap-1.5 font-medium"><Info className="h-4 w-4" /> Es fehlt noch</p>
                    <ul className="mt-1 list-disc pl-5 text-muted-foreground">{bericht.fehlt.map((f) => <li key={f.id}>{f.frage}</li>)}</ul>
                    <p className="mt-1 text-xs text-muted-foreground">Du kannst trotzdem speichern und später ergänzen.</p>
                  </div>
                )}
                {bericht.verworfen.length > 0 && (
                  <div className="mt-3 rounded-xl bg-rose-50/70 p-3 dark:bg-rose-950/40">
                    <p className="flex items-center gap-1.5 font-medium"><AlertTriangle className="h-4 w-4" /> Weggelassen</p>
                    <ul className="mt-1 list-disc pl-5 text-muted-foreground">{bericht.verworfen.map((v, i) => <li key={i}>{v}</li>)}</ul>
                  </div>
                )}
              </section>

              {art === "person" ? (
                <section className="flex flex-col gap-3 rounded-2xl bg-emerald-50/60 p-4 text-sm dark:bg-emerald-950/40" aria-label="Speichern">
                  <p>Das wird dein eigenes Profil. Was öffentlich sein soll, siehst du in der Vorschau; ändern kannst du es danach jederzeit.</p>
                  {fehler && <p className="text-rose-700 dark:text-rose-300">{fehler}</p>}
                  <button type="button" onClick={() => void anlegen()} disabled={laeuft}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
                    <Check className="h-4 w-4" /> {laeuft ? w.laeuft : w.knopf}
                  </button>
                </section>
              ) : spaces.length === 0 && p.spacesLaden ? (
                <p className="rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">Deine Spaces werden geladen …</p>
              ) : spaces.length === 0 ? (
                <p className="rounded-2xl bg-amber-50/70 p-4 text-sm dark:bg-amber-950/40">Du bist noch in keinem Space. Lege zuerst einen an oder tritt einem bei, dann öffne den Link noch einmal.</p>
              ) : (
                <section className="flex flex-col gap-3 rounded-2xl bg-emerald-50/60 p-4 text-sm dark:bg-emerald-950/40" aria-label="Anlegen">
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">{art === "einrichtung" ? "Für welchen Space?" : "In welchem Space?"}</span>
                    <select value={spaceId} onChange={(e) => setSpaceId(e.target.value)} className="rounded-lg bg-background px-3 py-2">
                      {spaces.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </label>
                  {w.komponente && space && !space.profilAktiv && (
                    <label className="flex items-start gap-2">
                      <input type="checkbox" checked={einschalten} onChange={(e) => setEinschalten(e.target.checked)} className="mt-0.5" />
                      <span>Das {w.komponente} in diesem Space einschalten, damit es so erscheint</span>
                    </label>
                  )}
                  {art === "einrichtung" && (
                    <p className="text-xs text-muted-foreground">
                      Speichern kann, wer den Space verwaltet.{space?.hatProfil ? " Der Space trägt schon ein Profil: Was der Entwurf mitbringt, ersetzt das Bisherige, der Rest bleibt." : ""}
                    </p>
                  )}
                  {p.beispielwelt && <p className="text-xs text-muted-foreground">Demo: Gespeichert wird nur in deinem Browser.</p>}
                  {fehler && <p className="text-rose-700 dark:text-rose-300">{fehler}</p>}
                  <button type="button" onClick={() => void anlegen()} disabled={laeuft || !space}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
                    <Check className="h-4 w-4" /> {laeuft ? w.laeuft : w.knopf}
                  </button>
                  <p className="text-xs text-muted-foreground">Gespeichert wird mit deiner Identität. Dein Agent hat nichts gespeichert.</p>
                </section>
              )}
            </aside>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** Derselbe Dialog unter seinem allgemeinen Namen. */
export const ProfilEntwurfDialog = ProjektEntwurfDialog

export default ProjektEntwurfDialog

// Das Modul-Register der Referenz-App (Spec 01, Regel 2).
//
// Seit dem 21.09.2026 (B0–B5) bringt jedes Toolkit-Modul seine Flaeche
// selbst mit: Die App erweitert hier nichts mehr. Sie komponiert trotzdem —
// einmal, vor dem ersten Render (main.tsx) —, damit klar ist, WO eine App
// eigene Module einfuehrt (`definitions`) oder eine Toolkit-Flaeche
// ausdruecklich ersetzt (`extensions` mit `replaces: ["view"]`).

import { Suspense, lazy } from "react"
import { Bot, Sparkles, Video } from "lucide-react"
import {
  TOOLKIT_DEFINITION,
  composeModules,
  setModuleRegistry,
  type ModuleViewProps,
} from "@real-life-stack/toolkit"
import { CompanionView } from "./views/companion-view"

// Das Video wird nachgeladen statt mitgeliefert: Wer den Reiter nie oeffnet,
// laedt seine Flaeche nicht. Die Verbindung selbst (Provider in App.tsx) ist
// klein und bleibt im Hauptstueck.
const VideoLazy = lazy(() => import("@kreis/ui/flaechen").then((m) => ({ default: m.VideoFlaeche })))
const laedt = <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Einen Moment …</div>
// Der Einladungslink. Er fuehrt auf die Einladungsseite der Instanz
// (`/einladung/`, Instanz-Repo trustdonation, mit Vorschau fuer Telegram und
// Signal), die weiter in die App leitet. Nur die App kennt ihre Adresse.
export const einladungsLink = (gruppeId: string, gruppeName: string) =>
  `${window.location.origin}/einladung/?konferenz=${encodeURIComponent(gruppeId)}&gruppe=${encodeURIComponent(gruppeName)}`
// Das KI-Modul (DEFINITION 13.10): Chat nachgeladen, erst wer den Reiter öffnet.
const KiViewLazy = lazy(() => import("./views/ki-view").then((m) => ({ default: m.KiView })))
const KiModul = () => <Suspense fallback={laedt}><KiViewLazy /></Suspense>
const VideoModul = (p: ModuleViewProps) => <Suspense fallback={laedt}><VideoLazy {...p} einladungsLink={einladungsLink} /></Suspense>

// Einmal komponiert, einmal gebunden, danach unveraenderlich (Spec 01, Regel 3).
export const MODULE_REGISTRY = composeModules([
  TOOLKIT_DEFINITION,
  // Die Schicht von trustdonation. Sie ergaenzt, sie ersetzt nichts: Antons
  // Module bleiben unberuehrt (Spec 01, Regel 2).
  //
  // Der Baukasten stand hier bis zum 01.10.2026 als Modul. Er ist raus
  // (Timo: "vollkommen Quatsch"); ausgewaehlt wird jetzt in den
  // Erweiterungen, einem Abschnitt im Space-Dialog (DEFINITION Teil 8).
  //
  // Das Profil steht hier mit Absicht NICHT. Ein Reiter ist eine
  // Arbeitsflaeche; ein Profil ist die Identitaetskarte dessen, mit dem man
  // es zu tun hat. Es erscheint als Komponente im Panel rechts, neben dem
  // Profil eines Menschen (views/profil-panel.tsx, docs/13-profil.md).
  { name: "trustdonation", definitions: [
    // Die Begleitung (DEFINITION Teil 13). `presents` fehlt mit Absicht: Sie
    // ist keine Sicht auf ein Item-Feld, sie liest die Items. Wer sie in die
    // Feld-Praesenz haengt, macht sie zur Karte fuer ein Feld, das es nicht
    // gibt.
    { id: "companion", label: "Begleitung", icon: Sparkles, maxWidth: "max-w-3xl", view: CompanionView },
    { id: "ki", label: "KI", icon: Bot, fill: "bleed", frame: "bare", view: KiModul },
  ] },
  // Das Video (docs/spec/modules/video.md), eine eigene Schicht, damit es
  // ohne trustdonation zu Anton hinuebergehen kann. Der Kreis mit Redestab
  // und Prozessen ist kein eigener Reiter mehr, sondern ein Tool im Modul:
  // eine Module Component in der Mitte der Konferenz (Timo, 30.09.2026;
  // Antons Regel 7 in docs/spec/modules/README.md). `keepMounted`, weil ein
  // Wechsel zur Karte die Sitzung nicht beenden darf.
  { name: "kreis", definitions: [
    // Id bleibt `video` (steht in `Group.data.modules`), der Name heisst
    // Circeling, so geschrieben (Timo, 01.10.2026: „nein, es soll Circeling heißen, nicht Circling“; vorher „Conferencing“).
    { id: "video", label: "Circeling", icon: Video, enabledByDefault: true, fill: "bleed", keepMounted: true, frame: "bare", view: VideoModul },
  ] },
  // Die Grundausstattung eines Space ohne eigene Liste: Feed, Kalender,
  // Karte, dazu das Video. Kanban bleibt im Register und laesst sich im
  // Zahnrad dazunehmen (Timo, 30.09.2026). Ein ausdruecklicher Ersatz ueber
  // Antons Regel 2, keine Naht.
  { name: "grundausstattung", extensions: [
    { id: "kanban", enabledByDefault: false, replaces: ["enabledByDefault"] },
  ] },
  { name: "app", definitions: [], extensions: [] },
])

setModuleRegistry(MODULE_REGISTRY)

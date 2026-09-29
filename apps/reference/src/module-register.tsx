// Das Modul-Register der Referenz-App (Spec 01, Regel 2).
//
// Seit dem 21.09.2026 (B0–B5) bringt jedes Toolkit-Modul seine Flaeche
// selbst mit: Die App erweitert hier nichts mehr. Sie komponiert trotzdem —
// einmal, vor dem ersten Render (main.tsx) —, damit klar ist, WO eine App
// eigene Module einfuehrt (`definitions`) oder eine Toolkit-Flaeche
// ausdruecklich ersetzt (`extensions` mit `replaces: ["view"]`).

import { Suspense, lazy } from "react"
import { Blocks, CircleDot, Sparkles, Video } from "lucide-react"
import {
  TOOLKIT_DEFINITION,
  composeModules,
  setModuleRegistry,
  type ModuleViewProps,
} from "@real-life-stack/toolkit"
import { BaukastenView } from "./views/baukasten-view"
import { CompanionView } from "./views/companion-view"

const Baukasten = ({ groupId }: ModuleViewProps) => <BaukastenView groupId={groupId} />

// Kreis und Video werden nachgeladen statt mitgeliefert: Wer den Reiter nie
// oeffnet, laedt ihre Flaechen nicht. Die Verbindung selbst (Provider in
// App.tsx) ist klein und bleibt im Hauptstueck.
const KreisLazy = lazy(() => import("@kreis/ui/flaechen").then((m) => ({ default: m.KreisFlaeche })))
const VideoLazy = lazy(() => import("@kreis/ui/flaechen").then((m) => ({ default: m.VideoFlaeche })))
const laedt = <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Einen Moment …</div>
const Kreis = (p: ModuleViewProps) => <Suspense fallback={laedt}><KreisLazy {...p} /></Suspense>
const VideoModul = (p: ModuleViewProps) => <Suspense fallback={laedt}><VideoLazy {...p} /></Suspense>

// Einmal komponiert, einmal gebunden, danach unveraenderlich (Spec 01, Regel 3).
export const MODULE_REGISTRY = composeModules([
  TOOLKIT_DEFINITION,
  // Die Schicht von trustdonation. Sie ergaenzt, sie ersetzt nichts: Antons
  // Module bleiben unberuehrt (Spec 01, Regel 2).
  //
  // `enabledByDefault` fehlt mit Absicht. Der Baukasten erscheint erst, wenn
  // ein Netzwerk ihn in `Group.data.modules` aufnimmt: Eine Stiftung, die
  // ihren Eintrag ansieht, braucht ihn nicht.
  //
  // Das Profil steht hier mit Absicht NICHT. Ein Reiter ist eine
  // Arbeitsflaeche; ein Profil ist die Identitaetskarte dessen, mit dem man
  // es zu tun hat. Es erscheint als Komponente im Panel rechts, neben dem
  // Profil eines Menschen (views/profil-panel.tsx, docs/13-profil.md).
  { name: "trustdonation", definitions: [
    { id: "baukasten", label: "Baukasten", icon: Blocks, fill: "bleed", view: Baukasten },
    // Die Begleitung (DEFINITION Teil 13). `presents` fehlt mit Absicht: Sie
    // ist keine Sicht auf ein Item-Feld, sie liest die Items. Wer sie in die
    // Feld-Praesenz haengt, macht sie zur Karte fuer ein Feld, das es nicht
    // gibt.
    { id: "companion", label: "Begleitung", icon: Sparkles, maxWidth: "max-w-3xl", view: CompanionView },
  ] },
  // Der Kreis (docs/spec/modules/kreis.md): eine eigene Schicht, damit er
  // ohne trustdonation zu Anton hinuebergehen kann. `keepMounted`, weil ein
  // Wechsel zur Karte die Sitzung nicht beenden darf: Wer im Kreis sitzt,
  // bleibt drin, auch wenn er kurz etwas nachsieht.
  { name: "kreis", definitions: [
    { id: "kreis", label: "Kreis", icon: CircleDot, fill: "bleed", keepMounted: true, view: Kreis },
    // Das Video (docs/spec/modules/video.md): dieselbe Verbindung wie der
    // Kreis, und Gastgeber fuer jedes andere Modul des Space.
    { id: "video", label: "Video", icon: Video, fill: "bleed", keepMounted: true, view: VideoModul },
  ] },
  { name: "app", definitions: [], extensions: [] },
])

setModuleRegistry(MODULE_REGISTRY)

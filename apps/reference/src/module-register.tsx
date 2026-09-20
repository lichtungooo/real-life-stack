// App-Schicht des Modul-Registers (Spec 01, "Modul-Register").
//
// Das Toolkit fuehrt die Modul-Ids samt Label, Icon und Fuellmodus; die App
// haengt hier ihre Flaechen daran. Ein neues Modul braucht damit zwei
// Eintraege — einen im Toolkit-Register und die View hier — statt frueher
// sechs verstreuter Listen.
//
// Einmal importieren, vor dem ersten Render (main.tsx).

import { Suspense, lazy } from "react"
import { Blocks, Sparkles } from "lucide-react"
import type { Group } from "@real-life-stack/data-interface"
import {
  CORE_MODULE_LAYER,
  composeModules,
  setModuleRegistry,
  type ModuleViewProps,
  type SelectionFocusVisibleArea,
} from "@real-life-stack/toolkit"
import { FeedView } from "./views/feed-view"
import { CalendarViewWrapper } from "./views/calendar-view"
import { KanbanView } from "./views/kanban-view"
import { CollectionView } from "./views/collection-view"
import { ResonanceView } from "./views/resonance-view"
import { GraphViewWrapper } from "./views/graph-view"
import { BaukastenView } from "./views/baukasten-view"
import { CompanionView } from "./views/companion-view"

// Die Views haben historisch leicht unterschiedliche Signaturen; hier werden
// sie auf den gemeinsamen Vertrag gebracht, damit der Dispatch nichts ueber
// einzelne Module wissen muss.
const Feed = ({ groupId }: ModuleViewProps) => <FeedView groupId={groupId} />
const Calendar = ({ groupId }: ModuleViewProps) => <CalendarViewWrapper groupId={groupId} />
const Resonance = ({ groupId }: ModuleViewProps) => <ResonanceView groupId={groupId} />
const Baukasten = ({ groupId }: ModuleViewProps) => <BaukastenView groupId={groupId} />
// Die Karte wird nachgeladen statt mitgeliefert. Sie bringt die
// Kartenbibliothek mit (rund ein Megabyte) und ist damit das groesste
// Einzelstueck der App. Wer nie auf die Karte geht, soll sie nicht laden:
// Eine Stiftung oeffnet den Link auf dem Telefon im Zug.
//
// `keepMounted` im Registereintrag sorgt dafuer, dass sie nach dem ersten
// Oeffnen im Baum bleibt; das Nachladen kostet darum genau einmal.
const MapView = lazy(() => import("./views/map-view").then((m) => ({ default: m.MapView })))
const Map = ({ groupId, active }: ModuleViewProps) => (
  <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Karte wird geladen …</div>}>
    <MapView groupId={groupId} active={active} />
  </Suspense>
)
const Graph = ({ groupId }: ModuleViewProps) => (
  <GraphViewWrapper groupId={groupId || "__overview__"} />
)
const Kanban = ({ groupId, groups }: ModuleViewProps) => (
  <KanbanView activeWorkspaceId={groupId || null} groups={(groups ?? []) as Group[]} />
)
const Collection = ({ groupId, selectionFocusVisibleArea }: ModuleViewProps) => (
  <CollectionView
    groupId={groupId}
    selectionFocusVisibleArea={selectionFocusVisibleArea as SelectionFocusVisibleArea | undefined}
  />
)

// Einmal komponiert, einmal gebunden, danach unveraenderlich. Kein Konsument
// muss sich fragen, ob er zu frueh gelesen hat (Review #277).
export const MODULE_REGISTRY = composeModules([
  CORE_MODULE_LAYER,
  // Die Schicht von trustdonation. Sie ergaenzt, sie ersetzt nichts: Antons
  // sieben Module bleiben unberuehrt (Spec 01, Regel 2).
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
    { id: "baukasten", label: "Baukasten", icon: Blocks, fill: "bleed" },
    // Die Begleitung (DEFINITION Teil 13). `presents` fehlt mit Absicht: Sie
    // ist keine Sicht auf ein Item-Feld, sie liest die Items. Wer sie in die
    // Feld-Praesenz haengt, macht sie zur Karte fuer ein Feld, das es nicht
    // gibt.
    { id: "companion", label: "Begleitung", icon: Sparkles, maxWidth: "max-w-3xl" },
  ] },
  { name: "app", extensions: [
    { id: "baukasten", view: Baukasten },
    { id: "companion", view: CompanionView },
    { id: "feed", view: Feed },
    { id: "kanban", view: Kanban },
    { id: "calendar", view: Calendar },
    { id: "map", view: Map },
    { id: "resonance", view: Resonance },
    { id: "collection", view: Collection },
    { id: "graph", view: Graph },
  ] },
])

setModuleRegistry(MODULE_REGISTRY)

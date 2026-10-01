// Die Erweiterungen im Space-Dialog (DEFINITION Teil 8), die Bindung.
//
// Ueber Antons Haken fuer App-Abschnitte (GroupDialog `appSections`,
// rls#551): kein Eingriff in seinen Dialog. Welche Module es gibt, sagt sein
// Register; Beschreibung, Erbauer und Reife unser Verzeichnis in td-core.
// Geschrieben wird `Group.data.modules` ueber `patchData`, seinen Weg.
// Komponenten stehen nur in unserem Verzeichnis und landen in
// `Group.data.komponenten` (DEFINITION Teil 8).

import { lazy, Suspense } from "react"
import { IdCard, Puzzle } from "lucide-react"
import { defaultModuleIds, getModules, type AppSpaceSection } from "@real-life-stack/toolkit"
import { erweiterungenAus, komponentenAus, komponentenImSpace, modulSchalten } from "@trustdonation/core"
// Nachgeladen, erst wenn jemand den Abschnitt oeffnet (Budget, 01.10.2026).
const ErweiterungenAbschnitt = lazy(() =>
  import("@trustdonation/ui/erweiterungen").then((m) => ({ default: m.ErweiterungenAbschnitt })),
)

export const ERWEITERUNGEN_ABSCHNITT: AppSpaceSection = {
  id: "erweiterungen",
  label: "Erweiterungen",
  icon: Puzzle,
  render: ({ group, canEdit, patchData }) => {
    const roh = group.data?.modules
    const gespeichert = Array.isArray(roh) ? roh.filter((m): m is string => typeof m === "string") : undefined
    const komponenten = komponentenImSpace(group.data as Record<string, unknown> | undefined)
    const imSpace = new Set([...(gespeichert ?? defaultModuleIds()), ...komponenten])
    const alle = [
      ...erweiterungenAus(getModules()),
      ...komponentenAus().map((k) => ({ ...k, modul: { ...k.modul, icon: IdCard } })),
    ]
    return (
      <Suspense fallback={<div className="h-24 animate-pulse rounded-lg bg-muted" />}>
      <ErweiterungenAbschnitt
        erweiterungen={alle}
        imSpace={imSpace}
        darfAendern={canEdit}
        onSchalten={(id, an) =>
          alle.find((e) => e.id === id)?.art === "komponente"
            ? patchData({ komponenten: [...modulSchalten(komponenten, [], id, an)] })
            : patchData({ modules: [...modulSchalten(gespeichert, defaultModuleIds(), id, an)] })
        }
      />
      </Suspense>
    )
  },
}

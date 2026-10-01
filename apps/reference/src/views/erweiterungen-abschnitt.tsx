// Die Erweiterungen im Space-Dialog (DEFINITION Teil 8), die Bindung.
//
// Ueber Antons Haken fuer App-Abschnitte (GroupDialog `appSections`,
// rls#551): kein Eingriff in seinen Dialog. Welche Module es gibt, sagt sein
// Register; Beschreibung, Erbauer und Reife unser Verzeichnis in td-core.
// Geschrieben wird `Group.data.modules` ueber `patchData`, seinen Weg.

import { Puzzle } from "lucide-react"
import { defaultModuleIds, getModules, type AppSpaceSection } from "@real-life-stack/toolkit"
import { erweiterungenAus, modulSchalten } from "@trustdonation/core"
import { ErweiterungenAbschnitt } from "@trustdonation/ui"

export const ERWEITERUNGEN_ABSCHNITT: AppSpaceSection = {
  id: "erweiterungen",
  label: "Erweiterungen",
  icon: Puzzle,
  render: ({ group, canEdit, patchData }) => {
    const roh = group.data?.modules
    const gespeichert = Array.isArray(roh) ? roh.filter((m): m is string => typeof m === "string") : undefined
    const imSpace = new Set(gespeichert ?? defaultModuleIds())
    return (
      <ErweiterungenAbschnitt
        erweiterungen={erweiterungenAus(getModules())}
        imSpace={imSpace}
        darfAendern={canEdit}
        onSchalten={(id, an) => patchData({ modules: [...modulSchalten(gespeichert, defaultModuleIds(), id, an)] })}
      />
    )
  },
}

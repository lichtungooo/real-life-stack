// Spenden eines Space oder Netzwerks (DEFINITION Teil 8, „Nächster Träger:
// Space und Netzwerk“, freigegeben von Timo am 03.10.2026), die Bindung.
//
// Abschnitt „Spenden“ im Space-Dialog über Antons App-Abschnitte, wie die
// Erweiterungen; geschrieben wird `Group.data.opencollective` und
// `spendenziel` über `patchData`. Dazu der Knopf „Unterstützen“ für die
// Kopfzeile. Der Baustein selbst wird nachgeladen.

import { lazy, Suspense, useState } from "react"
import { useParams } from "react-router-dom"
import { HandHeart } from "lucide-react"
import { Button, useGroups, type AppSpaceSection } from "@real-life-stack/toolkit"
import { spaceSpenden } from "@trustdonation/core"

const OcEinstellungen = lazy(() => import("@trustdonation/ui/opencollective").then((m) => ({ default: m.OcEinstellungen })))
const OcWidgetDialog = lazy(() => import("@trustdonation/ui/opencollective").then((m) => ({ default: m.OcWidgetDialog })))

export const SPENDEN_ABSCHNITT: AppSpaceSection = {
  id: "spenden",
  label: "Spenden",
  icon: HandHeart,
  render: ({ group, canEdit, patchData }) => {
    const { adresse, ziel } = spaceSpenden(group.data as Record<string, unknown> | undefined)
    return (
      <Suspense fallback={<div className="h-24 animate-pulse rounded-lg bg-muted" />}>
        <OcEinstellungen key={group.id} adresse={adresse} ziel={ziel} darfAendern={canEdit} onSpeichern={(aenderung) => patchData(aenderung)} />
      </Suspense>
    )
  },
}

/** „Unterstützen“ in der Kopfzeile, nur wenn der offene Space eine Seite bei Open Collective trägt. */
export function SpendenKnopf() {
  const { scope } = useParams()
  const { data: groups } = useGroups()
  const [offen, setOffen] = useState(false)
  const group = scope ? (groups ?? []).find((g) => g.id === scope) : undefined
  const { adresse, ziel } = spaceSpenden(group?.data as Record<string, unknown> | undefined)
  if (!group || !adresse) return null
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOffen(true)} title={`${group.name} unterstützen`}
        className="h-9 gap-1.5 px-2.5 text-emerald-700 hover:text-emerald-800 dark:text-emerald-400">
        <HandHeart className="h-4 w-4" /><span className="hidden sm:inline">Unterstützen</span>
      </Button>
      {offen && (
        <Suspense fallback={null}>
          <OcWidgetDialog adresse={adresse} ziel={ziel} titel={group.name} offen={offen} onOffen={setOffen} />
        </Suspense>
      )}
    </>
  )
}

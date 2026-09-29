// Die Flaeche des Kreis-Moduls (Spec: docs/spec/modules/kreis.md).
//
// Draussen: der Vorraum mit Namen. Drinnen: der Kreis mit Redestab und
// Klangschale in der Mitte, daneben die Leiste zum Prozess, unten die
// Steuerknoepfe. Stille und Pause legen sich ueber den Kreis.

import { useCurrentUser, useGroups, type ModuleViewProps } from "@real-life-stack/toolkit"
import { KreisRaumFlaeche } from "./kreis-raum-flaeche"
import { useReiterWechsel } from "./reiter"

export function KreisFlaeche({ groupId }: ModuleViewProps) {
  const { data: groups } = useGroups()
  const { data: user } = useCurrentUser()
  const space = (groups ?? []).find((g) => g.id === groupId)
  const raumName = space?.name ?? groupId ?? "kreis"
  const reiter = useReiterWechsel(groupId)
  return (
    <KreisRaumFlaeche
      raumName={raumName}
      vorschlagName={user?.displayName}
      zurKonferenz={reiter.fuehrt("video") ? () => reiter.wechseln("video") : undefined}
    />
  )
}

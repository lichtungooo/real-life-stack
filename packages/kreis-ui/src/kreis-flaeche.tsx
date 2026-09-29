// Die Flaeche des Kreis-Moduls (Spec: docs/spec/modules/kreis.md).
//
// Draussen: der Vorraum mit Namen. Drinnen: der Kreis mit Redestab und
// Klangschale in der Mitte, daneben die Leiste zum Prozess, unten die
// Steuerknoepfe. Stille und Pause legen sich ueber den Kreis.

import { Info } from "lucide-react"
import { useCurrentUser, useGroups, type ModuleViewProps } from "@real-life-stack/toolkit"
import { useKreisRaumFabrik } from "./raum-kontext"
import { KreisRaumFlaeche } from "./kreis-raum-flaeche"

export function KreisFlaeche({ groupId }: ModuleViewProps) {
  const fabrik = useKreisRaumFabrik()
  const { data: groups } = useGroups()
  const { data: user } = useCurrentUser()
  const space = (groups ?? []).find((g) => g.id === groupId)
  const raumName = space?.name ?? groupId ?? "kreis"

  // Fehlt der Raum-Adapter, degradiert das Modul sichtbar (Spec, Capabilities).
  if (!fabrik) {
    return (
      <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
        <Info className="h-8 w-8 text-muted-foreground" />
        <p className="font-semibold text-foreground">Für den Kreis fehlt ein Raum.</p>
        <p className="text-sm text-muted-foreground">
          Diese App gibt dem Kreis keinen Raum-Adapter. Mit einem Adapter treffen sich hier die Menschen des Space, im Bild, im Ton und geführt von einem Prozess.
        </p>
      </div>
    )
  }
  return <KreisRaumFlaeche fabrik={fabrik} raumName={raumName} vorschlagName={user?.displayName} />
}

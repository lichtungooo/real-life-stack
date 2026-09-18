// Das Profil des offenen Space, an die App gebunden.
//
// Die Regel (welche Abschnitte, welche Felder) liegt in `@trustdonation/core`,
// die Darstellung in `@trustdonation/ui`. Hier wird beides mit dem verbunden,
// was die App weiß: welcher Space offen ist und was er trägt.
import { useMemo } from "react"
import { useGroups } from "@real-life-stack/toolkit"
import {
  profilAbschnitte,
  profilStand,
  BAUPLAN_FOERDERER,
  BAUPLAN_PROJEKT,
} from "@trustdonation/core"
import { ProfilFlaeche } from "@trustdonation/ui"

export function ProfilView({ groupId }: { groupId: string }) {
  const { data: groups } = useGroups()

  const group = useMemo(
    () => (groups ?? []).find((g) => g.id === groupId) ?? null,
    [groups, groupId],
  )

  const daten = (group?.data ?? {}) as Record<string, unknown>

  // Welcher Bauplan gilt, entscheidet die Art des Space. Ein Projekt stellt
  // dieselben sechs Fragen mit anderen Feldern (siehe docs/13-profil.md).
  const istProjekt = String(daten.kind ?? "") === "projekt"
  const bauplan = istProjekt ? BAUPLAN_PROJEKT : BAUPLAN_FOERDERER

  const abschnitte = useMemo(() => profilAbschnitte(daten, bauplan), [daten, bauplan])
  const stand = useMemo(() => profilStand(daten, bauplan), [daten, bauplan])

  // Die Art, wie sie im Netzwerk heißt. Sie steht in den `spaceKinds` des
  // Netzwerks; hier genügt die Kennung, solange die Zuordnung fehlt.
  const artLabel = typeof daten.kind === "string"
    ? daten.kind.charAt(0).toUpperCase() + daten.kind.slice(1)
    : undefined

  return (
    <ProfilFlaeche
      name={group?.name ?? ""}
      art={artLabel}
      bild={typeof daten.image === "string" ? daten.image : undefined}
      farbe={typeof daten.primaryColor === "string" ? daten.primaryColor : undefined}
      abschnitte={abschnitte}
      stand={stand}
      quelle={typeof daten.quelle === "string" ? daten.quelle : undefined}
    />
  )
}

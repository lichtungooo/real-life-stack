// Das Profil einer Einrichtung, rechts im Panel.
//
// Timo am 20.09.2026: *"Es sollte nicht oben in diesem Header-Bereich
// auftauchen als Profil, sondern rechts. Also es ist nicht einfach ein Modul,
// sondern es ist eine Komponente."*
//
// Ein Reiter ist eine Arbeitsfläche: Feed, Kanban, Karte sind Orte, an denen
// man etwas tut. Ein Profil ist die Identitätskarte dessen, mit dem man es zu
// tun hat. Sie gehört dorthin, wo man sie aufschlägt und wieder zuklappt,
// neben das Profil eines Menschen (siehe `docs/13-profil.md`).
//
// **Die Schichten:** Die Regel (welche Abschnitte, welche Felder) liegt in
// `@trustdonation/core`, die Darstellung in `@trustdonation/ui`. Hier wird
// beides mit dem verbunden, was die App weiß: welcher Space gemeint ist.
import { useMemo } from "react"
import { AdaptivePanel, useGroups } from "@real-life-stack/toolkit"
import {
  profilAbschnitte,
  profilStand,
  BAUPLAN_FOERDERER,
  BAUPLAN_PROJEKT,
} from "@trustdonation/core"
import { ProfilFlaeche } from "@trustdonation/ui"

export function SpaceProfilPanel({
  groupId,
  onClose,
}: {
  /** Der Space, dessen Profil offen steht. `null` hält das Panel zu. */
  groupId: string | null
  onClose: () => void
}) {
  const { data: groups } = useGroups()

  const group = useMemo(
    () => (groups ?? []).find((g) => g.id === groupId) ?? null,
    [groups, groupId],
  )

  const daten = useMemo(
    () => (group?.data ?? {}) as Record<string, unknown>,
    [group],
  )

  // Welcher Bauplan gilt, entscheidet die Art des Space. Ein Projekt stellt
  // dieselben sechs Fragen mit anderen Feldern (siehe docs/13-profil.md).
  const bauplan = String(daten.kind ?? "") === "projekt" ? BAUPLAN_PROJEKT : BAUPLAN_FOERDERER

  const abschnitte = useMemo(() => profilAbschnitte(daten, bauplan), [daten, bauplan])
  const stand = useMemo(() => profilStand(daten, bauplan), [daten, bauplan])

  // Die Art, wie sie im Netzwerk heißt. Sie steht in den `spaceKinds` des
  // Netzwerks; hier genügt die Kennung, solange die Zuordnung fehlt.
  const artLabel = typeof daten.kind === "string"
    ? daten.kind.charAt(0).toUpperCase() + daten.kind.slice(1)
    : undefined

  return (
    <AdaptivePanel
      open={groupId !== null}
      onClose={onClose}
      // Rechts als Spalte, wo Timo es haben wollte. Auf dem Telefon zieht
      // das Panel selbst den Schluss auf den Schlitten, und wer die Karte
      // breiter lesen will, schaltet oben auf die mittige Ansicht.
      allowedModes={["sidebar", "modal", "drawer"]}
      sidebarWidth="480px"
      modalClassName="sm:max-w-xl max-h-[85dvh]"
    >
      {/* Das Panel bringt Schliessen und Scrollen selbst mit; hier steht
          allein der Inhalt. Die Kopfzeile bekommt rechts Platz, damit der
          Name nicht unter den Knopf laeuft. */}
      {group && (
        <ProfilFlaeche
          key={group.id}
          name={group.name ?? ""}
          art={artLabel}
          bild={typeof daten.image === "string" ? daten.image : undefined}
          farbe={typeof daten.primaryColor === "string" ? daten.primaryColor : undefined}
          abschnitte={abschnitte}
          stand={stand}
          quelle={typeof daten.quelle === "string" ? daten.quelle : undefined}
        />
      )}
    </AdaptivePanel>
  )
}

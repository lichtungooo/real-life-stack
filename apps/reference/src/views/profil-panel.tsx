// Das Profil einer Einrichtung, rechts im Panel.
//
// Timo am 20.09.2026: *"Es sollte nicht oben in diesem Header-Bereich
// auftauchen als Profil, sondern rechts. Also es ist nicht einfach ein Modul,
// sondern es ist eine Komponente."*
//
// Ein Reiter der App ist eine Arbeitsfläche: Feed, Kanban, Karte sind Orte, an
// denen man etwas tut. Ein Profil ist die Identitätskarte dessen, mit dem man
// es zu tun hat. Sie gehört dorthin, wo man sie aufschlägt und wieder
// zuklappt, neben das Profil eines Menschen (siehe `docs/13-profil.md`).
//
// **Zwei Träger, eine Fläche.** Ein Space trägt sein Profil in `Group.data`,
// ein recherchierter Eintrag in `Item.data`. Beide werden von denselben
// Feldern getragen, darum nimmt `groupId` beides an und sucht erst den Space,
// dann das Item. Die 234 recherchierten Stiftungen sind Items, keine Spaces.
//
// **Die Schichten:** Welcher Bauplan gilt und was er ergibt, rechnet
// `@trustdonation/core` aus; die Darstellung liegt in `@trustdonation/ui`.
import { useMemo } from "react"
import { AdaptivePanel, useGroups, useItems } from "@real-life-stack/toolkit"
import { profilAufbauen, bauplanFuer } from "@trustdonation/core"
import { ProfilFlaeche } from "@trustdonation/ui"

export function SpaceProfilPanel({
  groupId,
  onClose,
}: {
  /** Der Space oder das Item, dessen Profil offen steht. `null` hält zu. */
  groupId: string | null
  onClose: () => void
}) {
  const { data: groups } = useGroups()
  const { data: items } = useItems()

  /**
   * Wer gemeint ist: erst unter den Spaces, dann unter den Items.
   *
   * Ein Space gewinnt bei gleicher Kennung, denn er ist der gepflegte
   * Eintrag; ein Item ist die Recherche, die auf seine Übernahme wartet.
   */
  const traeger = useMemo(() => {
    if (groupId === null) return null
    const space = (groups ?? []).find((g) => g.id === groupId)
    if (space) {
      return {
        name: space.name ?? "",
        daten: (space.data ?? {}) as Record<string, unknown>,
      }
    }
    const item = (items ?? []).find((i) => i.id === groupId)
    if (item) {
      const daten = (item.data ?? {}) as Record<string, unknown>
      return {
        name: typeof daten.title === "string" ? daten.title : item.id,
        daten,
      }
    }
    return null
  }, [groupId, groups, items])

  const daten = traeger?.daten ?? {}

  // Ohne Bauplan kein Profil: Ein Netzwerk ist weder Förderer noch Projekt.
  const profil = useMemo(() => {
    const bauplan = bauplanFuer(daten)
    return bauplan ? profilAufbauen(daten, bauplan) : null
  }, [daten])

  return (
    <AdaptivePanel
      open={groupId !== null}
      onClose={onClose}
      // Rechts als Spalte, wo Timo es haben wollte. Auf dem Telefon zieht
      // das Panel selbst den Schluss auf den Schlitten, und wer die Karte
      // breiter lesen will, schaltet oben auf die mittige Ansicht.
      allowedModes={["sidebar", "modal", "drawer"]}
      sidebarWidth="480px"
      modalClassName="sm:max-w-2xl max-h-[85dvh]"
    >
      {/* Das Panel bringt Schliessen und Scrollen selbst mit. Der Hero laeuft
          bis an den Rand, darum steht hier kein eigenes Polster. */}
      {traeger && profil && (
        <ProfilFlaeche
          key={groupId ?? ""}
          name={traeger.name}
          farbe={
            (typeof daten.primaryColor === "string" && daten.primaryColor) ||
            (typeof daten.color === "string" ? daten.color : undefined)
          }
          profil={profil}
          quelle={typeof daten.quelle === "string" ? daten.quelle : undefined}
          ordnungsId={groupId ?? undefined}
        />
      )}
    </AdaptivePanel>
  )
}

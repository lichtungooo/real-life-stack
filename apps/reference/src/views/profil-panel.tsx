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
// **Zwei Träger, eine Fläche.** Ein Space trägt sein Profil in `Group.data`,
// ein recherchierter Eintrag in `Item.data`. Beide werden von denselben
// Feldern getragen, darum nimmt `groupId` beides an und sucht erst den Space,
// dann das Item. Timo am 20.09.2026: *"manche profile zeigt er garnicht an"* —
// die 234 recherchierten Stiftungen sind Items, keine Spaces.
//
// **Die Schichten:** Die Regel (welcher Bauplan, welche Abschnitte, welche
// Felder) liegt in `@trustdonation/core`, die Darstellung in
// `@trustdonation/ui`. Hier wird beides mit dem verbunden, was die App weiß.
import { useMemo } from "react"
import { AdaptivePanel, useGroups, useItems } from "@real-life-stack/toolkit"
import { profilAbschnitte, profilStand, bauplanFuer } from "@trustdonation/core"
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

  // Welcher Bauplan gilt, entscheidet die Regel in `@trustdonation/core`.
  // Ohne Bauplan bleibt die Fläche leer: Ein Netzwerk ist weder Förderer
  // noch Projekt, und eine leere Karte wirkt kaputt.
  const bauplan = useMemo(() => bauplanFuer(daten), [daten])

  const abschnitte = useMemo(
    () => (bauplan ? profilAbschnitte(daten, bauplan) : []),
    [daten, bauplan],
  )
  const stand = useMemo(
    () => (bauplan ? profilStand(daten, bauplan) : undefined),
    [daten, bauplan],
  )

  // Die Art, wie sie im Netzwerk heißt. Ein recherchierter Eintrag trägt sie
  // in `foerdererart` ("Stiftung", "Verein"), ein Space in `kind`.
  const artLabel =
    (typeof daten.foerdererart === "string" && daten.foerdererart) ||
    (typeof daten.kind === "string"
      ? daten.kind.charAt(0).toUpperCase() + daten.kind.slice(1)
      : undefined)

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
          allein der Inhalt. */}
      {traeger && (
        <ProfilFlaeche
          key={groupId ?? ""}
          name={traeger.name}
          art={artLabel}
          bild={typeof daten.image === "string" ? daten.image : undefined}
          farbe={
            (typeof daten.primaryColor === "string" && daten.primaryColor) ||
            (typeof daten.color === "string" ? daten.color : undefined)
          }
          abschnitte={abschnitte}
          stand={stand}
          quelle={typeof daten.quelle === "string" ? daten.quelle : undefined}
        />
      )}
    </AdaptivePanel>
  )
}

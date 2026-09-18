// Die Fläche des Baukastens, an die App gebunden.
//
// Die Darstellung liegt in `@trustdonation/ui` und kennt weder Connector noch
// Hooks. Hier wird sie mit dem verbunden, was die App weiß: welcher Space
// offen ist, wer ihn verwalten darf, und wie man seine Module schreibt.
//
// Diese Trennung ist dieselbe wie bei Antons Views: Das Paket bleibt ohne
// Datenzugriff prüfbar, die Bindung steht an einer Stelle.
import { useCallback, useMemo } from "react"
import {
  useGroups,
  useUpdateGroup,
  useCurrentUser,
  useMembers,
  resolveAdminView,
} from "@real-life-stack/toolkit"
import { BaukastenFlaeche } from "@trustdonation/ui"

export function BaukastenView({ groupId }: { groupId: string }) {
  const { data: groups } = useGroups()
  const updateGroup = useUpdateGroup()
  const { data: user } = useCurrentUser()

  const group = useMemo(
    () => (groups ?? []).find((g) => g.id === groupId) ?? null,
    [groups, groupId],
  )

  // Dieselbe Frage wie im Space-Dialog, mit derselben Antwort: `resolveAdminView`
  // kennt den Sonderfall, dass manche Connectoren keine Admin-Angabe liefern
  // und dann das erste Mitglied gilt. Eine eigene Regel hier würde davon
  // abweichen, sobald jemand seine anfasst.
  const { data: members } = useMembers(groupId)
  const darfAendern = useMemo(
    () => resolveAdminView(members ?? [], user?.id).currentUserIsAdmin,
    [members, user],
  )

  const aufModule = useCallback(
    async (ids: string[]) => {
      if (!group) return
      const daten = { ...(group.data as Record<string, unknown>), modules: ids }
      await updateGroup(group.id, { data: daten } as never)
    },
    [group, updateGroup],
  )

  return <BaukastenFlaeche group={group} darfAendern={darfAendern} aufModule={aufModule} />
}

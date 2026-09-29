// Die Flaeche des Video-Moduls im Stack (Spec: docs/spec/modules/video.md).
//
// Sie verbindet die toolkit-freie Konferenz mit dem, was nur der Stack weiss:
// welcher Space offen ist, welche Module er fuehrt (Antons Modul-Register),
// wie ein Modul mit seinen Items gezeigt wird (Antons `ModuleOutlet`), und wie
// ein Protokoll zum Item wird.

import { useCallback } from "react"
import {
  getModule,
  ModuleOutlet,
  useCreateItem,
  useCurrentUser,
  useGroups,
  type ModuleViewProps,
} from "@real-life-stack/toolkit"
import { raumKennung } from "@kreis/core"
import { useReiterWechsel } from "../reiter"
import { VideoRaumFlaeche, type ModulWahl } from "./video-raum-flaeche"

/** Das Video holt sich nicht selbst herein. */
const NICHT_IN_DER_KONFERENZ = new Set(["video"])

export function VideoFlaeche({ groupId }: ModuleViewProps) {
  const { data: groups } = useGroups()
  const { data: user } = useCurrentUser()
  const createItem = useCreateItem()
  const space = (groups ?? []).find((g) => g.id === groupId)
  const raumName = space?.name ?? groupId ?? "kreis"
  const reiter = useReiterWechsel(groupId)

  // Aus dem Register, nicht aus einer Liste hier (Spec 01, Regel 1).
  const module: ModulWahl[] = reiter.module
    .filter((id) => !NICHT_IN_DER_KONFERENZ.has(id))
    .map((id) => getModule(id))
    .filter((m): m is NonNullable<typeof m> => !!m?.view)
    .map((m) => ({ id: m.id, label: m.label }))

  const modulZeigen = useCallback((id: string) => (
    <ModuleOutlet
      activeWorkspace={space ? { id: space.id, name: space.name } : null}
      activeModule={id}
      groups={groups ?? []}
    />
  ), [space, groups])

  // Das Protokoll wird ein Beitrag im Space (`post`): Es erscheint im Feed und
  // in der Liste wie jeder andere, mit Raum und Teilnehmern in `data`.
  const protokollSpeichern = useCallback(async (text: string, teilnehmer: readonly string[]) => {
    if (!text.trim()) return
    const datum = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
    await createItem(
      {
        type: "post",
        createdBy: user?.id ?? "",
        data: {
          title: `Protokoll ${raumName}, ${datum}`,
          text,
          raum: raumKennung(raumName),
          teilnehmer: [...teilnehmer],
          wann: new Date().toISOString(),
        },
      },
      groupId ? { group: groupId } : undefined,
    )
  }, [createItem, raumName, groupId, user?.id])

  return (
    <VideoRaumFlaeche
      raumName={raumName}
      vorschlagName={user?.displayName}
      module={module}
      modulZeigen={modulZeigen}
      zumKreis={reiter.fuehrt("kreis") ? () => reiter.wechseln("kreis") : undefined}
      protokollSpeichern={protokollSpeichern}
    />
  )
}

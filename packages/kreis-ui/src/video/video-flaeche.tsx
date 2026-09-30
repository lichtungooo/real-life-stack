// Die Flaeche des Video-Moduls im Stack (Spec: docs/spec/modules/video.md).
//
// Sie verbindet die toolkit-freie Konferenz mit dem, was nur der Stack weiss:
// welcher Space offen ist, wer ich bin, und wie ein Protokoll zum Item wird.
//
// Feed, Kalender, Karte reicht sie NICHT in die Konferenz (Timo, 30.09.2026:
// "Das kann komplett weg. Das hat hier drin nichts verloren. Wir haben es ja
// oben im Menue."). Die Schnittstelle `module`/`modulZeigen` der Konferenz
// bleibt, fuer Module, die eigens fuer die Mitte gebaut werden (Folien).

import { useCallback } from "react"
import {
  useCreateItem,
  useCurrentUser,
  useGroups,
  type ModuleViewProps,
} from "@real-life-stack/toolkit"
import { raumKennung } from "@kreis/core"
import { VideoRaumFlaeche } from "./video-raum-flaeche"

export function VideoFlaeche({ groupId }: ModuleViewProps) {
  const { data: groups } = useGroups()
  const { data: user } = useCurrentUser()
  const createItem = useCreateItem()
  const space = (groups ?? []).find((g) => g.id === groupId)
  const raumName = space?.name ?? groupId ?? "kreis"

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
      protokollSpeichern={protokollSpeichern}
    />
  )
}

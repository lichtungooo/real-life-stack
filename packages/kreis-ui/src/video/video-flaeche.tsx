// Die Flaeche des Video-Moduls im Stack (Spec: docs/spec/modules/video.md).
//
// Sie verbindet die toolkit-freie Konferenz mit dem, was nur der Stack weiss:
// welcher Space offen ist, wer ich bin, und wie ein Protokoll zum Item wird.
//
// Feed, Kalender, Karte reicht sie NICHT in die Konferenz (Timo, 30.09.2026:
// "Das kann komplett weg. Das hat hier drin nichts verloren. Wir haben es ja
// oben im Menue."). Die Schnittstelle `module`/`modulZeigen` der Konferenz
// bleibt, fuer Module, die eigens fuer die Mitte gebaut werden (Folien).

import { useCallback, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Video } from "lucide-react"
import {
  resolveSpaceModules,
  useContacts,
  useCreateItem,
  useCurrentUser,
  useGroups,
  useInviteMember,
  useMembers,
  type ModuleViewProps,
} from "@real-life-stack/toolkit"
import { raumKennung } from "@kreis/core"
import { VideoRaumFlaeche } from "./video-raum-flaeche"
import type { KonferenzEinladen } from "./einladen"

/**
 * Der Link zum Einladen. Nur die App kennt Adresse und Basispfad, darum gibt
 * sie ihn herein (module-register.tsx). Fehlt er, gibt es keinen Knopf.
 */
export type EinladungsLink = (gruppeId: string, gruppeName: string) => string

export function VideoFlaeche({ groupId, einladungsLink }: ModuleViewProps & { einladungsLink?: EinladungsLink }) {
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

  // Einladen (Spec video, "Einladen"): Link, Kontakte, Aufnehmen. Alles ueber
  // Antons Hooks; `inviteMember` braucht nur die veroeffentlichte Kennung.
  const { activeContacts } = useContacts()
  const { data: mitglieder } = useMembers(space ? groupId : null)
  const einladenInGruppe = useInviteMember()
  const mitgliedIds = useMemo(() => new Set((mitglieder ?? []).map((m) => m.id)), [mitglieder])
  const einladen: KonferenzEinladen | undefined = useMemo(() => {
    if (!space || !einladungsLink) return undefined
    return {
      link: einladungsLink(space.id, space.name),
      kontakte: activeContacts
        .filter((k) => k.id !== user?.id)
        .map((k) => ({ id: k.id, name: k.name ?? k.id.slice(-8), mitglied: mitgliedIds.has(k.id) })),
      kontaktEinladen: (id) => einladenInGruppe(space.id, id),
      istMitglied: (kennung) => mitgliedIds.has(kennung),
      aufnehmen: (kennung) => einladenInGruppe(space.id, kennung),
    }
  }, [space, einladungsLink, activeContacts, mitgliedIds, einladenInGruppe, user?.id])

  // In der Uebersicht ("Mein Netzwerk") gehoert die Konferenz keiner Gruppe.
  // Sie zeigt dann die Gruppen, in denen man sich treffen kann (Timo,
  // 30.09.2026: im Login stand dort `__overview__` als Raumname).
  if (!space) return <GruppeWaehlen />

  // Aufgaben ins Kanban der Gruppe (Item `task`, Status `open`), Beschluesse
  // in den Feed (Item `post`). Aus dem Meeting heraus, mit Herkunft.
  const ergebnisAblegen = useCallback(async (e: { art: "aufgabe" | "beschluss"; text: string; wer?: string; bis?: string; von: string }) => {
    const datum = new Date().toLocaleDateString("de-DE")
    const herkunft = `Aus dem Meeting „${raumName}“ am ${datum}, festgehalten von ${e.von}.`
    const zusatz = [e.wer ? `Übernimmt: ${e.wer}` : "", e.bis ? `Bis: ${new Date(e.bis).toLocaleDateString("de-DE")}` : ""].filter(Boolean).join(" · ")
    await createItem(
      e.art === "aufgabe"
        ? { type: "task", createdBy: user?.id ?? "", data: { title: e.text, status: "open", description: [zusatz, herkunft].filter(Boolean).join("\n\n") } }
        : { type: "post", createdBy: user?.id ?? "", data: { title: `Beschluss: ${e.text.slice(0, 80)}`, text: `${e.text}\n\n${herkunft}` } },
      groupId ? { group: groupId } : undefined,
    )
  }, [createItem, raumName, groupId, user?.id])

  return (
    <VideoRaumFlaeche
      raumName={raumName}
      raumId={space.id}
      einladen={einladen}
      vorschlagName={user?.displayName}
      protokollSpeichern={protokollSpeichern}
      ergebnisAblegen={ergebnisAblegen}
    />
  )
}

function GruppeWaehlen() {
  const { data: groups } = useGroups()
  const navigate = useNavigate()
  const location = useLocation()
  const mitVideo = (groups ?? []).filter((g) =>
    resolveSpaceModules(g.data?.modules as string[] | undefined).includes("video"))
  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div className="w-full max-w-md">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Konferenz</p>
        <h2 className="mt-1 text-2xl font-semibold text-foreground">Wo trefft ihr euch?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Jede Gruppe hat ihren eigenen Raum. Wähle die Gruppe, mit der du dich treffen willst.
        </p>
        {mitVideo.length > 0 ? (
          <ul className="mt-5 flex flex-col gap-2">
            {mitVideo.map((g) => (
              <li key={g.id}>
                <button type="button" onClick={() => navigate(`/${g.id}/video${location.search}${location.hash}`)}
                  className="flex w-full items-center gap-3 rounded-xl bg-muted/60 px-4 py-3 text-left font-medium text-foreground transition hover:bg-muted">
                  <Video className="h-4 w-4 text-muted-foreground" /> {g.name}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 rounded-xl bg-muted/60 p-4 text-sm text-foreground">
            In keiner deiner Gruppen ist das Video eingeschaltet. Im Zahnrad einer Gruppe unter Module lässt es sich dazunehmen.
          </p>
        )}
      </div>
    </div>
  )
}

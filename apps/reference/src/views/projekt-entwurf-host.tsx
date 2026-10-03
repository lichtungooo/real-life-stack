// Ein Profil aus dem Entwurf eines Agenten anlegen (DEFINITION 13.6 und
// 13.8), die Bindung. Der Link aus `td-mcp` trägt den Entwurf im Fragment
// (`#projekt-entwurf=…`, `#stiftung-entwurf=…`, `#einrichtung-entwurf=…`).
// Nur dann lädt der Dialog nach; sonst kostet das nichts. Geschrieben wird
// hier, über den Connector, mit der Identität des Menschen, auf Antons Wegen:
// Projekt und Stiftung mit `createItem(…, { group })`, auf Wunsch die Wahl
// der Komponente in `Group.data.komponenten`; das Profil einer Einrichtung
// in `Group.data`, nur von dem, der den Space verwaltet.

import { lazy, Suspense, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useConnector, useCurrentUser, useGroups } from "@real-life-stack/toolkit"
import type { Group, User } from "@real-life-stack/data-interface"
import {
  komponenteAktiv,
  komponentenImSpace,
  PROJEKT_PROFIL,
  STIFTUNGS_PROFIL,
  traegtProfil,
  verwaltetSpace,
  type ProfilArt,
  type ProjektEntwurf,
} from "@trustdonation/core"
import { bildUrl } from "../type-register"

const ProjektEntwurfDialog = lazy(() => import("@trustdonation/ui/projekt-entwurf"))

const ENTWURF = /^#(projekt|stiftung|einrichtung)-entwurf=/

// Beim Laden festhalten: Die App leitet von "/" auf einen Space um, bevor
// der Dialog steht, und dabei kann das Fragment verloren gehen.
let beimStart = typeof window !== "undefined" && ENTWURF.test(window.location.hash) ? window.location.hash : null

type Schreiber = {
  createItem?: (i: unknown, o?: { group?: string }) => Promise<{ id: string } | unknown>
  updateGroup?: (id: string, u: Partial<Group>) => Promise<unknown>
  getMembers?: (groupId: string | null) => Promise<User[]>
}

const KOMPONENTE: Record<ProfilArt, string | null> = { projekt: PROJEKT_PROFIL, stiftung: STIFTUNGS_PROFIL, einrichtung: null }
const KOMPONENTE_NAME: Record<ProfilArt, string> = { projekt: "Project Profile", stiftung: "Stiftungsprofil", einrichtung: "" }

export function ProjektEntwurfHost({ beispielwelt }: { beispielwelt: boolean }) {
  const [fragment, setFragment] = useState<string | null>(beimStart)
  const connector = useConnector() as unknown as Schreiber
  const { data: groups, isLoading: spacesLaden } = useGroups()
  const { data: ich } = useCurrentUser()
  const { scope } = useParams()
  const navigate = useNavigate()
  if (!fragment) return null

  const schliessen = () => {
    // Das Fragment weg, damit ein Neuladen nicht wieder fragt.
    window.history.replaceState(null, "", window.location.pathname + window.location.search)
    beimStart = null
    setFragment(null)
  }
  const spaces = (art: ProfilArt) => (groups ?? [])
    .filter((g) => g.id !== "__overview__")
    .map((g) => {
      const daten = g.data as Record<string, unknown> | undefined
      const k = KOMPONENTE[art]
      return { id: g.id, name: g.name, profilAktiv: k ? komponenteAktiv(daten, k) : true, hatProfil: traegtProfil(daten) }
    })

  /** Alle Daten mitschicken: Spec 04 (Regel 3) sagt Patch, Antons Supabase-Connector ersetzt die Spalte ganz (Kimi, 02.10.2026). */
  const spaceDatenSetzen = async (spaceId: string, aendern: (daten: Record<string, unknown>) => Record<string, unknown>) => {
    if (typeof connector.updateGroup !== "function") throw new Error("Dieser Zugang kann den Space nicht ändern.")
    const g = groups?.find((x) => x.id === spaceId)
    await connector.updateGroup(spaceId, { data: aendern({ ...((g?.data ?? {}) as Record<string, unknown>) }) })
  }

  const anlegen = async (spaceId: string, entwurf: ProjektEntwurf, einschalten: boolean, art: ProfilArt) => {
    if (art === "einrichtung") {
      // Das Profil einer Einrichtung ist der Space selbst (DEFINITION Teil 9): nur wer ihn verwaltet.
      const mitglieder = typeof connector.getMembers === "function" ? await connector.getMembers(spaceId) : []
      if (!verwaltetSpace(mitglieder, ich?.id)) throw new Error("Speichern kann, wer diesen Space verwaltet. Bitte die Person, die ihn verwaltet, den Link zu öffnen.")
      await spaceDatenSetzen(spaceId, (daten) => ({ ...daten, ...entwurf.daten }))
      return { weiter: () => { schliessen(); navigate(`/${spaceId}/map?profil=${spaceId}`) } }
    }
    if (typeof connector.createItem !== "function") throw new Error("Dieser Zugang kann nichts anlegen. Melde dich an oder wähle die Demo.")
    const neu = (await connector.createItem(
      { type: art === "projekt" ? "project" : "place", createdBy: ich?.id ?? "", data: entwurf.daten, tags: entwurf.tags },
      { group: spaceId },
    )) as { id?: string } | undefined
    const weiter = () => {
      schliessen()
      navigate(neu?.id ? `/${spaceId}/map/${neu.id}` : `/${spaceId}/map`)
    }
    const k = KOMPONENTE[art]
    if (!einschalten || !k) return { weiter }
    // Ab hier ist der Eintrag angelegt. Was jetzt scheitert, darf nicht als
    // „nicht angelegt“ zurückkommen, sonst legt ein zweiter Klick ihn doppelt an.
    try {
      await spaceDatenSetzen(spaceId, (daten) => ({ ...daten, komponenten: [...komponentenImSpace(daten), k] }))
      return { weiter }
    } catch (e) {
      return { weiter, hinweis: `Das ${KOMPONENTE_NAME[art]} ließ sich in diesem Space nicht einschalten (${e instanceof Error ? e.message : "unbekannter Fehler"}). Wer den Space verwaltet, schaltet es unter Erweiterungen → Komponenten ein.` }
    }
  }

  return (
    <Suspense fallback={null}>
      <ProjektEntwurfDialog
        fragment={fragment}
        spaces={spaces}
        spacesLaden={spacesLaden}
        startSpace={scope}
        beispielwelt={beispielwelt}
        bildUrl={bildUrl}
        onAnlegen={anlegen}
        onSchliessen={schliessen}
      />
    </Suspense>
  )
}

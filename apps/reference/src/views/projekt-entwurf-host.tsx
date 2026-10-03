// Ein Projekt aus dem Entwurf eines Agenten anlegen (DEFINITION 13.6), die
// Bindung. Der Link aus `td-mcp` trägt den Entwurf im Fragment
// (`#projekt-entwurf=…`). Nur dann lädt der Dialog nach; sonst kostet das
// nichts. Geschrieben wird hier, über den Connector, mit der Identität des
// Menschen: `createItem(…, { group })`, und auf Wunsch die Wahl der
// Komponente in `Group.data.komponenten`, beides Antons Wege.

import { lazy, Suspense, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useConnector, useCurrentUser, useGroups } from "@real-life-stack/toolkit"
import type { Group } from "@real-life-stack/data-interface"
import { komponenteAktiv, komponentenImSpace, PROJEKT_PROFIL, type ProjektEntwurf } from "@trustdonation/core"
import { bildUrl } from "../type-register"

const ProjektEntwurfDialog = lazy(() => import("@trustdonation/ui/projekt-entwurf"))

// Beim Laden festhalten: Die App leitet von "/" auf einen Space um, bevor
// der Dialog steht, und dabei kann das Fragment verloren gehen.
let beimStart = typeof window !== "undefined" && window.location.hash.startsWith("#projekt-entwurf=") ? window.location.hash : null

type Schreiber = {
  createItem?: (i: unknown, o?: { group?: string }) => Promise<{ id: string } | unknown>
  updateGroup?: (id: string, u: Partial<Group>) => Promise<unknown>
}

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
  const spaces = (groups ?? [])
    .filter((g) => g.id !== "__overview__")
    .map((g) => ({ id: g.id, name: g.name, profilAktiv: komponenteAktiv(g.data as Record<string, unknown> | undefined, PROJEKT_PROFIL) }))

  const anlegen = async (spaceId: string, entwurf: ProjektEntwurf, einschalten: boolean) => {
    if (typeof connector.createItem !== "function") throw new Error("Dieser Zugang kann nichts anlegen. Melde dich an oder wähle die Demo.")
    const neu = (await connector.createItem(
      { type: "project", createdBy: ich?.id ?? "", data: entwurf.daten, tags: entwurf.tags },
      { group: spaceId },
    )) as { id?: string } | undefined
    const weiter = () => {
      schliessen()
      navigate(neu?.id ? `/${spaceId}/map/${neu.id}` : `/${spaceId}/map`)
    }
    if (!einschalten) return { weiter }
    // Ab hier ist das Projekt angelegt. Was jetzt scheitert, darf nicht als
    // „nicht angelegt“ zurückkommen, sonst legt ein zweiter Klick es doppelt an.
    try {
      if (typeof connector.updateGroup !== "function") throw new Error("Dieser Zugang kann den Space nicht ändern.")
      const g = groups?.find((x) => x.id === spaceId)
      const daten = (g?.data ?? {}) as Record<string, unknown>
      // Alle Daten mitschicken: Spec 04 (Regel 3) sagt Patch, Antons
      // Supabase-Connector ersetzt die Spalte ganz (Kimi, 02.10.2026). So ist
      // es unter beiden Lesarten sicher.
      await connector.updateGroup(spaceId, { data: { ...daten, komponenten: [...komponentenImSpace(daten), PROJEKT_PROFIL] } })
      return { weiter }
    } catch (e) {
      return { weiter, hinweis: `Das Project Profile ließ sich in diesem Space nicht einschalten (${e instanceof Error ? e.message : "unbekannter Fehler"}). Wer den Space verwaltet, schaltet es unter Erweiterungen → Komponenten ein.` }
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

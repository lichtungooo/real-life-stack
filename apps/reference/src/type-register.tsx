// App layer of the type register (spec 06).
//
// Seit 21.09.2026 leer: Das Toolkit liefert alle acht Typen samt Darstellung
// (`statement` eingeschlossen — die Resonanz kommt vollständig aus dem
// Toolkit). Eine App, die eigene Typen führt, komponiert hier ihr Manifest
// und bindet es über `setTypeManifest`, bevor sie Darstellung registriert.
//
// Import this module once, before first render (main.tsx).

import { lazy, Suspense, type ComponentType } from "react"
import { composeTypeManifest, TOOLKIT_TYPE_LAYER } from "@real-life-stack/data-interface"
import {
  registerTypePresentation,
  resolveTypePresentation,
  setTypeManifest,
  useCurrentGroup,
  type ItemSlotProps,
} from "@real-life-stack/toolkit"
import {
  traegtProfil,
  bauplanFuer,
  profilAufbauen,
  komponenteAktiv,
  traegtProjektProfil,
  PROJEKT_PROFIL,
} from "@trustdonation/core"
import { ProfilFlaeche } from "@trustdonation/ui"

/** The app's composed manifest — today the toolkit's, unchanged. */
export const TYPE_MANIFEST = composeTypeManifest([TOOLKIT_TYPE_LAYER])

setTypeManifest(TYPE_MANIFEST)

// Die Meta-Box, die das Toolkit einem Ort gibt. Einmal gelesen, bevor unsere
// Schicht dazukommt: Ein Ort ohne Profil behält genau sie.
const ORT_META: ComponentType<ItemSlotProps> = resolveTypePresentation("place").detail

/**
 * Traegt ein Ort ein Profil, steht es an der Stelle der Meta-Box.
 *
 * Die 234 recherchierten Stiftungen sind place-Items. Ohne diese Stelle
 * stehen ihre Förderbereiche, ihr Förderrahmen und ihr Antragsweg nirgends.
 * Timo am 20.09.2026: *"manche profile zeigt er garnicht an"*.
 *
 * Entschieden wird über die Felder, nicht über den Typ (Muster 4): Ein echter
 * Ort behält seine Meta-Box, eine Stiftung bekommt ihre Karte.
 *
 * Bis zum 29.09.2026 war das eine Naht in `detail-host.tsx`. Seit Antons
 * Modul-Host liegt die Detailansicht im Toolkit, und der Slot `detail` einer
 * Typ-Erweiterung ist der Haken dafür (Spec 06, Regel 17).
 */
function OrtOderProfil({ item }: ItemSlotProps) {
  const daten = (item.data ?? {}) as Record<string, unknown>
  const bauplan = traegtProfil(daten) ? bauplanFuer(daten) : null
  const profil = bauplan ? profilAufbauen(daten, bauplan) : null
  if (!profil) return <ORT_META item={item} />
  return (
    <ProfilFlaeche
      profil={profil}
      farbe={typeof daten.color === "string" ? daten.color : undefined}
      quelle={typeof daten.quelle === "string" ? daten.quelle : undefined}
      ordnungsId={item.id}
    />
  )
}

registerTypePresentation("trustdonation", {
  extensions: [
    { id: "place", detail: OrtOderProfil },
    // Projekte (Timo, 01.10.2026): auf der Karte rund, ohne Spitze, in
    // Waldgrün mit Spross. Antons `project` bringt keine Felder mit; ohne
    // den Ort liesse sich ein Projekt nicht auf die Karte setzen. Das Feld
    // `address` mit dem Location-Widget schreibt Adresse und Position, wie
    // beim Ort. `marker` ist die Naht A-Marker (NAEHTE.md): die Vorgabe der
    // Art, wo ein Projekt keine eigene Farbe oder kein eigenes Symbol traegt.
    {
      id: "project",
      fields: [
        { key: "title", widget: "title", pos: "head" },
        { key: "description", widget: "text", pos: "content", label: "Beschreibung" },
        { key: "address", widget: "location", pos: "meta" },
        { key: "tags", widget: "tags", pos: "tags" },
      ],
      marker: { icon: "sprout", color: "#2E7D5B", shape: "round" },
    },
  ],
})

// Das Project Profile (DEFINITION Teil 8, erste Komponente). Eine eigene
// Schicht, damit die Meta-Box aus Antons Feld-Register vorher feststeht:
// Ein Projekt in einem Space ohne diese Wahl behaelt genau sie. Keine Naht.
const PROJEKT_META: ComponentType<ItemSlotProps> = resolveTypePresentation("project").detail

// Nachgeladen: Wer nie ein Projekt oeffnet, laedt die Seite nie (Regel 4).
const ProjektProfilSeite = lazy(() => import("@trustdonation/ui/projekt-profil"))

/** Pfade der Instanz (`muster/garten.svg`) unter dem Basis-Pfad der App laden. */
function bildUrl(pfad: string): string {
  return /^(https?:|data:)/i.test(pfad) ? pfad : `${import.meta.env.BASE_URL}${pfad.replace(/^\//, "")}`
}

function ProjektOderMeta({ item }: ItemSlotProps) {
  const space = useCurrentGroup()
  const daten = (item.data ?? {}) as Record<string, unknown>
  if (!komponenteAktiv(space?.data as Record<string, unknown> | undefined, PROJEKT_PROFIL) || !traegtProjektProfil(daten)) {
    return <PROJEKT_META item={item} />
  }
  return (
    <Suspense fallback={<div className="aspect-[16/9] w-full animate-pulse rounded-2xl bg-muted" />}>
      <ProjektProfilSeite daten={daten} tags={item.tags} bildUrl={bildUrl} />
    </Suspense>
  )
}

registerTypePresentation("trustdonation-projekt-profil", {
  extensions: [{ id: "project", detail: ProjektOderMeta }],
})

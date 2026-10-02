// App layer of the type register (spec 06).
//
// Seit 21.09.2026 leer: Das Toolkit liefert alle acht Typen samt Darstellung
// (`statement` eingeschlossen — die Resonanz kommt vollständig aus dem
// Toolkit). Eine App, die eigene Typen führt, komponiert hier ihr Manifest
// und bindet es über `setTypeManifest`, bevor sie Darstellung registriert.
//
// Import this module once, before first render (main.tsx).

import { lazy, Suspense, useMemo, type ComponentType } from "react"
import { composeTypeManifest, TOOLKIT_TYPE_LAYER } from "@real-life-stack/data-interface"
import {
  registerTypePresentation,
  resolveTypePresentation,
  setTypeManifest,
  useCurrentGroup,
  useItemPermissions,
  useUpdateItem,
  type ItemSlotProps,
} from "@real-life-stack/toolkit"
import {
  traegtProfil,
  bauplanFuer,
  profilAufbauen,
  komponenteAktiv,
  traegtProjektProfil,
  traegtStiftungsProfil,
  PROJEKT_PROFIL,
  STIFTUNGS_PROFIL,
} from "@trustdonation/core"
// Nachgeladen: die Collage braucht erst, wer eine Stiftung öffnet (Budget,
// 02.10.2026, Platz für die Naht A-Cluster im Kartenadapter).
const ProfilFlaeche = lazy(() => import("@trustdonation/ui/profil-flaeche").then((m) => ({ default: m.ProfilFlaeche })))

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
/**
 * Profile bearbeiten (DEFINITION Teil 8): Wer darf, entscheidet Antons Regel
 * (`useItemPermissions`). Ohne Recht bekommt die Komponente nichts und zeigt
 * keinen Knopf. Gespeichert wird mit den ganzen Daten (alle Connectoren
 * ersetzen `data`); die Komponente baut sie über `abschnittSpeichern`.
 */
function useBearbeitung(item: ItemSlotProps["item"]) {
  const { canEdit } = useItemPermissions(item)
  const updateItem = useUpdateItem()
  const tags = item.tags
  return useMemo(() => (canEdit
    ? {
        daten: (item.data ?? {}) as Record<string, unknown>,
        eintrag: { tags: tags ?? [] },
        speichern: (aenderung: Record<string, unknown>) => updateItem(item.id, aenderung),
      }
    : undefined), [canEdit, item.data, item.id, tags, updateItem])
}

// Das Stiftungsprofil (DEFINITION Teil 8, zweite Komponente), nachgeladen.
const StiftungsProfilSeite = lazy(() => import("@trustdonation/ui/stiftungs-profil"))

function OrtOderProfil({ item }: ItemSlotProps) {
  const space = useCurrentGroup()
  const bearbeitung = useBearbeitung(item)
  const daten = (item.data ?? {}) as Record<string, unknown>
  // Hat der Space das Stiftungsprofil gewählt, zeigt eine Stiftung es; sonst
  // bleibt die bisherige Collage (oder Antons Meta-Box für einen echten Ort).
  if (komponenteAktiv(space?.data as Record<string, unknown> | undefined, STIFTUNGS_PROFIL) && traegtStiftungsProfil(daten)) {
    return (
      <Suspense fallback={<div className="h-40 w-full animate-pulse rounded-2xl bg-muted" />}>
        <StiftungsProfilSeite key={item.id} daten={daten} bearbeitung={bearbeitung} bildUrl={bildUrl} />
      </Suspense>
    )
  }
  const bauplan = traegtProfil(daten) ? bauplanFuer(daten) : null
  const profil = bauplan ? profilAufbauen(daten, bauplan) : null
  if (!profil) return <ORT_META item={item} />
  return (
    <Suspense fallback={<div className="h-40 w-full animate-pulse rounded-2xl bg-muted" />}>
      <ProfilFlaeche
        profil={profil}
        farbe={typeof daten.color === "string" ? daten.color : undefined}
        quelle={typeof daten.quelle === "string" ? daten.quelle : undefined}
        ordnungsId={item.id}
      />
    </Suspense>
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
      // Orange aus dem trustdonation-Logo (Timo, 02.10.2026: "Stiftungen blau,
      // Projekte orange, passt genau zum Logo"). Nie gebündelt: Ein Projekt
      // bleibt über den blauen Sammelpunkten sichtbar (Naht A-Cluster).
      marker: { icon: "sprout", color: "#EA580C", shape: "round", cluster: false },
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
export function bildUrl(pfad: string): string {
  // BASE_URL heisst live "/app", lokal "/": den Schraegstrich selbst setzen.
  return /^(https?:|data:)/i.test(pfad) ? pfad : `${import.meta.env.BASE_URL.replace(/\/+$/, "")}/${pfad.replace(/^\/+/, "")}`
}

function ProjektOderMeta({ item }: ItemSlotProps) {
  const space = useCurrentGroup()
  const bearbeitung = useBearbeitung(item)
  const daten = (item.data ?? {}) as Record<string, unknown>
  if (!komponenteAktiv(space?.data as Record<string, unknown> | undefined, PROJEKT_PROFIL) || !traegtProjektProfil(daten)) {
    return <PROJEKT_META item={item} />
  }
  return (
    <Suspense fallback={<div className="aspect-[16/9] w-full animate-pulse rounded-2xl bg-muted" />}>
      {/* key: Ein anderes Projekt beginnt frisch (gewaehlter Betrag, offene Ansicht). */}
      <ProjektProfilSeite key={item.id} daten={daten} tags={item.tags} bildUrl={bildUrl} bearbeitung={bearbeitung} />
    </Suspense>
  )
}

registerTypePresentation("trustdonation-projekt-profil", {
  extensions: [{ id: "project", detail: ProjektOderMeta }],
})

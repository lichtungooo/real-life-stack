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
  useMembers,
  useOptionalCurrentUser,
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
  PERSON_PROFIL,
  STIFTUNGS_PROFIL,
  traegtPersonProfil,
  darfStiftungBearbeiten,
  uebernahmeAblehnen,
  uebernahmeAnfragen,
  uebernahmeBestaetigen,
  verwaltetSpace,
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

/**
 * Profil übernehmen (DEFINITION Teil 8). Anfragen darf, wer angemeldet ist
 * und schreiben darf (Antons Regel: Mitglieder bearbeiten Inhalte); prüfen
 * und entscheiden, wer den Space verwaltet. Eine übernommene Stiftung zeigt
 * das Bearbeiten nur den Pflegenden und den Verwaltenden. Das ist Oberfläche,
 * keine Grenze: Antons Schreibrecht bleibt, wie es ist.
 */
function StiftungMitUebernahme({ item, spaceId }: ItemSlotProps & { spaceId: string | null }) {
  const bearbeitung = useBearbeitung(item)
  const updateItem = useUpdateItem()
  const { data: ich } = useOptionalCurrentUser()
  const { data: mitglieder } = useMembers(spaceId)
  const daten = (item.data ?? {}) as Record<string, unknown>
  const istAdmin = verwaltetSpace(mitglieder, ich?.id)
  const uebernahme = useMemo(() => {
    const schreiben = async (neu: Record<string, unknown> | null) => {
      if (!neu) throw new Error("Dieser Schritt passt nicht zum Stand des Eintrags.")
      await updateItem(item.id, { data: neu })
    }
    return {
      ich: bearbeitung && ich ? ich.id : null,
      istAdmin,
      anfragen: (a: { name: string; rolle: string; mail: string }) => schreiben(uebernahmeAnfragen(daten, { von: ich?.id ?? "", ...a })),
      bestaetigen: () => schreiben(uebernahmeBestaetigen(daten)),
      ablehnen: () => schreiben(uebernahmeAblehnen(daten)),
    }
  }, [bearbeitung, ich, istAdmin, daten, item.id, updateItem])
  const darf = darfStiftungBearbeiten(daten, ich?.id, istAdmin)
  return (
    <Suspense fallback={<div className="h-40 w-full animate-pulse rounded-2xl bg-muted" />}>
      <StiftungsProfilSeite key={item.id} daten={daten} bearbeitung={darf ? bearbeitung : undefined} uebernahme={uebernahme} bildUrl={bildUrl} />
    </Suspense>
  )
}

function OrtOderProfil({ item }: ItemSlotProps) {
  const space = useCurrentGroup()
  const daten = (item.data ?? {}) as Record<string, unknown>
  // Hat der Space das Stiftungsprofil gewählt, zeigt eine Stiftung es; sonst
  // bleibt die bisherige Collage (oder Antons Meta-Box für einen echten Ort).
  if (komponenteAktiv(space?.data as Record<string, unknown> | undefined, STIFTUNGS_PROFIL) && traegtStiftungsProfil(daten)) {
    return <StiftungMitUebernahme item={item} spaceId={space?.id ?? null} />
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
    // Menschen in Tannengrün aus dem Logo, eckig (DEFINITION Teil 6, Timo
    // am 03.10.2026 freigegeben): Stiftungen blau, Projekte orange, Menschen grün.
    { id: "person", marker: { icon: "person", color: "#1B5E40", shape: "square" } },
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

// Das Real Life Profil (DEFINITION 9.1): ein Mensch im Space, wie er für
// Kontakte freigegeben ist. Eigene Schicht wie beim Project Profile; ohne
// gewählte Komponente bleibt Antons Darstellung. Keine Naht.
const PERSON_META: ComponentType<ItemSlotProps> = resolveTypePresentation("person").detail
const PersonProfilSeite = lazy(() => import("@trustdonation/ui/person-profil"))

function PersonOderMeta({ item }: ItemSlotProps) {
  const space = useCurrentGroup()
  const daten = (item.data ?? {}) as Record<string, unknown>
  if (!komponenteAktiv(space?.data as Record<string, unknown> | undefined, PERSON_PROFIL) || !traegtPersonProfil(daten)) {
    return PERSON_META ? <PERSON_META item={item} /> : null
  }
  return (
    <Suspense fallback={<div className="h-40 w-full animate-pulse rounded-2xl bg-muted" />}>
      <PersonProfilSeite key={item.id} daten={daten} />
    </Suspense>
  )
}

registerTypePresentation("trustdonation-real-life-profil", {
  extensions: [{ id: "person", detail: PersonOderMeta }],
})

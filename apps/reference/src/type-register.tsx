// App layer of the type register (spec 06).
//
// Seit 21.09.2026 leer: Das Toolkit liefert alle acht Typen samt Darstellung
// (`statement` eingeschlossen — die Resonanz kommt vollständig aus dem
// Toolkit). Eine App, die eigene Typen führt, komponiert hier ihr Manifest
// und bindet es über `setTypeManifest`, bevor sie Darstellung registriert.
//
// Import this module once, before first render (main.tsx).

import type { ComponentType } from "react"
import { composeTypeManifest, TOOLKIT_TYPE_LAYER } from "@real-life-stack/data-interface"
import {
  registerTypePresentation,
  resolveTypePresentation,
  setTypeManifest,
  type ItemSlotProps,
} from "@real-life-stack/toolkit"
import { traegtProfil, bauplanFuer, profilAufbauen } from "@trustdonation/core"
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
  extensions: [{ id: "place", detail: OrtOderProfil }],
})

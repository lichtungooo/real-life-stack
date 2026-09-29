// Wie die App dem Kreis seinen Raum-Adapter gibt.
//
// Das Modul kennt keinen Server und keine Bibliothek (Spec, "Der
// Raum-Adapter"). Die App legt einen Provider um den Rahmen und reicht eine
// Fabrik hinein: den lokalen Adapter zum Ausprobieren, LiveKit fuer echte
// Sitzungen. Fehlt der Provider, degradiert das Modul sichtbar.

import { createContext, useContext, type ReactNode } from "react"
import type { KreisRaum } from "@kreis/core"

export type KreisRaumFabrik = () => KreisRaum

const Kontext = createContext<KreisRaumFabrik | null>(null)

export function KreisRaumProvider({ fabrik, children }: { fabrik: KreisRaumFabrik; children: ReactNode }) {
  return <Kontext.Provider value={fabrik}>{children}</Kontext.Provider>
}

/** Die Fabrik fuer den Raum, oder `null`, wenn die App keinen Adapter gibt. */
export function useKreisRaumFabrik(): KreisRaumFabrik | null {
  return useContext(Kontext)
}

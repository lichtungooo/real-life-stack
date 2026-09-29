// Die eine Verbindung zum Live-Raum, fuer die ganze App.
//
// Das Modul kennt keinen Server und keine Bibliothek (Spec kreis, "Der
// Raum-Adapter"). Die App legt diesen Provider um den Rahmen und reicht eine
// Fabrik hinein: den lokalen Adapter zum Ausprobieren, LiveKit fuer echte
// Sitzungen. Der Provider haelt die Verbindung; jedes Modul, das den Raum
// zeigt (Kreis, Video), liest sie mit `useKreisVerbindung()`. So bleibt man
// im Raum, waehrend man den Reiter wechselt, und beide Module sehen denselben
// Stab, dieselbe Stille, dieselben Menschen (Spec video, "Ein Raum, zwei Sichten").
//
// ⚠ Der Ton gehoert dem Raum, nicht der Flaeche. Haengte jede Flaeche ihre
// eigenen Lautsprecher an, hoerte man jeden Menschen doppelt, sobald Kreis
// und Video zugleich im Baum stehen (beide `keepMounted`). Darum spielt
// `RaumTon` hier einmal ab, fuer alle Flaechen.
//
// Fehlt der Provider, degradiert das Modul sichtbar.

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react"
import type { KreisRaum, KreisTeilnehmer, Prozess } from "@kreis/core"
import { useKreisVerbindungHalten, type KreisRaumFabrik, type KreisVerbindung } from "./use-kreis"
import { useNebenHalten, type Neben } from "./use-neben"

export type { KreisRaumFabrik } from "./use-kreis"
export type KreisKontext = KreisVerbindung & { neben: Neben }

const Kontext = createContext<KreisKontext | null>(null)

function Lautsprecher({ raum, person }: { raum: KreisRaum; person: KreisTeilnehmer }) {
  const ref = useRef<HTMLAudioElement | null>(null)
  useEffect(() => {
    if (!ref.current || !raum.tonAnhaengen) return
    return raum.tonAnhaengen(person.id, ref.current)
  }, [raum, person.id, person.mikroAn])
  return <audio ref={ref} autoPlay />
}

/** Der Ton aller anderen im Raum, einmal fuer die ganze App. Den eigenen nie, sonst pfeift es. */
function RaumTon({ v }: { v: KreisVerbindung }) {
  if (v.zustand !== "drin" || !v.raum.traegtMedien) return null
  return (
    <div hidden aria-hidden="true">
      {v.teilnehmer.filter((t) => !t.ichSelbst).map((t) => <Lautsprecher key={t.id} raum={v.raum} person={t} />)}
    </div>
  )
}

export function KreisRaumProvider({
  fabrik, eigeneProzesse, children,
}: {
  fabrik: KreisRaumFabrik
  eigeneProzesse?: readonly Prozess[]
  children: ReactNode
}) {
  const verbindung = useKreisVerbindungHalten(fabrik, eigeneProzesse)
  const neben = useNebenHalten(verbindung)
  return (
    <Kontext.Provider value={{ ...verbindung, neben }}>
      <RaumTon v={verbindung} />
      {children}
    </Kontext.Provider>
  )
}

/** Die Verbindung zum Live-Raum, oder `null`, wenn die App keinen Adapter gibt. */
export function useKreisVerbindung(): KreisKontext | null {
  return useContext(Kontext)
}

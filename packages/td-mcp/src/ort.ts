/**
 * Ortssuche für einen Server, den viele zugleich nutzen (DEFINITION 13.7).
 *
 * OpenStreetMap (Nominatim) erlaubt höchstens eine Anfrage je Sekunde. Ein
 * Netzwerk-Server spricht für alle seine Mitglieder, also stehen die Anfragen
 * hier in einer Reihe, und jede Anschrift wird nur einmal gesucht.
 */

export type Geocode = (anschrift: string) => Promise<{ lat: number; lng: number } | null>

export interface OrtsucheOptionen {
  /** Die eigentliche Suche, für Tests austauschbar. */
  suche: Geocode
  /** Abstand zwischen zwei Suchen in ms. Standard 1100 (Regel von OpenStreetMap). */
  abstandMs?: number
  /** Wie viele Anschriften der Zwischenspeicher hält. Standard 2000. */
  hoechstens?: number
}

/** Eine gedrosselte, zwischengespeicherte Ortssuche. */
export function gedrosselteOrtsuche({ suche, abstandMs = 1100, hoechstens = 2000 }: OrtsucheOptionen): Geocode {
  const speicher = new Map<string, { lat: number; lng: number } | null>()
  let naechsteFrei = 0
  let reihe: Promise<unknown> = Promise.resolve()

  return async (anschrift) => {
    const schluessel = anschrift.trim().toLowerCase().replace(/\s+/g, " ")
    if (speicher.has(schluessel)) return speicher.get(schluessel) ?? null

    // In die Reihe stellen: jede Suche wartet, bis die vorige ihren Abstand hatte.
    const lauf = reihe.then(async () => {
      if (speicher.has(schluessel)) return speicher.get(schluessel) ?? null
      const warten = naechsteFrei - Date.now()
      if (warten > 0) await new Promise((r) => setTimeout(r, warten))
      naechsteFrei = Date.now() + abstandMs
      const ort = await suche(anschrift).catch(() => null)
      if (speicher.size >= hoechstens) speicher.delete(speicher.keys().next().value as string)
      speicher.set(schluessel, ort)
      return ort
    })
    reihe = lauf.catch(() => null)
    return lauf
  }
}

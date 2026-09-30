// Das gemeinsame Zeichenpad, ohne Oberflaeche (Spec video, "Zeichenpad").
//
// Die Zeichenflaeche selbst ist Excalidraw (MIT). Jedes Element dort traegt
// eine Id, eine Fassung (`version`) und eine Zufallszahl (`versionNonce`).
// Wer etwas aendert, zaehlt die Fassung hoch. Damit ist die Einigung ohne
// Server einfach und dieselbe, die Excalidraw fuer seine eigene
// Zusammenarbeit nutzt: Je Id gilt die hoehere Fassung; bei Gleichstand die
// kleinere Zufallszahl, damit alle dasselbe waehlen. Geloeschtes bleibt als
// Element mit `isDeleted` stehen, sonst kaeme es beim naechsten Abgleich
// zurueck.

export interface ZeichenElement {
  id: string
  version: number
  versionNonce: number
  isDeleted?: boolean
  [feld: string]: unknown
}

/** Gilt das fremde Element statt des eigenen? */
export function fremdesGilt(eigenes: ZeichenElement | undefined, fremdes: ZeichenElement): boolean {
  if (!eigenes) return true
  if (fremdes.version !== eigenes.version) return fremdes.version > eigenes.version
  return fremdes.versionNonce < eigenes.versionNonce
}

/**
 * Fremde Elemente einmischen. Die Reihenfolge der eigenen bleibt (sie ist
 * die Zeichenreihenfolge), Neue kommen hinten dazu. Aendert sich nichts,
 * kommt dieselbe Liste zurueck.
 */
export function elementeEinmischen<E extends ZeichenElement>(eigene: readonly E[], fremde: readonly E[]): readonly E[] {
  if (fremde.length === 0) return eigene
  const index = new Map(eigene.map((e, i) => [e.id, i]))
  let neu: E[] | null = null
  for (const f of fremde) {
    const i = index.get(f.id)
    const liste: E[] = neu ?? [...eigene]
    if (i === undefined) {
      index.set(f.id, liste.length)
      liste.push(f)
      neu = liste
    } else if (fremdesGilt(liste[i], f)) {
      liste[i] = f
      neu = liste
    }
  }
  return neu ?? eigene
}

/** Was sich seit dem letzten Senden geaendert hat: je Id die Fassung vergleichen. */
export function geaenderteElemente<E extends ZeichenElement>(elemente: readonly E[], gesendet: ReadonlyMap<string, number>): E[] {
  return elemente.filter((e) => gesendet.get(e.id) !== e.version)
}

/**
 * In Pakete teilen, die klein genug fuer eine Nachricht sind. Ein einzelnes
 * Element ueber der Grenze reist allein; es zu zerteilen hiesse, es halb zu
 * zeigen.
 */
export function inPakete<E>(elemente: readonly E[], grenzeZeichen = 12_000): E[][] {
  const pakete: E[][] = []
  let aktuell: E[] = []
  let groesse = 0
  for (const e of elemente) {
    const g = JSON.stringify(e).length
    if (aktuell.length > 0 && groesse + g > grenzeZeichen) {
      pakete.push(aktuell)
      aktuell = []
      groesse = 0
    }
    aktuell.push(e)
    groesse += g
  }
  if (aktuell.length > 0) pakete.push(aktuell)
  return pakete
}

export function istZeichenElement(wert: unknown): wert is ZeichenElement {
  if (!wert || typeof wert !== "object") return false
  const e = wert as Record<string, unknown>
  return typeof e.id === "string" && typeof e.version === "number" && typeof e.versionNonce === "number"
}

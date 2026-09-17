// In welcher Reihenfolge die Spaces im Umschalter stehen.
//
// Reine Funktion ueber eine Liste, ohne React und ohne Oberflaeche. Sie stand
// in einem `useMemo` in der App und war dort nicht pruefbar, ohne einen
// Browser zu starten. Hier ist sie es (ARCHITEKTUR Teil 3).

/** Was die Ordnung von einem Space wissen muss. Mehr traegt sie nicht. */
export interface OrdnungsEintrag {
  id: string
  isNetwork?: boolean
}

/**
 * Netzwerke vor allem anderen, das Start-Netzwerk zuerst.
 *
 * Regeln (Spec 11, "Zuhause-Space"):
 *
 * 1. Das Start-Netzwerk der Instanz steht ganz vorn, damit der Anfang ohne
 *    URL und ohne Merker dorthin fuehrt.
 * 2. Ist der Mensch dort kein Mitglied, faellt es **still** weg. Ein Eintrag,
 *    der ins Leere fuehrt, waere schlimmer als keiner.
 * 3. Dahinter die Uebersicht, dann die uebrigen Netzwerke, dann alles andere.
 * 4. Die Reihenfolge der uebrigen Netzwerke traegt keine Bedeutung; sie bleibt
 *    darum, wie sie kam.
 *
 * `uebersicht` wird an ihre Stelle gesetzt. Sie ist kein Space und kommt
 * darum von aussen: Die App weiss, wie sie heisst und was sie zeigt.
 */
export function ordneSpaces<T extends OrdnungsEintrag>(
  spaces: readonly T[],
  uebersicht: T,
  startNetzwerkId?: string,
): T[] {
  const netzwerke = spaces.filter((w) => w.isNetwork === true)
  const start = startNetzwerkId
    ? netzwerke.find((w) => w.id === startNetzwerkId)
    : undefined
  return [
    ...(start ? [start] : []),
    uebersicht,
    ...netzwerke.filter((w) => w !== start),
    ...spaces.filter((w) => w.isNetwork !== true),
  ]
}

/**
 * Die Spaces eines Netzwerks, nach ihren Arten gegliedert.
 *
 * Ein Abschnitt ohne Spaces entfaellt. Spaces ohne Art oder mit einer Art, die
 * dieses Netzwerk nicht kennt, stehen zuletzt unter `ohneArt` (Spec 01, Regel
 * 4). Eine unbekannte Art ist **kein Fehler**: Sie stammt aus einer anderen
 * Version oder einem anderen Netzwerk und bleibt erhalten.
 */
export function gliedereNachArt<T extends { id: string; kind?: string }>(
  spaces: readonly T[],
  arten: readonly { id: string; labelPlural: string }[],
): { arten: { id: string; labelPlural: string; spaces: T[] }[]; ohneArt: T[] } {
  const bekannt = new Set(arten.map((a) => a.id))
  const abschnitte = arten
    .map((a) => ({ ...a, spaces: spaces.filter((s) => s.kind === a.id) }))
    .filter((a) => a.spaces.length > 0)
  const ohneArt = spaces.filter((s) => !s.kind || !bekannt.has(s.kind))
  return { arten: abschnitte, ohneArt }
}

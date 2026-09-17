// Regeln rund um die Arten eines Netzwerks.
//
// Hier liegt, was ohne Oberfläche gilt. Wie eine Art aussieht, entscheidet
// `@trustdonation/ui`; ob sie taugt, entscheidet diese Datei (Muster 2: zwei
// Schichten entlang der Paketgrenze).

/** Eine Art, wie sie in `Group.data.spaceKinds` steht. */
export interface ArtZeile {
  id: string
  label: string
  labelPlural: string
  color?: string
}

/**
 * Eine Zeile taugt, wenn sie Einzahl und Mehrzahl traegt.
 *
 * Wer nur die Einzahl eingetragen hat, ist mitten im Tippen. Seine Zeile wird
 * nicht geschrieben und auch nicht verworfen: Ein halbes Wort ist kein Fehler,
 * es ist ein Anfang.
 */
export function zeileVollstaendig(row: ArtZeile): boolean {
  return row.label.trim().length > 0 && row.labelPlural.trim().length > 0
}

/**
 * Was von einer bearbeiteten Liste geschrieben wird.
 *
 * Unvollstaendige Zeilen fallen weg, ohne die uebrigen mitzunehmen. Das ist
 * dieselbe Haltung wie bei `parseSpaceKinds` im Toolkit: Ein Tippfehler in
 * einer Art darf einem Netzwerk nicht alle Arten nehmen.
 */
export function schreibbareArten(rows: readonly ArtZeile[]): ArtZeile[] {
  return rows.filter(zeileVollstaendig)
}

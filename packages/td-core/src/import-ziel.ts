// Wohin die Stiftungen gehören, wenn kein Space offen ist. Ein eigenes,
// kleines Modul: Die App fragt das im Hauptteil, der Import-Dialog selbst
// wird erst geladen, wenn der Link ihn öffnet (Budget, 03.10.2026).

/** Das Netzwerk „trustdonation“, sonst ein Space dieses Namens, sonst keiner. */
export function importZiel<G extends { id: string; name: string; data?: unknown }>(groups: readonly G[]): G | undefined {
  const heisst = (g: G) => g.name.trim().toLowerCase() === "trustdonation"
  return groups.find((g) => heisst(g) && (g.data as { isNetwork?: boolean } | undefined)?.isNetwork) ?? groups.find(heisst)
}

// Trägt ein Eintrag ein Stiftungsprofil? Ein eigenes, kleines Modul: Die App
// fragt das im Hauptteil, der ganze Kern (`stiftungs-profil.ts`) bleibt im
// nachgeladenen Stück (Budget, 02.10.2026).

import { text, type Roh } from "./schleuse.js"

/** Trägt dieser Eintrag ein Stiftungsprofil? Er sagt, dass er ein Förderer ist. */
export function traegtStiftungsProfil(daten: Roh | null | undefined): boolean {
  return Boolean(daten && text(daten.title) && text(daten.foerdererart))
}

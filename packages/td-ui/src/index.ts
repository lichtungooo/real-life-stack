// Was trustdonation an Oberfläche mitbringt.
//
// Dieses Paket kennt Antons Toolkit und `@trustdonation/core`. Die
// Abhängigkeit zeigt in eine Richtung: `td-ui` kennt `td-core`, nie umgekehrt
// (ARCHITEKTUR Teil 3).
//
// Hier wachsen die Feld-Darstellung (DEFINITION Teil 7) und unsere Bereiche
// des Space-Dialogs, sobald Anton einen Einhängepunkt dafür hat (NAEHTE A1).
export { ArtenEditor, type ArtZeile, type ArtenEditorProps } from "./arten-editor.js"

// Die Regel, wann eine Art vollständig ist, liegt in der UI-freien Schicht.
// Sie hier zu doppeln wäre eine zweite Wahrheit über dieselbe Sache.
export { zeileVollstaendig, schreibbareArten } from "@trustdonation/core"

export {
  StiftungenImport,
  stiftungenSchreiben,
  type ImportStand,
} from "./stiftungen-import.js"
export { BaukastenFlaeche, type BaukastenFlaecheProps } from "./baukasten-flaeche.js"
export { ProfilFlaeche, type ProfilFlaecheProps } from "./profil-flaeche.js"

// Die Begleitung (DEFINITION Teil 13). `presents` bleibt leer: Sie ist keine
// Sicht auf Items, sie liest sie.
export {
  CompanionFlaeche,
  COMPANION_WERKZEUGE,
  ueberblickAus,
  sichtbareWerkzeuge,
  type CompanionWerkzeug,
  type SpaceUeberblick,
} from "./companion-flaeche.js"

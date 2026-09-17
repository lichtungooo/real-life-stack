// Was trustdonation an Oberflaeche mitbringt.
//
// Dieses Paket kennt Antons Toolkit und `@trustdonation/core`. Die
// Abhaengigkeit zeigt in eine Richtung: `td-ui` kennt `td-core`, nie umgekehrt
// (ARCHITEKTUR Teil 3).
//
// Hier wachsen die Feld-Darstellung (DEFINITION Teil 7) und unsere Bereiche
// des Space-Dialogs, sobald Anton einen Einhaengepunkt dafuer hat (NAEHTE A1).
export { ArtenEditor, type ArtZeile, type ArtenEditorProps } from "./arten-editor.js"

// Die Regel, wann eine Art vollstaendig ist, liegt in der UI-freien Schicht.
// Sie hier zu doppeln waere eine zweite Wahrheit ueber dieselbe Sache.
export { zeileVollstaendig, schreibbareArten } from "@trustdonation/core"

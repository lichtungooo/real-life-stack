// @kreis/ui — die Flaeche des Kreis-Moduls. Spec: docs/spec/modules/kreis.md

export { KreisFlaeche } from "./kreis-flaeche"
export { KreisRaumFlaeche, OhneRaum } from "./kreis-raum-flaeche"
export { KreisRaumProvider, useKreisVerbindung, type KreisRaumFabrik, type KreisKontext } from "./raum-kontext"
export { useNebenHalten, ZEICHEN, ZEICHEN_DAUER, spracherkennungVorhanden, type Neben, type ChatZeile, type ProtokollZeile, type ZeichenArt } from "./use-neben"
export { useKreisVerbindungHalten, type KreisVerbindung, type KreisZustand, type NebenNachricht } from "./use-kreis"
export { KreisRund, plaetze } from "./kreis-rund"
export { ProzessLeiste, ProzessWahl } from "./prozess-leiste"
export { schaleAnschlagen } from "./klangschale"

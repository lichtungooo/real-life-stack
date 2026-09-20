// Was trustdonation an Regeln und Daten mitbringt, ohne Oberfläche.
//
// Dieses Paket kennt Antons `data-interface`, nie sein Toolkit und nie React.
// Ein Connector oder ein Prüfwerkzeug soll es lesen können, ohne eine
// Oberfläche zu laden (ARCHITEKTUR Teil 3, Regel 2).
// Die Musterdaten stehen mit Absicht NICHT hier.
//
// Sie sind 308 KB Daten. Ein Index, den jede Ansicht anfasst, zieht sie
// sonst ins Haupt-Stück: Am 20.09.2026 lagen 626 Stiftungs-Kennungen darin,
// und ein `await import()` in der App half nichts, weil ein
// `import { ordneSpaces }` denselben Index las.
//
// Wer sie braucht, holt sie beim Namen:
//
//     import { musterdaten } from "@trustdonation/core/musterdaten"

export {
  ordneSpaces,
  gliedereNachArt,
  type OrdnungsEintrag,
} from "./space-ordnung.js"

export {
  zeileVollstaendig,
  schreibbareArten,
  type ArtZeile,
} from "./arten.js"

export {
  baukasten,
  type Baukasten,
  type BaukastenSchicht,
  type BaukastenStueck,
  type BaukastenLuecke,
} from "./baukasten.js"

export {
  profilAufbauen,
  profilStand,
  alleFelder,
  bauplanFuer,
  traegtProfil,
  feldTraegt,
  BAUPLAN_FOERDERER,
  BAUPLAN_PROJEKT,
  type Profil,
  type ProfilReiter,
  type ProfilFeld,
  type Kennzahl,
  type Bauplan,
  type FeldForm,
} from "./profil.js"

export {
  zerlegeEintrag,
  sitzAusAnschrift,
  type ZerlegterEintrag,
} from "./eintrag-zerlegen.js"

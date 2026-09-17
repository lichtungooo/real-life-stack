// Was trustdonation an Regeln und Daten mitbringt, ohne Oberflaeche.
//
// Dieses Paket kennt Antons `data-interface`, nie sein Toolkit und nie React.
// Ein Connector oder ein Pruefwerkzeug soll es lesen koennen, ohne eine
// Oberflaeche zu laden (ARCHITEKTUR Teil 3, Regel 2).
export {
  musterdaten,
  musterGroups,
  musterUsers,
  musterItems,
  musterGroupMembers,
  musterGroupItems,
  MUSTERDATEN_VERSION,
} from "./musterdaten.js"

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

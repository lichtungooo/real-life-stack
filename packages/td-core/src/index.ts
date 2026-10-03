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
export { ohneNetzwerkZuordnen, type ZuordnungsEintrag } from "./space-ordnung.js"

export {
  zeileVollstaendig,
  schreibbareArten,
  type ArtZeile,
} from "./arten.js"


export {
  profilAufbauen,
  profilStand,
  kachelnOrdnen,
  kartenAusschnitt,
  hashtagsFuer,
  alsHashtag,
  alleFelder,
  bauplanFuer,
  traegtProfil,
  feldTraegt,
  BAUPLAN_FOERDERER,
  BAUPLAN_PROJEKT,
  type Profil,
  type Kachel,
  type KachelArt,
  type ProfilFeld,
  type Meilenstein,
  type Ort,
  type Kartenkachel,
  type Kartenausschnitt,
  type Bauplan,
  type FeldForm,
} from "./profil.js"

export {
  zerlegeEintrag,
  sitzAusAnschrift,
  type ZerlegterEintrag,
} from "./eintrag-zerlegen.js"

export {
  netzwerkePlanen,
  type NetzwerkPlan,
  type NetzwerkSchritt,
} from "./netzwerke-uebernehmen.js"
export {
  ERWEITERUNGEN,
  erweiterungenAus,
  komponentenAus,
  komponentenImSpace,
  komponenteAktiv,
  modulSchalten,
  PROJEKT_PROFIL,
  PERSON_PROFIL,
  STIFTUNGS_PROFIL,
  type Erweiterung,
  type ErweiterungsArt,
  type ErweiterungsEintrag,
  type Reife,
} from "./erweiterungen.js"
export {
  projektProfil,
  traegtProjektProfil,
  euro,
  spendenLink,
  type ProjektProfil,
  type ProjektKennzahl,
  type ProjektSpende,
  type ProjektBedarf,
  type ProjektSchritt,
  type ProjektMensch,
  type ProjektKontakt,
} from "./projekt-profil.js"
export {
  stiftungsProfil,
  kontrast,
  lesbarAuf,
  lesbarAufHell,
  motivFuer,
  STIFTUNGS_MOTIVE,
  type StiftungsMotiv,
  type StiftungsSchwerpunkt,
  dunkler,
  type StiftungsProfil,
} from "./stiftungs-profil.js"
export { traegtStiftungsProfil } from "./stiftungs-erkennung.js"
export { importZiel } from "./import-ziel.js"
export {
  GEPFLEGT_VON_DER_STIFTUNG,
  uebernahmeAus,
  gepflegtAus,
  uebernahmeAnfragen,
  uebernahmeBestaetigen,
  uebernahmeAblehnen,
  darfStiftungBearbeiten,
  verwaltetSpace,
  type UebernahmeAnfrage,
  type Gepflegt,
} from "./uebernahme.js"
export {
  ocName,
  ocStandAusAntwort,
  ocStandAus,
  ocBetrag,
  ocZiel,
  ocSpende,
  spaceSpenden,
  spaceSpendenAenderung,
  OC_ABFRAGE,
  type SpaceSpenden,
  type OcStand,
  type OcAusgabe,
  type OcEingang,
} from "./opencollective.js"
export {
  PROJEKT_PROFIL_FELDER,
  PROJEKT_ENTWURF_REGELN,
  ENTWURF_HOECHSTENS,
  projektEntwurfPruefen,
  entwurfKodieren,
  entwurfLesen,
  ortAus,
  type EntwurfFeld,
  type EntwurfForm,
  type ProjektEntwurf,
  type EntwurfBericht,
} from "./projekt-entwurf.js"
export {
  STIFTUNGS_PROFIL_FELDER,
  felderIm,
  feldHinweise,
  bereinigt,
  abschnittSpeichern,
  arbeitskopie,
  schlagworte,
  type EingabeFeld,
  type EingabeTeil,
  type EingabeForm,
  type EingabePruefung,
  type AbschnittGespeichert,
} from "./profil-felder.js"

/** Rohe Daten eines Eintrags, vor der Schleuse. */
export type { Roh } from "./schleuse.js"
export {
  PROFIL_ARTEN,
  PROFIL_ART_REGELN,
  EINRICHTUNGS_PROFIL_FELDER,
  PROFIL_ENTWURF_REGELN,
  felderFuer,
  stiftungEntwurfPruefen,
  einrichtungEntwurfPruefen,
  personEntwurfPruefen,
  profilEntwurfPruefen,
  profilEntwurfKodieren,
  profilEntwurfLesen,
  type ProfilArt,
} from "./profil-entwurf.js"
export {
  KI_MCP_VORGABE,
  KI_GRENZEN,
  werkzeugName,
  schrittTitel,
  entwurfAusText,
  kiMcpAdresse,
  kiVerlauf,
  kiZeile,
  kiLeser,
  type KiNachricht,
  type KiEreignis,
} from "./ki.js"
export {
  PERSON_PROFIL_FELDER,
  SICHTBARKEITEN,
  SICHTBARKEIT_NAME,
  HEUTE_OEFFENTLICH,
  NIE_OEFFENTLICH,
  MUSTER_PERSON,
  sichtbarkeit,
  sichtbarkeitSetzen,
  werSiehtHeute,
  personProfil,
  oeffentlichesProfil,
  traegtPersonProfil,
  type PersonAnsicht,
  type Sichtbarkeit,
  type PersonProfil,
} from "./person-profil.js"
export {
  SPIELPAKET_MACHER,
  XP_GROESSEN,
  bereichsKette,
  xpFuerStufe,
  stufeAus,
  questAus,
  teilnahmeAus,
  zaehlt,
  bezeugt,
  spielstand,
  type Bereich,
  type Attribut,
  type Spielpaket,
  type BestaetigtVon,
  type StufenStand,
  type Quest,
  type Teilnahme,
  type TeilnahmeStand,
  type Bestaetigung,
  type QuestEintrag,
  type Spielstand,
} from "./spiel.js"

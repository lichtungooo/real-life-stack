# Definition

**Status:** Arbeitsgrundlage des Prototyps trustdonation, Stand 17.09.2026
**Ort:** Branch `trustdonation` in `lichtungooo/real-life-stack`
**Verhaeltnis zur Spec:** ergaenzend, nie widersprechend

Diese Datei sagt, wie wir weiterbauen. Sie steht neben Antons [Spec](spec/README.md) und erweitert sie um die Ebenen, die unser Vorhaben braucht: Arten von Spaces, Felder, Komponenten, ein Marktplatz fuer Module, Profile und das Matching.

**Die Spec gewinnt.** Wo diese Datei etwas anders saehe als `docs/spec/`, gilt die Spec, und diese Datei wird berichtigt. Wo die Spec schweigt, gilt diese Datei.

**Warum es sie gibt.** Bis hierher haben wir gebaut und danach beschrieben. Das traegt eine Runde weit. Ab der zweiten laufen die Listen auseinander, und niemand weiss mehr, welche Stelle die Wahrheit hat. Anton hat dagegen ein Mittel gefunden, das wir uebernehmen: **ein Register je Frage, eine Quelle.** Was hier steht, ist der Versuch, dieses Mittel auf unsere Themen anzuwenden, bevor wir Code schreiben.

---

## Teil 1: Was gilt

Antons Spec ist der Vertrag. Diese Landkarte sagt, wo was steht, damit wir nachschlagen statt raten.

| Frage | Antwort steht in |
|---|---|
| Welche Schichten hat eine RLS-App? | [00-architecture](spec/00-architecture.md) |
| Was ist App Shell, Current Space, Space Module, Module Component? | [01-app-composition](spec/01-app-composition.md) |
| Welche Module gibt es und was folgt daraus? | [01, Modul-Register](spec/01-app-composition.md) |
| Wie sieht der Space-Wechsel aus? | [01, Space-Wechsel nach Netzwerk und Art](spec/01-app-composition.md) |
| Welche Flaechen duerfen sich ueberlagern? | [01, Overlay-Flaechen](spec/01-app-composition.md) |
| Was kann ein Connector lesen? | [02-data-interface](spec/02-data-interface.md) |
| Was kann ein Connector zusaetzlich? | [03-capabilities](spec/03-capabilities.md) |
| Was ist ein Item, eine Relation, ein Space? | [04-items-relations-groups-spaces](spec/04-items-relations-groups-spaces.md) |
| Was ist ein Netzwerk, was eine Space-Art? | [04, Netzwerk und Space-Art](spec/04-items-relations-groups-spaces.md) |
| Wie entsteht Vertrauen aus Bestaetigungen? | [05-confirmations-and-trust](spec/05-confirmations-and-trust.md) |
| Welche Felder hat ein Item und woher weiss man das? | [06-schema-composition](spec/06-schema-composition.md) |
| Welche Item-Typen gibt es und was folgt daraus? | [06, Typ-Register](spec/06-schema-composition.md) |
| Wie kategorisiert man ohne neuen Typ? | [07-tags](spec/07-tags.md) |
| Wie werden Beziehungen eigenstaendig? | [08-relation-records](spec/08-relation-records.md) |
| Wie steht ein Item in mehreren Spaces? | [09-mirror-bridge](spec/09-mirror-bridge.md) |
| Was ist im Space passiert? | [10-activity-log](spec/10-activity-log.md) |
| Was unterscheidet zwei Instanzen desselben Images? | [11-runtime-config-und-branding](spec/11-runtime-config-und-branding.md) |
| Wie funktioniert ein Profil? | [12-profile](spec/12-profile.md) |
| Was heisst welches Wort? | [glossary](spec/glossary.md) |
| Wie wird ein Modul spezifiziert? | [spec/modules/template](spec/modules/template.md) |
| Welche Bausteine teilen sich die Module? | [spec/modules/shared-components](spec/modules/shared-components.md) |

Dazu die Vokabulare in [spec/schemas/vocab/](spec/schemas/vocab/): `base`, `event`, `person`, `place`, `project`, `relation`, `resource`, `statement`, `task`.

Nicht normativ, aber lesenswert: `docs/concepts/` (Ideen, darunter `item-types.md`, `relations.md`, `access-control.md`) und `docs/modules/` (frueher Modul-Brainstorm).

---

## Teil 2: Die sechs Muster

Antons Spec wiederholt sechs Bewegungen. Wer sie kennt, kann eine neue Sache so definieren, dass sie sich einfuegt.

### Muster 1: Ein Register je Frage, eine Quelle

Ein Register beantwortet **genau eine** Frage und beantwortet sie an **genau einer** Stelle. Das Typ-Register beantwortet „was folgt daraus, dass ein Item diesen `type` traegt". Das Modul-Register beantwortet „was folgt daraus, dass ein Space dieses Modul fuehrt".

Jede Flaeche, die aufzaehlt, anbietet, benennt oder anzeigt, leitet ihre Liste aus dem Register ab. **Eine zweite Aufzaehlung ist ein Fehler.** Beide Register sind aus derselben Not entstanden: Dieselbe Frage war an vier bis fuenf Stellen beantwortet, die Antworten liefen auseinander, und es fiel lautlos aus.

### Muster 2: Zwei Schichten entlang der Paketgrenze

Der Stack haengt in eine Richtung: `toolkit` kennt `data-interface`, nie umgekehrt. Daraus folgt die Teilung jedes Registers:

| Schicht | Paket | haelt | aendert sich wenn |
|---|---|---|---|
| Manifest | `data-interface`, ohne UI | Identitaet, Vokabular-Bindung, Kanten | die Bedeutung der Daten sich aendert |
| Darstellung | `toolkit` | Name, Icon, Widgets, Slots | das Aussehen sich aendert |

Das Manifest ist die einzige Quelle fuer Identitaet. Die Darstellung haengt sich an Ids an und fuehrt nichts Neues ein. Ein Connector zieht so keine React-Abhaengigkeit.

### Muster 3: Schichten Core, App, Space, additiv

Register werden in fester Reihenfolge zusammengesetzt: **Core, dann App, dann Space.** Jede Schicht vollstaendig, bevor die naechste beginnt. Zwei Formen sind erlaubt:

1. Eine **Definition** fuehrt eine neue Id ein. Eine schon vergebene Id ist ein Konflikt und wird abgelehnt.
2. Ein **Fragment** ergaenzt eine vorhandene Id additiv. Mengen werden vereinigt. Ein Skalar, das die Basis schon setzt, darf ein Fragment nicht ueberschreiben.

**Kein Shadowing, weder still noch ausdruecklich.** Ein Konflikt bricht die Zusammensetzung ab und nennt Feld und beide Schichten.

### Muster 4: Feld-Praesenz statt Typ-Verzweigung

Was ein Modul zeigt, entscheidet, welche **Felder** ein Item hat, nie sein `type`. Ein Item mit `position` gehoert auf die Karte, eines mit `start` in den Kalender, eines mit `status` ins Board. Ein `if (type === ...)` in Modul-Code ist verboten.

Die Richtung ist umgekehrt, als man erwartet: Nicht das Feld sucht ein Modul, sondern das **Modul erklaert**, welche Felder es darstellen kann (`presents`). So bringt eine App ihr eigenes Modul samt Feld mit, ohne dass das Toolkit davon weiss.

### Muster 5: Unbekanntes bleibt erhalten und faellt sichtbar zurueck

Eine Modul-Id ohne Registereintrag ist kein Fehler: Sie stammt aus einer anderen Version oder einer anderen App. Sie **bleibt erhalten** und wird **nicht dargestellt**. Ein unbekannter Item-Typ faellt auf eine schlichte Darstellung zurueck, nie auf eine leere Flaeche.

Das ist die Regel, die Erweiterbarkeit erst moeglich macht. Wer sie bricht, bestraft jeden, der etwas Eigenes baut.

### Muster 6: Die Spec gewinnt

Widersprechen Code und Spec einander, ist das ein Fehler in einem von beiden, nie ein Grund weiterzumachen. Neue Regeln entstehen nicht stillschweigend in Code, Hooks oder Konzeptpapieren.

---

## Teil 3: Wie wir erweitern

Sieben Regeln fuer alles, was wir ab jetzt bauen.

1. **Erst definieren, dann bauen.** Eine neue Sache bekommt einen Abschnitt in dieser Datei, bevor sie Code wird. Der Abschnitt beantwortet: Welche Frage beantwortet das? Wo ist die eine Quelle? Welche Schicht haelt was? Was passiert bei Unbekanntem?
2. **Wir erfinden kein zweites Register fuer eine Frage, die Anton schon beantwortet.** Wir ergaenzen seine Register ueber Fragmente, oder wir eroeffnen ein Register fuer eine Frage, die er ausdruecklich offen laesst.
3. **Nichts wird hart verdrahtet, was eine Instanz unterscheiden kann.** Namen, Arten, Farben, Domains, Felder: alles kommt aus Daten oder aus Laufzeit-Konfiguration ([Spec 11](spec/11-runtime-config-und-branding.md)). Eine Liste im Code, die in einer anderen Instanz anders aussehen muesste, ist ein Fehler.
4. **Was ein Mensch eingibt, steht in `data`.** Die obersten Felder eines Item gehoeren dem Core. Dasselbe gilt fuer `Group.data`.
5. **Keine Bewertungen.** Keine Punkte, keine Sterne, keine Ranglisten, keine Passungszahl. Wo ein Vergleich noetig ist, nennen wir **Gruende**, und der Mensch entscheidet. Das ist eine Entscheidung ueber das Produkt, keine ueber die Technik, und sie steht hier, weil sie sonst im Code verloren geht.
6. **Ein Prototyp zeigt echte Daten.** Musterdaten kommen aus dem, was wirklich angelegt wurde. Erfundene Beispiele gehoeren in Konzeptpapiere, nicht in die laufende App.
7. **Was wir aendern, bekommt einen Test.** Nicht fuer alles, aber fuer jede Regel, die eine Liste betrifft. Genau dort laufen Dinge auseinander.

---

## Teil 4: Was wir gebaut haben

Nachgetragen, damit es eine Definition hat und nicht nur Code ist.

### 4.1 Netzwerk und Art

**Frage:** Wie gehoeren Spaces zusammen, ohne dass ein Space einem anderen untergeordnet wird?

Ein Space kann ein **Netzwerk** sein. Ein Netzwerk traegt die **Arten**, in denen seine Spaces gefuehrt werden. Jeder andere Space waehlt sein Netzwerk und darin seine Art. Ein Space kann beides zugleich sein: die Lichtung ist ein Projekt im Netzwerk trustdonation und selbst ein Netzwerk mit den Arten Ort und Gruppe.

| Feld in `Group.data` | Form | Bedeutung |
|---|---|---|
| `isNetwork` | `true` oder fehlt | Dieser Space ist ein Netzwerk |
| `spaceKinds` | Liste von `{id, label, labelPlural, color?}` | die Arten dieses Netzwerks |
| `network` | Space-Id | zu welchem Netzwerk dieser Space gehoert |
| `kind` | Arten-Id | als was er dort gefuehrt wird |
| `domain` | Text | unter welcher Domain die Landingpage liegt |

Regeln:

1. Die Gliederung ist **Darstellung**. Sie aendert weder Routing noch Rechte noch Sichtbarkeit noch Module. Das steht so in [Spec 01](spec/01-app-composition.md) und gilt unveraendert.
2. Ein Space ist **nie sein eigenes Netzwerk**. Die Auswahl zeigt darum immer die anderen.
3. Eine `kind`, die im gewaehlten Netzwerk nicht vorkommt, ist **kein Fehler** (Muster 5): Sie bleibt erhalten und der Space steht unter „Gruppen".
4. Arten-Ids sind ASCII (`[a-z0-9-]{1,32}`) und werden **einmal** beim Anlegen aus dem Namen gebildet. Beim Umbenennen bleibt die Id, sonst verlieren Spaces ihre Zuordnung.

**Wo es geschrieben wird:** allein im Space-Dialog, Bereich **Netzwerk**. Eine zweite Schreibstelle waere eine zweite Wahrheit.

### 4.2 Landingpage

**Frage:** Wie kommt ein Mensch von der Webseite eines Netzwerks in das Netzwerk?

Ein Netzwerk traegt seine `domain` und daraus gebaut einen Link. Beides steht im Space-Dialog im Bereich **Landingpage**, getrennt vom Bereich Netzwerk, weil beide Bereiche sonst zu lang fuer ein Fenster werden.

Regeln:

1. Der Bereich erscheint **nur fuer Netzwerke**. Ohne Netzwerk gibt es nichts zu verlinken.
2. `domain` ist **Auskunft, keine Wirkung**. Die App leitet nichts um und prueft nichts. Wer die Domain aendert, aendert den Text und den Link, sonst nichts.
3. Der Link zeigt auf den Space in dieser Instanz. Er wird **gebaut, nicht gespeichert**: ein gespeicherter Link waere nach einem Umzug falsch.

### 4.3 Bereiche des Space-Dialogs

Die Frage „welche Bereiche hat die Space-Konfiguration" hat **eine** Quelle: `spaceConfigSections` im Toolkit. Menue, Inhalt und Startwert lesen daraus. Der Prototyp fuehrt sechs Bereiche:

| Bereich | Bedingung | Inhalt |
|---|---|---|
| Mitglieder | immer | wer dabei ist |
| Einladen | wenn die App Einladen anbietet | wen man dazuholt |
| Aussehen | fuer Admins | Farbe, Toenung, Rundung, Flaechen, Bild |
| Module | fuer Admins | welche Module dieser Space fuehrt |
| Netzwerk | fuer Admins | Netzwerk-Schalter, Arten, Zugehoerigkeit |
| Landingpage | fuer Admins **und** wenn der Space ein Netzwerk ist | Domain und Link |

Regel: Ein neuer Bereich wird **in dieser Funktion** eingefuehrt und nirgends sonst. Der Zaehler-Satz (`sectionCounts`) und die Inhalts-Bloecke haengen an denselben Ids.

---

## Teil 5: Die Luecken

Was unser Vorhaben braucht und in Antons Spec bewusst offen ist.

| Luecke | Was fehlt | Antons Stand |
|---|---|---|
| **Felder je Art** | Eine Stiftung traegt andere Angaben als ein Projekt. `spaceKinds` traegt heute nur Name und Farbe. | offen |
| **Feld-Register** | Ein neues Feld erscheint heute nur, wenn jemand Code schreibt, der es kennt. | Typ-Register deckt Item-Typen, nicht einzelne Felder |
| **Modul-Marktplatz** | Wie ein Modul angeboten, gefunden und in eine Instanz genommen wird. | ausdruecklich offen: „Ein spaeteres Plugin-Konzept waere eine eigene Sache mit eigenen Regeln" ([Spec 01, Regel 4](spec/01-app-composition.md)) |
| **Profil eines Space** | [Spec 12](spec/12-profile.md) definiert das Profil eines **Menschen**. Ein Stiftungsprofil ist ein Space. | offen |
| **Matching** | Wie ein Vorschlag entsteht und wie er begruendet wird. | nicht Gegenstand der Spec |
| **Angebot und Bedarf** | `docs/modules/marketplace.md` haelt zwei Saetze. | frueher Brainstorm |

Was **nicht** fehlt und was wir darum nicht neu bauen: Items, Relations, Tags, Vokabulare, Bestaetigungen, Vertrauen, Spiegel, Aktivitaetslog, Laufzeit-Konfiguration, Modul-Register, Typ-Register.

---

## Teil 6: Eine Art traegt Felder

**Frage, die dieser Abschnitt beantwortet:** Was folgt daraus, dass ein Space als Stiftung gefuehrt wird?

Heute folgt daraus eine Ueberschrift im Umschalter. Kuenftig folgt daraus auch, **welche Angaben der Space traegt**: eine Stiftung hat Foerderschwerpunkte, einen Foerderrahmen und einen Antragsweg; ein Projekt hat ein Vorhaben und Bedarfe.

Die Loesung folgt Muster 2 und Muster 4: Eine Art **bindet Vokabulare**, sonst nichts.

### Eintrag

`spaceKinds` waechst additiv um ein Feld:

| Feld | Form | Zweck |
|---|---|---|
| `id` | `[a-z0-9-]{1,32}` | stabile Identitaet, bleibt beim Umbenennen |
| `label` | Text | Anzeigename, Einzahl |
| `labelPlural` | Text | Anzeigename, Mehrzahl |
| `color` | `#rrggbb` | Akzent |
| `vocab` | Liste von Vokabular-URLs | welche Felder ein Space dieser Art traegt |

Beispiel:

```json
{
  "id": "stiftung",
  "label": "Stiftung",
  "labelPlural": "Stiftungen",
  "color": "#194294",
  "vocab": ["https://real-life-stack.org/vocab/foundation/v1"]
}
```

### Regeln

1. Die Art **bindet nur**. Sie traegt keine Darstellung, keine Reihenfolge der Felder, keine Pflichtangaben. Darstellung kommt aus dem Feld-Register (Teil 7).
2. Die Felder selbst leben in **`Group.data`**, flach, benannt wie im Vokabular. Was ein Mensch eingibt, steht in `data` (Teil 3, Regel 4).
3. Eine Art **ohne** `vocab` bleibt gueltig. Sie traegt dann nur Name und Farbe, genau wie heute. Die Erweiterung ist additiv (Muster 3).
4. Ein **unbekanntes Vokabular** wird uebergangen, der Space bleibt bedienbar (Muster 5). Ein Tippfehler in einer Art darf keinem Netzwerk seine Spaces nehmen.
5. Aendert ein Netzwerk die `vocab` einer Art, **verlieren bestehende Spaces nichts**. Felder, die kein aktives Vokabular mehr kennt, bleiben in `data` stehen und werden nicht angezeigt.
6. Wer die Arten eines Netzwerks setzt, setzt damit die Felder seiner Spaces. Das ist Admin-Sache und steht im Bereich **Netzwerk**.

### Woher die Vokabulare kommen

Neue Vokabulare entstehen wie Antons (`docs/spec/schemas/vocab/<name>/v1/`): ein `context.jsonld`, ein `schema.json`, Beispiele unter `examples/valid/`. Die CI validiert sie bereits. Wir brauchen zunaechst:

| Vokabular | Fuer | Felder, erste Fassung |
|---|---|---|
| `foundation/v1` | Stiftungen | `foerderschwerpunkte` (Tags), `foerderrahmen` (`{min, max, waehrung}`), `antragsweg` (Text), `antragsfrist` (Text oder Datum), `zustiftung` (ja/nein), `quelle` (URL) |
| `initiative/v1` | Projekte | `vorhaben` (Text), `beginn` (Datum), `wirkungsraum` (Text), `traeger` (Text) |
| `need/v1` | Bedarfe | `worum` (Text), `umfang` (`{betrag, waehrung}` oder Text), `bis` (Datum), `art` (Sache, Geld, Zeit, Wissen) |

Jedes davon bekommt vor dem Bau einen eigenen Abschnitt hier, nach demselben Raster.

---

## Teil 7: Das Feld-Register

**Frage, die dieser Abschnitt beantwortet:** Was folgt daraus, dass ein Datensatz dieses Feld traegt?

Antons Typ-Register beantwortet die Frage fuer ganze **Item-Typen**. Fuer einzelne Felder gibt es sie nicht: Ein neues Feld erscheint heute erst, wenn jemand eine Komponente schreibt, die es kennt, und diese Komponente steht dann an genau einer Flaeche. Genau so entstehen die Listen, die auseinanderlaufen.

### Zwei Schichten

| Schicht | Paket | haelt |
|---|---|---|
| **Feld-Manifest** | `data-interface` | `id` (Vokabular plus Feldname), Datenform, ob mehrfach |
| **Feld-Darstellung** | `toolkit` | `label`, `icon`, Eingabe-Widget, Anzeige, Kurzform |

### Eintrag

| Feld | Schicht | Zweck |
|---|---|---|
| `id` | Manifest | `<vokabular>#<feld>`, zum Beispiel `foundation/v1#foerderrahmen` |
| `shape` | Manifest | `text`, `longtext`, `number`, `money`, `range`, `date`, `bool`, `url`, `tags`, `position`, `ref` |
| `multiple` | Manifest | ob das Feld mehrfach vorkommt |
| `label` | Darstellung | Anzeigename |
| `icon` | Darstellung | Symbol in Zeilen und Karten |
| `input` | Darstellung | Widget im Composer und im Space-Dialog |
| `display` | Darstellung | Anzeige im Detail |
| `short` | Darstellung | Kurzform fuer Karten und Zeilen |

### Regeln

1. Jede Flaeche, die ein Feld eingibt oder anzeigt, holt ihre Bausteine **aus dem Register**. Kein `if (feld === ...)` in einer Flaeche.
2. Ein Feld **ohne** Darstellungs-Eintrag faellt auf seine `shape` zurueck: ein Text wird als Text gezeigt, eine Zahl als Zahl (Muster 5). Nie leer, nie kaputt.
3. Das Register **traegt keine Pflicht und kein Recht**. Ob ein Feld ausgefuellt sein muss, sagt das JSON-Schema des Vokabulars. Ob jemand es aendern darf, sagt die Autorisierung.
4. Das Register gilt fuer **Item-Felder und Space-Felder gleichermassen**. Ein `foerderrahmen` sieht im Stiftungs-Space so aus wie in einem Item, das ihn nennt. Zwei Darstellungen desselben Feldes waeren zwei Wahrheiten.
5. Es wird wie die anderen Register zusammengesetzt: **Core, App, Space**, additiv, Konflikt statt Shadowing (Muster 3).
6. `shape` ist eine **geschlossene Liste**. Eine neue Form kommt nur mit einem Abschnitt in dieser Datei dazu. Sonst wird `shape` zu einem zweiten Typsystem neben JSON-Schema.

### Verhaeltnis zum Typ-Register

Das Typ-Register sagt, **welche Felder** ein Typ mitbringt (ueber die Vokabular-Bindung) und wie eine ganze Karte aussieht. Das Feld-Register sagt, **wie ein einzelnes Feld** aussieht. Das Typ-Register bleibt die Quelle fuer Typ-Identitaet; das Feld-Register fuehrt keine Typen ein.

---

## Teil 8: Der Marktplatz fuer Module

**Frage, die dieser Abschnitt beantwortet:** Wie kommt ein Modul, das jemand anders gebaut hat, in meinen Space?

Antons Spec laesst das ausdruecklich offen und sagt zugleich, was **nicht** geht: Das Modul-Register wird vor dem ersten Render einmal zusammengesetzt und eingefroren. Ein Space waehlt aus dem Katalog, er traegt nichts bei. Ein Marktplatz, der zur Laufzeit fremden Code nachlaedt, waere ein Bruch dieser Regel und ein offenes Tor dazu.

Darum zwei Stufen, und die erste kommt ohne fremden Code aus.

### Was ein Marktplatz-Eintrag ist

**Ein Item, kein Code.** Wer ein Modul anbietet, veroeffentlicht ein Item vom Typ `module` in einem Netzwerk. Es traegt:

| Feld in `data` | Zweck |
|---|---|
| `moduleId` | die Id, die in `Group.data.modules` landet |
| `name` | Anzeigename |
| `zweck` | wofuer das Modul da ist, in Saetzen |
| `art` | `daten` oder `code` |
| `presents` | welche Felder es darstellt |
| `felder` | bei `art: "daten"`: die Feld-Ids, aus denen es besteht |
| `ansicht` | bei `art: "daten"`: `liste`, `karten`, `karte`, `kalender`, `board` |
| `herkunft` | wer es gebaut hat, als Relation auf einen Space oder ein Profil |
| `bezug` | bei `art: "code"`: wo das Paket liegt |

### Stufe 1: Datenmodule

Ein Datenmodul besteht aus **Feldern aus dem Feld-Register** und einer der vorhandenen Ansichten. Es braucht keine Zeile fremden Code.

Ablauf:

1. Jemand beschreibt sein Modul als Item und veroeffentlicht es.
2. Eine Instanz, die es fuehren will, nimmt den Eintrag in ihre **App-Schicht** des Modul-Registers. Das geschieht beim Bau der Instanz, nicht zur Laufzeit: Antons Regel 3 bleibt unangetastet.
3. Ein Space dieser Instanz nimmt die `moduleId` in `Group.data.modules`.

Regeln:

1. Ein Datenmodul **fuehrt keine neuen Feldformen ein**. Es setzt zusammen, was das Feld-Register kennt. Wer eine neue Form braucht, erweitert das Feld-Register, und das ist ein eigener Schritt mit einem eigenen Abschnitt.
2. Ein Datenmodul **fuehrt keine Typ-Verzweigung**. Es zeigt, was seine Felder tragen (Muster 4).
3. Eine Instanz, die den Eintrag **nicht** hat, laesst die Id in `Group.data.modules` stehen und zeigt sie nicht (Muster 5). Ein Space verliert sein Modul nicht, weil er gerade in einer anderen App geoeffnet wird.

### Stufe 2: Codemodule

Spaeter und mit eigenen Regeln. Was jetzt schon feststeht:

1. Ein Codemodul kommt als **Paket mit Version**, nie als Quelltext zur Laufzeit.
2. Es wird **signiert**, und die Signatur haengt an einer Identitaet im Web of Trust. Wer ein Modul in seine Instanz nimmt, sieht, von wem es kommt.
3. Es wird beim **Bau der Instanz** eingebunden. Nachladen zur Laufzeit ist kein Ziel.
4. Bis dahin ist der Weg fuer ein Codemodul derselbe wie heute: ein Pull Request.

### Was der Marktplatz nicht ist

Kein Laden, keine Bezahlung, keine Bewertungen, keine Rangliste. Wer ein Modul sucht, sieht, was es tut und wer es gebaut hat.

---

## Teil 9: Profile

**Frage:** Wo stehen die Angaben eines Menschen, und wo die einer Stiftung?

[Spec 12](spec/12-profile.md) beantwortet die erste Haelfte und bleibt unveraendert gueltig: Das Profil eines Menschen ist ein `person`-Item in seinem persoenlichen Space, und in jeden Gruppen-Space, fuer den er es freigibt, geht ein Spiegel.

Die zweite Haelfte fehlt. Unsere Antwort:

**Das Profil einer Stiftung, eines Projekts oder eines Netzwerks ist der Space selbst.** Seine Angaben stehen in `Group.data`, nach den Vokabularen seiner Art (Teil 6). Ein zweites Profil-Item daneben waere eine zweite Wahrheit.

Regeln:

1. Ein Mensch hat ein Profil-**Item**. Eine Einrichtung hat einen **Space**. Beide werden von demselben Feld-Register dargestellt (Teil 7, Regel 4), damit sie sich gleich anfuehlen.
2. Wer den Space verwaltet, verwaltet sein Profil. Es gibt keine getrennte Rechteebene dafuer.
3. Ein Space-Profil ist **so oeffentlich wie der Space**. Antons Freigabe-Mechanik aus Spec 12 gilt fuer Menschen; ein Space regelt das ueber seine Sichtbarkeit.
4. Was eine Einrichtung ueber **sich** sagt, steht im Space. Was **andere** ueber sie sagen, sind Bestaetigungen ([Spec 05](spec/05-confirmations-and-trust.md)) und Relationen ([Spec 08](spec/08-relation-records.md)). Die beiden werden nie vermischt.

Daraus folgt der Satz, der auf der Landingpage steht: Ein Eintrag, den wir recherchiert haben, gehoert der Einrichtung, sobald sie ihn uebernimmt.

### Der Weg vom Eintrag zum Space

Ein recherchierter Eintrag ist **noch kein Space**. Er ist ein `place`-Item mit Position, Namen und dem, was oeffentlich bekannt ist.

| | Eintrag | Space |
|---|---|---|
| Form | `place`-Item auf der Karte | Group mit `kind: "stiftung"` |
| Wer pflegt ihn | wir, aus oeffentlicher Recherche | die Einrichtung selbst |
| Was er traegt | Name, Sitz, Schwerpunkte, Quelle | dazu Mitglieder, Module, Profil, eigene Inhalte |
| Wieviele | hunderte | so viele, wie uebernommen haben |

**Warum nicht gleich Spaces:** Ein Space ist ein Arbeitsraum. 234 davon waeren im Umschalter unbenutzbar, und keiner haette ein Mitglied. Ein Punkt auf der Karte braucht keinen Arbeitsraum, er braucht einen Ort und einen Namen.

**Der Uebergang** ist der Moment, auf den das ganze Vorhaben zielt: Eine Stiftung sieht ihren Eintrag, erkennt sich wieder und uebernimmt ihn. Aus dem Item wird ein Space, sie wird sein Admin, und ab da sagt sie selbst, was sie foerdert. Der Eintrag verschwindet dann als Item und lebt als Space weiter.

---

## Teil 10: Matching

**Frage:** Wie entsteht ein Vorschlag, und woran erkennt ein Mensch, ob er taugt?

Das Fachliche steht in [trustdonation/docs/05-matching.md](https://github.com/lichtungooo/trustdonation/blob/main/docs/05-matching.md). Hier steht die Form.

**Ein Vorschlag ist ein Item vom Typ `match`.** Er traegt zwei Relationen auf die beiden Seiten und eine Liste von **Gruenden**.

| Feld | Zweck |
|---|---|
| `relations[]` mit `predicate: "matchSide"` | die beiden Seiten, je ein Space oder Item |
| `data.gruende[]` | warum dieser Vorschlag entstand |
| `data.erzeugtAm` | wann |
| `data.erzeugtVon` | welche Regel oder welcher Mensch |

Ein Grund ist selbst eine kleine Form:

```json
{ "feld": "foundation/v1#foerderschwerpunkte",
  "links": ["bildung", "jugend"],
  "rechts": ["jugend"],
  "art": "ueberschneidung" }
```

Regeln:

1. **Keine Zahl, kein Rang.** Ein Vorschlag hat Gruende oder er entsteht nicht. Eine Prozentzahl waere eine Bewertung, und die gibt es hier nicht (Teil 3, Regel 5).
2. Ein Grund nennt immer das **Feld**, auf dem er beruht, und was auf beiden Seiten steht. Ein Mensch muss ihn nachpruefen koennen, ohne uns zu fragen.
3. Die Arten von Gruenden sind eine **geschlossene Liste**: `ueberschneidung` (gemeinsame Werte), `naehe` (Ort), `rahmen` (Betrag passt in eine Spanne), `zeit` (Frist passt zum Vorhaben), `mensch` (jemand kennt beide Seiten).
4. Ein Vorschlag ist **eine Vermutung, keine Zusage**. Er wird angezeigt, bis eine Seite ihn annimmt oder verwirft. Angenommen wird er zu einer Relation zwischen den beiden Seiten; verworfen verschwindet er und kommt aus demselben Grund nicht wieder.
5. Wer keine Vorschlaege will, bekommt keine. Die Mechanik ist ein Angebot, kein Zustand.

---

## Teil 11: Wie wir arbeiten

1. **Eine Sache kommt zuerst hierher.** Ein Abschnitt mit: welche Frage, wo die eine Quelle, welche Schicht haelt was, was bei Unbekanntem passiert.
2. **Dann ein Test fuer die Regel**, die eine Liste betrifft.
3. **Dann der Bau.**
4. **Dann der Eintrag im Stand** (`memory/stand_trustdonation.md`) mit dem, was unterwegs schiefging.
5. Was Anton betrifft, geht als Pull Request an ihn, mit dem Anwendungsfall zuerst. Was nur uns betrifft, bleibt hier.

**Wo was liegt:**

| Was | Wo |
|---|---|
| Antons Vertrag | `docs/spec/` in `real-life-org/real-life-stack` |
| Unsere Definition | diese Datei, Branch `trustdonation` in `lichtungooo/real-life-stack` |
| Unser Konzept, fachlich | `docs/` in `lichtungooo/trustdonation` |
| Der laufende Prototyp | `trustdonation.org/app`, Image `trustdonation-app:proto-N` |
| Der Stand der Arbeit | `memory/stand_trustdonation.md` |

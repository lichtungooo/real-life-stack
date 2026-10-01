# Definition

**Status:** Arbeitsgrundlage des Prototyps trustdonation, Stand 17.09.2026
**Ort:** Branch `trustdonation` in `lichtungooo/real-life-stack`
**Verhältnis zur Spec:** ergänzend, nie widersprechend

Diese Datei sagt, wie wir weiterbauen. Sie steht neben Antons [Spec](spec/README.md) und erweitert sie um die Ebenen, die unser Vorhaben braucht: Arten von Spaces, Felder, Komponenten, Erweiterungen, Profile und das Matching.

**Die Spec gewinnt.** Wo diese Datei etwas anders sähe als `docs/spec/`, gilt die Spec, und diese Datei wird berichtigt. Wo die Spec schweigt, gilt diese Datei.

**Warum es sie gibt.** Bis hierher haben wir gebaut und danach beschrieben. Das trägt eine Runde weit. Ab der zweiten laufen die Listen auseinander, und niemand weiß mehr, welche Stelle die Wahrheit hat. Anton hat dagegen ein Mittel gefunden, das wir übernehmen: **ein Register je Frage, eine Quelle.** Was hier steht, ist der Versuch, dieses Mittel auf unsere Themen anzuwenden, bevor wir Code schreiben.

---

## Teil 1: Was gilt

Antons Spec ist der Vertrag. Diese Landkarte sagt, wo was steht, damit wir nachschlagen statt raten.

| Frage | Antwort steht in |
|---|---|
| Welche Schichten hat eine RLS-App? | [00-architecture](spec/00-architecture.md) |
| Was ist App Shell, Current Space, Space Module, Module Component? | [01-app-composition](spec/01-app-composition.md) |
| Welche Module gibt es und was folgt daraus? | [01, Modul-Register](spec/01-app-composition.md) |
| Wie sieht der Space-Wechsel aus? | [01, Space-Wechsel nach Netzwerk und Art](spec/01-app-composition.md) |
| Welche Flächen dürfen sich überlagern? | [01, Overlay-Flächen](spec/01-app-composition.md) |
| Was kann ein Connector lesen? | [02-data-interface](spec/02-data-interface.md) |
| Was kann ein Connector zusaetzlich? | [03-capabilities](spec/03-capabilities.md) |
| Was ist ein Item, eine Relation, ein Space? | [04-items-relations-groups-spaces](spec/04-items-relations-groups-spaces.md) |
| Was ist ein Netzwerk, was eine Space-Art? | [04, Netzwerk und Space-Art](spec/04-items-relations-groups-spaces.md) |
| Wie entsteht Vertrauen aus Bestaetigungen? | [05-confirmations-and-trust](spec/05-confirmations-and-trust.md) |
| Welche Felder hat ein Item und woher weiß man das? | [06-schema-composition](spec/06-schema-composition.md) |
| Welche Item-Typen gibt es und was folgt daraus? | [06, Typ-Register](spec/06-schema-composition.md) |
| Wie kategorisiert man ohne neuen Typ? | [07-tags](spec/07-tags.md) |
| Wie werden Beziehungen eigenständig? | [08-relation-records](spec/08-relation-records.md) |
| Wie steht ein Item in mehreren Spaces? | [09-mirror-bridge](spec/09-mirror-bridge.md) |
| Was ist im Space passiert? | [10-activity-log](spec/10-activity-log.md) |
| Was unterscheidet zwei Instanzen desselben Images? | [11-runtime-config-und-branding](spec/11-runtime-config-und-branding.md) |
| Wie funktioniert ein Profil? | [12-profile](spec/12-profile.md) |
| Was heißt welches Wort? | [glossary](spec/glossary.md) |
| Wie wird ein Modul spezifiziert? | [spec/modules/template](spec/modules/template.md) |
| Welche Bausteine teilen sich die Module? | [spec/modules/shared-components](spec/modules/shared-components.md) |

Dazu die Vokabulare in [spec/schemas/vocab/](spec/schemas/vocab/): `base`, `event`, `person`, `place`, `project`, `relation`, `resource`, `statement`, `task`.

Nicht normativ, aber lesenswert: `docs/concepts/` (Ideen, darunter `item-types.md`, `relations.md`, `access-control.md`) und `docs/modules/` (früher Modul-Brainstorm).

---

## Teil 2: Die sechs Muster

Antons Spec wiederholt sechs Bewegungen. Wer sie kennt, kann eine neue Sache so definieren, dass sie sich einfügt.

### Muster 1: Ein Register je Frage, eine Quelle

Ein Register beantwortet **genau eine** Frage und beantwortet sie an **genau einer** Stelle. Das Typ-Register beantwortet „was folgt daraus, dass ein Item diesen `type` trägt". Das Modul-Register beantwortet „was folgt daraus, dass ein Space dieses Modul führt".

Jede Fläche, die aufzählt, anbietet, benennt oder anzeigt, leitet ihre Liste aus dem Register ab. **Eine zweite Aufzählung ist ein Fehler.** Beide Register sind aus derselben Not entstanden: Dieselbe Frage war an vier bis fünf Stellen beantwortet, die Antworten liefen auseinander, und es fiel lautlos aus.

### Muster 2: Zwei Schichten entlang der Paketgrenze

Der Stack hängt in eine Richtung: `toolkit` kennt `data-interface`, nie umgekehrt. Daraus folgt die Teilung jedes Registers:

| Schicht | Paket | hält | ändert sich wenn |
|---|---|---|---|
| Manifest | `data-interface`, ohne UI | Identität, Vokabular-Bindung, Kanten | die Bedeutung der Daten sich ändert |
| Darstellung | `toolkit` | Name, Icon, Widgets, Slots | das Aussehen sich ändert |

Das Manifest ist die einzige Quelle für Identität. Die Darstellung hängt sich an Ids an und führt nichts Neues ein. Ein Connector zieht so keine React-Abhängigkeit.

### Muster 3: Schichten Core, App, Space, additiv

Register werden in fester Reihenfolge zusammengesetzt: **Core, dann App, dann Space.** Jede Schicht vollständig, bevor die nächste beginnt. Zwei Formen sind erlaubt:

1. Eine **Definition** führt eine neue Id ein. Eine schon vergebene Id ist ein Konflikt und wird abgelehnt.
2. Ein **Fragment** ergänzt eine vorhandene Id additiv. Mengen werden vereinigt. Ein Skalar, das die Basis schon setzt, darf ein Fragment nicht überschreiben.

**Kein Shadowing, weder still noch ausdrücklich.** Ein Konflikt bricht die Zusammensetzung ab und nennt Feld und beide Schichten.

### Muster 4: Feld-Präsenz statt Typ-Verzweigung

Was ein Modul zeigt, entscheidet, welche **Felder** ein Item hat, nie sein `type`. Ein Item mit `position` gehört auf die Karte, eines mit `start` in den Kalender, eines mit `status` ins Board. Ein `if (type === ...)` in Modul-Code ist verboten.

Die Richtung ist umgekehrt, als man erwartet: Nicht das Feld sucht ein Modul, sondern das **Modul erklärt**, welche Felder es darstellen kann (`presents`). So bringt eine App ihr eigenes Modul samt Feld mit, ohne dass das Toolkit davon weiß.

### Muster 5: Unbekanntes bleibt erhalten und fällt sichtbar zurück

Eine Modul-Id ohne Registereintrag ist kein Fehler: Sie stammt aus einer anderen Version oder einer anderen App. Sie **bleibt erhalten** und wird **nicht dargestellt**. Ein unbekannter Item-Typ fällt auf eine schlichte Darstellung zurück, nie auf eine leere Fläche.

Das ist die Regel, die Erweiterbarkeit erst möglich macht. Wer sie bricht, bestraft jeden, der etwas Eigenes baut.

### Muster 6: Die Spec gewinnt

Widersprechen Code und Spec einander, ist das ein Fehler in einem von beiden, nie ein Grund weiterzumachen. Neue Regeln entstehen nicht stillschweigend in Code, Hooks oder Konzeptpapieren.

---

## Teil 3: Wie wir erweitern

Sieben Regeln für alles, was wir ab jetzt bauen.

1. **Erst definieren, dann bauen.** Eine neue Sache bekommt einen Abschnitt in dieser Datei, bevor sie Code wird. Der Abschnitt beantwortet: Welche Frage beantwortet das? Wo ist die eine Quelle? Welche Schicht hält was? Was passiert bei Unbekanntem?
2. **Wir erfinden kein zweites Register für eine Frage, die Anton schon beantwortet.** Wir ergänzen seine Register über Fragmente, oder wir eröffnen ein Register für eine Frage, die er ausdrücklich offen lässt.
3. **Nichts wird hart verdrahtet, was eine Instanz unterscheiden kann.** Namen, Arten, Farben, Domains, Felder: alles kommt aus Daten oder aus Laufzeit-Konfiguration ([Spec 11](spec/11-runtime-config-und-branding.md)). Eine Liste im Code, die in einer anderen Instanz anders aussehen müsste, ist ein Fehler.
4. **Was ein Mensch eingibt, steht in `data`.** Die obersten Felder eines Item gehören dem Core. Dasselbe gilt für `Group.data`.
5. **Keine Bewertungen.** Keine Punkte, keine Sterne, keine Ranglisten, keine Passungszahl. Wo ein Vergleich nötig ist, nennen wir **Gründe**, und der Mensch entscheidet. Das ist eine Entscheidung über das Produkt, keine über die Technik, und sie steht hier, weil sie sonst im Code verloren geht.
6. **Ein Prototyp zeigt echte Daten.** Musterdaten kommen aus dem, was wirklich angelegt wurde. Erfundene Beispiele gehören in Konzeptpapiere, nicht in die laufende App.
7. **Was wir ändern, bekommt einen Test.** Nicht für alles, aber für jede Regel, die eine Liste betrifft. Genau dort laufen Dinge auseinander.

---

## Teil 4: Was wir gebaut haben

Nachgetragen, damit es eine Definition hat und nicht nur Code ist.

### 4.1 Netzwerk und Art

**Frage:** Wie gehören Spaces zusammen, ohne dass ein Space einem anderen untergeordnet wird?

Ein Space kann ein **Netzwerk** sein. Ein Netzwerk trägt die **Arten**, in denen seine Spaces geführt werden. Jeder andere Space wählt sein Netzwerk und darin seine Art. Ein Space kann beides zugleich sein: die Lichtung ist ein Projekt im Netzwerk trustdonation und selbst ein Netzwerk mit den Arten Ort und Gruppe.

| Feld in `Group.data` | Form | Bedeutung |
|---|---|---|
| `isNetwork` | `true` oder fehlt | Dieser Space ist ein Netzwerk |
| `spaceKinds` | Liste von `{id, label, labelPlural, color?}` | die Arten dieses Netzwerks |
| `network` | Space-Id | zu welchem Netzwerk dieser Space gehört |
| `kind` | Arten-Id | als was er dort geführt wird |
| `domain` | Text | unter welcher Domain die Landingpage liegt |

Regeln:

1. Die Gliederung ist **Darstellung**. Sie ändert weder Routing noch Rechte noch Sichtbarkeit noch Module. Das steht so in [Spec 01](spec/01-app-composition.md) und gilt unverändert.
2. Ein Space ist **nie sein eigenes Netzwerk**. Die Auswahl zeigt darum immer die anderen.
3. Eine `kind`, die im gewählten Netzwerk nicht vorkommt, ist **kein Fehler** (Muster 5): Sie bleibt erhalten und der Space steht unter „Gruppen".
4. Arten-Ids sind ASCII (`[a-z0-9-]{1,32}`) und werden **einmal** beim Anlegen aus dem Namen gebildet. Beim Umbenennen bleibt die Id, sonst verlieren Spaces ihre Zuordnung.

**Wo es geschrieben wird:** allein im Space-Dialog, Bereich **Netzwerk**. Eine zweite Schreibstelle wäre eine zweite Wahrheit.

### 4.2 Landingpage

**Frage:** Wie kommt ein Mensch von der Webseite eines Netzwerks in das Netzwerk?

Ein Netzwerk trägt seine `domain` und daraus gebaut einen Link. Beides steht im Space-Dialog im Bereich **Landingpage**, getrennt vom Bereich Netzwerk, weil beide Bereiche sonst zu lang für ein Fenster werden.

Regeln:

1. Der Bereich erscheint **nur für Netzwerke**. Ohne Netzwerk gibt es nichts zu verlinken.
2. `domain` ist **Auskunft, keine Wirkung**. Die App leitet nichts um und prüft nichts. Wer die Domain ändert, ändert den Text und den Link, sonst nichts.
3. Der Link zeigt auf den Space in dieser Instanz. Er wird **gebaut, nicht gespeichert**: ein gespeicherter Link wäre nach einem Umzug falsch.

### 4.3 Bereiche des Space-Dialogs

Die Frage „welche Bereiche hat die Space-Konfiguration" hat **eine** Quelle: `spaceConfigSections` im Toolkit. Menü, Inhalt und Startwert lesen daraus. Der Prototyp führt sechs Bereiche:

| Bereich | Bedingung | Inhalt |
|---|---|---|
| Mitglieder | immer | wer dabei ist |
| Einladen | wenn die App Einladen anbietet | wen man dazuholt |
| Aussehen | für Admins | Farbe, Tönung, Rundung, Flächen, Bild |
| Module | für Admins | welche Module dieser Space führt |
| Netzwerk | für Admins | Netzwerk-Schalter, Arten, Zugehörigkeit |
| Landingpage | für Admins **und** wenn der Space ein Netzwerk ist | Domain und Link |

Regel: Ein neuer Bereich wird **in dieser Funktion** eingeführt und nirgends sonst. Der Zähler-Satz (`sectionCounts`) und die Inhalts-Blöcke hängen an denselben Ids.

---

## Teil 5: Die Lücken

Was unser Vorhaben braucht und in Antons Spec bewusst offen ist.

| Lücke | Was fehlt | Antons Stand |
|---|---|---|
| **Felder je Art** | Eine Stiftung trägt andere Angaben als ein Projekt. `spaceKinds` trägt heute nur Name und Farbe. | offen |
| **Feld-Register** | Ein neues Feld erscheint heute nur, wenn jemand Code schreibt, der es kennt. | Typ-Register deckt Item-Typen, nicht einzelne Felder |
| **Baukasten** | Wie ein Baustein angeboten, gefunden und in eine Instanz genommen wird. | ausdrücklich offen: „Ein späteres Plugin-Konzept wäre eine eigene Sache mit eigenen Regeln" ([Spec 01, Regel 4](spec/01-app-composition.md)) |
| **Profil eines Space** | [Spec 12](spec/12-profile.md) definiert das Profil eines **Menschen**. Ein Stiftungsprofil ist ein Space. | offen |
| **Matching** | Wie ein Vorschlag entsteht und wie er begründet wird. | nicht Gegenstand der Spec |
| **Angebot und Bedarf** | `docs/modules/marketplace.md` hält zwei Sätze. | früher Brainstorm |
| **Ohne Anmeldung lesen** | Der Stack kennt keinen Leser ohne Identität. Eine Stiftung soll die Karte sehen, bevor sie zwölf Wörter aufschreibt. Siehe Teil 12 und `anwendungsfaelle/01-oeffentlich-lesen.md`. | „Jeder (öffentlich)" steht in `concepts/access-control.md` als Wunsch, ohne Code. [Spec 09](spec/09-mirror-bridge.md) Invariante 9 zieht die Grenze. |

Was **nicht** fehlt und was wir darum nicht neu bauen: Items, Relations, Tags, Vokabulare, Bestaetigungen, Vertrauen, Spiegel, Aktivitätslog, Laufzeit-Konfiguration, Modul-Register, Typ-Register.

---

## Teil 6: Eine Art trägt Felder

**Frage, die dieser Abschnitt beantwortet:** Was folgt daraus, dass ein Space als Stiftung geführt wird?

Heute folgt daraus eine Überschrift im Umschalter. Künftig folgt daraus auch, **welche Angaben der Space trägt**: eine Stiftung hat Förderschwerpunkte, einen Förderrahmen und einen Antragsweg; ein Projekt hat ein Vorhaben und Bedarfe.

Die Lösung folgt Muster 2 und Muster 4: Eine Art **bindet Vokabulare**, sonst nichts.

### Eintrag

`spaceKinds` wächst additiv um ein Feld:

| Feld | Form | Zweck |
|---|---|---|
| `id` | `[a-z0-9-]{1,32}` | stabile Identität, bleibt beim Umbenennen |
| `label` | Text | Anzeigename, Einzahl |
| `labelPlural` | Text | Anzeigename, Mehrzahl |
| `color` | `#rrggbb` | Akzent |
| `vocab` | Liste von Vokabular-URLs | welche Felder ein Space dieser Art trägt |

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

1. Die Art **bindet nur**. Sie trägt keine Darstellung, keine Reihenfolge der Felder, keine Pflichtangaben. Darstellung kommt aus dem Feld-Register (Teil 7).
2. Die Felder selbst leben in **`Group.data`**, flach, benannt wie im Vokabular. Was ein Mensch eingibt, steht in `data` (Teil 3, Regel 4).
3. Eine Art **ohne** `vocab` bleibt gültig. Sie trägt dann nur Name und Farbe, genau wie heute. Die Erweiterung ist additiv (Muster 3).
4. Ein **unbekanntes Vokabular** wird übergangen, der Space bleibt bedienbar (Muster 5). Ein Tippfehler in einer Art darf keinem Netzwerk seine Spaces nehmen.
5. Aendert ein Netzwerk die `vocab` einer Art, **verlieren bestehende Spaces nichts**. Felder, die kein aktives Vokabular mehr kennt, bleiben in `data` stehen und werden nicht angezeigt.
6. Wer die Arten eines Netzwerks setzt, setzt damit die Felder seiner Spaces. Das ist Admin-Sache und steht im Bereich **Netzwerk**.

### Woher die Vokabulare kommen

Neue Vokabulare entstehen wie Antons (`docs/spec/schemas/vocab/<name>/v1/`): ein `context.jsonld`, ein `schema.json`, Beispiele unter `examples/valid/`. Die CI validiert sie bereits. Wir brauchen zunächst:

| Vokabular | Für | Felder, erste Fassung |
|---|---|---|
| `foundation/v1` | Stiftungen | `foerderschwerpunkte` (Tags), `foerderrahmen` (`{min, max, waehrung}`), `antragsweg` (Text), `antragsfrist` (Text oder Datum), `zustiftung` (ja/nein), `quelle` (URL) |
| `initiative/v1` | Projekte | `vorhaben` (Text), `beginn` (Datum), `wirkungsraum` (Text), `traeger` (Text) |
| `need/v1` | Bedarfe | `worum` (Text), `umfang` (`{betrag, waehrung}` oder Text), `bis` (Datum), `art` (Sache, Geld, Zeit, Wissen) |

Jedes davon bekommt vor dem Bau einen eigenen Abschnitt hier, nach demselben Raster.

---

### Der Marker einer Art (01.10.2026)

**Frage:** Was folgt auf der Karte daraus, dass ein Eintrag zu einer Art gehört?

Timo: *"Für Stiftungen ein schönes Icon im Pin. Die Projekte hätte ich gern rund … alle Marker sollen Icons haben."* Man erkennt die Art auf einen Blick.

| Art | Form | Symbol | Farbe | Quelle |
|---|---|---|---|---|
| Stiftung (`place` mit Profil) | Stecknadel | `hands` | ihr eigenes Blau `data.color` | Felder der Musterdaten, `data.icon` |
| Projekt (`project`) | `round` | `sprout` | `#2E7D5B` | Vorgabe der Art (`marker`) in `type-register.tsx` |
| Mensch | eckig (`square`) | `person` | offen | kommt |

Regeln: Die eine Quelle ist das Feld `marker` der Typ-Darstellung (Naht A-Marker, Wunsch an Anton). Was ein Eintrag selbst trägt (`data.color`, `data.icon`), gewinnt. Eine Art ohne Vorgabe fällt auf Antons Regel zurück (Farbe aus Schlagwort oder Space, Symbol aus dem ersten Schlagwort). Der Marker trägt keine Bewertung und keine Rechte.

## Teil 7: Das Feld-Register

**Frage, die dieser Abschnitt beantwortet:** Was folgt daraus, dass ein Datensatz dieses Feld trägt?

Antons Typ-Register beantwortet die Frage für ganze **Item-Typen**. Für einzelne Felder gibt es sie nicht: Ein neues Feld erscheint heute erst, wenn jemand eine Komponente schreibt, die es kennt, und diese Komponente steht dann an genau einer Fläche. Genau so entstehen die Listen, die auseinanderlaufen.

### Zwei Schichten

| Schicht | Paket | hält |
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
| `short` | Darstellung | Kurzform für Karten und Zeilen |

### Regeln

1. Jede Fläche, die ein Feld eingibt oder anzeigt, holt ihre Bausteine **aus dem Register**. Kein `if (feld === ...)` in einer Fläche.
2. Ein Feld **ohne** Darstellungs-Eintrag fällt auf seine `shape` zurück: ein Text wird als Text gezeigt, eine Zahl als Zahl (Muster 5). Nie leer, nie kaputt.
3. Das Register **trägt keine Pflicht und kein Recht**. Ob ein Feld ausgefüllt sein muss, sagt das JSON-Schema des Vokabulars. Ob jemand es ändern darf, sagt die Autorisierung.
4. Das Register gilt für **Item-Felder und Space-Felder gleichermaßen**. Ein `foerderrahmen` sieht im Stiftungs-Space so aus wie in einem Item, das ihn nennt. Zwei Darstellungen desselben Feldes wären zwei Wahrheiten.
5. Es wird wie die anderen Register zusammengesetzt: **Core, App, Space**, additiv, Konflikt statt Shadowing (Muster 3).
6. `shape` ist eine **geschlossene Liste**. Eine neue Form kommt nur mit einem Abschnitt in dieser Datei dazu. Sonst wird `shape` zu einem zweiten Typsystem neben JSON-Schema.

### Verhältnis zum Typ-Register

Das Typ-Register sagt, **welche Felder** ein Typ mitbringt (über die Vokabular-Bindung) und wie eine ganze Karte aussieht. Das Feld-Register sagt, **wie ein einzelnes Feld** aussieht. Das Typ-Register bleibt die Quelle für Typ-Identität; das Feld-Register führt keine Typen ein.

---

## Teil 8: Erweiterungen

**Frage, die dieser Abschnitt beantwortet:** Was folgt daraus, dass es für einen Space eine Erweiterung gibt?

**Berichtigt am 01.10.2026.** Bis dahin hieß dieser Teil „Der Baukasten“, mit einer eigenen Fläche als Modul oben im Menü. Timo: *"Wir haben so etwas gebaut wie ein Baukastenmodul. Das ist vollkommen Quatsch und funktioniert auch nicht."* Wir bauen nichts, wir **wählen aus**. Der Name dafür ist **Erweiterungen** (Timo, 01.10.2026: *"da ja nicht nur Module drin sein werden, sondern auch fertige Komponenten und Themes"*). Das Modul `baukasten` und seine Fläche sind entfernt; die Recherche im Instanz-Repo unter `baukasten/` bleibt als Material liegen.

| Wort | Wofür es bei uns steht |
|---|---|
| **Erweiterung** | was ein Space dazunehmen kann: ein Modul, später eine fertige Komponente (etwa ein ganzes Profil), ein Theme |
| **Marktplatz** | wo Menschen einander Angebot und Bedarf zeigen. Siehe Teil 5, Lücke „Angebot und Bedarf" |

Eine Erweiterung ist Werkzeug. Ein Angebot ist ein Anliegen. Wer beides denselben Namen gibt, verwechselt sie später im Code.

### Arten von Erweiterungen

| Art | Was | Stand |
|---|---|---|
| **Module** | Flächen im Space: Feed, Kalender, Karte, Circeling | gebaut |
| **Komponenten** | fertige Teile, die man ganz nimmt, nicht zusammensetzt: ein Profil, eine Landingpage | erste gebaut: **Project Profile** |
| **Themes** | das Aussehen eines Space | kommt |

Timo: *"Nicht einzelnes Baukastensystem, sondern wir bauen komplette Profile."*

### Reife: geprüft oder Beta

Jede Erweiterung steht in genau einem von zwei Reitern.

| Reife | Bedeutet |
|---|---|
| **geprüft** | durch das große Testing gegangen und von den Entwicklern freigegeben |
| **Beta** | läuft, ist aber noch nicht freigegeben. Circeling steht hier, bis es durch das Testing ist |

Reife ist **keine Bewertung**. Sie sagt, ob die Freigabe erfolgt ist, nicht, wie gut etwas ist. Keine Sterne, keine Rangliste (Teil 3, Regel 2).

### Die Übersicht

**Frage:** Wo sieht ein Mensch, welche Erweiterungen es gibt, und nimmt eine in seinen Space?

Timo und Anton am 01.10.2026: Die Übersicht ist kein Reiter oben im Menü. Sie öffnet sich aus der Modul-Auswahl eines Space, über einen Knopf, und zeigt alles groß, über den ganzen Bildschirm: *"nicht alle da reinpacken, das wird viel zu eng."* Jede Erweiterung als Karte mit Symbol, Name, Beschreibung und klein dem Erbauer.

**Der Haken:** Antons App-Abschnitte im Space-Dialog (`AppSpaceSection`, `GroupDialog appSections`, rls#551). Unsere App trägt den Abschnitt **Erweiterungen** ein. Er zeigt kurz, was es gibt, und den Knopf zur Übersicht. Geschrieben wird über `patchData({ modules })` nach `Group.data.modules`, Antons vorgesehener Weg. Keine Naht.

### Eintrag

| Feld | Schicht | Zweck |
|---|---|---|
| `id` | Antons Modul-Register | die eine Quelle dafür, **welche** Module es gibt |
| `label`, `icon` | Antons Modul-Register | Name und Symbol, wie überall in der App |
| `beschreibung` | `td-core`, Verzeichnis `erweiterungen.ts` | ein bis zwei Sätze, wofür es da ist |
| `erbauer` | `td-core`, Verzeichnis | wer es gebaut hat, klein gezeigt |
| `reife` | `td-core`, Verzeichnis | `geprueft` oder `beta` |
| `art` | `td-core`, Verzeichnis | `modul`, `komponente`; später `theme` |
| `fuerTyp` | `td-core`, Verzeichnis | bei einer Komponente: der Typ, den sie darstellt |

### Regeln

1. **Welche Module es gibt, sagt allein Antons Register** (`getModules()`). Das Verzeichnis in `td-core` zählt keine Module auf, es **ergänzt** Einträge um Beschreibung, Erbauer und Reife, verschlüsselt über die Modul-Id.
2. **Ein Modul ohne Eintrag im Verzeichnis erscheint trotzdem**, als Beta, ohne Beschreibung und mit „Erbauer unbekannt“. Nie wegfallen, nie leer (Muster 5).
3. **Ein Eintrag im Verzeichnis ohne Modul im Register erscheint nicht.** Er beschreibt etwas, das diese Instanz nicht führt. Ein Test hält beide Richtungen fest.
4. **Ein Space verliert nichts:** Eine Id in `Group.data.modules`, die die Instanz nicht kennt, bleibt beim Schreiben stehen.
5. **Wer darf:** wie Antons Modul-Auswahl, `canEdit` aus dem Abschnitt-Kontext. Wer nicht darf, sieht die Übersicht und kann nichts ändern.
6. **Was die Übersicht nicht trägt:** keine Bewertungen, keine Bezahlung, kein Nachladen von Code zur Laufzeit, keine Rechte. Sie wählt aus, was die Instanz schon mitbringt.
7. **Wunsch an Anton:** `description` und `author` als Felder im Modul-Register. Dann wandern Beschreibung und Erbauer aus unserem Verzeichnis zu ihm, und nur die Reife bleibt bei uns.

### Was ein Modul als Erweiterung ist

Antons Spec lässt das ausdrücklich offen und sagt zugleich, was **nicht** geht: Das Modul-Register wird vor dem ersten Render einmal zusammengesetzt und eingefroren. Ein Space wählt aus dem Katalog, er trägt nichts bei. Eine Übersicht, die zur Laufzeit fremden Code nachlädt, wäre ein Bruch dieser Regel und ein offenes Tor dazu.

Darum zwei Stufen, und die erste kommt ohne fremden Code aus.

#### Was ein Modul-Eintrag ist

**Ein Item, kein Code.** Wer ein Modul anbietet, veröffentlicht ein Item vom Typ `module` in einem Netzwerk. Es trägt:

| Feld in `data` | Zweck |
|---|---|
| `moduleId` | die Id, die in `Group.data.modules` landet |
| `name` | Anzeigename |
| `zweck` | wofür das Modul da ist, in Sätzen |
| `art` | `daten` oder `code` |
| `presents` | welche Felder es darstellt |
| `felder` | bei `art: "daten"`: die Feld-Ids, aus denen es besteht |
| `ansicht` | bei `art: "daten"`: `liste`, `karten`, `karte`, `kalender`, `board` |
| `herkunft` | wer es gebaut hat, als Relation auf einen Space oder ein Profil |
| `bezug` | bei `art: "code"`: wo das Paket liegt |

#### Stufe 1: Datenmodule

Ein Datenmodul besteht aus **Feldern aus dem Feld-Register** und einer der vorhandenen Ansichten. Es braucht keine Zeile fremden Code.

Ablauf:

1. Jemand beschreibt sein Modul als Item und veröffentlicht es.
2. Eine Instanz, die es führen will, nimmt den Eintrag in ihre **App-Schicht** des Modul-Registers. Das geschieht beim Bau der Instanz, nicht zur Laufzeit: Antons Regel 3 bleibt unangetastet.
3. Ein Space dieser Instanz nimmt die `moduleId` in `Group.data.modules`.

Regeln:

1. Ein Datenmodul **führt keine neuen Feldformen ein**. Es setzt zusammen, was das Feld-Register kennt. Wer eine neue Form braucht, erweitert das Feld-Register, und das ist ein eigener Schritt mit einem eigenen Abschnitt.
2. Ein Datenmodul **führt keine Typ-Verzweigung**. Es zeigt, was seine Felder tragen (Muster 4).
3. Eine Instanz, die den Eintrag **nicht** hat, lässt die Id in `Group.data.modules` stehen und zeigt sie nicht (Muster 5). Ein Space verliert sein Modul nicht, weil er gerade in einer anderen App geöffnet wird.

#### Stufe 2: Codemodule

Später und mit eigenen Regeln. Was jetzt schon feststeht:

1. Ein Codemodul kommt als **Paket mit Version**, nie als Quelltext zur Laufzeit.
2. Es wird **signiert**, und die Signatur hängt an einer Identität im Web of Trust. Wer ein Modul in seine Instanz nimmt, sieht, von wem es kommt.
3. Es wird beim **Bau der Instanz** eingebunden. Nachladen zur Laufzeit ist kein Ziel.
4. Bis dahin ist der Weg für ein Codemodul derselbe wie heute: ein Pull Request.


### Was eine Komponente ist

**Frage:** Was folgt daraus, dass ein Space eine Komponente gewählt hat?

Timo am 01.10.2026: *"Ein richtig cooles Projektprofil … mit Kontaktdaten … ein Spendenbereich, der über Open Collective läuft … Und das wird unsere erste Komponente, die wir fertig designen, die du auswählen kannst und die dann integriert werden kann. Und dann bauen wir verschiedene Profilmodelle, auch für Stiftungen."*

Eine Komponente ist **eine fertige Darstellung für einen Typ**. Ein Modul ist eine Fläche im Space; eine Komponente bestimmt, wie ein Eintrag aussieht, wenn man ihn öffnet.

| | |
|---|---|
| **Wo sie steht** | im Verzeichnis `td-core/erweiterungen.ts`, Art `komponente`, mit `fuerTyp` |
| **Wo die Wahl liegt** | `Group.data.komponenten`, eine Liste von Ids, geschrieben über `patchData` |
| **Wie sie andockt** | als eigene Darstellungsschicht im Typ-Register (`registerTypePresentation`, Slot `detail`). Keine Naht |
| **Wann sie greift** | der Space, in dem man gerade ist, hat sie gewählt, **und** der Eintrag trägt ihre Felder |
| **Sonst** | die Darstellung aus Antons Feld-Register, unverändert |

Regeln:

1. **Eine Komponente ersetzt keine Daten.** Sie zeigt, was der Eintrag trägt. Abwählen lässt jede Angabe stehen.
2. **Was fehlt, erscheint nicht.** Ein Abschnitt ohne Angabe fällt weg, kein Strich, kein „unbekannt“ (Teil 9).
3. **Ids, die die Instanz nicht kennt, bleiben** in `Group.data.komponenten` stehen (wie Regel 4 oben).
4. **Nachgeladen**, erst wenn ein Eintrag sie braucht. Wer nie ein Projekt öffnet, lädt sie nie.

#### Project Profile (`projekt-profil`, für `project`)

Die Seite, mit der sich ein Projekt einer Stiftung und Spendenden zeigt. Reihenfolge, wie ein Besucher liest:

| Abschnitt | Frage | Felder in `data` |
|---|---|---|
| **Kopf** | Was ist das? | `bilder` (erstes ist das Titelbild), `kurz`, `tags`, `address`, `zeitraum` |
| **Kennzahlen** | Wie groß ist das? | `kennzahlen [{ wert, was }]`, höchstens vier |
| **Unterstützen** | Wie kann ich helfen? | `spende { ziel, gesammelt, unterstuetzende, opencollective, beispiel, stufen [{ betrag, bewirkt }] }` |
| **Was fehlt** | Warum braucht es das? | `beduerfnis` (eine Lücke, kein Selbstbild) |
| **Worum es geht** | Was passiert da? | `description` |
| **Was sich ändert** | Was bewirkt es? | `wirkung` (Liste) |
| **Wohin das Geld geht** | Wofür genau? | `bedarfe [{ wofuer, betrag }]` |
| **Schritte** | Wo steht es? | `schritte [{ titel, wann, erledigt }]` |
| **Wer dahinter steht** | Mit wem habe ich es zu tun? | `team [{ name, rolle }]` |
| **Kontakt** | An wen wende ich mich? | `kontakt { person, rolle, mail, telefon, website }`, `address` |
| **Bilder** | Wie sieht es aus? | `bilder` ab dem zweiten |

**Zwei Ansichten, ein Guss** (Timo, 01.10.2026: *"ganz neue und unterschiedliche UX, die sich ähnlich anfühlen, jedoch vom Aufbau her verschieden sind"*). In Antons Detail-Leiste steht eine **Karte**: Titelbild, ein Satz, Spendenstand, Knopf, und „Ganzes Profil öffnen“. Die **ganze Ansicht** liegt über dem Bildschirm: großes Titelbild, Kennzahlen, die Geschichte als Bento-Raster, rechts eine mitlaufende Spendenkarte, auf dem Handy eine feste Spendenleiste unten. Vorbild sind Kampagnenseiten, die gerade gut funktionieren: Fortschritt sichtbar, Beträge mit ihrer Wirkung, der Knopf immer in Reichweite.

**Beträge mit Wirkung.** `spende.stufen` nennt Beträge und was jeder bewirkt („150 €: ein Hochbeet aus Lärchenholz“). Die Wahl führt zur Spendenseite bei Open Collective mit dem Betrag (`…/donate?amount=`).

**Spenden über Open Collective.** Der Knopf führt zur Seite des Projekts bei Open Collective, dort läuft das Geld. Den Stand (`gesammelt`, `unterstuetzende`) liest später ein Abruf bei Open Collective; bis dahin steht er im Eintrag. Trägt `spende.beispiel` den Wert `true`, steht sichtbar „Beispielzahlen“ daneben. Ohne `opencollective` steht der Knopf still mit „Spendenseite folgt“.

**Musterprojekt.** `muster: true` zeigt den Hinweis „Musterprojekt“. Das Musterprojekt in den Demodaten trägt Platzhalterbilder (gezeichnet, keine Fotos fremder Menschen) und erfundene Namen, sichtbar als Muster.

---

### Was die Erweiterungen nicht sind

Kein Laden, keine Bezahlung, keine Bewertungen, keine Rangliste. Wer etwas sucht, sieht, was es tut, wer es gebaut hat und ob es freigegeben ist.

Und sie sind **kein Marktplatz**: Dort zeigen Menschen einander, was sie brauchen und was sie geben können. Das ist ein Anliegen, kein Werkzeug, und es bekommt eine eigene Definition.

---

## Teil 9: Profile

**Frage:** Wo stehen die Angaben eines Menschen, und wo die einer Stiftung?

[Spec 12](spec/12-profile.md) beantwortet die erste Hälfte und bleibt unverändert gültig: Das Profil eines Menschen ist ein `person`-Item in seinem persönlichen Space, und in jeden Gruppen-Space, für den er es freigibt, geht ein Spiegel.

Die zweite Hälfte fehlt. Unsere Antwort:

**Das Profil einer Stiftung, eines Projekts oder eines Netzwerks ist der Space selbst.** Seine Angaben stehen in `Group.data`, nach den Vokabularen seiner Art (Teil 6). Ein zweites Profil-Item daneben wäre eine zweite Wahrheit.

Regeln:

1. Ein Mensch hat ein Profil-**Item**. Eine Einrichtung hat einen **Space**. Beide werden von demselben Feld-Register dargestellt (Teil 7, Regel 4), damit sie sich gleich anfühlen.
2. Wer den Space verwaltet, verwaltet sein Profil. Es gibt keine getrennte Rechteebene dafür.
3. Ein Space-Profil ist **so öffentlich wie der Space**. Antons Freigabe-Mechanik aus Spec 12 gilt für Menschen; ein Space regelt das über seine Sichtbarkeit.
4. Was eine Einrichtung über **sich** sagt, steht im Space. Was **andere** über sie sagen, sind Bestaetigungen ([Spec 05](spec/05-confirmations-and-trust.md)) und Relationen ([Spec 08](spec/08-relation-records.md)). Die beiden werden nie vermischt.

Daraus folgt der Satz, der auf der Landingpage steht: Ein Eintrag, den wir recherchiert haben, gehört der Einrichtung, sobald sie ihn übernimmt.

### Der Weg vom Eintrag zum Space

Ein recherchierter Eintrag ist **noch kein Space**. Er ist ein `place`-Item mit Position, Namen und dem, was öffentlich bekannt ist.

| | Eintrag | Space |
|---|---|---|
| Form | `place`-Item auf der Karte | Group mit `kind: "stiftung"` |
| Wer pflegt ihn | wir, aus öffentlicher Recherche | die Einrichtung selbst |
| Was er trägt | Name, Sitz, Schwerpunkte, Quelle | dazu Mitglieder, Module, Profil, eigene Inhalte |
| Wieviele | hunderte | so viele, wie übernommen haben |

**Warum nicht gleich Spaces:** Ein Space ist ein Arbeitsraum. 234 davon wären im Umschalter unbenutzbar, und keiner hätte ein Mitglied. Ein Punkt auf der Karte braucht keinen Arbeitsraum, er braucht einen Ort und einen Namen.

**Der Uebergang** ist der Moment, auf den das ganze Vorhaben zielt: Eine Stiftung sieht ihren Eintrag, erkennt sich wieder und übernimmt ihn. Aus dem Item wird ein Space, sie wird sein Admin, und ab da sagt sie selbst, was sie fördert. Der Eintrag verschwindet dann als Item und lebt als Space weiter.

---

## Teil 10: Matching

**Frage:** Wie entsteht ein Vorschlag, und woran erkennt ein Mensch, ob er taugt?

Das Fachliche steht in [trustdonation/docs/05-matching.md](https://github.com/lichtungooo/trustdonation/blob/main/docs/05-matching.md). Hier steht die Form.

**Ein Vorschlag ist ein Item vom Typ `match`.** Er trägt zwei Relationen auf die beiden Seiten und eine Liste von **Gründen**.

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

1. **Keine Zahl, kein Rang.** Ein Vorschlag hat Gründe oder er entsteht nicht. Eine Prozentzahl wäre eine Bewertung, und die gibt es hier nicht (Teil 3, Regel 5).
2. Ein Grund nennt immer das **Feld**, auf dem er beruht, und was auf beiden Seiten steht. Ein Mensch muss ihn nachprüfen können, ohne uns zu fragen.
3. Die Arten von Gründen sind eine **geschlossene Liste**: `ueberschneidung` (gemeinsame Werte), `naehe` (Ort), `rahmen` (Betrag passt in eine Spanne), `zeit` (Frist passt zum Vorhaben), `mensch` (jemand kennt beide Seiten).
4. Ein Vorschlag ist **eine Vermutung, keine Zusage**. Er wird angezeigt, bis eine Seite ihn annimmt oder verwirft. Angenommen wird er zu einer Relation zwischen den beiden Seiten; verworfen verschwindet er und kommt aus demselben Grund nicht wieder.
5. Wer keine Vorschläge will, bekommt keine. Die Mechanik ist ein Angebot, kein Zustand.

---

## Teil 11: Wie wir arbeiten

1. **Eine Sache kommt zuerst hierher.** Ein Abschnitt mit: welche Frage, wo die eine Quelle, welche Schicht hält was, was bei Unbekanntem passiert.
2. **Dann ein Test für die Regel**, die eine Liste betrifft.
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

---

## Teil 12: Wer ohne Anmeldung sehen darf

Timo am 17.09.2026: *"Du kannst keine Daten öffentlich sehen. Wenn du auf die Karte klickst oder wenn du App anschauen klickst, dann müssten erst die Daten angezeigt werden und dann kann ich mich anmelden, damit ich da im Web of Trust interagieren kann."*

Er beschreibt die Reihenfolge, die jede Stiftung erwartet: **erst sehen, dann entscheiden.** Wer eine Anmeldung vor die Karte stellt, verliert den Besucher, bevor er verstanden hat, worum es geht.

### Was der Stack heute kennt

Der Stack kennt **keinen Leser ohne Identität**. Das ist kein Versehen, sondern eine Festlegung. Spec 09, Invariante 9:

> Die Bridge ist Mitglied beider Spaces und verschlüsselt für den Ziel-Space neu; Relay und Nicht-Mitglieder sehen weiterhin nur Ciphertext.

Ein Space ist Ende zu Ende verschlüsselt. Wer den Schlüssel nicht hat, sieht Rauschen. Das gilt für das Relay selbst, und darin liegt der Wert: Der Träger der Daten kann sie nicht lesen.

In `docs/concepts/access-control.md` steht "Jeder (öffentlich)" als Wunsch, ohne Code dahinter. Vier Stufen stehen dort, und die dritte ist die, die den Weg öffnet: **"Jeder mit link/secret/einladung"**.

### Die drei Wege, nach Kosten geordnet

**Weg 1: Die Beispielwelt.** Steht. `trustdonation.org/app` zeigt ohne Anmeldung 234 Stiftungen auf der Karte, aus dem local-Connector.

Es ist eine Kopie, kein Fenster. Was jemand im Web of Trust ändert, erscheint dort nie. Für den Pitch reicht es, und es hat den Vorteil, dass niemand versehentlich echte Daten sieht.

**Weg 2: Ein Space, dessen Schlüssel öffentlich ist.** Der kurze Weg zu echten Daten, und er bleibt innerhalb der Grenze.

Die Verschlüsselung bleibt, wie sie ist. Der Schlüssel des Space steht in der Adresse, wie bei einem geteilten Dokument. Der Besucher bekommt beim Öffnen eine wegwerfbare Identität und tritt als Leser bei. Den Code dafür gibt es schon: `authenticate("generate")` im wot-connector legt eine Identität ohne Passwort und ohne Speichern an.

Was der Besucher sieht, ist echt und lebt. Meldet er sich danach an, steht er mit seiner eigenen Identität da, und die Wegwerf-Identität verschwindet mit dem Tab.

Was daran zu klären bleibt:

| Frage | Warum sie zählt |
|---|---|
| Darf ein Leser schreiben? | Ein Space ohne Rollen macht jeden Besucher zum Autor |
| Was zeigt das Relay über Besucher? | Jede Wegwerf-Identität ist eine Verbindung mehr |
| Wie kommt der Schlüssel in die Adresse, ohne im Verlauf zu landen? | Ein Link im Browserverlauf ist ein Schlüssel im Browserverlauf |

Die erste Frage ist die harte: **Der Stack kennt keinen Leser-Rang.** Wer in einem Space ist, kann schreiben.

**Weg 3: Ein Veröffentlichungs-Dienst.** Die echte Öffentlichkeit, und Antons Baustelle.

Ein Brücken-Client liefert Mirror-Snapshots als offene Daten aus, so wie `profiles.web-of-trust.de` es für Profile tut. Ein Mirror ist bereits signiert statt verschlüsselt und bereits read-only, und er entsteht nur durch eine bewusste Freigabe. Die E2EE-Grenze bleibt darum unberührt: Veröffentlicht wird, was jemand veröffentlichen wollte.

Das trägt weiter als Weg 2: lesbar ohne jeden Client, von Suchmaschinen auffindbar, als Link teilbar. Eine Stiftung, die ihren Eintrag jemandem schicken will, braucht genau das.

### Was wir festlegen

1. **Weg 1 bleibt die Startseite.** `trustdonation.org/app` zeigt Beispieldaten und sagt es auch. Eine Stiftung soll die Karte sehen, bevor sie irgendetwas entscheidet.
2. **Weg 2 bauen wir, sobald der Leser-Rang steht.** Ohne ihn öffnet ein öffentlicher Schlüssel den Space für jeden Schreiber, und dann bleibt von den Daten nichts übrig.
3. **Weg 3 formulieren wir als Anwendungsfall für Anton**, nicht als Code. Er gehört in den Stack, und er berührt die Spec.
4. **Kein eigener Leseweg an Antons Verschlüsselung vorbei.** Die Grenze zum Protokoll gilt weiter (siehe `ARCHITEKTUR.md`). Wer hier abkürzt, baut eine zweite Wahrheit über die Sichtbarkeit, und die verliert gegen seine.

### Die Reihenfolge, die Timo beschreibt

Was unabhängig von allen drei Wegen gilt und heute schon gebaut werden kann:

**Anmelden gehört ans Ende, nicht an den Anfang.** Wer die Karte öffnet, sieht die Karte. Der Knopf zum Anmelden steht dort, wo er gebraucht wird: an der Stelle, an der jemand etwas beitragen will.

---

## Teil 13: Der Companion

**Frage:** Wie bekommt ein Mensch im Space eine Begleitung, die seine Sachen kennt, ohne dass die Instanz eine Rechnung dafür aufmacht?

Der Companion ist das erste Modul einer Familie. Er hängt eine AI an den Menschen im Space und stellt ihr Werkzeuge in die Hand. Vorlage ist das Modul in `lichtungooo/rln`, `src/modules/companion/` (1622 Zeilen); hier entsteht es neu im Sprachgebrauch des Stacks.

### 13.1 Was ihn vom Vorbild unterscheidet

| | RLN-Vorbild | Hier |
|---|---|---|
| Daten | Wissensfeld des Spaces | `useItems()` aus dem Toolkit |
| Einbringung | HumHub-Modul | Registerschicht `trustdonation`, Fläche in `td-ui` |
| Schlüssel | `localStorage` je Space | ebenso, **und ausdrücklich befristet**, siehe 13.4 |

### 13.2 Der Registereintrag

Eine Zeile in der vorhandenen Schicht `trustdonation` in `apps/reference/src/module-register.tsx`. Die Naht dort steht schon im Register (`NAEHTE.md`, Zeile 124) und ist als Erweiterungspunkt gedacht.

| Feld | Wert | Grund |
|---|---|---|
| `id` | `companion` | ASCII, zugleich URL-Segment |
| `label` | Begleitung | Anzeigename |
| `icon` | `Sparkles` | |
| `enabledByDefault` | `false` | Ein neuer Space bekommt ihn nicht ungefragt |
| `maxWidth` | `max-w-3xl` | Ein Gespräch liest sich schmal besser |
| `presents` | **leer** | Der Companion stellt **kein** Item-Feld dar |

`presents` leer zu lassen ist eine Aussage, keine Auslassung: Der Companion ist keine Sicht auf Items. Er liest sie, er zeigt sie nicht. Wer ihn in die Feld-Präsenz hängt, macht ihn zur Karte für ein Feld, das es nicht gibt.

### 13.3 Was er liest, und was nicht

Er liest über `useItems()` die Items des aktiven Space. Er verzweigt **nie** über `type` (Muster 4): Ein Werkzeug fragt nach Feldern, nicht nach Art.

**Lesend im ersten Schritt.** Kein Werkzeug schreibt. Der Grund steht in Teil 11 und in der Erfahrung des 18.09.2026: Ein Agent, der keinen Weg hat, denkt sich einen aus. Ein schreibendes Werkzeug bekommt erst dann einen Platz, wenn die Freigabe etwas verlangt, das der Agent nicht hat.

### 13.4 ⚠ Woher das Modell kommt, ist offen

Heute ruft das Vorbild `api.anthropic.com` unmittelbar aus dem Browser, mit dem Schlüssel des Nutzers im `localStorage`. Das trägt für einen Prototypen und **nicht für eine Instanz**:

1. Ein Schlüssel im `localStorage` ist ein Schlüssel in fremder Hand. Jedes Skript auf der Seite liest ihn.
2. Jeder Nutzer bräuchte einen eigenen Schlüssel und eine eigene Rechnung.
3. Timos Bedingung vom 18.09.2026 gilt für alles, was wir betreiben: *"Es soll gar nichts Geld kosten. Keine API."*

**Darum steht die Fläche zuerst ohne Modell.** Sie zeigt, was der Companion weiß und welche Werkzeuge er hat, und sie sagt offen, dass die Anbindung fehlt. Das ist ehrlicher als ein Eingabefeld für einen Schlüssel, den niemand dort ablegen sollte.

Drei Wege stehen offen, und die Wahl gehört Timo und Anton:

| Weg | Was er kostet | Was er verlangt |
|---|---|---|
| Schlüssel je Nutzer im Browser | nichts für die Instanz | jeder Nutzer einen eigenen Schlüssel; der Schlüssel liegt unsicher |
| Ein Dienst der Instanz | je Aufruf | ein Schlüssel der Instanz, eine Grenze je Nutzer |
| MCP-Server je Space | nichts, wenn der Nutzer seinen eigenen Agenten mitbringt | einen Weg, einen MCP-Server im Space zu nennen |

Der dritte ist der, der zum Rest passt: Der Werkzeug-Vertrag steht schon als Register, und ein Space, der einen MCP-Server nennen kann, bringt jede App ihre Werkzeuge selbst mit. Dasselbe Muster wie `presents` bei den Modulen.

### 13.5 Regeln

1. Der Companion ist **eine** Fläche und trägt **eine** Werkzeug-Liste. Eine zweite Aufzählung von Werkzeugen ist ein Fehler (Muster 1).
2. Ein Werkzeug ohne Beschreibung erscheint nicht. Was ein Mensch nicht lesen kann, gibt er nicht frei.
3. Eine fehlende Anbindung **degradiert sichtbar**: Die Fläche steht, das Gespräch fehlt, und sie sagt warum. Nie eine leere Fläche, nie ein Fehler.
4. Der Schlüssel, wenn einer kommt, steht **nicht** im Quelltext und **nicht** in den Musterdaten.
5. Kein `did:key`, kein JWS, kein Yjs. Die Grenze gilt hier wie überall.

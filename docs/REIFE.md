# Reife

**Stand:** 17.09.2026
**Frage:** Was fehlt, damit trustdonation ein Projekt ist, das man ohne Bauchschmerzen einer Stiftung zeigt und über Jahre weiterbaut?

Diese Datei ist die ehrliche Liste. Sie wird nicht schoengeschrieben, und sie wird bei jeder Runde nachgezogen.

---

## Was steht

| | |
|---|---|
| **Definition** | `DEFINITION.md`, elf Teile, Antons Muster übernommen |
| **Architektur** | `ARCHITEKTUR.md`, Haken, Paketschnitt, Naht-Regeln, Grenze zum Protokoll |
| **Naht-Register** | `NAEHTE.md`, alle 27 Stellen benannt, maschinell geprüft |
| **Plan** | `PLAN.md`, fünf Etappen mit vorführbarem Ende |
| **Werkzeuge** | `td-tools/anton-stand.py` (Schnittstelle zu Anton, samt seinen offenen PRs), `td-tools/pruefen.py` (sechs Tore) |
| **Skills** | fünfzehn in zwei Plugins, versioniert in `lichtungooo/trustdonation` |
| **Gedächtnis** | Stand, Architektur, vier Erfahrungen, Forge-Eintrag |
| **Der Prototyp** | live, mit Timos echten Spaces, ohne Login sichtbar |
| **Betrieb** | Wacht von außen, Sicherung gerechnet, Impressum und Datenschutz live |
| **Entscheidungen** | `ENTSCHEIDUNGEN.md`, neun Einträge mit Verfallsbedingung |
| **Einstieg** | `EINSTIEG.md`, eine halbe Stunde bis zum laufenden Stand |

---

## Erledigt am 17.09.2026

| Punkt | Was jetzt steht |
|---|---|
| **Tore laufen von selbst** | `.github/workflows/trustdonation-tore.yml` fährt Typen, Regeln und `pruefen.py` bei jedem Push auf den Prototyp-Branch |
| **Blick auf die laufende App** | `.github/workflows/wacht.yml` im Instanz-Repo prüft alle fünfzehn Minuten **von außen** Landing, App und `config.json`. Bei einer Störung ein Issue, bei Entwarnung geschlossen. Dazu `scripts/wacht.sh` für den Blick von innen auf den Container |
| **Impressum und Datenschutz** | `/recht/` ist live. Was nur Timo weiß, steht als sichtbare Lücke darin. Dabei gefunden: die Fußleiste nannte einen Verein, den es noch nicht gibt |
| **Sicherung** | Gerechnet statt vermutet: Landing, Konfiguration und Compose liegen in Git, Images sind neu baubar, Nutzerdaten liegen bei den Menschen. Uebrig bleibt die `.env` mit acht Zeilen. `scripts/sichern.sh` sichert sie, und der Wiederaufbau dauert unter einer Stunde. Steht in `trustdonation/docs/09-betrieb.md` |
| **Entscheidungen** | `ENTSCHEIDUNGEN.md`, neun Einträge nachgetragen, jeder mit verworfenen Alternativen und einer Verfallsbedingung |
| **Einstieg für Dritte** | `EINSTIEG.md`: in einer halben Stunde vom leeren Ordner zum laufenden Prototyp |
| **Release-Notizen** | `AUSLIEFERUNGEN.md`, proto-1 bis proto-6 nachgetragen |
| **Zugang** | `td-tools/zugang.py` lässt axe-core über die laufende App laufen. Erster Lauf: drei Verstöße, zwei schwer (Umschalter ohne Namen, Zoomen abgeschaltet, keine Ueberschrift). Alle behoben, lokal null Funde |
| **Startlast** | `td-tools/startlast.py` misst im Browser, was beim ersten Aufruf wirklich geholt wird. Von **1596 KB auf 864 KB**: das größte Einzelstück war kein Code, sondern ein Avatar mit 733 KB. Jetzt 3 KB. Die Karte wird nachgeladen statt mitgeliefert |
| **Eigene Pakete** | `packages/td-core` (UI-frei) und `packages/td-ui`. Musterdaten, Space-Ordnung und Arten-Regeln liegen dort, mit 19 Tests. Sieben Datennähte aufgelöst |
| **Antons offene Arbeit** | `anton-stand.py` liest jetzt auch seine offenen Pull Requests und markiert die an unseren Themen. Erster Lauf: 18 offen, 9 an unseren Themen, darunter #279 mit generischen Input-Widgets, die nah an unserem Feld-Register liegen |

**Auf diesem Server gibt es keinen Zeitplandienst** (kein `cron`, `systemd --user` ohne Linger, kein root). Darum läuft die Wacht von außen, und die Sicherung hängt an der Auslieferung statt an der Uhr. Das ist der bessere Zuschnitt: Eine Prüfung auf demselben Rechner schweigt genau dann, wenn der Rechner weg ist.

---

## Was fehlt

Drei Punkte, alle benannt, keiner blockierend.

### 1. Die Anschriften fehlen

**Heute:** 234 Stiftungen tragen die Koordinate ihrer Stadt, nicht ihre Anschrift. Wer sich einen Ort teilt, bekommt einen festen kleinen Versatz, damit die Punkte sich auffächern. Die Beschreibung sagt das: *"Der Punkt zeigt die Stadt, nicht die Anschrift."*

**Was fehlt:** Geokodierung der **70 Einträge, die eine Anschrift tragen**. Die übrigen 164 haben keine, dort bleibt die Stadt die ehrliche Auskunft.

**Wie:** `createNominatimGeocoder` liegt in Antons Toolkit. Ein Lauf über 70 Adressen, mit Pause zwischen den Anfragen.

**Warum es zählt:** Timo beim ersten Blick: *"Da müssten dann schon die Orte, die Straßen, das wirklich genau eingetragen sein. Ansonsten ist das nicht zielführend."*

### 2. Bildbeschreibung wiederholt den Namen

**Gemessen:** `image-redundant-alt`, klein. Das Space-Bild trägt `alt="trustdonation"`, und direkt daneben steht derselbe Name. Eine Vorlesehilfe sagt ihn zweimal.

**Wo:** Antons Avatar-Komponente. Die richtige Lösung ist ein leeres `alt`, wenn der Name daneben steht; das gehört in seine Komponente, nicht in unsere Daten.

**Was wir tun:** als Anwendungsfall an ihn, zusammen mit Fund 1.

---

## Was bewusst wartet

| Sache | Warum sie wartet |
|---|---|
| Andere KI-Modelle einbinden | Timo: "erstmal nicht Priorität" |
| Codemodule im Baukasten | erst wenn Datenmodule stehen |
| Mehrsprachigkeit der App | die Landing ist dreisprachig, die App folgt, wenn jemand sie braucht |
| Mobile App als Paket | Antons Capacitor-Aufbau steht, wir brauchen ihn noch nicht |
| Eigene Server-Dienste | solange der WoT-Connector trägt, brauchen wir kein Backend |

---

## Die nächsten drei

1. **Etappe 0.5** aus `PLAN.md`. Jede weitere Zeile im falschen Paket erhöht die Kosten.
2. **Timo füllt die Lücken im Impressum.** Anschrift, Vorstand, Registergericht, Vereinsregisternummer, eine gelesene E-Mail. Solange sie offen sind, hat die Seite eine sichtbare Baustelle.
3. **Eine erste Messung der Barrierefreiheit.** Eine halbe Stunde, und wir wissen, wo wir stehen.

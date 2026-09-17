# Reife

**Stand:** 17.09.2026
**Frage:** Was fehlt, damit trustdonation ein Projekt ist, das man ohne Bauchschmerzen einer Stiftung zeigt und ueber Jahre weiterbaut?

Diese Datei ist die ehrliche Liste. Sie wird nicht schoengeschrieben, und sie wird bei jeder Runde nachgezogen.

---

## Was steht

| | |
|---|---|
| **Definition** | `DEFINITION.md`, elf Teile, Antons Muster uebernommen |
| **Architektur** | `ARCHITEKTUR.md`, Haken, Paketschnitt, Naht-Regeln, Grenze zum Protokoll |
| **Naht-Register** | `NAEHTE.md`, alle 27 Stellen benannt, maschinell geprueft |
| **Plan** | `PLAN.md`, fuenf Etappen mit vorfuehrbarem Ende |
| **Werkzeuge** | `td-tools/anton-stand.py` (Schnittstelle zu Anton, samt seinen offenen PRs), `td-tools/pruefen.py` (sechs Tore) |
| **Skills** | fuenfzehn in zwei Plugins, versioniert in `lichtungooo/trustdonation` |
| **Gedaechtnis** | Stand, Architektur, vier Erfahrungen, Forge-Eintrag |
| **Der Prototyp** | live, mit Timos echten Spaces, ohne Login sichtbar |
| **Betrieb** | Wacht von aussen, Sicherung gerechnet, Impressum und Datenschutz live |
| **Entscheidungen** | `ENTSCHEIDUNGEN.md`, neun Eintraege mit Verfallsbedingung |
| **Einstieg** | `EINSTIEG.md`, eine halbe Stunde bis zum laufenden Stand |

---

## Erledigt am 17.09.2026

| Punkt | Was jetzt steht |
|---|---|
| **Tore laufen von selbst** | `.github/workflows/trustdonation-tore.yml` faehrt Typen, Regeln und `pruefen.py` bei jedem Push auf den Prototyp-Branch |
| **Blick auf die laufende App** | `.github/workflows/wacht.yml` im Instanz-Repo prueft alle fuenfzehn Minuten **von aussen** Landing, App und `config.json`. Bei einer Stoerung ein Issue, bei Entwarnung geschlossen. Dazu `scripts/wacht.sh` fuer den Blick von innen auf den Container |
| **Impressum und Datenschutz** | `/recht/` ist live. Was nur Timo weiss, steht als sichtbare Luecke darin. Dabei gefunden: die Fussleiste nannte einen Verein, den es noch nicht gibt |
| **Sicherung** | Gerechnet statt vermutet: Landing, Konfiguration und Compose liegen in Git, Images sind neu baubar, Nutzerdaten liegen bei den Menschen. Uebrig bleibt die `.env` mit acht Zeilen. `scripts/sichern.sh` sichert sie, und der Wiederaufbau dauert unter einer Stunde. Steht in `trustdonation/docs/09-betrieb.md` |
| **Entscheidungen** | `ENTSCHEIDUNGEN.md`, neun Eintraege nachgetragen, jeder mit verworfenen Alternativen und einer Verfallsbedingung |
| **Einstieg fuer Dritte** | `EINSTIEG.md`: in einer halben Stunde vom leeren Ordner zum laufenden Prototyp |
| **Release-Notizen** | `AUSLIEFERUNGEN.md`, proto-1 bis proto-6 nachgetragen |
| **Antons offene Arbeit** | `anton-stand.py` liest jetzt auch seine offenen Pull Requests und markiert die an unseren Themen. Erster Lauf: 18 offen, 9 an unseren Themen, darunter #279 mit generischen Input-Widgets, die nah an unserem Feld-Register liegen |

**Auf diesem Server gibt es keinen Zeitplandienst** (kein `cron`, `systemd --user` ohne Linger, kein root). Darum laeuft die Wacht von aussen, und die Sicherung haengt an der Auslieferung statt an der Uhr. Das ist der bessere Zuschnitt: Eine Pruefung auf demselben Rechner schweigt genau dann, wenn der Rechner weg ist.

---

## Was fehlt

Zwei Punkte, beide benannt und keiner blockierend.

### 1. Das Bundle ist doppelt so gross wie das Budget

**Heute:** 1758 KB groesstes Stueck, Budget 800 KB. Die Karte allein wiegt 1029 KB und wird immer geladen, auch von dem, der nie draufgeht. `dist/` gesamt 5,0 MB.
**Naechster Schritt:** Die Karte nachladen statt mitliefern, ein `import()` am Registereintrag. Das beruehrt `apps/reference` und ist darum nach Etappe 0.5 billiger: dann ist es unsere Datei.
**Gemessen:** `pruefen.py` zeigt es als Warnung, nicht als Blocker.

### 2. Barrierefreiheit ungeprueft

**Heute:** Nicht gemessen. Tastaturbedienung, Kontraste und Vorlesbarkeit sind offen.
**Naechster Schritt:** Ein Lauf mit Lighthouse oder axe gegen `trustdonation.org` und `/app`, dann die Funde sortieren. Eine erste Messung kostet eine halbe Stunde.
**Warum es zaehlt:** Ein Teil der Menschen, die wir erreichen wollen, ist darauf angewiesen, und oeffentliche Foerderer fragen danach.

---

## Was bewusst wartet

| Sache | Warum sie wartet |
|---|---|
| Andere KI-Modelle einbinden | Timo: "erstmal nicht Priorität" |
| Codemodule im Marktplatz | erst wenn Datenmodule stehen |
| Mehrsprachigkeit der App | die Landing ist dreisprachig, die App folgt, wenn jemand sie braucht |
| Mobile App als Paket | Antons Capacitor-Aufbau steht, wir brauchen ihn noch nicht |
| Eigene Server-Dienste | solange der WoT-Connector traegt, brauchen wir kein Backend |

---

## Die naechsten drei

1. **Etappe 0.5** aus `PLAN.md`. Jede weitere Zeile im falschen Paket erhoeht die Kosten.
2. **Timo fuellt die Luecken im Impressum.** Anschrift, Vorstand, Registergericht, Vereinsregisternummer, eine gelesene E-Mail. Solange sie offen sind, hat die Seite eine sichtbare Baustelle.
3. **Eine erste Messung der Barrierefreiheit.** Eine halbe Stunde, und wir wissen, wo wir stehen.

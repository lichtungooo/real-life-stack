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
| **Werkzeuge** | `td-tools/anton-stand.py` (Schnittstelle zu Anton), `td-tools/pruefen.py` (alle Tore) |
| **Skills** | elf, versioniert in `lichtungooo/trustdonation` |
| **Gedaechtnis** | Stand, Architektur, drei Erfahrungen, Forge-Eintrag |
| **Der Prototyp** | live, mit Timos echten Spaces, ohne Login sichtbar |

---

## Was fehlt

Nach Dringlichkeit, mit ehrlicher Einschaetzung des Aufwands.

### 1. Die Tore laufen nur, wenn jemand daran denkt

**Heute:** `pruefen.py` muss von Hand gestartet werden.
**Fehlt:** Ein Arbeitsablauf in unserem Fork, der bei jedem Push prueft und meldet.
**Warum es zaehlt:** Disziplin ist keine Architektur. Was nicht von selbst laeuft, faellt in der dritten Woche aus.
**Aufwand:** klein. Antons Workflows liegen als Vorbild in `.github/workflows/`.

### 2. Niemand sieht, wenn die laufende App bricht

**Heute:** Faellt `trustdonation.org/app` aus oder wirft die App bei einer Stiftung einen Fehler, erfahren wir es, wenn jemand anruft.
**Fehlt:** Eine Verfuegbarkeitspruefung und ein Blick auf Fehler im Browser.
**Warum es zaehlt:** Der Prototyp ist Pitch-Material. Ein Ausfall waehrend eines Stiftungsgespraechs kostet mehr als jede Funktion bringt.
**Aufwand:** klein fuer die Verfuegbarkeit (ein Aufruf alle fuenf Minuten, Nachricht per Telegram), mittel fuer Fehler im Browser.

### 3. Impressum und Datenschutzerklaerung auf der App

**Heute:** Die Landingpage hat sie. `/app` ist eine eigene Flaeche und braucht sie ebenfalls, sobald Menschen sich dort anmelden.
**Fehlt:** Beides, plus ein Satz, welche Daten der WoT-Connector wo speichert.
**Warum es zaehlt:** Stiftungen pruefen so etwas. Es ist auch Pflicht.
**Aufwand:** klein, aber es braucht eine Aussage, die stimmt. Fachlich gehoert es zu `docs/04-recht.md` im Instanz-Repo.

### 4. Keine Sicherung

**Heute:** Der Server traegt Images, Instanz-Konfiguration und die Landing. Die Konfiguration liegt in Git, die Images nicht.
**Fehlt:** Eine Aussage, was bei einem Serverausfall verloren geht und wie lange der Wiederaufbau dauert.
**Warum es zaehlt:** Solange die Antwort ungeprueft ist, ist sie eine Hoffnung.
**Aufwand:** klein fuer die Aussage. Die Images lassen sich jederzeit neu bauen; entscheidend ist, dass der Bauordner und die `.env` gesichert sind.

### 5. Das Bundle ist doppelt so gross wie das Budget

**Heute:** 1758 KB groesstes Stueck, Budget 800 KB. Die Karte allein wiegt 1 MB und wird immer geladen.
**Fehlt:** Nachladen der Karte, Messung der Ladezeit auf langsamer Leitung.
**Warum es zaehlt:** Eine Stiftung oeffnet den Link auf dem Telefon im Zug.
**Aufwand:** mittel. Skill `td-performance` hat die Zahlen und die Reihenfolge.

### 6. Barrierefreiheit ungeprueft

**Heute:** Nicht gemessen. Tastaturbedienung, Kontraste, Vorlesbarkeit sind offen.
**Warum es zaehlt:** Ein Teil unserer Zielgruppe ist darauf angewiesen, und oeffentliche Foerderer fragen danach.
**Aufwand:** klein fuer eine erste Messung, mittel fuer die Behebung.

### 7. Entscheidungen stehen verstreut

**Heute:** Anton fuehrt `docs/spec/decisions/`. Wir haben keins; unsere Entscheidungen stehen in Definition, Architektur und im Stand.
**Fehlt:** Ein kurzer Eintrag je Entscheidung mit Datum, Alternativen und Grund.
**Warum es zaehlt:** In sechs Monaten fragt jemand, warum der Marktplatz keine Bewertungen hat, und die Antwort muss auffindbar sein.
**Aufwand:** klein, laufend.

### 8. Kein Einstieg fuer Dritte

**Heute:** Das Instanz-Repo hat `AGENTS.md` und einen Konzept-Index. Der Prototyp-Branch hat Definition und Architektur, aber keinen Weg, der sagt: „So kommst du in einer halben Stunde zum laufenden Stand."
**Warum es zaehlt:** Timo will, dass andere mitmachen. Ohne Einstieg macht niemand mit.
**Aufwand:** klein.

### 9. Keine Release-Notizen

**Heute:** `proto-1` bis `proto-6` ohne Vermerk, was sich geaendert hat. Die Commit-Titel tragen es, aber niemand liest sie.
**Warum es zaehlt:** Beim Zurueckdrehen muss man wissen, was man verliert.
**Aufwand:** klein, laufend.

### 10. Antons offene Arbeit ist unsichtbar

**Heute:** `anton-stand.py` sieht Commits, Tags und Abhaengigkeiten. Es sieht nicht, was er **vorhat**: offene Pull Requests und Issues.
**Warum es zaehlt:** Ein grosser Umbau bei ihm kuendigt sich in einem PR an, Wochen bevor er landet. Wer das sieht, baut nicht gegen die Wand.
**Aufwand:** klein, wenn `gh` verfuegbar ist.

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

Wenn nur drei Dinge gehen, dann diese:

1. **Etappe 0.5** aus `PLAN.md`. Jede weitere Zeile im falschen Paket erhoeht die Kosten.
2. **Punkt 1 und 2 dieser Liste.** Tore, die von selbst laufen, und ein Blick auf die laufende App. Zusammen ein halber Tag, und danach schlaeft man ruhiger.
3. **Punkt 3.** Impressum und Datenschutz, bevor der Link an eine Stiftung geht.

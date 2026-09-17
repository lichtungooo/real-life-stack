# Auslieferungen

Was in welchem Stand steckt. Beim Zurückdrehen muss man wissen, was man verliert.

Das Image liegt auf dem Server als `trustdonation-app:proto-N`. Zurückgedreht wird über `RLS_IMAGE_TAG` in `~/apps/wir-ooo/.env`, darum werden **alte Images nie gelöscht**, solange der Platz reicht.

| Stand | Commit | Datum | Was drin ist |
|---|---|---|---|
| **proto-10** | `97fcdb56` | 17.09.2026 | **Echte Umlaute und erkennbare Pins.** 1767 Stellen mit ASCII-Ersatz berichtigt, in Dokumenten, Kommentaren, Anzeigetexten und Musterdaten. Die Stiftungs-Pins tragen jetzt alle die Farbe ihrer Art statt der ihres ersten Themas, und wer sich einen Ort teilt, bekommt einen festen kleinen Versatz: In Berlin lagen 28 auf einer Koordinate. |
| proto-9 | `1989b69a` | 17.09.2026 | **234 recherchierte Stiftungen auf der Karte**, als place-Items im Netzwerk trustdonation. 70 davon ausgearbeitet (Schwerpunkte, Förderrahmen, Antragsweg), 164 mit Name, Sitz und Schwerpunkten. Jeder Eintrag nennt seine Quelle. Die Karte bündelt von selbst und steht nach 3,4 Sekunden; die Startlast steigt um 22 KB. |
| proto-8 | `3071e99d` | 17.09.2026 | **Der Durchgang läuft als Test.** Zwölf Erwartungen aus dem Testplan mit Playwright, in achtzehn Sekunden. Dazu: trustdonation trägt `#b16105` statt `#d97706`, damit der aktive Reiter lesbar ist (gerechnet: 3,19 auf 4,58). Live sind damit null schwere Zugangsfunde. |
| proto-7 | `a1b24bf3` | 17.09.2026 | **Eigene Pakete und messbare Qualität.** Die Musterdaten liegen in `packages/td-core` und gehen als Seed an den Connector; Antons Datendateien sind unberührt. Die Startlast fällt von 1596 KB auf 864 KB, weil ein Avatar mit 733 KB in den Daten steckte. Der Hell-Dunkel-Umschalter hat einen Namen, Zoomen ist wieder erlaubt, die Seite hat eine Ueberschrift: null Zugangsfunde lokal. Die Karte wird nachgeladen. |
| proto-6 | `3fbc8da0` | 17.09.2026 | **Landingpage als eigener Bereich.** Domain und Link stehen nicht mehr unter dem Arten-Editor, sondern daneben. Der Bereich erscheint nur für Netzwerke. 949 Toolkit-Tests. |
| proto-5 | `6c22a8a5` | 17.09.2026 | **`SEED_VERSION` auf 4.** Ohne das erreichten die neuen Musterdaten keinen Browser, der die App schon offen hatte. Dreimal ausgeliefert, dreimal derselbe alte Satz. |
| proto-4 | `b9ce479d` | 17.09.2026 | **Musterdaten auf fünf Spaces** nach Timos Bild vom Umschalter: vier Netzwerke (Marker & Maps, Real Life, trustdonation, Lichtung), zwei Projekte, eine Stiftung. Christianskies, Kassel Geilebachquelle, Kaffeefreundinnen, Real Life Projekt und Real Life Netzwerk heraus. |
| proto-3 | `c863ddce` | 17.09.2026 | **Timos echte Spaces** aus der IndexedDB des Dev-Servers statt erfundener Einträge. Zehn Spaces mit eigenen Ids, Bildern und Farben. `RLS_HOME_SPACE_ID` wird jetzt an den Container durchgereicht (Instanz-Repo `e112702`). |
| proto-2 | `d447916b` | 17.09.2026 | **Erste eigene Musterdaten**: acht recherchierte Stiftungen, sechs erdachte Projekte. Verworfen, siehe Entscheidung E3. Standard-Connector auf `local`, damit die App ohne Anmeldung zeigt. |
| proto-1 | `25e9068d` | 17.09.2026 | **Der Prototyp entsteht.** Antons Stand vom 17.09. (`f9c56fff`) mit Seitenmenü, Aussehen als Achsen und Space-Bild, dazu unsere Netzwerk-Arbeit als eigener Bereich **Netzwerk** im Space-Dialog. 946 Toolkit-Tests. |

## Was noch nicht ausgeliefert ist

| Commit | Was |
|---|---|
| `9a33f2b4` | `DEFINITION.md` und `PLAN.md` |
| `c8bd62fe` | `ARCHITEKTUR.md`, `NAEHTE.md`, Verweis in `AGENTS.md` |
| `116355b6` | Naht-Register vervollständigt, `td-tools/`, `REIFE.md` |

Dokumente und Werkzeuge ändern die laufende App nicht. Sie gehen mit der nächsten Auslieferung mit, die Code berührt.

## Wie ein Eintrag entsteht

Beim Ausliefern, vor dem Umschalten von `RLS_IMAGE_TAG`:

1. Neue Zeile oben, mit Stand, Commit, Datum.
2. **Was drin ist**, in ein bis drei Sätzen. Nicht die Commit-Titel abschreiben, sondern sagen, was ein Mensch merkt.
3. Wenn etwas herausgefallen ist: hinschreiben. Beim Zurückdrehen zählt genau das.

Der Ablauf steht im Skill `td-ausliefern`.

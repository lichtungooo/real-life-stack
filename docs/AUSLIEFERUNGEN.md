# Auslieferungen

Was in welchem Stand steckt. Beim Zurueckdrehen muss man wissen, was man verliert.

Das Image liegt auf dem Server als `trustdonation-app:proto-N`. Zurueckgedreht wird ueber `RLS_IMAGE_TAG` in `~/apps/wir-ooo/.env`, darum werden **alte Images nie geloescht**, solange der Platz reicht.

| Stand | Commit | Datum | Was drin ist |
|---|---|---|---|
| **proto-6** | `3fbc8da0` | 17.09.2026 | **Landingpage als eigener Bereich.** Domain und Link stehen nicht mehr unter dem Arten-Editor, sondern daneben. Der Bereich erscheint nur fuer Netzwerke. 949 Toolkit-Tests. |
| proto-5 | `6c22a8a5` | 17.09.2026 | **`SEED_VERSION` auf 4.** Ohne das erreichten die neuen Musterdaten keinen Browser, der die App schon offen hatte. Dreimal ausgeliefert, dreimal derselbe alte Satz. |
| proto-4 | `b9ce479d` | 17.09.2026 | **Musterdaten auf fuenf Spaces** nach Timos Bild vom Umschalter: vier Netzwerke (Marker & Maps, Real Life, trustdonation, Lichtung), zwei Projekte, eine Stiftung. Christianskies, Kassel Geilebachquelle, Kaffeefreundinnen, Real Life Projekt und Real Life Netzwerk heraus. |
| proto-3 | `c863ddce` | 17.09.2026 | **Timos echte Spaces** aus der IndexedDB des Dev-Servers statt erfundener Eintraege. Zehn Spaces mit eigenen Ids, Bildern und Farben. `RLS_HOME_SPACE_ID` wird jetzt an den Container durchgereicht (Instanz-Repo `e112702`). |
| proto-2 | `d447916b` | 17.09.2026 | **Erste eigene Musterdaten**: acht recherchierte Stiftungen, sechs erdachte Projekte. Verworfen, siehe Entscheidung E3. Standard-Connector auf `local`, damit die App ohne Anmeldung zeigt. |
| proto-1 | `25e9068d` | 17.09.2026 | **Der Prototyp entsteht.** Antons Stand vom 17.09. (`f9c56fff`) mit Seitenmenue, Aussehen als Achsen und Space-Bild, dazu unsere Netzwerk-Arbeit als eigener Bereich **Netzwerk** im Space-Dialog. 946 Toolkit-Tests. |

## Was noch nicht ausgeliefert ist

| Commit | Was |
|---|---|
| `9a33f2b4` | `DEFINITION.md` und `PLAN.md` |
| `c8bd62fe` | `ARCHITEKTUR.md`, `NAEHTE.md`, Verweis in `AGENTS.md` |
| `116355b6` | Naht-Register vervollstaendigt, `td-tools/`, `REIFE.md` |

Dokumente und Werkzeuge aendern die laufende App nicht. Sie gehen mit der naechsten Auslieferung mit, die Code beruehrt.

## Wie ein Eintrag entsteht

Beim Ausliefern, vor dem Umschalten von `RLS_IMAGE_TAG`:

1. Neue Zeile oben, mit Stand, Commit, Datum.
2. **Was drin ist**, in ein bis drei Saetzen. Nicht die Commit-Titel abschreiben, sondern sagen, was ein Mensch merkt.
3. Wenn etwas herausgefallen ist: hinschreiben. Beim Zurueckdrehen zaehlt genau das.

Der Ablauf steht im Skill `td-ausliefern`.

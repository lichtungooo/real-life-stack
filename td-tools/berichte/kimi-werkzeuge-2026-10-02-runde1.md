# Prüfkreis: Kimi prüft die Werkstatt-Werkzeuge, Runde 1

- Datum: 2026-10-02
- Modell: kimi-code/k3
- Sitzung: `session_75d5e6cc-a444-4d17-ba6a-047c70d51276`
- Geprüft: kimi-pruefen.py, ausliefer-tor.py, trustdonation-tore.yml, 00-index/laufend.py, skills-pruefen.py, wacht.yml, td-ausliefern

Alle Proben sind gelaufen, die Testdateien sind aufgeräumt. Hier mein Prüfbericht.

## Befund 1: Das Ausliefer-Tor prüft nie, ob Kimi den ganzen Unterschied seit der letzten Auslieferung gesehen hat
- Schwere: kritisch
- Ort: `td-tools/ausliefer-tor.py:70-100` (Funktion `kimi`), `td-tools/kimi-pruefen.py:214-215` (`--basis`)
- Was passiert: Das Tor verlangt nur: jüngster Bericht mit `Stand` = Vorfahre des Commits, danach nur Doku-Änderungen, 0 kritisch. Die Zeile `Basis:` im Bericht wird nie gelesen. `kimi-pruefen.py --basis HEAD~1` erzeugt einen voll gültigen Bericht (`Stand` = HEAD, `Sauber: ja`, 0 Befunde), obwohl Kimi nur den letzten Commit sah und nicht den Unterschied seit proto-64. Das Werkzeug empfiehlt `--basis` sogar selbst (Zeile 239-240: "Mit --basis näher heranrücken oder in Teilen prüfen") — gerade bei großen, prüfwürdigen Änderungen. Variante desselben Lochs: Prüfung in zwei Teilen (Bericht A über Teil 1 mit kritischem Befund, Bericht B über Teil 2 sauber) — das Tor findet zuerst B und schaut A nie an. Damit ist die Antwort auf eure Kernfrage: **ja, das Tor kann einen Commit freigeben, dessen Großteil Kimi nie gesehen hat.**
- Beleg: Code-Lektüre beider Dateien; in `kimi()` kommt der String `Basis` nirgends vor. Probe `kimi-pruefen.py --zeigen` zeigt, dass der Bericht die Basis im Kopf trägt (`- Basis: proto-64 (...)`), das Tor sie aber ignoriert.
- Vorschlag: Im Bericht-Kopf die Basis maschinenlesbar halten und im Tor prüfen: Entweder muss die Basis gleich der letzten Auslieferung aus `docs/AUSLIEFERUNGEN.md` sein, oder das Tor muss eine Kette von Berichten verlangen, die lückenlos von letzter Auslieferung bis zum Commit reicht (Basis des nächsten = Stand des vorherigen). Bis dahin: `--basis`-Berichte im Tor nur akzeptieren, wenn die Basis selbst eine Auslieferung ist.

## Befund 2: Die Wacht kann ihre Störungs-Meldung nicht anlegen — das Label "wacht" existiert nicht
- Schwere: kritisch
- Ort: `KIMI_MATERIAL/wacht.yml:118-122` (`issues.create` mit `labels: ["wacht"]`)
- Was passiert: Genau dann, wenn ein Dienst ausfällt, läuft der Schritt "Stoerung melden". `issues.create` mit einem nicht existierenden Label beantwortet die GitHub-API mit 422 Validation Failed, github-script wirft, der Schritt schlägt fehl — **kein Issue, kein Kommentar, keine Meldung je Störung**. Der Wächter sieht den Ausfall und schweigt. Das ist der Stillversager schlechthin: Das System meldet "grün/frei" nicht, es meldet gar nichts, und zwar nur im Ernstfall.
- Beleg: `gh api repos/lichtungooo/real-life-stack/labels/wacht` → 404 Not Found; die Label-Liste von `lichtungooo/trustdonation` enthält ebenfalls kein "wacht". In beiden Kandidaten-Repos fehlt das Label.
- Vorschlag: Label "wacht" im Ziel-Repo anlegen (einmalig, dokumentiert im Workflow-Kommentar), und defensiv: im Skript das Label vor `create` per API anlegen falls fehlend (`labels.create` mit 422-Toleranz), oder das Label weglassen und das Issue am Titel erkennen.

## Befund 3: pnpm-lock.yaml wird weder von Kimi gelesen noch vom Tor erfasst — Abhängigkeitsänderungen gehen ungesehen live
- Schwere: mittel
- Ort: `td-tools/kimi-pruefen.py:46` (`:(exclude)pnpm-lock.yaml`), `td-tools/ausliefer-tor.py:86`
- Was passiert: Die Lock-Datei ist aus Kimis Patch ausgeschlossen. Gleichzeitig entsteht die Änderung typischerweise *vor* dem Berichts-`Stand`, taucht also auch in der Tor-Prüfung `git diff stand..sha` nie auf. Eine neue oder hochgezogene Abhängigkeit (Angriffsfläche Lieferkette, geändertes Laufzeitverhalten) passiert beide Tore, ohne dass je ein Mensch oder Modell sie liest. Bilder und dist auszunehmen ist sinnvoll; die Lock-Datei ist Code.
- Beleg: Probe im Repo: `git diff --name-only c07c2c82 HEAD` liefert 24 Dateien, `kimi-pruefen.py --zeigen` zeigt 18 — unter den 6 Versteckten ist konkret `pnpm-lock.yaml` (live verifiziert).
- Vorschlag: Lock-Datei nicht pauschal ausschließen, sondern bei Änderung als kompakte Zusammenfassung in den Auftrag geben (`pnpm install --lockfile-only`-Diff ist zu groß, aber `git diff --stat` plus die Liste der geänderten Paketnamen/Versionen reicht für eine Prüfung) und im Tor als prüfpflichtig markieren.

## Befund 4: ERGEBNIS-Zeile wird als erster Treffer gelesen — ein früher "0 kritisch"-Text schlägt den echten Befund
- Schwere: mittel
- Ort: `td-tools/kimi-pruefen.py:270`, `td-tools/ausliefer-tor.py:90` (je `re.search` = erster Treffer)
- Was passiert: Der Auftrag verlangt die ERGEBNIS-Zeile "zum Schluss", erzwingt das aber nicht. Enthält die Antwort zwei ERGEBNIS-Zeilen, zählt die erste. Kimi selbst kann das beim Zitieren der Vorgabe erzeugen; und der geprüfte Patch ist beliebiger Code — ein Kommentar darin kann Kimi zu einer frühen Zusammenfassung "ERGEBNIS: 0 Befunde, davon 0 kritisch" verleiten (Prompt-Injection über den Prüfgegenstand). Tor und Werkzeug melden dann frei, obwohl weiter unten kritische Befunde stehen.
- Beleg: Probe: `re.search` auf einen Text mit "ERGEBNIS: 0 … 0 kritisch" vor "ERGEBNIS: 1 … 1 kritisch" parst `0/0`.
- Vorschlag: `re.findall` nehmen und den **letzten** Treffer werten; zusätzlich ablehnen, wenn mehrere ERGEBNIS-Zeilen mit unterschiedlichen Zahlen vorkommen.

## Befund 5: Rückgabe 0 und "Kein kritischer Befund" auch bei `Sauber: nein` — der Bericht zählt dann nicht fürs Tor
- Schwere: mittel
- Ort: `td-tools/kimi-pruefen.py:262, 278, 306-310`
- Was passiert: Liegt bei der Prüfung nicht eingecheckter Code im Baum, schreibt der Bericht korrekt `Sauber: nein` — aber das Programm endet trotzdem mit Rückgabe 0 und "Kein kritischer Befund." Der Skill (Schritt 1b) koppelt die Freigabe an "Rückgabe 0". Der Ablauf: alles grün, Schritt 4, Tor sperrt ("mit nicht eingechecktem Code geprüft") — genau die Art fälschlicher Sperrung, die zum `--ohne-kimi`-Umweg verleitet.
- Beleg: Code-Lektüre: `sauber` fließt nur in den Bericht-Kopf, nicht in den Rückgabewert.
- Vorschlag: Wenn `sauber` falsch ist, am Ende laut warnen und Rückgabe 1 mit dem Hinweis "erst einchecken, dann Runde wiederholen" — der Bericht ist fürs Tor wertlos, das darf nicht wie ein Erfolg aussehen.

## Befund 6: Wettlauf zwischen Tor und Server-Bau — das Tor bindet den Bau nicht an den geprüften Commit
- Schwere: mittel
- Ort: `td-tools/ausliefer-tor.py:113-114`, `td-ausliefern/SKILL.md:107-115`
- Was passiert: Das Tor prüft `fork/trustdonation` zum Zeitpunkt T. Der Server-Bau (Schritt 4) holt Minuten später erneut `origin/trustdonation`. Wird dazwischen gepusht (parallele Session, Force-Push), baut der Server einen Commit, den weder CI noch Kimi freigegeben haben. Die einzige Sicherung ist der manuelle Abgleich "git log --oneline -1 muss der Commit sein, den das Tor freigab" — ein Pflichtschritt, den niemand prüft, also nach eurer eigenen Definition ein Wunsch.
- Beleg: Code- und Skill-Lektüre; das Tor gibt den SHA nur aus, der Bau bekommt ihn nie als Parameter.
- Vorschlag: Das Tor soll den freigegebenen SHA in eine Datei schreiben (z. B. `td-tools/berichte/.freigabe`), und der Skill/das Bau-Kommando baut mit `git reset --hard <sha>` statt `origin/trustdonation` — Abweichung = Abbruch.

## Befund 7: Umbenennung von Code nach `docs/` oder `*.md` ist für beide Prüfungen unsichtbar
- Schwere: klein
- Ort: `td-tools/kimi-pruefen.py:150` (`z[3:]`), `td-tools/ausliefer-tor.py:86` (`--name-only`)
- Was passiert: Zwei Mechanismen wirken zusammen: (1) `git status --porcelain` zeigt Umbenennungen als `R  alt -> neu`; `z[3:]` liefert die ganze Kette, und `src/alt.ts -> docs/neu.md` endet auf `.md` → als Doku eingestuft, `Sauber` bleibt "ja". (2) `git diff --name-only stand sha` zeigt bei Umbenennungen (Umbenennungserkennung ist Standard) nur den neuen Pfad — der alte Code-Pfad taucht nie auf. Eine Verschiebung von Code nach `docs/` oder in eine `.md`-Datei passiert also Tor und Sauber-Check unbemerkt. Praktische Wirkung heute begrenzt (docs/ wird nicht gebaut), aber die Schutzlogik `nur_doku` ist damit prinzipiell unterlaufen.
- Beleg: Probe 1: Parsing von `R  src/alt.ts -> docs/neu.md` ergibt `nur_doku: True`. Probe 2 im echten Repo: Commit `1cb3ecf4` enthält `R094 use-space-vocabulary.ts → use-group-vocabulary.ts`; `git diff --name-only` listet nur den neuen Pfad.
- Vorschlag: `git status --porcelain=v1 -z` bzw. `--name-status` verwenden und bei Umbenennungen **beide** Pfade prüfen; es reicht, wenn einer der beiden Code ist, um als Code zu gelten.

## Befund 8: laufend.py — Session-Dateien kollidieren über `sid[:8]` und den "unbekannt"-Fallback
- Schwere: klein
- Ort: `00-index/laufend.py:72, 111`
- Was passiert: Die Datei heißt nach den ersten 8 Zeichen der Session-Id. Zwei Sessions mit gleichem Präfix teilen sich eine Datei — genau der Wettlauf, den das Werkzeug verhindern soll: `ende` der einen löscht die Anwesenheit der anderen. Zusätzlich landen alle Aufrufe ohne `session_id` gemeinsam in `unbekannt.md`. Bei echten UUIDs ist die Kollision unwahrscheinlich, aber der Mechanismus ist real und still.
- Beleg: Live-Probe: `start` mit `kimitest-1111-aaaa` und `puls` mit `kimitest-2222-bbbb` erzeugten zusammen genau eine Datei `kimitest.md`; die zweite Session war unsichtbar. Beide `ende` aufgerufen, Ordner ist wieder sauber (`aufgeraeumt`).
- Vorschlag: Volle Session-Id als Dateiname (oder 12+ Zeichen); bei fehlender Id eine Zufallskennung erzeugen statt "unbekannt", und `ende` nur löschen, wenn die gespeicherte Id passt.

## Befund 9: Timeout im Kimi-Aufruf verliert das Rohlog; Sekunden-Stempel kollidiert bei parallelen Läufen
- Schwere: klein
- Ort: `td-tools/kimi-pruefen.py:159-165, 245-247, 274`
- Was passiert: (1) `subprocess.run(..., timeout=3600)` wirft bei Timeout `TimeoutExpired` — ungefangen, also kein `.kimi-roh-*`-Log (Zeile 165 wird nie erreicht), genau das Artefakt, das ihr euch zur Diagnose stiller Läufe geschaffen habt. (2) Patch- und Berichtsdateien tragen Sekunden-Stempel; zwei parallele Läufe (mit `laufend.py` der Normalfall) in derselben Sekunde überschreiben sich, und `PRUEFKREIS.md` zeigt dann zwei Zeilen auf dieselbe Datei.
- Beleg: Code-Lektüre; kein `try/except subprocess.TimeoutExpired` im Modul.
- Vorschlag: Timeout abfangen und vor dem Abbruch `e.stdout/e.stderr` ins Rohlog schreiben; an den Stempel eine kurze Zufalls- oder Prozess-Komponente hängen.

## Befund 10: skills-pruefen hängt still am Tabellenformat von CLAUDE.md; skills-spiegeln überschreibt Namensgleiches still
- Schwere: klein
- Ort: `00-index/skills-pruefen.py:46`, `KIMI_MATERIAL/skills-spiegeln.py:69-82`
- Was passiert: (1) `genannt` wird nur aus Tabellenzeilen `| \`/name\`` gelesen. Nennt CLAUDE.md Skills künftig anders (Liste, Prosa), ist `genannt` leer oder unvollständig — der harte Check "nennt, was fehlt" prüft dann nichts mehr und meldet trotzdem "Alles stimmt." Die Probe zeigt: 53 genannt, 48 vorhanden, Exit 0 — funktioniert heute, ist aber formatabhängig. (2) Haben zwei Plugins einen Skill gleichen Namens, gewinnt der letzte im Alphabet — ohne Warnung; und `rmtree` vor `copytree` hinterlässt bei einem Fehler mittendrin einen gelöschten Skill.
- Beleg: Probe `skills-pruefen.py` (Ausgabe oben, Exit 0); Lektüre von `skills-spiegeln.py` (`ziel = ziel_wurzel / ordner.name`, keine Kollisionsprüfung).
- Vorschlag: (1) Warnung ausgeben, wenn `genannt` leer ist oder die Zahl gegenüber der letzten Prüfung stark fällt. (2) Bei Namenskollision zwischen Plugins mit Exit 1 abbrechen; erst in ein Temp-Verzeichnis kopieren und dann atomar umbenennen.

## Befund 11: Wacht-Nebenpunkte: 60-Tage-Abschaltung, exakter "wach"-Vergleich, fehlende Sperre gegen Doppelläufe
- Schwere: klein
- Ort: `KIMI_MATERIAL/wacht.yml:14-16, 72-78`
- Was passiert: (1) GitHub deaktiviert geplante Workflows nach 60 Tagen ohne Repo-Aktivität — der Wächter von außen schweigt dann dauerhaft, ausgerechnet ohne dass es jemand merkt (kein Selbsttest). (2) `if [ "$token" = "wach" ]` schlägt fehl, sobald der Dienst "wach\n" oder ein Leerzeichen liefert — Daueralarm ohne Störung, und Alarmmüdigkeit ist der Anfang vom Umgehen. (3) Keine `concurrency`-Gruppe: Zwei verspätet gestartete Läufe sehen beide "kein offenes Issue" und legen zwei an.
- Beleg: Code-Lektüre; GitHub-Plattformverhalten zu geplanten Workflows.
- Vorschlag: Einen Keep-alive-Hinweis oder manuellen Monats-Reminder einplanen; Token-Antwort trimmen (`$(... | tr -d '[:space:]')`); `concurrency: wacht` mit `cancel-in-progress: false` setzen.

## Proben

Ausgeführt (alle gefahrlos, nichts verändert, Testreste entfernt):

- `python D:/Workspace/00-index/skills-pruefen.py` → "53 genannt, 48 vorhanden, Kimi liest die Quelle. Alles stimmt.", Exit 0. Junction zeigt korrekt auf `D:\Workspace\.claude\skills`.
- `python D:/Workspace/00-index/laufend.py` → zeigt 3 lebende Sessions, Exit 0.
- Pipe-Tests `start`/`puls` mit `kimitest-1111-aaaa` und `kimitest-2222-bbbb` → beide landeten in **derselben** Datei `kimitest.md` (Beleg für Befund 8). Danach für beide `ende` aufgerufen; Kontrolle: Ordner sauber.
- `python td-tools/kimi-pruefen.py --zeigen` (in rls-uebersicht) → Basis proto-64 (`c07c2c82`), 18 Dateien, 60.598 Zeichen, Exit 0. Abgleich mit `git diff --name-only c07c2c82 HEAD` (24 Dateien): versteckt sind `pnpm-lock.yaml` (Befund 3), dazu Doku/Berichte wie ausgelegt.
- `python td-tools/ausliefer-tor.py` → **Gesperrt, Exit 1**: CI für `9b87f0f0c5` rot, kein gültiger Kimi-Bericht. Das Tor tut aktuell das Richtige.
- `gh api .../runs/36932838080/jobs` → der jüngste CI-Lauf scheitert an **"Tor 1, Typen" (`pnpm build`)**, nicht am geänderten Schritt. "Antons Stand holen" wurde `skipped` — **der reparierte Schritt ist in der CI bisher nie gelaufen, der Fix ist unbewiesen.** Positiv: Kein `|| true` mehr, der Lauf ist laut rot.
- Rename-Verhalten: `git diff --name-status` auf Commit `1cb3ecf4` zeigt `R094 alt → neu`, `--name-only` nur den neuen Pfad (Beleg für Befund 7); Parsing-Probe für die Porzellan-Zeile ebenfalls.
- ERGEBNIS-Parsing-Probe: erster Treffer gewinnt (Beleg für Befund 4).
- `gh api .../labels` → Label "wacht" fehlt in beiden Kandidaten-Repos (Beleg für Befund 2).
- Nicht geprüft: `kimi-pruefen.py` ohne `--zeigen` (verboten), das Live-Verhalten des Kimi-CLI-Flags `-S` und des Events `session.resume_hint` (Zeile 157, 180) — falls die CLI das Event umbenennt oder bei regulärem Ende auslässt, sperrt das Werkzeug fälschlich mit "vorzeitig aufgehört"; das konnte ich nur lesen, nicht beweisen.

ERGEBNIS: 11 Befunde, davon 2 kritisch

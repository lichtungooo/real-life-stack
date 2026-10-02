# Prüfkreis: Kimi prüft die Werkstatt-Werkzeuge, Runde 2

- Datum: 2026-10-02
- Modell: kimi-code/k3
- Sitzung: `session_75d5e6cc-a444-4d17-ba6a-047c70d51276`
- Geprüft: kimi-pruefen.py, ausliefer-tor.py, trustdonation-tore.yml, 00-index/laufend.py, skills-pruefen.py, wacht.yml, td-ausliefern

Zweite Runde abgeschlossen. Hier die Bewertung je Befund aus Runde 1, dann die neuen Befunde.

## Runde 1, je Befund

**Befund 1 (Basis-Abdeckung): behoben.** Das Tor verlangt jetzt `Basis-Commit` im Bericht und gleicht ihn mit der letzten Auslieferung aus `docs/AUSLIEFERUNGEN.md` ab (`ausliefer-tor.py:96-106`); `kimi-pruefen.py:266,325` schreibt den aufgelösten Commit in den Kopf. Ein `--basis HEAD~1`-Bericht scheitert jetzt an "prüfte nicht ab der letzten Auslieferung". Auch die Teilprüfungs-Variante ist abgedeckt. Aber siehe neuen Befund 1: Die Behebung erzeugt eine Sackgasse.

**Befund 2 (Wacht-Label): behoben.** `wacht.yml:119-126` legt das Etikett per `createLabel` an und toleriert 422 (existiert schon). Verifiziert: `gh api repos/lichtungooo/trustdonation/labels/wacht` → "wacht"; die Fassung auf `main` enthält `createLabel` und `concurrency`.

**Befund 3 (Lock-Datei): behoben.** `lock_zusammenfassung()` (`kimi-pruefen.py:174-193`) fasst Paket-Änderungen kompakt zusammen und hängt sie an den Patch. Probe gegen den echten Diff: erkennt `@types/node@26.6.3` dazu, `@types/node@22.19.15` weg (73 dazu, 2 weg). `--zeigen` listet `pnpm-lock.yaml` jetzt als 19. Datei.

**Befund 4 (ERGEBNIS erster Treffer): behoben.** `ergebnis()` in beiden Dateien: `findall`, letzter Treffer zählt, widersprechende Zeilen → Bericht ungültig. Beide Implementierungen identisch.

**Befund 5 (Sauber nein trotz Rückgabe 0): behoben.** `kimi-pruefen.py:358-361`: bei `Sauber: nein` jetzt Rückgabe 1 mit klarem Hinweis "einchecken, pushen, Runde wiederholen".

**Befund 6 (Wettlauf Tor→Bau): behoben.** Das Tor schreibt den freigegebenen SHA nach `td-tools/berichte/.kimi-freigabe` und löscht die Datei beim Sperren; der Skill (Schritt 4) baut mit `git reset --hard $SHA`. Restpunkt siehe neuen Befund 3.

**Befund 7 (Umbenennungen): behoben.** `--no-renames` in `stand_und_sauber()` (`kimi-pruefen.py:153`) und in der Tor-Diff-Prüfung (`ausliefer-tor.py:116`). Eine Verschiebung erscheint jetzt als Löschung + Neuanlage, der alte Code-Pfad taucht auf und gilt als Code.

**Befund 8 (Kennungs-Kollision): behoben.** Volle, bereinigte Session-Id als Dateiname (`laufend.py:72-76`), Altdaten werden migriert, `ende` löscht nur die eigene volle Kennung. Live-Probe: zwei `kimitest`-Ids → zwei Dateien; `kimitest-äö/..x` → sicher bereinigt zu `kimitest-x.md`; leere Id → keine Datei, sauberer Hinweis. Alle Testdateien per `ende` entfernt.

**Befund 9 (Timeout/Stempel): behoben.** `TimeoutExpired` wird gefangen und schreibt die Teil-Ausgabe ins Rohlog (`kimi-pruefen.py:203-209`); der Stempel trägt jetzt die Prozessnummer (`stempel_jetzt`).

**Befund 10 Teil 1: behoben** (`skills-pruefen.py:51-53`: unter 20 erkannte Skills → Fehler statt stillem Grün; Probe: 53 erkannt, Exit 0). **Teil 2: offen** (Namensgleichheit in `skills-spiegeln.py` — wie angekündigt nicht angegangen).

**Befund 11: größtenteils behoben.** `concurrency`-Gruppe und `tr -d '[:space:]'` beim Token stehen im Code und auf `main`. Der 60-Tage-Punkt ist nur ein Kommentar ("einmal im Monat unter Actions nachsehen") — eine Handpflicht, die niemand prüft; nach eurer eigenen Definition ein Wunsch. Bleibt als kleiner Restpunkt offen.

## Befund 1 (neu): Sackgasse bei großen Unterschieden — das Werkzeug rät zu einem Weg, den das Tor jetzt sperrt
- Schwere: mittel
- Ort: `td-tools/kimi-pruefen.py:287-289` vs. `td-tools/ausliefer-tor.py:103-106`
- Was passiert: Überschreitet der Unterschied 400.000 Zeichen, bricht `kimi-pruefen.py` ab mit dem Rat "Mit --basis näher heranrücken oder in Teilen prüfen." Genau solche Berichte (Basis ≠ letzte Auslieferung) lehnt das Tor seit der Befund-1-Behebung immer ab. Für einen großen Umbau gibt es damit **keinen** legitimen Weg mehr zu einem tor-gültigen Kimi-Bericht: zu groß für Kimi, ungültig fürs Tor. Das ist die klassische fälschliche Sperre, die zum `--ohne-kimi`-Umweg drängt — ausgerechnet bei den größten, prüfbedürftigsten Änderungen. Die Fehlermeldung weist zudem aktiv in die Sackgasse.
- Beleg: Lektüre beider Stellen; die Tor-Bedingung ist hart (`geprueft_ab.group(1) != basis` → Grund, kein Kettenabgleich).
- Vorschlag: Entweder das Tor lernt die Berichts-Kette (Basis des nächsten Berichts = Stand des vorherigen, lückenlos ab letzter Auslieferung — so war "in Teilen prüfen" gemeint), oder `kimi-pruefen.py` teilt große Diffs selbst in Abschnitte unter 400k mit je eigener Basis und führt sie als einen Lauf. Bis dahin den Rat in der Fehlermeldung streichen, sonst produziert jemand Berichte, die nie zählen.

## Befund 2 (neu): Die Korrekturen wirken nicht am Ort der Ausführung — drei Stände, keiner passt zum anderen
- Schwere: mittel
- Ort: `td-ausliefern/SKILL.md:103` (Pfad `rls-uebersicht`), `20-repos/rls-uebersicht/td-tools/ausliefer-tor.py` (alter Stand), `20-repos/rls-werkzeuge` (neuer Stand)
- Was passiert: Der live gespiegelte Skill ist schon aktualisiert (erwähnt `.kimi-freigabe`, Basis-Bedingung) und schickt die Auslieferung nach `rls-uebersicht`. Dort liegt aber noch das **alte** Tor: `grep "Basis-Commit"` → 0 Treffer, HEAD ist `9b87f0f0`, die Fixes stecken in `rls-werkzeuge` (`c0558700`, gepusht, aber lokal nicht geholt). Folgen, solange das so steht: (1) Das alte Tor akzeptiert weiterhin `--basis`-Berichte — Befund 1 aus Runde 1 ist am Ausführungsort unverändert offen. (2) Umgekehrt blockt die Kombination neuer Skill + altes Tor: Bei "frei" schreibt das alte Tor keine `.kimi-freigabe`, der Skill sagt "fehlt die Datei, war das Tor nicht frei" → unlösbare Sperre und genau die Verwirrung, die zum Umgehen verleitet. Dazu liegen in `rls-uebersicht` gerade drei nicht eingecheckte Code-Änderungen einer anderen Session (`projekt-entwurf-host.tsx`, `projekt-entwurf.ts`, `docs/NAEHTE.md`) — die nächste Auslieferung wird genau von dort starten.
- Beleg: `grep -c "Basis-Commit" rls-uebersicht/td-tools/ausliefer-tor.py` → 0; `grep -c "kimi-freigabe" .claude/skills/td-ausliefern/SKILL.md` → 2; `git log --oneline -1` in rls-uebersicht → `9b87f0f0`; `git status --porcelain` → 3 geänderte Dateien.
- Vorschlag: `rls-uebersicht` auf `c0558700` ziehen (fast-forward, sobald die fremden Änderungen eingecheckt sind) und den Skill erst dann als aktuell betrachten. Grundsätzlich: bei Werkzeug-Änderungen die Stelle nennen, ab der sie wo wirken — ein Fix im Worktree heilt den Pfad nicht, den der Skill fährt.

## Befund 3 (neu): `.kimi-freigabe` überlebt einen "CI läuft noch"-Lauf und trägt keinen Zeitstempel
- Schwere: klein
- Ort: `td-tools/ausliefer-tor.py:160-169`
- Was passiert: Bei Rückgabe 2 (CI läuft noch) wird die Datei weder geschrieben noch gelöscht. Eine ältere Freigabe bleibt liegen. Der Skill lehrt "fehlt die Datei, war das Tor nicht frei" — aber eine **vorhandene** Datei beweist nicht, dass der letzte Lauf frei war. Ablauf: Tor frei für sha1 (Datei liegt) → Push sha2 → Tor meldet "läuft noch" → wer trotzdem aus der Datei baut, bekommt sha1. Inhaltlich entschärft (sha1 war geprüft und CI-grün), aber es kann ein veralteter Commit live gehen, während alle glauben, den neuesten zu bauen.
- Beleg: Lektüre; der `return 2`-Zweig berührt `FREIGABE` nicht, nur der Sperr-Zweig löscht.
- Vorschlag: `FREIGABE` zu Beginn jedes Laufs löschen (oder SHA plus Zeitstempel schreiben und der Skill prüft Frische, z. B. < 1 Stunde); im Skill klarstellen: Bau nur unmittelbar nach Rückgabe 0 desselben Laufs.

## Proben

- `skills-pruefen.py` → "53 genannt, 48 vorhanden … Alles stimmt.", Exit 0 (Schwellen-Check greift nicht, Format unverändert).
- `laufend.py` (zeigen) → 3 Sessions, Exit 0.
- Pipe-Tests `laufend.py` mit `kimitest-1111-aaaa`, `kimitest-2222-bbbb`, `kimitest-äö/..x`, `{}` → zwei getrennte Dateien, sichere Bereinigung, leere Id ohne Datei; danach für jede Kennung `ende`, Ordner wieder sauber.
- `rls-werkzeuge`: `kimi-pruefen.py --zeigen` → Basis proto-64, 19 Dateien (inkl. `pnpm-lock.yaml`), Exit 0. Lock-Regex gegen echten Diff → `@types/node@26.6.3` dazu / `@22.19.15` weg erkannt.
- `rls-werkzeuge`: `ausliefer-tor.py` → Gesperrt, Exit 1 (CI für `c0558700` rot an "Tor 1, Typen", kein Bericht). `.kimi-freigabe` wurde nicht angelegt; nichts verändert.
- Behauptung CI-Fix geprüft: Lauf `36929690575` (Commit `7041139d`) → success, Schritte "Tor 1, Typen", "Antons Stand holen", "Tore 3 bis 6" alle success. Der reparierte Fetch-Schritt ist also grün gelaufen; das aktuelle Rot (seit `1878b8d4`, wieder "Tor 1, Typen") passt zur @types/node-Erklärung — das Tor sperrt korrekt.
- Label "wacht" in `lichtungooo/trustdonation` vorhanden; `wacht.yml` auf `main` enthält `createLabel` und `concurrency`.
- Rollout-Probe: alter Tor-Stand in `rls-uebersicht` (0× Basis-Commit), neuer Skill live (2× kimi-freigabe) — Beleg für neuen Befund 2.

ERGEBNIS: 5 Befunde, davon 0 kritisch

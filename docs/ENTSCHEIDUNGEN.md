# Entscheidungen

Jede Entscheidung mit Wirkung bekommt hier einen Eintrag: **was**, **warum**, **welche Alternative** und **was sie ungültig machen würde**.

In sechs Monaten fragt jemand, warum der Marktplatz keine Bewertungen hat. Die Antwort muss auffindbar sein, sonst wird sie neu verhandelt.

Anton führt dasselbe in `docs/spec/decisions/` für den Stack. Diese Datei ist unsere Ebene.

**Aufbau eines Eintrags:** Nummer, Titel, Datum, Entscheidung in einem Satz, Begründung, verworfene Alternativen, und woran man merkt, dass sie nicht mehr gilt.

---

## E1. Keine Bewertungen

**16.09.2026** · Timo

**Entscheidung:** trustdonation zeigt keine Punkte, Sterne, Ranglisten oder Passungszahlen. Wo ein Vergleich nötig ist, nennen wir **Gründe**, und der Mensch entscheidet.

**Warum:** Eine Zahl verdeckt, worauf sie beruht. Sie lädt zum Optimieren ein statt zum Nachdenken, und sie stellt Projekte in eine Ordnung, die niemand verantwortet. Unsere Recherche trägt ein Feld `passung`; es bleibt aus jeder Anzeige heraus.

**Verworfen:** Prozentzahl für die Passung (verdeckt die Gründe), Sterne für Stiftungen (wir bewerten keine Förderer), Rangliste der Projekte (macht aus Zusammenarbeit einen Wettbewerb).

**Ungültig, wenn:** nie aus Bequemlichkeit. Nur, wenn die Menschen, die die Plattform nutzen, ausdrücklich danach fragen und einen Weg finden, der die Gründe sichtbar lässt.

---

## E2. Ein eigener, eingefrorener Prototyp

**17.09.2026** · Timo nach Telefonat mit Anton

**Entscheidung:** trustdonation läuft als eigener Prototyp auf einem Abzweig von Antons Stand, ohne laufende Updates. Unsere Arbeit kommt als eigene Bereiche hinein, nicht als Umbau seiner.

**Warum:** Anton will die Funktionalität seines Stacks selbst definieren, sonst entsteht nach seinen Worten Spaghetti-Code. Zugleich braucht Timo etwas Vorführbares für Stiftungsgespräche. Ein eigener Abzweig löst beides.

**Verworfen:** In Antons Stack weiterbauen (er hat widersprochen), einen eigenen Stack bauen (verwirft Jahre seiner Arbeit), auf ein Release warten (zu langsam für die Gespräche).

**Ungültig, wenn:** Anton unsere Arbeit übernimmt. Dann weicht unsere Fassung seiner, und der Abzweig wird zur Instanz.

---

## E3. Musterdaten sind echte Daten

**17.09.2026** · Timo

**Entscheidung:** Der Prototyp zeigt Timos eigene Spaces vom Dev-Server. Nichts wird hinzuerfunden.

**Warum:** Ein Prototyp mit erfundenen Namen zeigt meine Vorstellung, nicht seine, und er muss beim Vorführen erklären, was daran stimmt. Er zeigt lieber weniger, das echt ist.

**Verworfen:** Recherchierte Stiftungen mit erdachten Projekten (gebaut und verworfen), leere App (zeigt nichts).

**Ungültig, wenn:** nie. Erfundene Beispiele gehören in Konzeptpapiere.

---

## E4. Der Prototyp zeigt ohne Anmeldung

**17.09.2026**

**Entscheidung:** `RLS_DEFAULT_CONNECTOR=local`. Wer `trustdonation.org/app` öffnet, sieht die Musterdaten sofort. Timos eigene Spaces im Web of Trust erreicht er über `?connector=wot`.

**Warum:** Der Prototyp ist Pitch-Material. Eine Anmeldemaske vor der ersten Ansicht kostet das Gespräch.

**Verworfen:** WoT als Standard (Anmeldewand), zwei Adressen für zwei Zwecke (verwirrt).

**Ungültig, wenn:** aus dem Prototyp eine benutzte Instanz wird. Dann ist die Anmeldung der Anfang.

---

## E5. Der Marktplatz ist ein Katalog von Items

**17.09.2026**

**Entscheidung:** Module werden als Items beschrieben und veröffentlicht, nicht als Code nachgeladen. Stufe 1 sind Datenmodule aus Feldern; Codemodule kommen später als signierte Pakete beim Bau der Instanz.

**Warum:** Antons Modul-Register wird vor dem ersten Render einmal zusammengesetzt und eingefroren. Ein Nachladen zur Laufzeit bräche diese Regel und wäre zugleich ein offenes Tor für fremden Code.

**Verworfen:** Plugins zur Laufzeit laden (bricht die Regel, öffnet ein Tor), ein eigener Modul-Server (Backend, das wir nicht wollen).

**Ungültig, wenn:** Anton ein Plugin-Konzept mit eigenen Regeln baut. Er nennt es in Spec 01 ausdrücklich als offene Möglichkeit.

---

## E6. Das Profil einer Einrichtung ist ihr Space

**17.09.2026**

**Entscheidung:** Stiftungen, Projekte und Netzwerke tragen ihre Angaben in `Group.data`, nach den Vokabularen ihrer Art. Menschen behalten ihr `person`-Item aus Spec 12.

**Warum:** Ein zweites Profil-Item neben dem Space wäre eine zweite Wahrheit über dieselbe Sache. Wer den Space verwaltet, verwaltet sein Profil; es braucht keine eigene Rechteebene.

**Verworfen:** `organization`-Item neben dem Space (zwei Wahrheiten), Profile nur als Items ohne Spaces (dann fehlt der Arbeitsraum).

**Ungültig, wenn:** eine Einrichtung mehrere Profile in verschiedenen Netzwerken braucht, die sich unterscheiden. Dann wäre die Spiegel-Mechanik aus Spec 09 der Weg.

---

## E7. Die Grenze zum Protokoll

**17.09.2026**

**Entscheidung:** Kein `did:key`, kein JWS, kein Yjs-Aufruf in unserem Code. Wir sprechen mit dem Web of Trust ausschließlich über `DataInterface` und Capabilities.

**Warum:** Jeder Protokoll-Aufruf bindet uns an eine Version. Antons nächster Fortschritt wäre dann unser Problem statt unser Gewinn. So ist ein Protokoll-Update ein Paket-Update.

**Verworfen:** Direkter Zugriff für Sonderfälle (jeder Sonderfall wird zur Regel).

**Ungültig, wenn:** nie, solange wir Antons Connectoren nutzen. `td-tools/pruefen.py` misst die Einhaltung.

---

## E8. Eigene Pakete statt Nähte

**17.09.2026**

**Entscheidung:** `packages/td-core`, `packages/td-ui` und `apps/trustdonation` nehmen unsere Arbeit auf. Antons Pakete werden nur an eingetragenen Nähten berührt, jede unter zwanzig Zeilen, jede mit einem Wunsch an ihn.

**Warum:** Die Messung am 17.09. ergab 27 seiner Dateien mit rund 800 geänderten Zeilen. Jede davon ist eine Stelle, an der ein Update auf unsere Arbeit trifft.

**Verworfen:** So weitermachen (die Kosten steigen mit jeder Zeile), alles als Pull Request an Anton (er will selbst definieren, und manches geht nur uns an), einen eigenen Stack bauen (verwirft seine Arbeit).

**Ungültig, wenn:** Anton die Haken baut, die wir uns wünschen. Dann werden aus Nähten Erweiterungen, und die eigenen Pakete bleiben trotzdem richtig.

---

## E9. Die Skills leben im Projekt-Repo

**17.09.2026** · Timo

**Entscheidung:** Alle Skills liegen in `lichtungooo/trustdonation` unter `plugins/`, nach Antons Marketplace-Muster. Der lokale Arbeitsbereich bekommt sie per Spiegelung.

**Warum:** Wer das Projekt klont, soll mitarbeiten können. Skills auf einem Rechner sind nicht teilbar, nicht versioniert und beim nächsten Rechnerwechsel weg.

**Verworfen:** Nur lokal (nicht teilbar), in Antons `claude-plugins` (unsere Prozess-Skills handeln davon, wie wir mit seinem Code umgehen, das gehört nicht in sein Repo).

**Ungültig, wenn:** nie absehbar.

---

## Wie ein Eintrag entsteht

Sobald eine Entscheidung getroffen ist, die länger als eine Sitzung wirkt:

1. Nächste Nummer.
2. Datum und wer entschieden hat.
3. Die Entscheidung in **einem** Satz.
4. Das **Warum**, nicht das Was. Das Was steht schon oben.
5. **Verworfene Alternativen** mit dem Grund. Das ist der Teil, der später zählt: Ohne ihn wird dieselbe Alternative in sechs Monaten neu vorgeschlagen.
6. **Ungültig, wenn**: Woran erkennt man, dass die Entscheidung überholt ist? Eine Entscheidung ohne Verfallsbedingung wird zum Dogma.

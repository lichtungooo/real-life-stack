# Entscheidungen

Jede Entscheidung mit Wirkung bekommt hier einen Eintrag: **was**, **warum**, **welche Alternative** und **was sie ungueltig machen wuerde**.

In sechs Monaten fragt jemand, warum der Marktplatz keine Bewertungen hat. Die Antwort muss auffindbar sein, sonst wird sie neu verhandelt.

Anton fuehrt dasselbe in `docs/spec/decisions/` fuer den Stack. Diese Datei ist unsere Ebene.

**Aufbau eines Eintrags:** Nummer, Titel, Datum, Entscheidung in einem Satz, Begruendung, verworfene Alternativen, und woran man merkt, dass sie nicht mehr gilt.

---

## E1. Keine Bewertungen

**16.09.2026** · Timo

**Entscheidung:** trustdonation zeigt keine Punkte, Sterne, Ranglisten oder Passungszahlen. Wo ein Vergleich noetig ist, nennen wir **Gruende**, und der Mensch entscheidet.

**Warum:** Eine Zahl verdeckt, worauf sie beruht. Sie laedt zum Optimieren ein statt zum Nachdenken, und sie stellt Projekte in eine Ordnung, die niemand verantwortet. Unsere Recherche traegt ein Feld `passung`; es bleibt aus jeder Anzeige heraus.

**Verworfen:** Prozentzahl fuer die Passung (verdeckt die Gruende), Sterne fuer Stiftungen (wir bewerten keine Foerderer), Rangliste der Projekte (macht aus Zusammenarbeit einen Wettbewerb).

**Ungueltig, wenn:** nie aus Bequemlichkeit. Nur, wenn die Menschen, die die Plattform nutzen, ausdruecklich danach fragen und einen Weg finden, der die Gruende sichtbar laesst.

---

## E2. Ein eigener, eingefrorener Prototyp

**17.09.2026** · Timo nach Telefonat mit Anton

**Entscheidung:** trustdonation laeuft als eigener Prototyp auf einem Abzweig von Antons Stand, ohne laufende Updates. Unsere Arbeit kommt als eigene Bereiche hinein, nicht als Umbau seiner.

**Warum:** Anton will die Funktionalitaet seines Stacks selbst definieren, sonst entsteht nach seinen Worten Spaghetti-Code. Zugleich braucht Timo etwas Vorfuehrbares fuer Stiftungsgespraeche. Ein eigener Abzweig loest beides.

**Verworfen:** In Antons Stack weiterbauen (er hat widersprochen), einen eigenen Stack bauen (verwirft Jahre seiner Arbeit), auf ein Release warten (zu langsam fuer die Gespraeche).

**Ungueltig, wenn:** Anton unsere Arbeit uebernimmt. Dann weicht unsere Fassung seiner, und der Abzweig wird zur Instanz.

---

## E3. Musterdaten sind echte Daten

**17.09.2026** · Timo

**Entscheidung:** Der Prototyp zeigt Timos eigene Spaces vom Dev-Server. Nichts wird hinzuerfunden.

**Warum:** Ein Prototyp mit erfundenen Namen zeigt meine Vorstellung, nicht seine, und er muss beim Vorfuehren erklaeren, was daran stimmt. Er zeigt lieber weniger, das echt ist.

**Verworfen:** Recherchierte Stiftungen mit erdachten Projekten (gebaut und verworfen), leere App (zeigt nichts).

**Ungueltig, wenn:** nie. Erfundene Beispiele gehoeren in Konzeptpapiere.

---

## E4. Der Prototyp zeigt ohne Anmeldung

**17.09.2026**

**Entscheidung:** `RLS_DEFAULT_CONNECTOR=local`. Wer `trustdonation.org/app` oeffnet, sieht die Musterdaten sofort. Timos eigene Spaces im Web of Trust erreicht er ueber `?connector=wot`.

**Warum:** Der Prototyp ist Pitch-Material. Eine Anmeldemaske vor der ersten Ansicht kostet das Gespraech.

**Verworfen:** WoT als Standard (Anmeldewand), zwei Adressen fuer zwei Zwecke (verwirrt).

**Ungueltig, wenn:** aus dem Prototyp eine benutzte Instanz wird. Dann ist die Anmeldung der Anfang.

---

## E5. Der Marktplatz ist ein Katalog von Items

**17.09.2026**

**Entscheidung:** Module werden als Items beschrieben und veroeffentlicht, nicht als Code nachgeladen. Stufe 1 sind Datenmodule aus Feldern; Codemodule kommen spaeter als signierte Pakete beim Bau der Instanz.

**Warum:** Antons Modul-Register wird vor dem ersten Render einmal zusammengesetzt und eingefroren. Ein Nachladen zur Laufzeit braeche diese Regel und waere zugleich ein offenes Tor fuer fremden Code.

**Verworfen:** Plugins zur Laufzeit laden (bricht die Regel, oeffnet ein Tor), ein eigener Modul-Server (Backend, das wir nicht wollen).

**Ungueltig, wenn:** Anton ein Plugin-Konzept mit eigenen Regeln baut. Er nennt es in Spec 01 ausdruecklich als offene Moeglichkeit.

---

## E6. Das Profil einer Einrichtung ist ihr Space

**17.09.2026**

**Entscheidung:** Stiftungen, Projekte und Netzwerke tragen ihre Angaben in `Group.data`, nach den Vokabularen ihrer Art. Menschen behalten ihr `person`-Item aus Spec 12.

**Warum:** Ein zweites Profil-Item neben dem Space waere eine zweite Wahrheit ueber dieselbe Sache. Wer den Space verwaltet, verwaltet sein Profil; es braucht keine eigene Rechteebene.

**Verworfen:** `organization`-Item neben dem Space (zwei Wahrheiten), Profile nur als Items ohne Spaces (dann fehlt der Arbeitsraum).

**Ungueltig, wenn:** eine Einrichtung mehrere Profile in verschiedenen Netzwerken braucht, die sich unterscheiden. Dann waere die Spiegel-Mechanik aus Spec 09 der Weg.

---

## E7. Die Grenze zum Protokoll

**17.09.2026**

**Entscheidung:** Kein `did:key`, kein JWS, kein Yjs-Aufruf in unserem Code. Wir sprechen mit dem Web of Trust ausschliesslich ueber `DataInterface` und Capabilities.

**Warum:** Jeder Protokoll-Aufruf bindet uns an eine Version. Antons naechster Fortschritt waere dann unser Problem statt unser Gewinn. So ist ein Protokoll-Update ein Paket-Update.

**Verworfen:** Direkter Zugriff fuer Sonderfaelle (jeder Sonderfall wird zur Regel).

**Ungueltig, wenn:** nie, solange wir Antons Connectoren nutzen. `td-tools/pruefen.py` misst die Einhaltung.

---

## E8. Eigene Pakete statt Naehte

**17.09.2026**

**Entscheidung:** `packages/td-core`, `packages/td-ui` und `apps/trustdonation` nehmen unsere Arbeit auf. Antons Pakete werden nur an eingetragenen Naehten beruehrt, jede unter zwanzig Zeilen, jede mit einem Wunsch an ihn.

**Warum:** Die Messung am 17.09. ergab 27 seiner Dateien mit rund 800 geaenderten Zeilen. Jede davon ist eine Stelle, an der ein Update auf unsere Arbeit trifft.

**Verworfen:** So weitermachen (die Kosten steigen mit jeder Zeile), alles als Pull Request an Anton (er will selbst definieren, und manches geht nur uns an), einen eigenen Stack bauen (verwirft seine Arbeit).

**Ungueltig, wenn:** Anton die Haken baut, die wir uns wuenschen. Dann werden aus Naehten Erweiterungen, und die eigenen Pakete bleiben trotzdem richtig.

---

## E9. Die Skills leben im Projekt-Repo

**17.09.2026** · Timo

**Entscheidung:** Alle Skills liegen in `lichtungooo/trustdonation` unter `plugins/`, nach Antons Marketplace-Muster. Der lokale Arbeitsbereich bekommt sie per Spiegelung.

**Warum:** Wer das Projekt klont, soll mitarbeiten koennen. Skills auf einem Rechner sind nicht teilbar, nicht versioniert und beim naechsten Rechnerwechsel weg.

**Verworfen:** Nur lokal (nicht teilbar), in Antons `claude-plugins` (unsere Prozess-Skills handeln davon, wie wir mit seinem Code umgehen, das gehoert nicht in sein Repo).

**Ungueltig, wenn:** nie absehbar.

---

## Wie ein Eintrag entsteht

Sobald eine Entscheidung getroffen ist, die laenger als eine Sitzung wirkt:

1. Naechste Nummer.
2. Datum und wer entschieden hat.
3. Die Entscheidung in **einem** Satz.
4. Das **Warum**, nicht das Was. Das Was steht schon oben.
5. **Verworfene Alternativen** mit dem Grund. Das ist der Teil, der spaeter zaehlt: Ohne ihn wird dieselbe Alternative in sechs Monaten neu vorgeschlagen.
6. **Ungueltig, wenn**: Woran erkennt man, dass die Entscheidung ueberholt ist? Eine Entscheidung ohne Verfallsbedingung wird zum Dogma.

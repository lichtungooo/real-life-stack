# Plan

**Stand:** 17.09.2026
**Grundlage:** [DEFINITION.md](DEFINITION.md), [ARCHITEKTUR.md](ARCHITEKTUR.md), [NAEHTE.md](NAEHTE.md)
**Ziel:** Stiftungen sehen, wie Projekte und Foerderung zueinander finden, und foerdern den Bau.

Jede Etappe schliesst eine Luecke aus [DEFINITION, Teil 5](DEFINITION.md). Jede beginnt mit einem Abschnitt in der Definition und endet mit etwas, das man vorfuehren kann.

---

## Etappe 0: Der Prototyp steht

**Erledigt am 17.09.2026.**

- Antons Stand vom 17.09. als Grundlage, mit Seitenmenue, Aussehen als Achsen und Space-Bild.
- Unsere Netzwerk-Arbeit als zwei eigene Bereiche: **Netzwerk** und **Landingpage**.
- Musterdaten sind Timos eigene Spaces vom Dev-Server: vier Netzwerke, zwei Projekte, eine Stiftung.
- Live auf `trustdonation.org/app`, ohne Login sichtbar.

**Was daraus folgt:** Timo kann vorfuehren, wie Netzwerke, Projekte und Stiftungen zusammenhaengen. Was noch fehlt, ist alles, was eine Stiftung **ueber sich** sagt.

---

## Etappe 0.5: Das eigene Haus

**Luecke:** 27 Dateien von Anton, in die wir hineingeschrieben haben
**Grundlage:** [ARCHITEKTUR.md](ARCHITEKTUR.md), [NAEHTE.md](NAEHTE.md)

Diese Etappe kommt **vor allem anderen**. Jede weitere Zeile im falschen Paket erhoeht die Kosten, und sie kommt nie guenstiger als jetzt.

Heute arbeiten wir in Antons Referenz-App und schreiben in seine Pakete. Danach haben wir ein eigenes Haus, das seine Pakete benutzt.

### Schritte

1. **`apps/trustdonation` anlegen**, aus `apps/reference` abgeleitet. Eigene Komposition, eigenes Routing, eigene Register-Schichten. Damit werden `App.tsx`, `use-workspace-routing.ts` und `config.json` **unsere** Dateien statt Naehte.
2. **`packages/td-core` anlegen**, UI-frei, mit Testgeruest. Zieht die Arten aus `toolkit/src/lib/space-kinds.ts` zu sich.
3. **`packages/td-ui` anlegen**, haengt an `td-core` und an Antons Toolkit.
4. **Unsere Dialog-Bereiche nach `td-ui` ziehen.** Im `group-dialog.tsx` bleibt ein Einhaengepunkt. Aus 383 Zeilen werden etwa 20.
5. **Musterdaten als Seed uebergeben.** `new LocalConnector(unsereMusterdaten)` in unserer App, Antons fuenf Datendateien auf seinen Stand zurueck. Damit fallen auch `demo-data.ts` und `schema-validation.test.ts` weg.
6. **`NAEHTE.md` neu messen.** Aus 27 Dateien sollen fuenf werden, aus rund 800 geaenderten Zeilen unter 60.
7. **Die fuenf Wuensche als Pull Requests** an Anton formulieren, jeder mit dem Anwendungsfall zuerst.

### Stand am 17.09.2026 abends

**Erledigt:**

- `packages/td-core` steht, UI-frei: Musterdaten als Seed, Space-Ordnung, Arten-Regeln, 19 Tests.
- `packages/td-ui` steht: der Arten-Editor, und ein Test wacht darueber, dass Regeln nicht gedoppelt werden.
- **Sieben Datennaehte aufgeloest.** Antons fuenf Datendateien, `demo-data.ts` und `schema-validation.test.ts` stehen wieder auf seinem Stand.
- Das Tor **Grenze** misst jetzt echt und ist gruen: keine Protokoll-Aufrufe in unseren Paketen.

**Bewusst nicht gemacht:** `apps/trustdonation` als eigene App. Die Messung sprach dagegen: `apps/reference` hat 4020 Zeilen, unsere Naehte darin 134. Eine eigene App taeuschte 134 Zeilen Naht gegen 4000 Zeilen Duplikat ein und naehme uns seine Verbesserungen an der Referenz-App.

**Offen und aus gutem Grund:** Die beiden grossen Naehte (`group-dialog` 387, `workspace-switcher` 219) sind genau die Arbeit, die als **PR #379** bei Anton liegt. Sie jetzt umzubauen waere Arbeit, die bei seiner Uebernahme wegfaellt.

### Fertig, wenn

`git diff --numstat <antons-stand>..trustdonation` nennt fuenf Dateien von Anton, jede unter zwanzig Zeilen, jede mit Eintrag in `NAEHTE.md` und einem Wunsch daneben. Und ein Update von Anton laesst sich in einer Sitzung einspielen.

### Was dabei nicht passiert

**Wir bauen keine Kopie seines Toolkits.** Was sein Toolkit kann, benutzen wir. Eine eigene Fassung derselben Komponente ist der teuerste Fehler, den man hier machen kann.

---

## Etappe 1: Eine Stiftung sagt, was sie foerdert

**Luecke:** Felder je Art, Feld-Register
**Definition:** [Teil 6](DEFINITION.md) und [Teil 7](DEFINITION.md)

Heute traegt ein Stiftungs-Space einen Namen, ein Bild und eine Farbe. Danach traegt er Foerderschwerpunkte, einen Foerderrahmen, einen Antragsweg und seine Quelle. Ein Projekt traegt sein Vorhaben.

### Schritte

1. **Feld-Register beschreiben.** Den Abschnitt in der Definition schaerfen: die geschlossene Liste der `shape`-Werte festzurren, an drei echten Feldern durchspielen.
2. **Feld-Manifest bauen** in `packages/td-core`: `id`, `shape`, `multiple`. UI-frei, mit Test fuer die Zusammensetzung (Core, App, Space; Konflikt statt Shadowing).
3. **Feld-Darstellung bauen** in `packages/td-ui`: `label`, `icon`, `input`, `display`, `short`. Mit dem Rueckfall auf die `shape`, wenn kein Eintrag da ist.
4. **Vokabulare anlegen** nach Antons Muster in `docs/spec/schemas/vocab/`: `foundation/v1`, `initiative/v1`. Je `context.jsonld`, `schema.json`, ein gueltiges Beispiel. Die CI prueft sie von selbst.
5. **`vocab` in `spaceKinds`** ergaenzen, additiv. Eine Art ohne `vocab` bleibt gueltig.
6. **Bereich Profil** im Space-Dialog: zeigt die Felder der eigenen Art, aus dem Register gebaut, ohne eine einzige Verzweigung nach Art.
7. **Anzeige** auf der Space-Karte und im Umschalter-Eintrag: die Kurzform der wichtigsten Felder.

### Fertig, wenn

Timo legt eine neue Stiftung an, waehlt die Art Stiftung, und der Dialog fragt ihn nach Foerderschwerpunkten und Foerderrahmen. Niemand hat dafuer eine Zeile Code geschrieben, die das Wort „Stiftung" kennt.

---

## Etappe 2: Ein Projekt sagt, was ihm fehlt

**Luecke:** Angebot und Bedarf
**Definition:** [Teil 6](DEFINITION.md), Vokabular `need/v1`

Ein Bedarf ist ein Item, kein Feld: Ein Projekt hat mehrere, sie haben eigene Fristen, und andere Menschen sollen sie einzeln aufgreifen koennen.

### Schritte

1. **`need/v1` beschreiben und anlegen:** `worum`, `umfang`, `bis`, `art` (Sache, Geld, Zeit, Wissen).
2. **Typ-Register ergaenzen** um `need`, ueber `composeTypeManifest` mit eigener Schicht. Manifest in `td-core`, Darstellung in `td-ui`. Kein Eingriff in Antons Pakete.
3. **Bedarfe erscheinen**, wo ihre Felder hingehoeren: mit `bis` im Kalender, im Feed als Karte, in der Liste. Ueber Feld-Praesenz, nie ueber `type`.
4. **Die Karte zeigt sie am Ort des Projekts**, ueber die Relation zum Space.

### Fertig, wenn

Die Werkstatt am Bahnhof steht auf der Karte, und wer sie anklickt, sieht, dass sechs Werkbaenke fehlen und bis wann.

---

## Etappe 3: Ein Vorschlag mit Gruenden

**Luecke:** Matching
**Definition:** [Teil 10](DEFINITION.md)

### Schritte

1. **`match` als Typ** beschreiben und anlegen, mit den zwei Relationen und der Gruende-Liste.
2. **Die fuenf Grundarten bauen:** Ueberschneidung, Naehe, Rahmen, Zeit, Mensch. Jede ist eine kleine reine Funktion ueber zwei Seiten, jede mit Test.
3. **Die Flaeche:** eine Liste von Vorschlaegen je Space, jeder mit seinen Gruenden im Klartext, mit Annehmen und Verwerfen.
4. **Angenommen wird zur Relation**, verworfen verschwindet und kommt aus demselben Grund nicht wieder.

### Fertig, wenn

Eine Stiftung oeffnet ihren Space und liest: „Werkstatt am Bahnhof, weil Jugend und Handwerk bei beiden stehen, weil Melsungen 18 Kilometer entfernt liegt, und weil 14.000 Euro in Ihren Rahmen passen." Ohne Prozentzahl.

---

## Etappe 4: Module aus anderen Haenden

**Luecke:** Modul-Marktplatz
**Definition:** [Teil 8](DEFINITION.md)

Erst sinnvoll, wenn das Feld-Register steht: Ein Datenmodul besteht aus Feldern.

### Schritte

1. **`module` als Typ** anlegen, mit den Feldern aus Teil 8.
2. **Eine Flaeche**, die Modul-Items in einem Netzwerk zeigt.
3. **Der Weg in eine Instanz:** wie ein Eintrag zur App-Schicht des Modul-Registers wird, beim Bau, nachvollziehbar.
4. **Ein erstes eigenes Datenmodul** als Probe, gebaut nur aus Feldern.

### Fertig, wenn

Jemand ausserhalb unseres Teams beschreibt ein Modul, und wir nehmen es auf, ohne seinen Code zu lesen.

---

## Was daneben laeuft

| Sache | Wann |
|---|---|
| Timo fuellt die Musterdaten mit seinen Stiftungen | laufend, ab jetzt |
| Die Domain des trustdonation-Netzwerks von `wir.ooo` auf `trustdonation.org` | im Bereich Landingpage, ein Klick |
| PR #379 bleibt bei Anton als Vorlage offen | unveraendert |
| PR #6 fuer die Sprach-Skills in `claude-plugins` | unveraendert |
| Die 280 recherchierten Stiftungen auf die Karte | nach Etappe 1, sobald ein Stiftungs-Space Felder traegt |

---

## Was wir jetzt entscheiden sollten

1. **Wohin gehoert diese Definition auf Dauer?** Sie liegt im Prototyp-Branch neben Antons Spec. Das ist richtig, solange wir am Stack bauen. Sobald wir eigene Pakete haben, zieht sie mit.
2. **Bekommt Anton sie zu sehen?** Dafuer spricht, dass er unsere Richtung kennt und widersprechen kann, bevor wir viel bauen. Dagegen spricht nichts, was ich sehe.
3. **Wie weit gehen wir mit `shape`?** Die geschlossene Liste in Teil 7 ist der Kern von Etappe 1. Zu wenige Formen zwingen zu Code, zu viele bauen ein zweites Typsystem neben JSON-Schema.
4. **Wann kommen die 280 Stiftungen auf die Karte, und mit welchen Namen?** Echte Haeuser aus oeffentlicher Recherche, jeweils mit Quelle, oder erst nach der Ansprache.

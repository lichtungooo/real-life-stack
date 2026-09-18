# Nähte

**Stand:** 17.09.2026, gemessen gegen Antons `f9c56fff`
**Regeln:** [ARCHITEKTUR.md, Teil 4](ARCHITEKTUR.md)

Eine **Naht** ist eine Stelle, an der wir Antons Code ändern, weil kein Haken dafür da ist. Nähte sind erlaubt. Unbenannte Nähte sind es nicht.

Diese Datei ist vollständig. Wer Antons Code ändert, trägt hier ein.

## Zahlen

| | 17.09. morgens | 17.09. abends | Ziel |
|---|---:|---:|---:|
| Dateien von Anton, die wir ändern | 27 | 21 | 5 |
| Geänderte Zeilen in seinen Dateien | rund 800 | rund 790 | unter 60 |
| Nähte mit offenem Wunsch an Anton | 0 | 8 | alle |

Die sieben Datennähte sind vollständig weg. Die beiden großen (A1, A2) stehen noch: Sie sind genau die Arbeit, die als **PR #379** bei Anton liegt. Sie jetzt umzubauen wäre Arbeit, die bei seiner Übernahme wegfällt.

Gemessen wird nicht von Hand: `python td-tools/anton-stand.py`.

---

## A. Nähte, die bleiben sollen

Stellen, an denen ein Haken fehlt und wir ihn uns wünschen.

### A1. Bereiche im Space-Dialog

| | |
|---|---|
| **Datei** | `packages/toolkit/src/components/layout/group-dialog.tsx` |
| **Umfang heute** | +383 / -4 |
| **Was wir tun** | Zwei Bereiche eingesetzt (Netzwerk, Landingpage), `SpaceConfigSectionId` erweitert, `spaceConfigSections` um `isNetwork` ergänzt, `sectionCounts` erweitert, zwei Inhalts-Blöcke eingefügt |
| **Warum kein Haken** | `spaceConfigSections` ist eine feste Funktion, kein Register mit Schichten. Die Inhalts-Blöcke stehen direkt im Dialog. |
| **Risiko bei Update** | **hoch.** Antons meistbearbeitete Datei. Jede Umgestaltung des Dialogs trifft uns. |
| **Wunsch an Anton** | Das Muster, das er beim Modul- und Typ-Register selbst gewählt hat, auch hier: `composeSpaceConfigSections(layers)` mit Core- und App-Schicht, und je Bereich ein Inhalts-Slot. Dann liefert unsere App ihre zwei Bereiche als Schicht, und seine Datei bleibt unberührt. |
| **Zwischenschritt** | Die 383 Zeilen nach `td-ui` ziehen. Im Dialog bleibt ein Aufruf je Bereich. Aus 383 werden etwa 20. |

### A2. Gliederung im Space-Wechsel

| | |
|---|---|
| **Datei** | `packages/toolkit/src/components/layout/workspace-switcher.tsx` |
| **Umfang heute** | +173 / -46 |
| **Was wir tun** | Netzwerke als eigener Abschnitt, aktives Netzwerk, Gliederung der Spaces nach Art |
| **Warum kein Haken** | Die Komponente baut ihre Abschnitte selbst. |
| **Risiko bei Update** | **hoch.** Die 46 gelöschten Zeilen sind seine, das heißt wir haben umgebaut, nicht nur ergänzt. |
| **Wunsch an Anton** | Die Gliederung steht inzwischen in seiner eigenen Spec ([01, Space-Wechsel nach Netzwerk und Art](spec/01-app-composition.md)). Der saubere Weg ist, sie ihm als Pull Request anzubieten (das ist PR #379) und danach seine Fassung zu nehmen. |
| **Zwischenschritt** | Keiner. Diese Naht löst sich, wenn Anton die Gliederung übernimmt, oder sie bleibt groß. |

### A3. Zuhause-Space in der Laufzeit-Konfiguration

| | |
|---|---|
| **Dateien** | `packages/toolkit/src/lib/runtime-config.ts` (+22), `packages/toolkit/src/index.ts` (+2), `packages/toolkit/tests/runtime-config.test.ts` (+26) |
| **Was wir tun** | `homeSpaceId` gelesen und geprüft, `parseHomeSpaceId` exportiert |
| **Warum kein Haken** | Die Konfiguration hat ein festes Feld-Set. |
| **Risiko bei Update** | **niedrig.** Additiv, an einer ruhigen Stelle. |
| **Wunsch an Anton** | Teil von PR #379. Steht bereits in seiner Spec 11. |

### A4. Arten eines Netzwerks

| | |
|---|---|
| **Datei** | `packages/toolkit/src/lib/space-kinds.ts` (neu, 100 Zeilen) |
| **Was wir tun** | Eine **neue** Datei in seinem Paket: Prüfung der Arten-Liste, Schlüsselbildung |
| **Warum kein Haken** | Sie liegt im Toolkit, weil Dialog und Umschalter sie brauchen. |
| **Risiko bei Update** | **keins.** Eine neue Datei kollidiert nicht. Sie ist trotzdem eine Naht, weil sie in seinem Paket liegt. |
| **Wunsch an Anton** | Teil von PR #379. |
| **Zwischenschritt** | Nach `td-core` ziehen. Sie ist UI-frei und gehört dorthin. Danach ist sie keine Naht mehr. |

### A5. Musterdaten-Version

| | |
|---|---|
| **Datei** | `packages/local-connector/src/local-connector.ts` (+1 / -1) |
| **Was wir tun** | `SEED_VERSION` von 3 auf 4 |
| **Warum kein Haken** | Die Zahl gehört zum Connector, die Daten gehören uns. |
| **Risiko bei Update** | **mittel.** Aendert Anton seine Musterdaten, setzt er dieselbe Zahl, und wir kollidieren in einer Zeile. Leicht zu lösen, leicht zu übersehen. |
| **Wunsch an Anton** | Die Version an den **Seed** binden statt an den Connector: Wer einen eigenen Seed übergibt, gibt seine eigene Version mit. Dann stempelt jeder Datensatz sich selbst. |
| **Merke** | Solange diese Naht steht: bei **jeder** Datenänderung hochsetzen, siehe `memory/feedback_seed_version.md`. |

---

## B. Nähte, die verschwinden

Stellen, die nur deshalb Nähte sind, weil wir in Antons Referenz-App gearbeitet haben. Mit `apps/trustdonation` werden es unsere eigenen Dateien.

| Datei | Umfang | Was wir tun | Danach |
|---|---|---|---|
| `apps/reference/src/App.tsx` | +87 / -13 | Komposition, Connector-Wahl, Musterdaten, Beispieldaten-Hinweis, Stiftungs-Import | unsere Datei |
| `apps/reference/src/hooks/use-workspace-routing.ts` | +78 / -11 | Ordnung der Spaces, Netzwerk-Felder | unsere Datei |
| `apps/reference/public/config.json` | neu | Testkonfiguration | unsere Datei |
| `apps/reference/src/index.css` | +6 | `@source` für `packages/td-ui`: Ohne die Zeile erzeugt Tailwind unsere Klassen nicht, und jede Fläche aus `td-ui` steht ohne Gestaltung da | unsere Datei |
| `packages/toolkit/src/components/layout/workspace-switcher.stories.tsx` | +37 | Beispiele für die Gliederung | zieht mit A2 |
| `packages/toolkit/docs/UI-REQUIREMENTS.md` | +6 | Notiz zu den Bereichen | zieht nach `td-ui` |

---

## C. Nähte in Daten: erledigt

**Am 17.09.2026 aufgelöst.** Fünf Datendateien mit 990 geänderten Zeilen, dazu `demo-data.ts` und `schema-validation.test.ts`.

Die Musterdaten liegen jetzt in `packages/td-core/daten/` und gehen als Seed an den Connector:

```ts
new LocalConnector(musterdaten)
new MockConnector(musterdaten)
```

Antons Dateien stehen wieder auf seinem Stand. Ein Update seiner Demodaten trifft uns nicht mehr.

---

## H. Zugang und Geschwindigkeit

Drei echte Fehler, gefunden am 17.09.2026 von `td-tools/zugang.py` und `td-tools/startlast.py`. Alle behoben. **Diese drei gehören Anton**: Es sind Fehler in seiner Referenz-App, keine Eigenheiten unseres Prototyps.

| Datei | Umfang | Was wir tun | Wunsch an Anton |
|---|---|---|---|
| `apps/reference/index.html` | 1 Zeile | `user-scalable=no` und `maximum-scale=1` entfernt | Als PR anbieten. Zoomen abzuschalten trifft jeden, der vergrößern muss, um zu lesen (WCAG 1.4.4). |
| `apps/reference/src/App.tsx` | 8 Zeilen | Der Hell-Dunkel-Umschalter hat einen Namen bekommen; eine Überschrift erster Ordnung steht in der Leiste | Als PR anbieten. Ein Screenreader las vorher nur "Schaltfläche", und die Seite hatte keinen Anfang zum Anspringen. |
| `apps/reference/src/module-register.tsx` | 24 Zeilen | Die Karte wird nachgeladen statt mitgeliefert. Dazu unsere Schicht `trustdonation` mit dem Modul `baukasten` | Die Karte als PR anbieten (die Kartenbibliothek wiegt ein Megabyte). Die eigene Schicht bleibt: Sie ist genau der Erweiterungspunkt, den Anton vorgesehen hat. |

| `packages/toolkit/src/index.ts` | 1 Zeile plus Notiz | `resolveAdminView` wird exportiert | **Als PR anbieten.** Die Baukasten-Fläche stellt dieselbe Frage wie der Space-Dialog (darf dieser Mensch die Module wählen?) und soll dieselbe Antwort bekommen. Ohne den Export müssten wir die Regel doppeln, und zwei Antworten auf eine Frage laufen auseinander. Die Funktion kennt einen Sonderfall, den niemand zweimal richtig baut: Liefert ein Connector keine Admin-Angabe, gilt das erste Mitglied. |

**Messbar geworden:** Zugang von drei Verstößen (zwei schwer) auf null. Startlast von 1596 KB auf 864 KB, vor allem weil ein Avatar mit 733 KB in den Musterdaten steckte; er ist jetzt 3 KB und liegt in unserem Paket.

---

## D. Nähte in Tests

Der schwerste Fall: Wir haben eine Regel von Anton geändert.

### D1. Bereiche des Space-Dialogs

| | |
|---|---|
| **Datei** | `packages/toolkit/tests/space-config-sections.test.ts` (+31 / -4) |
| **Was wir tun** | Vier seiner Erwartungen um `"netzwerk"` erweitert, drei eigene Fälle für `"landing"` ergänzt |
| **Warum unsere Regel richtiger ist** | Sie ist es **nicht**. Seine Tests beschreiben seine Bereichsliste korrekt; wir haben die Liste erweitert und darum seine Erwartungen mitgezogen. Das ist ehrlich, aber es heißt: **Nach einem Update seiner Bereiche kollidieren genau diese vier Zeilen.** |
| **Lösung** | Mit dem Haken aus A1 wären es zwei getrennte Testdateien: seine für die Core-Schicht, unsere für unsere. Dann kollidiert nichts. |

### D2. Schema-Validierung

Siehe Teil C. Fällt mit den Musterdaten weg.

---

## E. Unsere Spec-Ergänzungen

| Datei | Umfang |
|---|---|
| `docs/spec/01-app-composition.md` | +13 |
| `docs/spec/04-items-relations-groups-spaces.md` | +26 |
| `docs/spec/11-runtime-config-und-branding.md` | +14 |

Diese drei sind **Antons normativer Bereich**. Wir haben hineingeschrieben, weil die Arbeit Teil von PR #379 war und eine Spec-Aenderung dazugehört.

Solange der PR offen ist, bleiben sie. Wird er nicht übernommen, ziehen die Inhalte nach [DEFINITION.md](DEFINITION.md) und die drei Dateien gehen auf seinen Stand zurück. **Unsere Definition steht in unserer Datei, nicht in seiner Spec.**

---

## F. Nähte in der Auslieferung

Gefunden am 17.09.2026 vom Bericht `td-tools/anton-stand.py`, der sie im Register vermisste. Alle tragen dieselbe Sache: **das Start-Netzwerk der Instanz** (`RLS_HOME_SPACE_ID`, Spec 11).

| Datei | Umfang | Was wir tun |
|---|---|---|
| `deploy/app/entrypoint.sh` | +5 | schreibt `homeSpaceId` in die `config.json` |
| `deploy/app/docker-compose.yml` | +2 | reicht die Variable an den Container |
| `deploy/app/docker-compose.preview.yml` | +1 | dasselbe für die Vorschau |
| `deploy/app/.env.example` | +5 | dokumentiert sie |
| `deploy/app/README.md` | +11 | erklärt sie |

| | |
|---|---|
| **Risiko bei Update** | **niedrig.** Alles additiv, an ruhigen Stellen. |
| **Wunsch an Anton** | Teil von PR #379, zusammen mit A3. Fällt weg, sobald er `homeSpaceId` übernimmt. |

## I. Der Bau kennt unsere Pakete

| | |
|---|---|
| **Datei** | `deploy/app/Dockerfile` (+5 / -0) |
| **Was wir tun** | `packages/td-core/package.json` und `packages/td-ui/package.json` in die Abhängigkeits-Schicht aufgenommen |
| **Warum kein Haken** | Der Bau kopiert jede `package.json` einzeln, damit die Schicht im Cache bleibt, solange sich keine Abhängigkeit ändert. Eine Liste, die jedes Paket nennt, muss jedes Paket nennen. |
| **Risiko bei Update** | **niedrig.** Zwei Zeilen an einer Liste. Aendert Anton die Liste, ist der Konflikt in einer Minute gelöst. |
| **Wunsch an Anton** | Keiner mit Nachdruck. Ein `COPY packages/*/package.json` ginge nicht (Docker flacht das Ziel ein), und seine Lösung ist bewusst gewählt. |
| **Merke** | **Bei jedem neuen Paket den Dockerfile ergänzen.** Lokal fällt es nicht auf, weil dort alles installiert ist; der Server-Bau bricht erst ab, wenn das neue Paket etwas importiert. Das hat einen Durchgang gekostet. |

## G. Wegweiser

| | |
|---|---|
| **Datei** | `AGENTS.md` (+1 / -0) |
| **Was wir tun** | Eine Zeile, die auf `docs/DEFINITION.md`, `docs/ARCHITEKTUR.md`, `docs/NAEHTE.md` und `docs/PLAN.md` verweist |
| **Warum kein Haken** | Die Datei ist der Einstieg für jeden Agenten im Repo. Ohne den Verweis findet niemand unsere Ebene. |
| **Risiko bei Update** | **niedrig.** Eine Zeile an einer Liste. |
| **Wunsch an Anton** | Keiner. Diese Naht bleibt, solange wir in seinem Repo arbeiten, und kostet nichts. |

## Wie eingetragen wird

Bei jeder Aenderung an einer Datei von Anton, vor dem Commit:

1. **Steht sie schon hier?** Dann Umfang nachziehen.
2. **Neu?** Abschnitt anlegen, nach dem Raster aus A: Datei, Umfang, Was wir tun, Warum kein Haken, Risiko, Wunsch an Anton, Zwischenschritt.
3. **Zahlen oben nachziehen.**
4. Wachsen die Nähte, ohne dass ein Wunsch unterwegs ist: anhalten und fragen, ob es doch einen Haken gibt.

Gemessen wird nicht von Hand:

```bash
python td-tools/anton-stand.py
```

Der Bericht zählt die Nähte, gleicht sie mit dieser Datei ab und nennt jede Datei, die hier fehlt. Er hat die Abschnitte F und G selbst gefunden.

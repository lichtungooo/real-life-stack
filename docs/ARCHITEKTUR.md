# Architektur

**Status:** Beschluss, 17.09.2026
**Gilt für:** trustdonation, Branch `trustdonation` in `lichtungooo/real-life-stack`
**Ergänzt:** [DEFINITION.md](DEFINITION.md) sagt *was* wir bauen, diese Datei sagt *wo es steht und wie es zusammenhängt*

---

## Teil 1: Die Frage, die alles entscheidet

Wir bauen eigenständig weiter, und Anton baut weiter. Beides soll wahr bleiben.

Daraus folgt genau eine Frage, an der diese Architektur hängt:

> **Was passiert mit unserer Arbeit, wenn Anton morgen seine Dateien ändert?**

Heute ist die Antwort unbequem. Die Messung vom 17.09.2026, unser Branch gegen Antons Stand `f9c56fff`:

| | Dateien |
|---|---:|
| Dateien, die wir **neu** angelegt haben | 6 |
| Dateien **von Anton**, in die wir hineingeschrieben haben | 27 |

Die größten Eingriffe: `group-dialog.tsx` (+387 Zeilen), `workspace-switcher.tsx` (+219), `use-workspace-routing.ts` (+89), dazu fünf Datendateien und `App.tsx`.

**Jede dieser 27 Dateien ist eine Stelle, an der ein Update von Anton auf unsere Arbeit trifft.** Das ist heute tragbar, weil wir eingefroren sind. Sobald wir Antons Protokoll-Fortschritt wollen, wird es teuer.

Die Architektur beantwortet die Frage in drei Bewegungen:

1. **Was über einen Haken geht, geht über den Haken.** Anton bietet mehr an, als wir bisher genutzt haben.
2. **Was keinen Haken hat, wird eine Naht**: eine benannte, gezählte, so klein wie mögliche Stelle, mit einem Wunsch an Anton daneben.
3. **Was uns allein gehört, lebt in eigenen Paketen**, die seine als Abhängigkeit nehmen.

---

## Teil 2: Die Haken, die es gibt

Geprüft am Code, nicht an der Spec.

| Haken | Wo | Was damit geht |
|---|---|---|
| `composeModules(layers)` + `setModuleRegistry` | `toolkit/src/lib/module-register.ts` | **eigene Module** einbringen, Core plus App-Schicht, additiv, Konflikt statt Shadowing |
| `composeTypeManifest(layers)` | `data-interface/src/type-manifest.ts` | **eigene Item-Typen** einbringen, `CORE_TYPE_LAYER` plus eigene Schicht |
| Typ-Darstellung | `toolkit/src/components/preview/type-presentation.tsx` | **Aussehen eigener Typen**, an Manifest-Ids gehängt |
| `registerIcon` | `toolkit/src/lib/icons.ts` | eigene Symbole |
| Connector-Seed | `new LocalConnector(seed)`, `new MockConnector(seed)` | **eigene Musterdaten** als Parameter, ohne Antons Datendateien anzufassen |
| Laufzeit-Konfiguration | `config.json`, `Branding`, `homeSpaceId` | was eine Instanz unterscheidet |
| `Group.data` | Spec 04 | eigene Space-Felder, additiv erweiterbar |
| `item.data` und `@context` | Spec 06 | eigene Item-Felder über eigene Vokabulare |
| Tags | Spec 07 | kategorisieren ohne neuen Typ |

Vorbilder in Antons eigener App: `apps/reference/src/module-register.tsx` setzt `composeModules([CORE, APP_LAYER])`, `apps/reference/src/type-register.tsx` setzt `composeTypeManifest([CORE_TYPE_LAYER, APP_TYPE_LAYER])`. **Er hat den Weg vorgemacht.** Wir sind ihn bisher nicht gegangen, weil wir in seiner Referenz-App gearbeitet haben statt in einer eigenen.

---

## Teil 3: Der Paketschnitt

```text
packages/data-interface      Anton   Vertrag, Items, Typ-Manifest
packages/toolkit             Anton   Oberflaeche, Modul-Register, Hooks
packages/local-connector     Anton   Browser-Speicher
packages/mock-connector      Anton   Pruefstand
packages/wot-connector       Anton   Identitaet, Begegnung, Sync
apps/reference               Anton   seine Referenz-App

packages/td-core             wir     UI-frei: Arten, Feld-Manifest, Vokabulare, Typ-Schicht
packages/td-ui               wir     Darstellung: Feld-Widgets, unsere Dialog-Bereiche, Komponenten
apps/trustdonation           wir     die App: Komposition, Register-Schichten, Musterdaten, Routing
```

Regeln:

1. **Die Abhängigkeit zeigt in eine Richtung.** Unsere Pakete kennen Antons, nie umgekehrt. `td-ui` kennt `td-core`, nie umgekehrt: dieselbe Trennung wie bei ihm, aus demselben Grund (Muster 2 in der Definition).
2. **`td-core` bleibt frei von React.** Ein Connector oder ein Prüfwerkzeug soll es lesen können, ohne eine Oberfläche zu laden.
3. **`apps/trustdonation` ist die einzige Stelle, die komponiert.** Dort werden die Register-Schichten zusammengesetzt, der Connector gebaut und die Musterdaten übergeben. Keine Komposition in einem Paket.
4. **Antons Pakete bleiben unberührt**, außer an einer eingetragenen Naht (Teil 4).
5. **Wir bauen keine Kopie.** Was Antons Toolkit schon kann, benutzen wir. Eine eigene Fassung derselben Komponente ist der teuerste Fehler, den man hier machen kann.

### Was wo hingehört

| Sache | Paket |
|---|---|
| Arten eines Netzwerks, Prüfung, Schlüsselbildung | `td-core` |
| Feld-Manifest (`id`, `shape`, `multiple`) | `td-core` |
| Vokabulare (`foundation/v1`, `initiative/v1`, `need/v1`) | `td-core`, Schemas unter `docs/spec/schemas/vocab/` |
| Typ-Schicht für `need`, `match`, `module` | `td-core` |
| Matching-Regeln (reine Funktionen über zwei Seiten) | `td-core` |
| Feld-Darstellung (`label`, `icon`, `input`, `display`, `short`) | `td-ui` |
| Unsere Bereiche im Space-Dialog | `td-ui` |
| Unsere Module (Flächen) | `td-ui` |
| Register-Schichten zusammensetzen | `apps/trustdonation` |
| Musterdaten | `apps/trustdonation` |
| Instanz-Konfiguration, Compose, Landing | Repo `lichtungooo/trustdonation` |

---

## Teil 4: Nähte

Eine **Naht** ist eine Stelle, an der wir Antons Code ändern, weil kein Haken dafür da ist.

Nähte sind erlaubt. Unbenannte Nähte sind es nicht.

### Regeln

1. **Jede Naht steht in [NAEHTE.md](NAEHTE.md).** Mit Datei, Umfang, Grund, dem fehlenden Haken und dem Risiko bei einem Update. Eine Aenderung an Antons Code ohne Eintrag ist ein Fehler.
2. **Eine Naht ist so klein wie möglich.** Nicht 387 Zeilen in seinem Dialog, sondern ein Aufruf, der unsere Bereiche einhängt. Der Unterschied bei einem Konflikt ist der zwischen einer Minute und einem Tag.
3. **Jede Naht hat einen Wunsch.** Welchen Haken bräuchten wir, damit sie verschwindet? Der Wunsch wird ein Pull Request an Anton, mit dem Anwendungsfall zuerst.
4. **Eine Naht in einer Datendatei ist immer vermeidbar.** Musterdaten gehen als Seed-Parameter.
5. **Eine Naht in einer Testdatei bedeutet, dass wir seine Regel geändert haben.** Das ist der schwerste Fall und braucht einen Satz im Eintrag, warum unsere Regel richtiger ist.
6. **Vor jedem Update werden die Nähte gezählt.** Wachsen sie, ohne dass ein Wunsch unterwegs ist, halten wir an.

### Der Weg von einer Aenderung zu einer Naht

Wenn etwas in Antons Datei muss:

1. **Gibt es einen Haken?** Teil 2 prüfen. Meistens ja.
2. **Geht es in unserer App statt in seiner?** Dann ist es keine Naht, sondern unsere Datei.
3. **Lässt sich der Eingriff auf einen Einhängepunkt zusammenziehen?** Ein Aufruf bei ihm, der Inhalt bei uns.
4. **Eintragen**, mit Wunsch.

---

## Teil 5: Wie ein Update von Anton ankommt

Ein wiederholbarer Ablauf. Er hat ein Tor: Er bricht ab, statt einen kaputten Stand auszuliefern.

```text
1  Antons Stand holen          git fetch origin master
2  Naehte zaehlen              welche seiner Aenderungen treffen unsere Eintraege
3  Zusammenfuehren             Konflikte nur an eingetragenen Naehten erwartet
4  Tor 1: Typen                pnpm build
5  Tor 2: Regeln               pnpm -r test
6  Tor 3: Augenschein          Prototyp lokal, die fuenf Spaces stehen
7  Musterdaten                 SEED_VERSION hoch, wenn Daten sich aenderten
8  Bauen und ausliefern        Image proto-N+1
9  Nachtragen                  NAEHTE.md, Stand, was unterwegs schiefging
```

Regeln:

1. **Ein Konflikt außerhalb der eingetragenen Nähte ist ein Signal**, kein Ärgernis: Dort ist eine Naht entstanden, die niemand eingetragen hat. Erst eintragen, dann lösen.
2. **Kein Tor wird übersprungen.** Ein grüner Build ohne grüne Tests sagt nichts über die Regeln, die wir geändert haben.
3. **Der Prototyp bleibt eingefroren, bis das Update durch ist.** Live steht immer ein Stand, der durch alle Tore gegangen ist.

---

## Teil 6: Der Vertrag nach außen

Drei Dinge ändern sich unabhängig von uns. Für jedes gibt es genau eine Stelle, an der wir es berühren.

| Was sich ändert | Wo es uns erreicht | Was uns schützt |
|---|---|---|
| **Web of Trust** (Identität, Begegnung, Sync, Protokoll) | `@real-life-stack/wot-connector`, darunter `@web_of_trust/core` und `@web_of_trust/adapter-yjs` | Wir sprechen **nie** direkt mit WoT. Immer über `DataInterface` und Capabilities. Ein Protokoll-Update ist dann ein Paket-Update. |
| **Antons Stack** (Toolkit, Register, Hooks) | Antons Pakete | Haken statt Nähte, und die Nähte gezählt |
| **Die Spec** | `docs/spec/` | Bei Widerspruch gewinnt sie. Unsere Definition wird berichtigt, nicht seine Spec. |

Die wichtigste Regel dieses Teils, und sie ist absolut:

> **Kein `did:key`, kein JWS, kein Yjs-Aufruf in unserem Code.**

Wer diese Grenze bricht, bindet uns an eine Protokollversion, und Antons nächster Fortschritt wird zu unserem Problem. Der einzige Ort, an dem wir Yjs angefasst haben, war ein Werkzeug zum Auslesen der IndexedDB, und das lief außerhalb der App.

### Woran wir merken, dass die Grenze hält

Eine Suche nach `did:key`, `Y.Doc`, `applyUpdate` oder `@web_of_trust` in `packages/td-*` und `apps/trustdonation` muss leer bleiben. Das ist ein Test, kein Vorsatz.

---

## Teil 7: Was Qualität hier heißt

Sieben Tore, an denen wir messen, ob die Arbeit trägt.

| Tor | Messung | Heute |
|---|---|---|
| **Typen** | `pnpm build` ohne Fehler | grün |
| **Regeln** | `pnpm -r test` ohne Fehler | grün, 949 Toolkit-Tests |
| **Spec** | Schema-Validierung der Vokabulare und Musterdaten in der CI | grün |
| **Nähte** | Zahl der Einträge in NAEHTE.md, mit Wunsch | 27 Dateien, Reduktion geplant |
| **Grenze** | keine Protokoll-Aufrufe in unseren Paketen | noch kein Test |
| **Augenschein** | der Prototyp zeigt, was er zeigen soll | täglich |
| **Gedächtnis** | Stand gepflegt, Erfahrungen eingetragen | nach jeder Runde |

Was **nicht** Qualität heißt: Abdeckung in Prozent, Zeilenzahl, Zahl der Module. Wir messen, was bricht, wenn es fehlt.

---

## Teil 8: Wer wir sind, wenn wir bauen

Fünf Haltungen, die diese Architektur voraussetzt.

1. **Wir sind Gast in Antons Haus und Herr im eigenen.** Sein Code wird respektiert, unserer verantwortet. Die Grenze ist das Naht-Register.
2. **Wir bauen erst die eine Quelle, dann die Fläche.** Jede Frage bekommt ein Register. Eine zweite Liste ist ein Fehler, kein Kompromiss.
3. **Wir schreiben auf, was schiefging.** Die drei Fallen von heute (Seed-Version, Item in zwei Spaces, Variable nicht durchgereicht) haben zusammen zwei Stunden gekostet und stehen jetzt an drei Stellen, damit sie es nie wieder tun.
4. **Wir liefern nur aus, was durch alle Tore ging.** Ein schneller Stand, der live bricht, kostet mehr als ein langsamer.
5. **Wir erfinden nichts in die Daten hinein.** Ein Prototyp zeigt, was wirklich angelegt wurde.

---

## Teil 9: Der Weg dorthin

Der heutige Stand ist nicht diese Architektur. Der Weg ist eine eigene Etappe, und sie kommt vor allem anderen, weil jede weitere Zeile im falschen Paket die Kosten erhöht.

Sie steht als **Etappe 0.5** in [PLAN.md](PLAN.md).

Kurz:

1. `apps/trustdonation` anlegen, aus `apps/reference` abgeleitet. Danach sind Routing, Komposition und Musterdaten **unsere** Dateien statt Nähte.
2. `packages/td-core` und `packages/td-ui` anlegen, leer, mit Testgeruest.
3. Unsere Dialog-Bereiche nach `td-ui` ziehen, im Toolkit bleibt ein Einhängepunkt.
4. Arten und Netzwerk-Logik nach `td-core` ziehen.
5. Musterdaten als Seed übergeben, Antons Datendateien zurücksetzen.
6. `NAEHTE.md` füllen und die Zahl messen: aus 27 sollen fünf werden.
7. Die Wünsche als Pull Requests an Anton formulieren.

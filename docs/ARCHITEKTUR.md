# Architektur

**Status:** Beschluss, 17.09.2026
**Gilt fuer:** trustdonation, Branch `trustdonation` in `lichtungooo/real-life-stack`
**Ergaenzt:** [DEFINITION.md](DEFINITION.md) sagt *was* wir bauen, diese Datei sagt *wo es steht und wie es zusammenhaengt*

---

## Teil 1: Die Frage, die alles entscheidet

Wir bauen eigenstaendig weiter, und Anton baut weiter. Beides soll wahr bleiben.

Daraus folgt genau eine Frage, an der diese Architektur haengt:

> **Was passiert mit unserer Arbeit, wenn Anton morgen seine Dateien aendert?**

Heute ist die Antwort unbequem. Die Messung vom 17.09.2026, unser Branch gegen Antons Stand `f9c56fff`:

| | Dateien |
|---|---:|
| Dateien, die wir **neu** angelegt haben | 6 |
| Dateien **von Anton**, in die wir hineingeschrieben haben | 27 |

Die groessten Eingriffe: `group-dialog.tsx` (+387 Zeilen), `workspace-switcher.tsx` (+219), `use-workspace-routing.ts` (+89), dazu fuenf Datendateien und `App.tsx`.

**Jede dieser 27 Dateien ist eine Stelle, an der ein Update von Anton auf unsere Arbeit trifft.** Das ist heute tragbar, weil wir eingefroren sind. Sobald wir Antons Protokoll-Fortschritt wollen, wird es teuer.

Die Architektur beantwortet die Frage in drei Bewegungen:

1. **Was ueber einen Haken geht, geht ueber den Haken.** Anton bietet mehr an, als wir bisher genutzt haben.
2. **Was keinen Haken hat, wird eine Naht**: eine benannte, gezaehlte, so klein wie moegliche Stelle, mit einem Wunsch an Anton daneben.
3. **Was uns allein gehoert, lebt in eigenen Paketen**, die seine als Abhaengigkeit nehmen.

---

## Teil 2: Die Haken, die es gibt

Geprueft am Code, nicht an der Spec.

| Haken | Wo | Was damit geht |
|---|---|---|
| `composeModules(layers)` + `setModuleRegistry` | `toolkit/src/lib/module-register.ts` | **eigene Module** einbringen, Core plus App-Schicht, additiv, Konflikt statt Shadowing |
| `composeTypeManifest(layers)` | `data-interface/src/type-manifest.ts` | **eigene Item-Typen** einbringen, `CORE_TYPE_LAYER` plus eigene Schicht |
| Typ-Darstellung | `toolkit/src/components/preview/type-presentation.tsx` | **Aussehen eigener Typen**, an Manifest-Ids gehaengt |
| `registerIcon` | `toolkit/src/lib/icons.ts` | eigene Symbole |
| Connector-Seed | `new LocalConnector(seed)`, `new MockConnector(seed)` | **eigene Musterdaten** als Parameter, ohne Antons Datendateien anzufassen |
| Laufzeit-Konfiguration | `config.json`, `Branding`, `homeSpaceId` | was eine Instanz unterscheidet |
| `Group.data` | Spec 04 | eigene Space-Felder, additiv erweiterbar |
| `item.data` und `@context` | Spec 06 | eigene Item-Felder ueber eigene Vokabulare |
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

1. **Die Abhaengigkeit zeigt in eine Richtung.** Unsere Pakete kennen Antons, nie umgekehrt. `td-ui` kennt `td-core`, nie umgekehrt: dieselbe Trennung wie bei ihm, aus demselben Grund (Muster 2 in der Definition).
2. **`td-core` bleibt frei von React.** Ein Connector oder ein Pruefwerkzeug soll es lesen koennen, ohne eine Oberflaeche zu laden.
3. **`apps/trustdonation` ist die einzige Stelle, die komponiert.** Dort werden die Register-Schichten zusammengesetzt, der Connector gebaut und die Musterdaten uebergeben. Keine Komposition in einem Paket.
4. **Antons Pakete bleiben unberuehrt**, ausser an einer eingetragenen Naht (Teil 4).
5. **Wir bauen keine Kopie.** Was Antons Toolkit schon kann, benutzen wir. Eine eigene Fassung derselben Komponente ist der teuerste Fehler, den man hier machen kann.

### Was wo hingehoert

| Sache | Paket |
|---|---|
| Arten eines Netzwerks, Pruefung, Schluesselbildung | `td-core` |
| Feld-Manifest (`id`, `shape`, `multiple`) | `td-core` |
| Vokabulare (`foundation/v1`, `initiative/v1`, `need/v1`) | `td-core`, Schemas unter `docs/spec/schemas/vocab/` |
| Typ-Schicht fuer `need`, `match`, `module` | `td-core` |
| Matching-Regeln (reine Funktionen ueber zwei Seiten) | `td-core` |
| Feld-Darstellung (`label`, `icon`, `input`, `display`, `short`) | `td-ui` |
| Unsere Bereiche im Space-Dialog | `td-ui` |
| Unsere Module (Flaechen) | `td-ui` |
| Register-Schichten zusammensetzen | `apps/trustdonation` |
| Musterdaten | `apps/trustdonation` |
| Instanz-Konfiguration, Compose, Landing | Repo `lichtungooo/trustdonation` |

---

## Teil 4: Naehte

Eine **Naht** ist eine Stelle, an der wir Antons Code aendern, weil kein Haken dafuer da ist.

Naehte sind erlaubt. Unbenannte Naehte sind es nicht.

### Regeln

1. **Jede Naht steht in [NAEHTE.md](NAEHTE.md).** Mit Datei, Umfang, Grund, dem fehlenden Haken und dem Risiko bei einem Update. Eine Aenderung an Antons Code ohne Eintrag ist ein Fehler.
2. **Eine Naht ist so klein wie moeglich.** Nicht 387 Zeilen in seinem Dialog, sondern ein Aufruf, der unsere Bereiche einhaengt. Der Unterschied bei einem Konflikt ist der zwischen einer Minute und einem Tag.
3. **Jede Naht hat einen Wunsch.** Welchen Haken braeuchten wir, damit sie verschwindet? Der Wunsch wird ein Pull Request an Anton, mit dem Anwendungsfall zuerst.
4. **Eine Naht in einer Datendatei ist immer vermeidbar.** Musterdaten gehen als Seed-Parameter.
5. **Eine Naht in einer Testdatei bedeutet, dass wir seine Regel geaendert haben.** Das ist der schwerste Fall und braucht einen Satz im Eintrag, warum unsere Regel richtiger ist.
6. **Vor jedem Update werden die Naehte gezaehlt.** Wachsen sie, ohne dass ein Wunsch unterwegs ist, halten wir an.

### Der Weg von einer Aenderung zu einer Naht

Wenn etwas in Antons Datei muss:

1. **Gibt es einen Haken?** Teil 2 pruefen. Meistens ja.
2. **Geht es in unserer App statt in seiner?** Dann ist es keine Naht, sondern unsere Datei.
3. **Laesst sich der Eingriff auf einen Einhaengepunkt zusammenziehen?** Ein Aufruf bei ihm, der Inhalt bei uns.
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

1. **Ein Konflikt ausserhalb der eingetragenen Naehte ist ein Signal**, kein Ärgernis: Dort ist eine Naht entstanden, die niemand eingetragen hat. Erst eintragen, dann loesen.
2. **Kein Tor wird uebersprungen.** Ein gruener Build ohne gruene Tests sagt nichts ueber die Regeln, die wir geaendert haben.
3. **Der Prototyp bleibt eingefroren, bis das Update durch ist.** Live steht immer ein Stand, der durch alle Tore gegangen ist.

---

## Teil 6: Der Vertrag nach aussen

Drei Dinge aendern sich unabhaengig von uns. Fuer jedes gibt es genau eine Stelle, an der wir es beruehren.

| Was sich aendert | Wo es uns erreicht | Was uns schuetzt |
|---|---|---|
| **Web of Trust** (Identitaet, Begegnung, Sync, Protokoll) | `@real-life-stack/wot-connector`, darunter `@web_of_trust/core` und `@web_of_trust/adapter-yjs` | Wir sprechen **nie** direkt mit WoT. Immer ueber `DataInterface` und Capabilities. Ein Protokoll-Update ist dann ein Paket-Update. |
| **Antons Stack** (Toolkit, Register, Hooks) | Antons Pakete | Haken statt Naehte, und die Naehte gezaehlt |
| **Die Spec** | `docs/spec/` | Bei Widerspruch gewinnt sie. Unsere Definition wird berichtigt, nicht seine Spec. |

Die wichtigste Regel dieses Teils, und sie ist absolut:

> **Kein `did:key`, kein JWS, kein Yjs-Aufruf in unserem Code.**

Wer diese Grenze bricht, bindet uns an eine Protokollversion, und Antons naechster Fortschritt wird zu unserem Problem. Der einzige Ort, an dem wir Yjs angefasst haben, war ein Werkzeug zum Auslesen der IndexedDB, und das lief ausserhalb der App.

### Woran wir merken, dass die Grenze haelt

Eine Suche nach `did:key`, `Y.Doc`, `applyUpdate` oder `@web_of_trust` in `packages/td-*` und `apps/trustdonation` muss leer bleiben. Das ist ein Test, kein Vorsatz.

---

## Teil 7: Was Qualitaet hier heisst

Sieben Tore, an denen wir messen, ob die Arbeit traegt.

| Tor | Messung | Heute |
|---|---|---|
| **Typen** | `pnpm build` ohne Fehler | gruen |
| **Regeln** | `pnpm -r test` ohne Fehler | gruen, 949 Toolkit-Tests |
| **Spec** | Schema-Validierung der Vokabulare und Musterdaten in der CI | gruen |
| **Naehte** | Zahl der Eintraege in NAEHTE.md, mit Wunsch | 27 Dateien, Reduktion geplant |
| **Grenze** | keine Protokoll-Aufrufe in unseren Paketen | noch kein Test |
| **Augenschein** | der Prototyp zeigt, was er zeigen soll | taeglich |
| **Gedaechtnis** | Stand gepflegt, Erfahrungen eingetragen | nach jeder Runde |

Was **nicht** Qualitaet heisst: Abdeckung in Prozent, Zeilenzahl, Zahl der Module. Wir messen, was bricht, wenn es fehlt.

---

## Teil 8: Wer wir sind, wenn wir bauen

Fuenf Haltungen, die diese Architektur voraussetzt.

1. **Wir sind Gast in Antons Haus und Herr im eigenen.** Sein Code wird respektiert, unserer verantwortet. Die Grenze ist das Naht-Register.
2. **Wir bauen erst die eine Quelle, dann die Flaeche.** Jede Frage bekommt ein Register. Eine zweite Liste ist ein Fehler, kein Kompromiss.
3. **Wir schreiben auf, was schiefging.** Die drei Fallen von heute (Seed-Version, Item in zwei Spaces, Variable nicht durchgereicht) haben zusammen zwei Stunden gekostet und stehen jetzt an drei Stellen, damit sie es nie wieder tun.
4. **Wir liefern nur aus, was durch alle Tore ging.** Ein schneller Stand, der live bricht, kostet mehr als ein langsamer.
5. **Wir erfinden nichts in die Daten hinein.** Ein Prototyp zeigt, was wirklich angelegt wurde.

---

## Teil 9: Der Weg dorthin

Der heutige Stand ist nicht diese Architektur. Der Weg ist eine eigene Etappe, und sie kommt vor allem anderen, weil jede weitere Zeile im falschen Paket die Kosten erhoeht.

Sie steht als **Etappe 0.5** in [PLAN.md](PLAN.md).

Kurz:

1. `apps/trustdonation` anlegen, aus `apps/reference` abgeleitet. Danach sind Routing, Komposition und Musterdaten **unsere** Dateien statt Naehte.
2. `packages/td-core` und `packages/td-ui` anlegen, leer, mit Testgeruest.
3. Unsere Dialog-Bereiche nach `td-ui` ziehen, im Toolkit bleibt ein Einhaengepunkt.
4. Arten und Netzwerk-Logik nach `td-core` ziehen.
5. Musterdaten als Seed uebergeben, Antons Datendateien zuruecksetzen.
6. `NAEHTE.md` fuellen und die Zahl messen: aus 27 sollen fuenf werden.
7. Die Wuensche als Pull Requests an Anton formulieren.

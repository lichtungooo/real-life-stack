# Nähte

**Stand:** 02.10.2026 (dazu Nähte A-Marker, A-PanelKopf und A-Cluster), zusammengeführt mit Antons `31d13fc3` (8 Commits, App-Abschnitte im Space-Dialog rls#551). Davor 29.09.2026 mit `bb8487b1`
**Regeln:** [ARCHITEKTUR.md, Teil 4](ARCHITEKTUR.md)

Eine **Naht** ist eine Stelle, an der wir Antons Code ändern, weil kein Haken dafür da ist. Nähte sind erlaubt. Unbenannte Nähte sind es nicht.

Diese Datei ist vollständig. Wer Antons Code ändert, trägt hier ein.

## Zahlen

| | 17.09. morgens | 17.09. abends | 19.09. | Ziel |
|---|---:|---:|---:|---:|
| Dateien von Anton, die wir ändern | 27 | 21 | 24 | 5 |
| Geänderte Zeilen in seinen Dateien | rund 800 | rund 790 | 997 | unter 60 |
| Nähte mit offenem Wunsch an Anton | 0 | 8 | 9 | alle |

Die sieben Datennähte sind vollständig weg. Die beiden großen (A1, A2) stehen noch: Sie sind genau die Arbeit, die als **PR #379** bei Anton liegt. Sie jetzt umzubauen wäre Arbeit, die bei seiner Übernahme wegfällt.

Gemessen wird nicht von Hand: `python td-tools/anton-stand.py`.

## Nachtrag 29.09.2026: Update auf `bb8487b1`

Anton hat den **Modul-Host** gebaut. Kopfleiste, Space-Umschalter, Space-Dialog, Routing und Detailansicht sind aus der Referenz-App in das Toolkit gewandert (`RoutedAppFrame`, `AppFrame`, `workspace-routing.tsx`, `host/detail-host.tsx`). Die App ist schlank geworden. Was das für unsere Nähte heißt:

| Stelle | Vorher | Jetzt |
|---|---|---|
| Profil statt Meta-Box eines Ortes | Naht in `apps/reference/src/detail-host.tsx` (+24) | **Keine Naht mehr.** Über Antons Haken `registerTypePresentation` (Erweiterung `place`, Slot `detail`) in `apps/reference/src/type-register.tsx`. Ein Ort ohne Profil behält die Meta-Box des Toolkits |
| Modul `companion` (der `baukasten` ist seit 01.10.2026 raus) | App-Schicht plus Views für alle Toolkit-Module | Nur noch unsere Schicht `trustdonation` mit eigener `view`. Antons Module bringen ihre Flächen selbst mit |
| Netzwerk-Felder und Ordnung der Spaces | `apps/reference/src/hooks/use-workspace-routing.ts` (unsere Datei) | **Naht** in `packages/toolkit/src/components/router/workspace-routing.tsx` (Ordnung, rund 25 Zeilen) und in `workspaceOf` in `workspace-switcher.tsx` (fünf Felder). Teil von PR #379 |
| Netzwerke im Space-Dialog, `activeNetworkId` im Umschalter, Anlegen mit Netzwerk und Art, Überschrift erster Ordnung, Reiterleiste `min-w-0` | `apps/reference/src/App.tsx` | **Neue Naht** in `packages/toolkit/src/components/frame/app-frame.tsx` (rund 55 Zeilen). `spaceLink` kommt als neuer Prop von der App, weil nur sie ihren Basispfad kennt. Teil von PR #379, der Reiterleisten-Fix als eigener Wunsch |
| Beispieldaten-Hinweis, Profil-Taste, Profil-Panel, Stiftungs-Import, Netzwerke-Import (Knopf „Netzwerke übernehmen“, `?import=netzwerke`, 30.09.2026), Beitritt zur Konferenz über `?konferenz=` und die Kennung für den Kreis-Provider (30.09.2026), Ort der Excalidraw-Schriften (`EXCALIDRAW_ASSET_PATH`) | `App.tsx` im Kopf und Körper | `App.tsx` über die Haken `navbarEnd` und `children` des Rahmens. Space aus der URL (`useParams`) |
| Musterdaten | `App.tsx` | unverändert als Seed-Parameter der Connectoren, `SEED_VERSION` und `MUSTERDATEN_VERSION` auf 16 |
| `apps/reference/package.json`, `pnpm-lock.yaml` | ungenannt | zwei Einträge `@trustdonation/core` und `@trustdonation/ui`, die Sperrdatei folgt ihnen. Ruhig |

**Ausgeklammert:** Antons neue Webseite `apps/site` baut unter Windows nicht (`scripts/site/lib.mjs` erwartet LF-Zeilenenden, git liefert CRLF). Betrifft den Prototyp nicht; gebaut wird mit `--filter=!@real-life-stack/site`.

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
| **Erfüllt am 30.09.2026** | Anton hat den Haken gebaut: `GroupDialog appSections` / `AppFrame spaceSections` (rls#551). Die Erweiterungen hängen schon daran (DEFINITION Teil 8). **Nächster Schritt:** unsere Bereiche Netzwerk und Landingpage als App-Abschnitte herausziehen; dann schrumpft diese Naht von rund 380 Zeilen auf die Häkchen für Netzwerk und Sammelnetzwerk. |
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

### A-Rahmen. Ein Modul ohne Suche, Filter und Plusknopf (30.09.2026)

| | |
|---|---|
| **Dateien** | `packages/toolkit/src/lib/module-register.ts` (Feld `frame` im `ModuleEntry`, 7 Zeilen mit Kommentar), `packages/toolkit/src/components/host/module-host.tsx` (1 Zeile: kein `CreateFab` bei `bare`), `packages/toolkit/src/components/host/module-outlet.tsx` (1 Zeile), `packages/toolkit/src/components/layout/module-frame.tsx` (Prop `bare`, 4 Zeilen), `packages/toolkit/tests/modul-rahmen-bare.test.tsx` (unser Test) |
| **Was wir tun** | Ein Registereintrag mit `frame: "bare"` bekommt vom Rahmen weder Suche noch Filter-Pille noch den Plusknopf. Die Konferenz (`video`) meldet sich so an. Test: `packages/toolkit/tests/modul-rahmen-bare.test.tsx` |
| **Warum kein Haken** | Der Rahmen legt Suche und Filter um jede Fläche, sobald es einen Filter-Besitzer gibt, und der Host zeigt den Plusknopf, sobald der Connector schreiben kann. Ein Modul, das keine Items auflistet, kann beides nicht abbestellen. In der Konferenz lagen „Filter" und „+" über ihren eigenen Knöpfen (Timo, 30.09.2026, mit Bildschirmfoto) |
| **Risiko bei Update** | gering, vier kleine Stellen |
| **Wunsch an Anton** | Genau dieses Feld oder ein gleichwertiges in `ModuleEntry`, damit Module ohne Item-Liste (Konferenz, Spiele, Werkzeuge) den Rahmen abbestellen können. **Zweiter Wunsch, Grundaufbau (Timo):** Die Suche nimmt oben viel Platz. Vorschlag: eine Lupe, die ein Such-Fenster öffnet, statt einer breiten Leiste in jedem Modul |

### A-Grundausstattung. Ein Space ohne Liste führt die Vorgaben (30.09.2026)

| | |
|---|---|
| **Dateien** | `packages/toolkit/src/lib/module-register.ts` (`resolveSpaceModules`: `stored ?? defaultModuleIds()` statt `stored ?? moduleIds()`, 1 Zeile plus Kommentar), `apps/reference/src/module-register.test.ts` (Antons Erwartung „full set“ auf „defaults“ umgestellt, 3 Zeilen), `packages/toolkit/tests/grundausstattung.test.ts` (unser Test) |
| **Was wir tun** | Ein Space ohne eigene `data.modules` und die Übersicht („Mein Netzwerk“) führen die Vorgaben (`enabledByDefault`), nicht jedes Modul. Unsere Vorgaben: Feed, Kalender, Karte, Video; Kanban nimmt unsere Schicht `grundausstattung` über Antons Regel 2 aus dem Standard (`replaces: ["enabledByDefault"]`, keine Naht). Test: `apps/reference/src/module-register-td.test.ts` |
| **Warum kein Haken** | Antons Space-Dialog zeigt für einen Space ohne Liste schon die Vorgaben an (`group-dialog.tsx`, `defaults()`), sein Routing aber jedes Modul. Im Login trugen Timos echte Gruppen und die Übersicht so alle zehn Module (Timo, 30.09.2026, mit Bildschirmfoto: *"Das überlädt ja wirklich alles"*). Einen Haken für diese Rückfallregel gibt es nicht |
| **Risiko bei Update** | gering, eine Zeile; bei Kollision Antons Test prüfen |
| **Wunsch an Anton** | Dialog und Routing gleich machen: ohne Liste die Vorgaben. Wir bringen das als kleinen PR mit dem Anwendungsfall |

### A-Marker. Ein Marker je Art: Symbol, Farbe, Form (01.10.2026)

| | |
|---|---|
| **Dateien** | `packages/toolkit/src/components/preview/type-presentation.tsx` (+14/-1: Feld `marker` in Eintrag, Fragment und Auflösung, in `SCALAR_SLOTS`), `packages/toolkit/src/components/map/markers/marker-shapes.ts` (+9/-2: Form `round`, `shapeAnchor`, `shapeGlyphCenter`), `packages/toolkit/src/components/map/markers/render-marker-svg.ts` (+3/-3: Symbol in der Mitte seiner Form), `packages/toolkit/src/components/map/adapters/leaflet.ts` (+4/-3: Anker je Form), `packages/toolkit/src/components/map/adapters/maplibre.ts` (+17/-4: Merkmal `round`, Anker und Versatz als Ausdruck, eigener Leuchtring ohne Versatz), `packages/toolkit/src/components/lens/map-lens.tsx` (+7/-2: Vorgabe der Art, wo das Item nichts trägt) |
| **Was wir tun** | Eine Art trägt in ihrer Darstellung einen Marker (`{ icon, color, shape }`). Die Karte nimmt zuerst `data.color`/`data.icon` des Items, sonst diese Vorgabe. Neue Form `round`: eine Scheibe ohne Spitze, die auf ihrer Mitte sitzt. Unsere App-Schicht setzt Projekt auf rund, Waldgrün, Spross (Timo, 01.10.2026); Mensch folgt (eckig) |
| **Warum kein Haken** | Die Karte kennt kein Aussehen je Art, nur Felder des einzelnen Items. Formen sind eine feste Liste mit einem Anker für alle (`PIN_ANCHOR`), und MapLibre setzt Anker und Leuchtring als Konstanten |
| **Risiko bei Update** | mittel: sechs Dateien, je unter zwanzig Zeilen, alle mit `NAHT trustdonation (A-Marker)` markiert. Antons 56 Tests für Karte, Marker und Darstellung grün |
| **Wunsch an Anton** | Ein Feld `marker` je Typ in der Darstellung (Spec 06) und Formen mit eigenem Anker. Anwendungsfall: Auf einer Karte mit Stiftungen, Projekten und Menschen soll man die Art auf einen Blick erkennen, ohne jeden Eintrag einzeln einzufärben |
| **Zwischenschritt** | Unser Test `apps/reference/src/marker-art.test.ts` hält fest, was gelten muss |

### A-Cluster. Arten, die nie gebündelt werden, und Auffächern am selben Punkt (02.10.2026)

| | |
|---|---|
| **Dateien** | `packages/toolkit/src/components/map/adapters/maplibre.ts` (+114/-3: zweite, ungebündelte Quelle `rls-markers-free` mit Symbol- und Leuchtebene über den Sammelpunkten, erst angelegt, wenn es solche Marker gibt; Klick wie jeder Pin; Einträge näher als 40 m rücken auf einen Kreis von 32 px, neu gerechnet bei jedem Zoom; seit 03.10.2026 als reine Funktion `fanPositions`, die nur fächert, solange der Ring unter 250 m bleibt, Kimi-Befund; Tests in `packages/toolkit/tests/marker-fan.test.ts`); seit 03.10.2026 dazu der **Ring je Art** um jeden Sammelpunkt: eine Symbolebene `rls-marker-cluster-ring` über dem Kreis, Bild je Zusammensetzung aus Antons `colorList` beim ersten Bedarf (`styleimagemissing`), Anteile in der reinen Funktion `clusterRingShares`, Tests in `packages/toolkit/tests/cluster-ring.test.ts`; von Timo freigegeben; nach Kimis Prüfung am 03.10.2026 gruppiert `sameSpotGroups` einmal für Fächer und `fanActive` (keine zweite Paar-Suche), und Ring-Bilder liegen in einem Set, höchstens 200 (`evictOldest`), beim Abbau der Ebenen entfernt, `packages/toolkit/src/components/preview/type-presentation.tsx` (+2: `TypeMarker.cluster`), `packages/toolkit/src/components/map/adapter.ts` (+2: `MapMarkerSpec.cluster`), `packages/toolkit/src/components/lens/map-lens.tsx` (+2: Vorgabe der Art durchreichen). Alle Stellen markiert `NAHT trustdonation (A-Cluster)` |
| **Was wir tun** | Eine Art mit `marker.cluster: false` landet in einer eigenen Quelle ohne Bündelung, gezeichnet über den Sammelpunkten. Einträge, die näher als 40 m beieinander liegen (in Kassel sechs Stiftungen im selben Haus), rücken auf einen Kreis von 32 px; der Ort selbst rückt, nicht das Bild, damit Leuchtring und Pin zusammenbleiben. Unsere App setzt Projekte so: Orange `#EA580C`, nie gebündelt |
| **Warum kein Haken** | Die Karte bündelt alles in einer Quelle und färbt den Sammelpunkt nach der häufigsten Farbe. Timo, 02.10.2026: *"Durch das Clustering sieht man nur blaue Punkte … man sieht die Projekte ja gar nicht, wenn die unter diesen blauen Punkten verschwinden … mehrere Stiftungen aufeinander, nicht sauber gefächert"* |
| **Risiko bei Update** | mittel: ein großer Block im Adapter, eng an `setMarkersAsync` und `ensureMarkerLayers`. Antons Kartentests laufen grün |
| **Wunsch an Anton** | Eine Vorgabe je Art, ob sie gebündelt wird, und Auffächern gleicher Punkte als Fähigkeit des Adapters. Anwendungsfall: Auf einer Karte mit vielen Stiftungen und wenigen Projekten sollen die Projekte immer sichtbar sein; Stiftungen am selben Sitz sollen nebeneinander liegen statt übereinander |
| **Zwischenschritt** | Die Berechnung des Fächers in eine eigene, reine Funktion ziehen (`map/markers/fan.ts`), dann bleiben im Adapter rund 40 Zeilen |

### A-PanelKopf. Die Knöpfe des Panels stehen in einer festen Kopfzeile (01.10.2026)

| | |
|---|---|
| **Datei** | `packages/toolkit/src/components/layout/adaptive-panel.tsx` (+4/-1, markiert `NAHT trustdonation (A-PanelKopf)`) |
| **Was wir tun** | Die Knopfleiste (⋮, Moduswechsel, ✕) ist keine absolut liegende Gruppe über dem Inhalt mehr, sondern eine feste Zeile oben mit eigener Glasfläche (`surface-glass-inner`, `border-b`), schmaler als der Kommentar-Fuß. Der Inhalt scrollt darunter, wie unten über dem Kommentar-Fuß |
| **Warum kein Haken** | Die Leiste ist fest verdrahtet. Timo, 01.10.2026, mit Bildschirmfoto des Project Profile: *"Wenn ich nach oben scrolle, läuft das oben raus … das X wird überdeckt … oben eine kleine Leiste, in die das X eingebettet ist, etwas kleiner als unten die Kommentarzeile"* |
| **Risiko bei Update** | gering: eine Zeile Klassen; bei Kollision Antons neue Fassung nehmen und die Klassen wieder setzen |
| **Wunsch an Anton** | Die Knopfleiste des Panels als feste Kopfzeile, für alle Inhalte. Anwendungsfall: Ein Detail mit großem Titelbild schiebt sich beim Scrollen unter ✕ und ⋮, beide werden unlesbar |
| **Zwischenschritt** | keiner nötig |

### A-Sammelnetzwerk. Gruppen ohne Netzwerk erscheinen in einem Netzwerk (30.09.2026)

| | |
|---|---|
| **Dateien** | `packages/toolkit/src/components/layout/workspace-switcher.tsx` (Feld `adoptsUnassigned` im `Workspace`, in `workspaceOf` gelesen, 8 Zeilen), `packages/toolkit/src/components/router/workspace-routing.tsx` (`ohneNetzwerkZuordnen`, 18 Zeilen, und der Aufruf), `packages/toolkit/src/components/layout/group-dialog.tsx` (Häkchen „Gruppen ohne Netzwerk gehören hierher“ mit Art, rund 40 Zeilen), `packages/toolkit/tests/sammelnetzwerk.test.ts` (unser Test). Die Regel selbst geprüft in `packages/td-core/src/space-ordnung.ts` (`ohneNetzwerkZuordnen`) |
| **Was wir tun** | Trägt genau ein Netzwerk `data.adoptsUnassigned` (`true` oder eine Art-Id), erscheinen alle Spaces ohne `network` in ihm, bei einer Art-Id als diese Art. Nur in der Anzeige; in fremde Spaces wird nichts geschrieben. Spec 04, Regel 10 |
| **Warum kein Haken** | Die Liste der Spaces entsteht in `workspace-routing.tsx` aus `workspaceOf`, ohne Stelle, an der eine App sie umordnen kann. Anlass: Timo, 30.09.2026: Die Gruppen aus Antons Real Life Stack (etwa Emils) sollen bei uns unter Real Life stehen, auch jede neue, und bei Anton unverändert bleiben. Jeder entscheidet danach selbst im Zahnrad, wohin seine Gruppe gehört |
| **Risiko bei Update** | mittel: drei Dateien, die Anton oft anfasst; die Stellen sind klein und benannt |
| **Wunsch an Anton** | Ein Haken zum Umordnen der Space-Liste (etwa `arrangeWorkspaces` am Rahmen) oder das Feld selbst in Spec 04 |

## B. Nähte, die verschwinden

Stellen, die nur deshalb Nähte sind, weil wir in Antons Referenz-App gearbeitet haben. Mit `apps/trustdonation` werden es unsere eigenen Dateien.

| Datei | Umfang | Was wir tun | Danach |
|---|---|---|---|
| `apps/reference/src/App.tsx` | +163 / -13 | Komposition, Connector-Wahl, Musterdaten, Beispieldaten-Hinweis, Stiftungs-Import, Netzwerke-Import, Klassen für die Reiterleiste (siehe H), das Profil-Panel einer Einrichtung (`?profil=`) | unsere Datei |
| `apps/reference/src/module-register-td.test.ts` | neu | Unsere Schicht im Register, in unserer Datei statt in seiner | unsere Datei |
| `apps/reference/src/views/companion-view.tsx` | neu | Die Begleitung an das Register gehängt; die Fläche liegt in `td-ui` | unsere Datei |
| `apps/reference/src/views/profil-panel.tsx` | neu | Das Profil einer Einrichtung im Panel rechts; die Fläche liegt in `td-ui` | unsere Datei |
| `apps/reference/src/detail-host.tsx` | +24 | Wer ein Profil trägt, zeigt es statt der Meta-Box seines Typs. Die 234 recherchierten Stiftungen sind `place`-Items: Ohne diese Stelle stehen ihre Förderbereiche, ihr Förderrahmen und ihr Antragsweg nirgends. Entschieden über Feld-Präsenz, nicht über den Typ | unsere Datei |
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
| `apps/reference/src/module-register.tsx` | 24 Zeilen | Die Karte wird nachgeladen statt mitgeliefert. Dazu unsere Schicht `trustdonation` mit dem Modul `companion` (der `baukasten` ist seit 01.10.2026 raus) | Die Karte als PR anbieten (die Kartenbibliothek wiegt ein Megabyte). Die eigene Schicht bleibt: Sie ist genau der Erweiterungspunkt, den Anton vorgesehen hat. |
| `apps/reference/src/App.tsx` | 1 Zeile plus Notiz | Die Reiterleiste bekommt `min-w-0 overflow-x-auto` und einen unsichtbaren Balken, damit sie in ihrem Kasten bleibt | **Als PR anbieten.** Dieselben Klassen gehören in `packages/toolkit/src/components/layout/module-tabs.tsx`, dann trifft es keine App mehr. Siehe unten. |

| ~~`packages/toolkit/src/index.ts`~~ | **weggefallen am 01.10.2026** | Der Export von `resolveAdminView` diente allein der Baukasten-Fläche. Mit dem Baukasten ist er raus; die Erweiterungen fragen `canEdit` aus Antons App-Abschnitt (rls#551). Die Datei ist wieder ganz seine, bis auf die zwei Exporte aus Abschnitt A |

**Messbar geworden:** Zugang von drei Verstößen (zwei schwer) auf null. Startlast von 1596 KB auf 864 KB, vor allem weil ein Avatar mit 733 KB in den Musterdaten steckte; er ist jetzt 3 KB und liegt in unserem Paket.

### H4. Die Reiterleiste quillt über den Space-Umschalter

Gefunden am 19.09.2026, als die Begleitung als zehnter Reiter dazukam und drei Prüfungen im Durchgang ausfielen.

`ModuleTabs` rendert ein `<nav class="hidden md:flex ...">` in `NavbarCenter`. Ein Flex-Kind hat `min-width: auto` und schrumpft darum nicht: Die Leiste behält ihre volle Breite, und weil `NavbarCenter` mittig ausrichtet, steht sie nach beiden Seiten über ihren Kasten hinaus.

Gemessen bei 1280 px, zehn Reiter: Der Kasten reicht von 236 bis 965, die Leiste lag von 110 bis 1090. Sie deckte damit den Space-Umschalter links (16 bis 236) und den Hell-Dunkel-Schalter rechts ab und verschluckte deren Klicks. Bei neun Reitern begann sie bei 199 und traf die Mitte des Umschalters (x=126) knapp nicht; der Fehler lag also schon vorher da und war nur unsichtbar.

| | |
|---|---|
| **Datei** | `apps/reference/src/App.tsx` (1 Zeile plus Notiz) |
| **Was wir tun** | Über den vorhandenen Haken `className` bekommt die Leiste `min-w-0 overflow-x-auto` und einen unsichtbaren Rollbalken (`[scrollbar-width:none]`, `[&::-webkit-scrollbar]:hidden`). Der Balken bleibt unsichtbar, weil er von den 56 px Kopfhöhe fräße. |
| **Warum keine Naht im Toolkit** | Es gibt den Haken. `ModuleTabs` nimmt ein `className`, und `App.tsx` steht ohnehin schon im Register. |
| **Risiko bei Update** | **keins.** Eine Zeile in einer Datei, die uns gehört, sobald `apps/trustdonation` steht. |
| **Wunsch an Anton** | **Als PR anbieten.** Die Klassen gehören in seine `module-tabs.tsx`: Jede App, die zehn Module führt, trifft diesen Fehler, und der Space-Umschalter ist die Stelle, an der ein Mensch sich bewegt. Der Anwendungsfall für den PR: eine Instanz mit eigener Modul-Schicht kommt über neun Reiter, und unter 1600 px Fensterbreite ist der Umschalter dann nicht mehr erreichbar. |
| **Offen** | Der aktive Reiter rollt sich noch nicht selbst ins Bild. Wer über die URL auf ein hinteres Modul kommt, sieht seinen Reiter erst nach dem Rollen. Das gehört in denselben PR. |

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

## Neue Wünsche an Anton (01.10.2026)

| Wunsch | Warum |
|---|---|
| `description` und `author` im Modul-Register (`ModuleEntry`) | Die Erweiterungen zeigen je Modul Beschreibung und Erbauer. Heute stehen sie in unserem Verzeichnis `td-core/src/erweiterungen.ts`, verschlüsselt über die Modul-Id. Kennt sein Register die Felder, bringt jedes Modul sie selbst mit, auch fremde, und bei uns bleibt nur die Reife (geprüft oder Beta). |
| Supabase-Connector: `updateGroup` als Patch auf `Group.data` (Spec 04, Regel 3) | Gefunden von Kimi am 02.10.2026. `packages/supabase-connector/src/supabase-connector.ts` schreibt `data` als ganze Spalte, local, mock und wot ergänzen nur. Wer auf Supabase einen einzelnen Schlüssel setzt (unser „Project Profile einschalten“, sein eigener Aufruf in `app-frame.tsx`), löscht Module, Bild und Netzwerk des Space. Wir schicken bis dahin die ganzen Daten mit; keine Naht in seinem Connector. |
| `@radix-ui/colors` nur mit den genutzten Skalen laden (03.10.2026) | Gemessen mit source-map-explorer: `packages/toolkit/src/lib/color-scales.ts` lädt mit `import * as radix` alle Paletten (hell, dunkel, Alpha, P3) in den Hauptteil, 102 KB verkleinert, der größte Einzelposten nach React. Werden nur die Skalen der Space-Farben gebraucht, reicht ein Import je Skala. Für uns heißt das Luft im Budget (Hauptteil 1947 von 2000 KB). Keine Naht von uns. |
| Space-Dialog: Netzwerk, Art, `isNetwork`, `adoptsUnassigned` über `createLatestWinsSaver` (03.10.2026) | Gefunden von Kimi am 02.10.2026 (Bericht `kimi-2026-10-02-141939-5292`). `group-dialog.tsx` speichert diese Felder als unabhängige, nicht abgewartete Patches; wer Netzwerk und gleich danach die Art wählt, kann die Art verlieren, wenn der erste Patch zuletzt ankommt. Für Module, Farbe und `spaceKinds` löst er das schon mit dem Latest-wins-Saver. |
| Feed-Karten: keine Knöpfe in einem klickbaren `article` (03.10.2026) | axe-core meldet auf der Startseite 195-mal `nested-interactive` und `aria-allowed-role`: Die Item-Karte ist als Ganzes klickbar (Rolle am `article`) und trägt darin Knöpfe. Ein Bildschirmleser erreicht die inneren Knöpfe so schlecht. Muster: Titel als Link, die Karte ohne eigene Rolle. |

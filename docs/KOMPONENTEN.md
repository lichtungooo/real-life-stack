# Komponenten bauen

Das Werkstattbuch für Komponenten der Erweiterungen. Geschrieben beim Bau der ersten, des **Project Profile** (01.10.2026, proto-62), damit daraus ein Skill wird.

Timo: *"Wir halten uns natürlich an Antons definierte Vorgaben, damit es super integriert werden kann. Wir entwickeln jedoch ganz neue und unterschiedliche UX, die sich ähnlich anfühlen, jedoch vom Aufbau her verschieden sind, und wie aus einem Guss funktionieren. Modernes UX/UI-Design in Perfektion."*

Die Definition steht in `DEFINITION.md` Teil 8, Abschnitt „Was eine Komponente ist“. Dieses Buch sagt, **wie** man eine baut.

---

## 0. Die Einstiege von td-ui

Jeder Baustein mit eigenem Einstieg wird nachgeladen und belastet den Hauptteil nicht. Das Gedächtnis-Tor prüft, dass jeder Einstieg hier steht.

| Einstieg `@trustdonation/ui/…` | Was | Abschnitt |
|---|---|---|
| `erweiterungen` | der Reiter „Erweiterungen“ im Space-Dialog: Komponenten wählen | 2 |
| `projekt-profil` | Project Profile, die erste Komponente: Karte und ganze Ansicht | 2, 4c |
| `stiftungs-profil` | Stiftungsprofil im Auftritt der Stiftung, mit Bearbeiten und Profil übernehmen | 4b, 4d, 4e, 4g |
| `profil-flaeche` | die Collage für Orte mit Profil-Bauplan (Rückfall ohne gewählte Komponente) | 4e |
| `projekt-entwurf` | Profil-Entwurf aus dem eigenen Agenten: Vorschau, Prüfbericht, Space-Wahl | DEFINITION 13.6 |
| `stiftungen-import` | recherchierte Stiftungen in einen Space holen, ergänzt nur, was fehlt | 4d |
| `netzwerke-import` | Netzwerke als Orte in einen Space holen | |
| `opencollective` | der Baustein Open Collective in drei Größen, überall einbindbar | 4f |
| `begleiter` | Reinsprechen im Begleiter: Mikrofon, Mitschrift wie in Circeling, Weitergabe an den eigenen Agenten | DEFINITION 13.9 |
| `ki` | Das KI-Modul: Chat in der Mitte, Arbeitsschritte sichtbar, am Ende die Karte mit dem fertigen Profil | DEFINITION 13.10 |
| `person-profil` | **Real Life Profil**, die Komponente für Menschen (`real-life-profil`, Typ `person`): Karte in der Leiste, ganze Ansicht, Sichtbarkeit je Angabe, „So sehen mich andere“ | DEFINITION 9.1 |

## 1. Was eine Komponente ist

Eine **fertige Darstellung für einen Typ**. Ein Modul ist eine Fläche im Space, eine Komponente bestimmt, wie ein Eintrag aussieht, wenn man ihn öffnet.

| | |
|---|---|
| Verzeichnis | `packages/td-core/src/erweiterungen.ts`, `art: "komponente"`, `name`, `fuerTyp` |
| Wahl im Space | `Group.data.komponenten: string[]`, über `patchData` |
| Andocken | eigene Darstellungsschicht im Typ-Register, Slot `detail`. **Keine Naht** |
| Greift, wenn | der aktuelle Space sie gewählt hat **und** der Eintrag ihre Felder trägt |
| Sonst | Antons Darstellung aus dem Feld-Register, unverändert |

Die Arten der Erweiterungen: **Module**, **Komponenten**, **Themes** (kommen), **Widgets** (Timos Wunsch vom 01.10.2026, siehe Gedächtnis `project_gamification_komponenten.md`).

---

## 2. Der Ablauf in neun Schritten

Jeder Schritt mit der Datei, in der er beim Project Profile stand.

### Schritt 1: Definieren

In `DEFINITION.md` Teil 8 einen Abschnitt mit:

- Timos Satz, warum es die Komponente gibt
- einer Tabelle **Abschnitt · Frage · Felder in `data`**, in der Reihenfolge, wie ein Besucher liest
- den Regeln: was bei fehlenden Angaben passiert, welche Zahlen Beispiele sind

Skill `/td-definieren`. Erst danach Code.

### Schritt 2: Der Kern in td-core

`packages/td-core/src/<name>.ts`, ohne Browser. Eine Funktion nimmt die rohen `data` und gibt fertig auf, was die Seite zeigt (`projektProfil(daten, tags)`).

- **Was fehlt oder die falsche Form hat, fällt weg.** `null` oder leere Liste, nie „unbekannt“.
- **Zahlen rechnen, nicht glauben:** Anteile auf 0 bis 1 begrenzen, Rest nie unter null.
- **Adressen prüfen:** nur `https?://`, eigene Pfade ohne `..`, `data:image/`. Nie `javascript:`.
- **Eine Prüffunktion**, ob ein Eintrag genug trägt (`traegtProjektProfil`).
- Tests in `packages/td-core/tests/<name>.test.ts`: leer, kaputt, gefährlich, gerechnet.

### Schritt 3: Der Eintrag im Verzeichnis

In `ERWEITERUNGEN` (td-core):

```ts
{ id: PROJEKT_PROFIL, art: "komponente", name: "Project Profile", fuerTyp: "project",
  erbauer: "…", reife: "beta", beschreibung: "…" }
```

Die Id als Konstante exportieren. Neue Komponenten starten als **Beta**.

### Schritt 4: Die Darstellung in td-ui

`packages/td-ui/src/<name>.tsx`, mit **eigenem Einstieg** in `packages/td-ui/package.json`:

```json
"./projekt-profil": {
  "types": "./dist/src/projekt-profil.d.ts",
  "development": "./src/projekt-profil.tsx",
  "import": "./dist/src/projekt-profil.js"
}
```

**Nicht** in `td-ui/src/index.ts` aufnehmen: Alles im Index landet im Hauptteil der App.

Der **Standard-Export nimmt rohe Daten** (`ProjektProfilAusDaten({ daten, tags, bildUrl })`) und ruft den Kern selbst. So liegt auch der Kern im nachgeladenen Stück.

### Schritt 5: Die Bindung in der App

In `apps/reference/src/type-register.tsx`, **nach** der Schicht, die die Felder des Typs bringt:

```ts
// 1. Die Darstellung, die gilt, solange die Komponente nicht gewählt ist.
const PROJEKT_META = resolveTypePresentation("project").detail
// 2. Nachladen.
const Seite = lazy(() => import("@trustdonation/ui/projekt-profil"))
// 3. Wählen: Space hat sie gewählt und der Eintrag trägt etwas.
function ProjektOderMeta({ item }: ItemSlotProps) {
  const space = useCurrentGroup()
  const daten = item.data ?? {}
  if (!komponenteAktiv(space?.data, PROJEKT_PROFIL) || !traegtProjektProfil(daten)) return <PROJEKT_META item={item} />
  return <Suspense fallback={…}><Seite daten={daten} tags={item.tags} bildUrl={bildUrl} /></Suspense>
}
// 4. Eigene Schicht, eigener Name.
registerTypePresentation("trustdonation-projekt-profil", { extensions: [{ id: "project", detail: ProjektOderMeta }] })
```

Warum eine **eigene Schicht**: Das Register lässt einen Slot nur einmal setzen. Wer die Rückfall-Darstellung **vor** dem Registrieren abholt, hat Antons Meta-Box in der Hand und braucht keine Naht.

### Schritt 6: Der Reiter in den Erweiterungen

Die Bindung `apps/reference/src/views/erweiterungen-abschnitt.tsx` hängt `komponentenAus()` an die Module an, gibt jeder ein Symbol (`IdCard`) und schreibt beim Schalten `Group.data.komponenten` statt `modules`. Bei einer neuen Komponente ist hier nichts zu tun, außer sie braucht ein eigenes Symbol.

### Schritt 7: Musterdaten

- Ein Eintrag in `packages/td-core/daten/items.json` mit `muster: true` und sichtbar erfundenen Angaben (`example.org`, `0561 000 000`, „Musterweg 1“)
- Seine Id in `group-items.json` beim Demo-Space
- Die Komponente in `groups.json` → `data.komponenten` des Demo-Space
- **Beide Versionen hochzählen:** `SEED_VERSION` (local-connector) und `MUSTERDATEN_VERSION` (td-core). Sie müssen gleich sein.

**Bilder:** gezeichnete SVG-Illustrationen in `apps/reference/public/muster/`, keine Fotos fremder Menschen. Im Eintrag als Pfad `muster/<datei>.svg`; die Bindung macht daraus über `import.meta.env.BASE_URL` eine Adresse.

### Schritt 8: Ansehen

```bash
pnpm --filter reference dev                    # App starten
node td-tools/komponente-ansehen.mjs 30455be1-a5f9-465d-8d19-a72dd8da2d83/map/<item-id>
```

Fotografiert Karte und ganze Ansicht auf Rechner, Handy und dunkel, zählt Seitenfehler. Der zweite Wert nennt den Knopf zur ganzen Ansicht (`"Profil bearbeiten"` öffnet sie im Bearbeiten-Modus); `DANACH="Kontakt bearbeiten"` klickt dort einen zweiten Knopf und zeigt so ein offenes Formular. Nach dem Ausliefern dasselbe gegen live: `BASIS=https://trustdonation.org/app`. **Jedes Bild ansehen.** Ohne diesen Schritt wäre der Text über dem Etikett „Musterprojekt“ live gegangen.

### Schritt 9: Tore, Ausliefern, Festhalten

`python td-tools/pruefen.py`, alle acht grün, nach **jeder** Änderung neu. Dann `/td-ausliefern`, Zeile in `AUSLIEFERUNGEN.md`, Stand im Gedächtnis.

---

## 3. Die Designsprache: aus einem Guss

Jede Komponente bekommt ihren **eigenen Aufbau**, passend zu ihrem Zweck. Was sie verbindet, sind diese Bausteine.

### Zwei Ansichten

| Ansicht | Wo | Was |
|---|---|---|
| **Karte** | Antons Detail-Leiste (schmal, um 400 px) | Titelbild ohne Text darüber, ein Satz, das Wichtigste (beim Projekt der Spendenstand), Knopf „Ganzes … öffnen“ |
| **Ganze Ansicht** | `Dialog` über den ganzen Bildschirm (`showCloseButton={false}`, eigener Schließen-Knopf auf dem Bild) | die ganze Geschichte |

In der schmalen Leiste **nie Text über ein Bild legen**: Er stößt an Etiketten und wird unlesbar.

### Bausteine

| Baustein | Klassen und Regel |
|---|---|
| **Fläche** | `rounded-3xl` (ganz) oder `rounded-2xl` (Karte), Farbe `bg-<farbe>-50/60`, dunkel `dark:bg-<farbe>-950/40`. **Kein Rahmen** |
| **Schwebende Karte** | `bg-card shadow-xl shadow-black/5` (dunkel `shadow-black/30`). Schatten statt Rahmen |
| **Überschrift eines Abschnitts** | Symbol plus `text-xs font-semibold uppercase tracking-wider text-muted-foreground` |
| **Kopf** | Bild über die ganze Breite, `h-[46vh]`, Verlauf `from-black/85` nach oben, Titel `text-3xl sm:text-5xl font-bold` |
| **Kennzahlen** | bis zu vier Karten, die mit `-mt-10` halb über dem Kopf liegen |
| **Bento-Raster** | `grid sm:grid-cols-6`; Abschnitte mit `sm:col-span-6`, `-4`/`-2`, `-3`/`-3`. Ein Bild füllt die Lücke neben einem Text |
| **Mitlaufende Spalte** | `lg:grid-cols-[minmax(0,1fr)_360px]`, Seitenspalte `lg:sticky lg:top-6 lg:self-start` |
| **Handy** | Was rechts mitläuft, wird unten zur festen Leiste (`fixed inset-x-0 bottom-0 … lg:hidden`), Inhalt mit `pb-28` |
| **Bilder** | `object-cover`, Hover `group-hover:scale-105`, Klick öffnet die Großansicht (Escape schließt) |
| **Ehrlichkeit** | Etikett „Musterprojekt“, Hinweis „Beispielzahlen“. Ein Knopf ohne Ziel steht still mit dem Grund („Spendenseite folgt“) |

### Farben nach Bedeutung

| Farbe | Bedeutung |
|---|---|
| Smaragd | Geben, Handlung, Fortschritt |
| Bernstein | Was fehlt, das Bedürfnis |
| Grün | Wirkung |
| Orange | Geld und Bedarfe |
| Himmelblau | Schritte und Zeit |
| Violett | Kontakt |
| Muted | Erzählung, Team |

### Vorbilder

Kampagnenseiten, die 2026 gut funktionieren: Fortschritt sichtbar, **Beträge mit ihrer Wirkung** („150 €: ein Hochbeet“), der Knopf immer in Reichweite, Bento-Raster mit sechs bis neun Kacheln. Quellen beim Bau: Übersichten zu Bento-Layouts und zu Spendenseiten (Sticky-Button, Fortschrittsbalken als ehrliche soziale Bestätigung).

---

## 4. Fallen, in die wir getreten sind

| Falle | Was half |
|---|---|
| **Budget gerissen** (größtes Stück 2003 KB von 2000), obwohl alles „nachgeladen“ war | Kern **und** Übersicht der Erweiterungen in eigene Einstiege; nichts davon über den Index von td-ui |
| Text über dem Titelbild in der schmalen Leiste stieß an das Etikett | Karte ohne Text auf dem Bild, ganze Ansicht für die große Wirkung |
| Radix-Dialog im Space-Dialog nimmt keine Klicks | eigener `Dialog`, Radix stapelt sie |
| Ein Test erwartete noch den Platzhalter „Komponenten kommen“ | Tests mit der Funktion ändern, nicht hinterher |
| Ein Test verlangte, jeder Verzeichnis-Eintrag sei ein Modul | Regel auf `art: "modul"` begrenzt, eigene Regel für Komponenten (Name, Typ, keine Id-Kollision) |
| Nachgeladener Abschnitt war im Test noch nicht da | im Test warten, bis ein Knopf steht |
| **Bilder lokal heil, live kaputt:** `BASE_URL` heißt live `/app`, ohne Schrägstrich am Ende; daraus wurde `/appmuster/…` (derselbe Fehler steckte seit Wochen in den Zeichenpad-Schriften) | Schrägstrich selbst setzen: `BASE_URL.replace(/\/+$/, "") + "/" + pfad`. **Nach dem Ausliefern live ansehen:** `BASIS=https://trustdonation.org/app node td-tools/komponente-ansehen.mjs …` |
| Bildschirmfotos: `setContent` lädt keine `file://`-Bilder; Git Bash macht aus `/pfad` einen Windows-Pfad | über eine HTML-Datei laden; Pfad ohne führenden Schrägstrich übergeben |

---

## 4b. Die zweite Komponente: das Stiftungsprofil (02.10.2026)

Was der zweite Durchgang gelehrt hat:

- **Erst die Daten zählen, dann gestalten.** Von 193 Stiftungen tragen fast alle nur sechs Felder. Die Vorlage muss damit fertig aussehen und wachsen, wenn eine Stiftung übernimmt. Eine erfundene Musterstiftung mit allen Feldern (`muster: true`) zeigt die volle Fassung.
- **Eigener Aufbau je Leser.** Das Projekt erzählt (großes Foto, Geschichte); die Stiftung beantwortet Fragen (Band in der Hausfarbe mit Logo oder Monogramm, der Antragsweg ganz oben).
- **Die Schleuse teilen.** Prüfhelfer liegen in `td-core/src/schleuse.ts`, beide Profile nutzen sie.
- **Hausfarbe und Kartenfarbe trennen** (`hausfarbe` gegen `color`), und Text in Hausfarbe in der dunklen Ansicht auf den Vordergrund legen.
- **Fotos nach der Einblend-Animation** machen, sonst erscheinen helle Streifen, die es gar nicht gibt.

## 4c. Profile bearbeiten (02.10.2026)

Jede Komponente, die ein Profil zeigt, lässt sich an Ort und Stelle bearbeiten. Definition: `DEFINITION.md` Teil 8, „Profile bearbeiten“.

| Teil | Wo | Was |
|---|---|---|
| Feldliste | `td-core`: `PROJEKT_PROFIL_FELDER` (`projekt-entwurf.ts`), `STIFTUNGS_PROFIL_FELDER` (`profil-felder.ts`) | je Feld `abschnitt`, `form`, `name`, `hilfe`, bei Listen von Objekten `teile` mit `pflicht` |
| Speichern | `abschnittSpeichern(felder, abschnitt, daten, arbeit)` | nur die Felder des Abschnitts, alles andere bleibt; `{ data, ...eintrag }` |
| Hinweise | `feldHinweise(feld, wert)` | was die Schleuse beim Anzeigen weglassen würde, in Sätzen |
| Editor | `td-ui/src/profil-bearbeiten.tsx` | `useProfilBearbeiten`, `Bearbeitbar`, `StiftKnopf`, `BearbeitenKnopf`, Formular aus der Liste |
| Bindung | `type-register.tsx`, `useBearbeitung(item)` | Recht über `useItemPermissions`, Schreiben über `useUpdateItem` |

So bekommt eine neue Komponente das Bearbeiten:

1. Feldliste in td-core mit `abschnitt` je Feld. Ein Test prüft, dass jedes Feld die Seite ändert.
2. In der ganzen Ansicht `useProfilBearbeiten(FELDER, bearbeitung)`; die Seite rechnet aus `b.vorschau`, solange es sie gibt. Das ist die Vorschau.
3. Jeden Abschnitt in `<Bearbeitbar abschnitt name da spalten>` legen. Die Rasterklassen wandern vom Abschnitt auf `spalten`, sonst bricht das Bento-Raster.
4. `<BearbeitenRahmen wert={b.kontext}>` innen im `DialogContent`, `BearbeitenKnopf` neben das Schließen, `StiftKnopf` und `OffenesFormular` für den Kopf.
5. `onEscapeKeyDown` verhindern, solange ein Abschnitt offen ist: Escape schließt sonst die ganze Ansicht samt Arbeit.

Gelernt:

- **Leere Abschnitte erscheinen im Bearbeiten-Modus** als gestrichelte Fläche „… ergänzen“. Ohne sie ließe sich nie etwas hinzufügen.
- **Formulare in der Seitenspalte** sind 360 Pixel breit: Spalten über `@container` an der Breite des Formulars ausrichten, nicht am Bildschirm.
- **Hinweise für Agenten und für Menschen trennen** (`hinweis` gegen `hilfe`): „{ lat, lng }“ hilft einem Modell, einem Menschen nicht.
- **Schlagworte gehören an den Eintrag** (`Item.tags`); alte `data.tags` ziehen beim Speichern des Kopfs dorthin um.
- **Stift auf die Ecke** (`-right-2 -top-2`), sonst deckt er in schmalen Abschnitten die Überschrift zu.

## 4d. Im Auftritt der Stiftung (02.10.2026)

Timo: *"auf die Webseite gucken … das stiftungseigene Logo … die Farben vom Logo übernehmen … erstmal schön schreiben, was wir machen … die Hashtags."* Definition: `DEFINITION.md` Teil 8, „Stiftungsprofil im Auftritt der Stiftung“ (Logos mit Hinweis).

**Der Weg der Daten:**

1. `python td-tools/stiftungen/auftritt.py holen --alle` liest je Website Startseite und bis zu vier Seiten (Stiftung, Förderung, Antrag), Logo-Kandidaten, Farben aus Seite, CSS und Logo. Ein Abruf je Sekunde und Host, `robots.txt` gilt. Alles landet in `%TEMP%/td-auftritt/`, nie im Repo.
2. Agenten wählen je Stiftung Logo und Farben und schreiben `kurz`, `zweck`, `zielgruppen`, `hinweis`, `foerderbereiche`; Anleitung mit den Regeln (nichts erfinden, eigene Worte, Partner-Logos und Siegel aussortieren). Ergebnis: `td-tools/stiftungen/auftritt-teile/*.json`, eingecheckt.
3. `auftritt.py blatt` baut einen Kontaktbogen, `node td-tools/stiftungen/blatt-foto.mjs` fotografiert ihn: Logos und Farben auf einen Blick prüfen.
4. `auftritt.py anwenden` schreibt die Felder in `items.json` und legt Logos verkleinert unter `apps/reference/public/stiftungen/` ab (SVG ohne Skripte und fremde Verweise). Danach `SEED_VERSION` und `MUSTERDATEN_VERSION` hochzählen.

**Darstellung:** Variablen `--td-haus`, `--td-akzent`, `--td-haus-text` am Profil; Flächen mischen mit `color-mix(in oklab, var(--td-haus) 8%, var(--card))`, damit hell und dunkel stimmen. Kontrast rechnet td-core: `lesbarAuf` (hell oder dunkel auf dem Verlauf) und `lesbarAufHell` (Hausfarbe als Schrift, abgedunkelt bis 4,5 zu 1).

Gelernt:

- **Gelb als Schrift ist unlesbar.** Ohne `farbeText` stand die Summe der Software AG gelb auf Weiß.
- **Eine Kennzahl, die nur zählt, was daneben steht** („8 Förderbereiche“), fällt weg.
- **TLS-Abfangen am Arbeitsrechner:** Etwa 20 Websites scheiterten lokal an „nicht vertrauenswürdiger Stammzertifizierung“, vom Server aus nicht. Prüfung nie abschalten; den Rest auf dem Server im Container `python:3.12-slim` holen und zurückkopieren.
- **Die Musterstiftung gehört nicht in echte Spaces:** Der Import filtert `muster: true`.
- **Der Import zieht den Auftritt nur nach, wo er fehlt** und solange der Eintrag unsere Recherche ist; Bearbeitetes bleibt.

## 4e. Das große Ganze statt des Antrags (02.10.2026)

Timo nach proto-70: *"Das fördernd bringt gar nichts … wirklich in die Förderbereiche reingehen … Zahlen oder Beispiele … klein stichpunktartig, groß das große Ganze, mit Bildern dazwischen."* Ergebnis: Schwerpunkte als Karten mit **eigenem Bildmotiv** (`td-ui/src/stiftungs-motive.tsx`, 17 Zeichnungen in `--td-haus` und `--td-akzent`), Beispiele, Zahlen, Herkunft; Antrag nur noch in den Daten.

Gelernt:

- **Was die App im Hauptteil fragt, gehört in ein eigenes kleines Modul.** `traegtStiftungsProfil` lag im Modul des ganzen Kerns; Rollup legte dadurch den Kern in den Hauptteil (Budget 1999 KB). Ausgelagert nach `stiftungs-erkennung.ts`: 1994 KB.
- **`fixed` im Dialog klebt nicht.** Der Dialog verschiebt sich per `transform`, `fixed` hängt dann am Container und scrollt mit. `sticky bottom-0` am Ende des Inhalts hält die Leiste unten.
- **Ohne eigene Schwerpunkte** zeigt die Seite die Förderbereiche als Karten mit Motiv (`motivFuer`): Jede Stiftung sieht fertig aus, auch vor der zweiten Runde.
- **Zweite Runde mit tieferen Seiten:** `auftritt.py nachholen` holt Geschichte, Schwerpunkte, Projekte nach; mehrere Auswahl-Dateien je Stiftung werden zusammengeführt.

## 4f. Der Baustein Open Collective (03.10.2026)

Timo: *"Wenn wir Module bauen, muss es in alle Seiten offen sein und integrierbar sein."* Darum kein Teil des Project Profile, sondern ein **Baustein in drei Größen**, eigener Einstieg `@trustdonation/ui/opencollective`: `OcKnapp` (eine Zeile), `OcWidget` (Karte mit Betragsknöpfen), `OcGanz` (Dialog mit Zahlen, Ausgaben, Eingängen). Kern `td-core/src/opencollective.ts`, Dienst `trustdonation.org/oc/<name>` im td-mcp-Container.

Gelernt:

- **Ein Dienst vor der fremden Schnittstelle:** Die Besucher fragen unseren Dienst, er fragt Open Collective mit zehn Minuten Zwischenspeicher. So geht keine Adresse eines Besuchers hinaus, und viele Besuche fragen dort selten.
- **Eingänge ohne Namen** (Timo): nur Betrag und Datum, schon im Kern, damit kein Träger sie versehentlich zeigt.
- **Fremde Währung, kein Zielvergleich:** Das Ziel im Eintrag ist in Euro; rechnet die Seite in Dollar, entfällt der Balken statt falsch zu rechnen.
- **Space und Netzwerk** (03.10.2026): Abschnitt „Spenden“ im Space-Dialog über `spaceSections`, Knopf „Unterstützen“ in der Kopfzeile über `navbarEnd`; beides ohne Naht. Das Ziel steht in Euro; Knapp und Widget vergleichen nur bei einer Euro-Seite.
- **Widget, kein Modul** (Timo, 03.10.2026): Ein Modul ist bei Anton eine Fläche (Reiter). Open Collective ist ein Widget, das jede Seite trägt. Ein Modul „Spenden“ entstünde erst für eine eigene Fläche, etwa die Summe aller Projekte eines Netzwerks.
- **Nächste Träger** als eigene kleine Schritte: Personenprofil (braucht Anton), Widget auf der Landingpage, Meldung aufs Handy bei neuer Spende.

## 4g. Profil übernehmen (03.10.2026)

Eine Stiftung nimmt ihr recherchiertes Profil selbst in die Hand: „Das ist meine Stiftung“, die Verwaltenden prüfen außerhalb der App und bestätigen, danach „Gepflegt von der Stiftung seit …“. Definition in `DEFINITION.md` Teil 8.

Gelernt:

- **Antons Regel für Verwaltende liegt im Toolkit, nicht exportiert** (`resolveAdminView`): `isAdmin` setzen nur Connectoren, die es wissen; lokal verwaltet das erste Mitglied. Nachgebildet in `verwaltetSpace`, statt für eine Zeile eine Naht zu öffnen. Ohne diese Regel hätte live im Demo-Modus niemand bestätigen können.
- **Schritte als reine Funktionen** über die ganzen Daten: Die Oberfläche ruft nur `anfragen`, `bestaetigen`, `ablehnen`; Test mit echtem Zustand in einer kleinen Bühne.
- **Das Grenz-Tor liest `did:` auch in Tests:** neutrale Kennungen wie `mensch-anna` nehmen.

## 5. Was als Nächstes kommt

1. ~~Stiftungsprofil~~ gebaut am 02.10.2026 (Abschnitt 4b) (`fuerTyp: "place"` mit Stiftungsfeldern, oder eigener Typ über die Manifest-Schicht), mit den vier entschiedenen Verbesserungen: „Stiftung“ statt „Ort“, Website und Anschrift mit Quelle, Bild mit Platzhalter, Kontakt und Antrag oben.
2. ~~Open Collective live~~ gebaut am 03.10.2026 als Baustein (Abschnitt 4f). Offen: Personenprofil, Space, Landingpage.
3. ~~Bearbeiten~~ gebaut am 02.10.2026 (Abschnitt 4c), eigener Editor aus der Feldliste statt Antons `fields`. Später: Bilder hochladen, sobald Antons Stack Dateien trägt.
4. **Widgets und HUD** als vierte Art (Gedächtnis `project_gamification_komponenten.md`).

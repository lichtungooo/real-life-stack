# Video Module

**Status:** Entwurf v0.1 (lichtungooo, 29.09.2026), gedacht als Beitrag an den Real Life Stack

## Zweck

Das Video ist die Konferenz eines Space: Bild, Ton, Bildschirm, Chat und ein Live-Protokoll, in dem Aufbau, den Menschen aus Zoom kennen. Und es ist ein **Gastgeber für andere Module**: Mitten in der Konferenz öffnet man den Kreis mit dem Redestab, die Tafel oder eine Umfrage, und alle arbeiten in derselben Fläche weiter. Feed, Kalender und Karte bleiben oben im Menü des Space; in der Konferenz haben sie nichts verloren (Timo, 30.09.2026).

- **Problem im Current Space:** Gruppen leben verstreut. Eine Videokonferenz daneben in einem fremden Werkzeug trennt das Gespräch von der Arbeit. Hier liegen beide in einem Raum.
- **Wiederholte Nutzung:** Teamtreffen, Kreise, Beratungen, Planung am Kanban, gemeinsamer Blick auf die Karte.
- **Wer davon profitiert:** jedes Modul, das in der Konferenz geöffnet wird; das Wissensfeld und der Feed (das Protokoll wird ein Item).

Es ersetzt die eigenständige Seite `kreis.wir.ooo`. Was dort lief, läuft hier in jedem Stack, der das Modul führt.

## Einordnung

| Frage | Antwort |
|---|---|
| Space Module? | Ja |
| App-Shell-Fläche? | Nein |
| Module Components | `VideoBuehne` (Sprecher und Galerie, Blättern ab zwölf), `VideoKachel`, `VideoSteuerleiste`, `VideoSeitenleiste` (Menschen, Chat, Protokoll, Module), `KreisLeiste` (Redestab, Schritt, Klangschale aus dem Kreis) |
| Primäre Datenbasis | Capability `KreisRaumCapable` (derselbe Live-Raum wie der Kreis), Modul-Register |
| Externe Semantik | keine |

## Tools im Modul (v0.3, 30.09.2026)

Timo: *„Der mittlere Bereich ist für mich der Modul-im-Modul-Bereich.“* In der Mitte liegt ein **Tool im Modul**, für alle. Der Aktions-Knopf (+) unten links legt es hinein:

| Tool | Herkunft |
|---|---|
| Alle zeigen | keines: die Menschen groß |
| Tafel | das Video selbst |
| Kreis mit Redestab, Kreis mit Prozess (Wir-Prozess, Klärungskreis …) | `@kreis/core`, als Module Component (Spec [kreis.md](kreis.md)) |
| jedes Modul des Space | Antons Modul-Register über `ModuleOutlet` |
| Umfrage | das Video selbst: Frage und bis zu sechs Antworten, oder schnell Ja · Nein · Enthaltung; je Mensch zählt die jüngste Stimme |
| Folien (geplant) | braucht Dateien; siehe Offene Punkte |

Dazu, ebenfalls im Aktions-Knopf: **Zufällig jemanden wählen** (das Los steht acht Sekunden groß bei allen) und der **Kurzzeitwecker** (1 bis 30 Minuten; die Restzeit steht oben, am Ende klingt es einmal leise). **„Kreis mit Prozess“ und „Kurzzeitwecker“ sind Aufklappfelder**, damit das Menü kurz bleibt. Links unter Notizen: **Geteilte Notizen**, ein Text für alle.

**Redezeit mit Gong (Einstellungen, ⋮):** Für alle gleich festgelegt (keine, 1, 2, 3, 5, 10, 15, 20, 30 Minuten) und was danach geschieht: Der Stab geht an den Nächsten im Kreis, oder er kehrt in die Mitte zurück. Wer den Stab hält, sieht seine Restzeit, die anderen sehen sie oben. Ist sie um, klingt ein Gong bei allen, und der Stab wandert von selbst. Ausgelöst vom Gerät dessen, der den Stab hält, damit es genau einmal geschieht (`redezeitAblaufen`, `Sitzung.regeln`, `Sitzung.gong`). Der Knopf **„Wort nehmen“** unten macht den Redestab in jeder Konferenz nutzbar, auch ohne Kreis-Prozess.

**Stille und Dauer des Treffens (Einstellungen, ⋮):** Die Stille nach der Klangschale gilt für alle (15 Sekunden, 30 Sekunden, 1 Minute, 2 Minuten); ohne eigene Wahl gilt die des Prozesses (`stilleSekundenVon`). Die Dauer des Treffens (offen, 30 Minuten bis 3 Stunden) beginnt mit dem Festlegen (`Regeln.sitzungSeit`). Oben steht, wie lange das Treffen noch geht. Ist sie um, klingt der Gong bei jedem einmal, und ein Hinweis ruft zur Abschlussrunde. Das Treffen läuft weiter.

**Aktions-Menü, Feinarbeit (30.09.2026):** Timo: *„nicht trennen, sondern einfach nur Kreisprozess … ansonsten wäre es ein normales Meeting“*. Ein Aufklappfeld **Kreisprozess** mit „Freier Kreis mit Redestab“ und den Prozessen. Unter „Für alle“ steht **Dauer des Meetings** (offen, 30, 45, 60, 90 Min., 2 und 3 Std.) direkt im Menü. Am Ende klingt ein **eigener Ton** (`meetingEnde`: vier helle, aufsteigende Töne), weder Schale noch Gong (*„da kann ruhig was anderes kommen“*). Der Kurzzeitwecker ist für Pausen und Übungen; die Redezeit mit Gong steht unter ⋮ Einstellungen. Die Restzeit rundet auf die nächste Minute statt auf, damit zwei Geräte mit einem Takt Abstand dasselbe zeigen.

**Einladen (30.09.2026):** Timo: *„dass der, der eine Konferenz startet, Nutzer dafür einlädt. Und dass es einen Link gibt, den man verschicken kann, falls noch ein Nutzer mit beitreten will, der noch nie drin war.“* Neue werden richtige Mitglieder, keine Gäste. Keine E-Mail.

- **Der Raum hängt an der Id der Gruppe** (`raumId`), nicht mehr an ihrem Namen. Der Token-Dienst gibt das Zugangswort jedem mit erlaubter Herkunft, und die lässt sich außerhalb des Browsers fälschen; ein Name ließe sich erraten, eine UUID nicht. Der Link ist so der Schlüssel. Der Provider trennt Schlüssel (`raumName`) und Titel (`raumTitel`).
- **Knopf „Einladen“** in der Kopfzeile: optionale Beschreibung, **„Text mit Link kopieren“** (Einladung zur Session „Gruppe“, Beschreibung, Link, was Neue erwartet, „Conferencing ist ein Modul vom Real Life Network“) und „Nur den Link“. Darunter die Kontakte: wer nicht in der Gruppe ist, bekommt die Einladung (`inviteMember`), wer drin ist, steht als „in der Gruppe“.
- **Der Link** führt auf die Einladungsseite der Instanz (`/einladung/?konferenz=<id>&gruppe=<name>`, Instanz-Repo trustdonation). Sie trägt die Vorschau für Telegram und Signal (Open Graph; Messenger führen kein JavaScript aus) und leitet mit einem Knopf nach `/app/?connector=wot&konferenz=…&gruppe=…`.
- **In der App** fängt `KonferenzBeitrittHost` (`App.tsx`) `?konferenz=` ab: Mitglieder springen nach `/<id>/video`; Neue legen erst ihren Zugang an und sitzen dann in der **Beitritts-Konferenz** (`BeitrittsKonferenz`, derselbe Raum, ohne Daten der Gruppe). Kommt die Gruppe bei ihnen an, wechselt die Fläche, die Verbindung bleibt.
- **Vorstellen:** Jeder schickt beim Betreten seine Kennung (DID) über den Neben-Kanal (`vorstellen`, `vorstellen-frage`; `kennungVon`). Wer kein Mitglied ist, steht bei den Mitgliedern unter **„Neu im Raum“** mit **„In die Gruppe aufnehmen“** (`inviteMember`). Die Einladung ist an seinen Schlüssel verschlüsselt: Wer eine fremde Kennung vorgibt, kann sie nicht annehmen. `inviteMember` braucht nur die veröffentlichte Kennung, keine Verifizierung; verifizieren geht live im Gespräch (der Code gilt fünf Minuten, Antons Regel).
- Die Konferenz kennt den Stack nicht: Link, Kontakte, `kontaktEinladen`, `istMitglied`, `aufnehmen` gibt ihr die App über `KonferenzEinladen`.

**Name:** Das Modul heißt **Conferencing** (Timo, 30.09.2026); die Id bleibt `video`, weil sie in `Group.data.modules` steht.

**In der Übersicht** („Mein Netzwerk“) gehört die Konferenz keiner Gruppe. Sie zeigt dann die Gruppen, die das Video führen, und führt per Klick in deren Raum. Der Raumname kommt aus `raumKennung` und passt immer zum Muster des Token-Dienstes (Buchstabe oder Ziffer an beiden Enden).

**Alle zeigen, zwei Wege:** Der Knopf über der Bühne zeigt nur mir die Menschen groß; das Tool bleibt für die anderen in der Mitte, und oben führt „Zurück zu …“ hinein. Über + legt „Alle zeigen, für alle“ das Tool für die ganze Runde beiseite.

**Wo was liegt, und warum:** Kurzzeitwecker und Los stehen im Sitzungszustand (`Sitzung.wecker`, `Sitzung.los`), dort handelt immer einer. Die Umfrage liegt NICHT dort: Bei gleicher Fassung gilt einer von zwei Ständen, und zwei gleichzeitige Stimmen ließen eine verloren gehen. Darum reist jede Stimme einzeln und wird eingemischt (`@kreis/core`, werkzeuge.ts). Die geteilten Notizen gelten mit Fassung und Absender wie der Redestab; solange jemand im Feld schreibt, bleibt sein Entwurf stehen.

Links eine Leiste wie bei Big Blue Button: **Nachrichten** (Gemeinsamer Chat), **Notizen** (Protokoll; geteilte Notizen geplant), **Teilnehmer** mit Namen. Ein Eintrag klappt eine Spalte daneben auf, der Pfeil klappt sie zu. Oben rechts: gehen, ⋮ (Vollbild).

## Aufbau (nach Big Blue Button, v0.2)

| Ort | Was dort steht |
|---|---|
| **Mitte** | Was für alle dort liegt: die Menschen (Sprecher oder Galerie), die **Tafel** oder ein Modul. Wer etwas in die Mitte legt, legt es für alle hinein, wie der Präsentator bei Big Blue Button. Gespeichert im Sitzungszustand (`Sitzung.mitte`, Einigung wie beim Redestab) |
| **Oben** | die Menschen mit Bild als Streifen, sobald etwas in der Mitte liegt |
| **Links** | die Menschen nur mit Namen (Stab, Hand, Bildschirm, Sprechen, stumm), darunter **Chat** oder **Protokoll**, auf- und zuklappbar |
| **Unten** | Ton, Bild, Chat, Mitte, teilen, Zeichen, Hand, gehen |

**Die Tafel:** Striche reisen als Punkte in Anteilen der Fläche (16:9), damit sie auf jedem Bildschirm an derselben Stelle liegen (`@kreis/core`, tafel.ts). Wer später kommt, fragt nach dem Stand. Flüchtig wie der Chat.

**Scheitert Kamera, Mikrofon oder Bildschirm**, sagt die Fläche es und nennt den Weg (Browser-Freigabe), statt dass ein Knopf still bleibt.

## Ein Raum, zwei Sichten

Video und Kreis teilen **eine** Verbindung (Spec [kreis.md](kreis.md), „Der Raum-Adapter"). Die App hält sie im `KreisRaumProvider`; beide Module lesen sie mit `useKreisVerbindung()`.

Daraus folgen die Schnittstellen in beide Richtungen:

| Richtung | Was geschieht |
|---|---|
| Video → Kreis | Die Konferenz zeigt oben, welcher Prozess und welcher Schritt läuft und wer den Redestab hält. Die Klangschale lässt sich von hier schlagen. „Zum Kreis" wechselt in den Kreis-Reiter, ohne die Verbindung zu trennen |
| Kreis → Video | Der Kreis zeigt die Gesichter im Rund. „Zur Konferenz" wechselt ins Video |
| Video → Modul in der Mitte | Die Konferenz nimmt über `module`/`modulZeigen` Module entgegen und legt das gewählte für alle in die Mitte. **Der Host reicht seit 30.09.2026 keine Stack-Module mehr hinein** (Feed, Kalender, Karte gehören ins Menü oben). Die Schnittstelle bleibt für Module, die eigens für die Mitte entstehen (Folien) |

## Datenmodell

| Projektion | Muss? | Quelle | Bedeutung im Modul |
|---|---:|---|---|
| Live-Raum | ja | `KreisRaumCapable` | Teilnehmer, Bild, Ton, Bildschirm, Daten-Kanal |
| Modul-Register | ja | Toolkit | welche Module sich in die Konferenz holen lassen |
| Items | nein | `DataInterface` | das Protokoll |

Chat, Hand und Zeichen sind **flüchtig**: Sie reisen als Neben-Nachrichten über den Daten-Kanal und enden mit der Sitzung. Das Protokoll wird erst auf Wunsch ein Item (`note`, `data.text`, `data.raum`, `data.teilnehmer`).

## Capabilities

| Capability | Verhalten, wenn vorhanden | Verhalten, wenn fehlt |
|---|---|---|
| `KreisRaumCapable` mit Medien | Bild, Ton, Bildschirm | ohne Medien (lokaler Adapter): Teilnehmer, Chat, Hand, Kreis; Kacheln mit Anfangsbuchstaben |
| `KreisRaumCapable` fehlt | — | Hinweis, dass die App keinen Raum gibt |
| `ItemWriter` | Protokoll speichern | Speichern ausblenden |
| Web Speech API | Live-Protokoll des eigenen Mikrofons | Protokoll-Knopf ausblenden. **Hinweis in der Fläche:** Chrome schickt das Audio an Google; für Gesundheitsdaten ungeeignet |

## Aktionen

| Aktion | Voraussetzung | Effekt |
|---|---|---|
| Betreten, Gehen | Adapter | wie im Kreis, derselbe Raum |
| Mikrofon, Kamera, Bildschirm | Adapter mit Medien | eigener Track an oder aus |
| Leertaste halten | Mikrofon aus, Fokus außerhalb eines Feldes | Mikrofon offen, solange sie gedrückt ist |
| Ansicht Sprecher / Galerie | — | lokal |
| Anheften | — | eine Person bleibt groß, lokal |
| Hand heben, Zeichen geben | Raum | für alle sichtbar, Zeichen verschwinden nach vier Sekunden |
| Chat | Raum | Zeile an alle |
| Protokoll | Web Speech | eigene Zeilen an alle |
| Modul öffnen | Modul-Register | das Modul erscheint in der Seitenleiste, lokal |
| Klangschale, Redestab | Raum | wie im Kreis |

## Nicht-Ziele

- keine Aufzeichnung,
- kein Warteraum, keine Moderatorenrechte in v0.1 (die eigenständige Seite konnte stummschalten und hinausbitten; das kommt mit einer eigenen Regel für Rollen),
- keine Telefoneinwahl,
- kein eigener Server im Modul.

## Implementierungsreferenzen

- `lichtungooo/rln`, `src/modules/kreis/` (Oberfläche nach Zoom, Protokoll, Leertaste, ERFAHRUNGEN.md)
- `lichtungooo/kreis-server`, `seite/` (die eigenständige Seite, die dieses Modul ablöst) und `token/` (Token-Dienst)

## Offene Punkte

- **Folien brauchen Dateien.** Antons Stack führt heute keine Capability für Dateianhänge; Bilder liegen als eingebettete Daten in `data.image`. Für PDFs reicht das nicht. Übergang: Folien nur für die Sitzung auf dem Raum-Server. **Wunsch an Anton:** eine `BlobCapable` (ablegen, holen, an ein Item hängen), dann bleiben Folien als Item im Space.
- **Aufnahme je Person und Transkript danach** (Timo, 30.09.2026): jede Stimme einzeln aufnehmen und nachträglich transkribieren, zusätzlich zum Live-Protokoll. Braucht die Zustimmung aller und eine Regel dafür.

- Moderatorenrechte: welche Rolle darf stummschalten? Vorschlag: der Space-Admin, über `GroupManager`.
- Kleingruppen in Unterräumen, gemeinsam mit dem Kreis.
- Ein Modul für alle gleichzeitig öffnen („alle sehen das Kanban"): als Neben-Nachricht, wer folgen will, folgt.

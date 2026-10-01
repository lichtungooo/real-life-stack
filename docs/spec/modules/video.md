# Video Module

**Status:** Entwurf v0.1 (lichtungooo, 29.09.2026), gedacht als Beitrag an den Real Life Stack

## Zweck

**Circeling** (so geschrieben, Timo 01.10.2026; vorher „Conferencing“) ist die Konferenz eines Space: Bild, Ton, Bildschirm, Chat und ein Live-Protokoll, in dem Aufbau, den Menschen aus Zoom kennen. Und es ist ein **Gastgeber für andere Module**: Mitten in der Konferenz öffnet man den Kreis mit dem Redestab, die Tafel oder eine Umfrage, und alle arbeiten in derselben Fläche weiter. Feed, Kalender und Karte bleiben oben im Menü des Space; in der Konferenz haben sie nichts verloren (Timo, 30.09.2026).

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

**Zeichenpad (30.09.2026, Schritt A des Folien-Werkzeugs):** Über + → **Zeichenpad** in die Mitte. Die Fläche ist **Excalidraw** (MIT; tldraw, das BBB nutzt, ist nicht Open Source) und lädt erst, wenn jemand das Pad öffnet. Wer es hineinlegt, **präsentiert** und zeichnet; **„Mehrere Benutzer“** gibt es für alle frei (`Sitzung.pad`, `padOeffnen`, `padFreigeben`, `darfZeichnen`); ist der Präsentierende gegangen, kann jemand **übernehmen**. Die Elemente reisen über den Neben-Kanal (`pad-elemente`, `pad-frage` für Nachzügler), in Paketen unter 12.000 Zeichen; Einigung wie in Excalidraw selbst: je Element die höhere Fassung, bei Gleichstand die kleinere Zufallszahl (`@kreis/core/zeichnung`). Fremde Änderungen landen nicht in der eigenen Rückgängig-Liste. Schriften liefert die App selbst aus (`public/excalidraw/fonts`, `EXCALIDRAW_ASSET_PATH`), ohne fremdes Netz. Folgt: Folien aus PDF (B), Markdown-Textdokument (C).

**Folien (30.09.2026, Schritt B):** Wer präsentiert, legt über „Folien hochladen“ eine **PDF** auf (bis 15 MB). Sie reist **in Stücken über den Kanal des Raums** (`datei-kopf`, `datei-teil`, `datei-frage` für Nachzügler; `@kreis/core/dateien`), ohne Server, und lebt nur in der Sitzung (der Stack trägt keine Dateianhänge; Wunsch an Anton: `BlobCapable`). Jedes Gerät zeichnet die Seite selbst mit **pdf.js** (Apache 2.0, Worker aus dem Bau) als Bild und legt es gesperrt unter die Zeichnung. **Jede Folie hat ihre eigene Zeichnung** (`padSchluessel`). Blättern (‹ Folie n ›) nur, wer präsentiert (`padBlaettern`); „Folien abnehmen“ führt zur freien Fläche zurück. **Gefunden und behoben:** Der Neben-Kanal meldete seinen Empfänger bei jedem Neuzeichnen ab und an; eine Antwort genau dazwischen ging verloren. Jetzt meldet er sich einmal an und liest die Verarbeitung aus einem Ref.

**Mitschrift (01.10.2026):** Timo: *„da steht der Name drin, wenn man was spricht … wenn jemand anders spricht, muss das System erkennen, jetzt spricht der … und auch die Zeiten … wie lang … dass wir das messen.“* Jeder schreibt **nur sein eigenes Mikrofon** mit, darum stimmt der Name ohne Sprechererkennung. Der Browser trennt Sprache von Stille (`waechterSchritt` in `@kreis/core`: Grundrauschen gelernt, Beginn nach 0,2 s Sprache, Ende erst nach 2 s Stille, Schnitt nach 90 s, unter 0,5 s fällt weg). **Live wie in Antons Redekreis (01.10.2026):** Spricht sein Mensch, meldet der `AbschnittSchneider` den Beginn und schickt den Ton Block für Block (128 ms, 16 kHz) als Strom an den **Mitschrift-Dienst**; der Text wächst beim Sprechen (alle 0,25 s vom Dienst, gebremst auf 0,6 s zu den anderen), fertig 0,3 s nach dem Ende (gemessen). Nach einer Pause geht der Beitrag **in derselben Zeile** weiter, solange niemand anderes dazwischen sprach und keine 10 s vergingen; die Redezeit zählt nur die gesprochene Zeit (`MitschriftZeile.ms`). Der Dienst hat **Plätze** (je ein Modell, rund 1 GB, `MITSCHRIFT_PLAETZE`, heute 1); sprechen mehr zugleich, wartet deren Ton und wird danach aufgeholt (`kreis-server/mitschrift`, `wss://kreis.wir.ooo/mitschrift`). Der erkennt mit **Nemotron 3.5 ASR Streaming 0.6B** (Gewichte OpenMDW 1.1, frei) über transcribe.cpp (MIT) auf der CPU (Weg aus Antons Redekreis, MIT; Modell aus dessen Volume) und gibt den Text zurück. Zutritt nur mit dem LiveKit-Token des Raums (`KreisRaum.mitschriftZugang`); Ton bleibt nirgends liegen. Eine Zeile reist mit **Name, Beginn, Ende**; erst vorläufig („…“), dann mit Text. **Gemessen wird:** Dauer je Zeile, Redezeit und Beiträge je Mensch mit Anteil (`redezeiten`). **Zustimmung, ein Hebel für alle (Timo, 01.10.2026):** *„allgemein fragen, da können wir mitschneiden. Dann drücken wir einen Hebel … und dann kann man denen auch sagen, ihr könnt euch ausnehmen … und wenn sie es selber ausschalten wollen, an Einstellungen.“* Wer die Runde gefragt hat, legt im Protokoll den Hebel um (`Sitzung.mitschrift`, `mitschriftHebel`); jedes Gerät schreibt dann sein eigenes Mikrofon mit. Alle sehen einen Hinweis mit „Mich ausnehmen“, oben links steht „Mitschrift“, an jeder Person in der Teilnehmerliste, ob sie mitgeschrieben wird. Ausnehmen geht für diese Runde (Protokoll-Spalte, wieder aufnehmen möglich) oder für immer (Einstellungen, „Mich nie mitschreiben“, `Vorlieben.nieMitschreiben`). Wer den Hebel zurücklegt, beendet die Mitschrift für alle. Ist das Mikrofon in der Konferenz aus, hört die Mitschrift nicht hin. **Ablage:** als Beitrag im Space (`post`, Markdown in `content`) oder als `.md`-Datei (`protokollMarkdown`: Kopf mit Zeit und Dabei, Verlauf, Tabelle Redezeit). **Grenze:** ein Modell trägt einen Strom zugleich; alle Abschnitte laufen durch eine Warteschlange, bei 3,3-facher Echtzeit reicht das für ein Gespräch, in dem meist einer spricht. Googles Web Speech ist raus (Timo: *„immer alles open source“*).

**Mini-Konferenz (01.10.2026):** Antons Wunsch (über Timo): *„wenn man vom Circeling auf die Map geht oder in den Kalender … so ein kleines Bild, dass man immer noch in der Konferenz im Kreis mit drin ist … und dass der Ton weiterläuft.“* Das Modul ist gehalten (`keepMounted`), Ton und Verbindung laufen weiter; Antons Host versteckt es mit `display: none`. Ist es nicht vorne (`ModuleViewProps.active` falsch) und man sitzt in einer Runde, zeigt `MiniKonferenz` per Portal ein kleines, verschiebbares Fenster: wer spricht (Bildschirm geht vor, Sprecher bleibt 2 s stehen, `miniWahl`), Titel, Zahl der Menschen, Mikrofon, „Zurück zur Runde“ (in den Raum der Gruppe, aus einem Gruppenraum in den Hauptraum), „Gehen“. Keine Naht an Antons Code.

**Ein Wort zur Zeit (01.10.2026):** Timo: *„Es ist gut, die Leute zu erziehen … erst sprechen, wenn der andere, der gerade spricht, es wieder freigegeben hat. Dann können wir das noch besser regeln mit der Transkribierung.“* Schalter in der Moderation (`Moderation.einWort`, `nurEinerSpricht`). Ist er an, gilt die Regel des Redestabs auch ohne Kreis-Prozess: Das Mikrofon hat nur, wer das Wort hält; wer es nicht hält, verstummt. „Wort nehmen“, der Mikrofon-Knopf und die Leertaste nehmen das Wort, wenn es frei ist (die Leertaste gibt es beim Loslassen zurück); hat es jemand, sagt die Fläche wer und rät zur Hand. Oben links steht „Anna hat das Wort“ oder „Das Wort ist frei“. Auf Augenhöhe: Jeder darf schalten, jedes Gerät hält sich selbst daran.

**Textdokument (30.09.2026):** Timo: *„wie im HedgeDoc zeitgleich mitschreiben im Markdown-Format, mit oben einer kleinen Leiste“*. **Anton: ganz normale Real Life Stack Items.** Das Dokument ist darum ein **Beitrag (`post`) im Space**, das Markdown steht in `content`, der Titel folgt der ersten Überschrift. Die Sitzung merkt sich nur die Id (`Sitzung.dokument`, `dokumentSetzen`); gelesen und geschrieben wird über Antons Hooks `useItem` und `useUpdateItem` (App: `TextdokumentItem` in `video-flaeche.tsx`), synchronisiert von seinem Stack. Kein eigenes Yjs, die Grenz-Regel bleibt heil. Editor CodeMirror 6 (MIT), gesteuert: eigene Änderungen gehen gebündelt (0,7 s) hinaus, eine neue Fassung von außen kommt herein, sobald man 1,5 s nicht tippt. **Grenze:** Schreiben zwei zugleich an derselben Stelle, gilt die zuletzt gespeicherte Fassung. Leiste: Fett, Kursiv, Überschriften, Liste, Aufgabe, Zitat, Code, Link, Tabelle, Rückgängig; Ansicht Schreiben · Beides · Vorschau (react-markdown, MIT); als `.md` herunterladen. **Nebenbei behoben:** Protokoll und Beschlüsse schrieben ihren Text in `text`, Antons `post` erwartet `content`.

**Meeting-Überblick (30.09.2026):** Zahnrad bei Teilnehmer → **Meeting-Überblick**, nach dem Lernanalyse-Dashboard von BBB: Karten (Aktive Teilnehmer, Nachrichten, Redezeit gesamt, Umfragen) und je Mensch Onlinezeit, **Redezeit**, Kamerazeit, Nachrichten, Reaktionen, gehobene Hände, Status; „Konferenzdaten herunterladen“ als CSV (Semikolon). **Datensparsam:** Jedes Gerät zählt, was es selbst seit dem Betreten gesehen hat (`useUeberblick`, ein Takt je Sekunde); nichts wird gespeichert oder verschickt. Aktivitätswert und Quizze aus BBB sind bewusst weggelassen: Menschen in einem Kreis bekommen keine Punktzahl.

**Gruppenräume (30.09.2026):** Zahnrad bei Teilnehmer → **Gruppenräume erstellen**, wie in BBB: Anzahl (2 bis 8), Dauer in Minuten, „selbst aussuchen“, Spalten „Nicht zugewiesen / Raum n“ mit **Ziehen** oder Auswahl neben dem Namen, **Zufällig zuordnen**, Prüfung „Jedem Gruppenraum muss wenigstens eine Person zugeordnet sein“ (`@kreis/core/gruppenraeume`). Jeder Gruppenraum ist ein eigener Raum im Adapter (`<Hauptschlüssel>-grN`, passt zum Token-Dienst). Wer eingeteilt ist, sieht einen **Countdown** und wechselt nach fünf Sekunden selbst (oder „Jetzt gehen“); beim Selbstaussuchen wählt jeder seinen Raum. Im Gruppenraum steht die Restzeit mit **„Zurück in den Hauptraum“**; zur Zeit kehrt jedes Gerät von selbst zurück (Provider: `unterraum`, `inUnterraum`, `zurueckInHauptraum`). **Grenze:** Wer im Hauptraum „Hier beenden“ drückt, erreicht die Gruppenräume nicht (getrennte Räume, kein Server); sie kommen zur verabredeten Zeit. Aktuelle Folie mitgeben und Whiteboard aufnehmen aus BBB sind noch offen.

**Moderation (30.09.2026):** Zahnrad bei „Teilnehmer“, wie in BBB. **Auf Augenhöhe:** Jeder darf sie bedienen, und jedes Gerät hält sich selbst daran (`Sitzung.moderation`, `@kreis/core/moderation`); einen Server, der für andere entscheidet, gibt es nicht.
- **Neue Teilnehmer stumm schalten:** Wer hereinkommt, schaltet sich einmal selbst stumm, sobald der Stand bei ihm ist.
- **Alle stumm schalten bis auf die Person, die präsentiert** (Pad-Präsentierende, sonst wer den Stab hält, sonst wer klickt): Neben-Kanal `alle-stumm`.
- **Rechte der Zuschauenden:** Chat schließen, Notizen nur zum Lesen, Bildschirm teilen sperren (eigenes Teilen beenden geht immer).
- **Gastzugang, Warteraum:** Wer über den Link kommt und nicht zur Gruppe gehört, wartet ohne Mikrofon, Kamera und Ton, bis ihn jemand **hereinholt** (`hereinholen`); der Provider kennt dafür `tonAus`.
- **Teilnehmernamen speichern** (Textdatei), **Alle Reaktionen löschen** (Hände und Zeichen bei allen).

**Tagesordnung, Aufgaben und Beschlüsse (30.09.2026):** Links unter **Meeting** zwei Spalten.
- **Tagesordnung** (`Sitzung.tagesordnung`, `@kreis/core/tagesordnung`): Punkte mit Zeit (ohne, 5 bis 60 Min.), aufrufen (der vorige gilt dann als erledigt), abhaken, verschieben, entfernen, „Punkt abschließen“. Der laufende Punkt steht oben in der Kopfzeile mit Restzeit oder „überzogen“. Jeder darf sie pflegen.
- **Aufgaben und Beschlüsse** (Neben-Kanal `ergebnis`, Nachzügler über `werkzeug-frage`): Aufgabe mit „Wer?“ (Namen aus dem Raum) und „Bis wann“, oder Beschluss. **Nur wer festhält, legt ab**, damit jedes Item genau einmal entsteht: Aufgabe als Item `task` mit Status `open` (Kanban der Gruppe), Beschluss als `post` (Feed), jeweils mit Herkunft „Aus dem Meeting … am …, festgehalten von …“ (`ergebnisAblegen` von der App).

**Layouts (30.09.2026):** ⋮ → **Layout** öffnet vier Ansichten als Bildchen wie in BBB: **Bilder oben** (Standard), **Bilder rechts**, **Präsentation im Zentrum** (Bilder klein unten links), **Video im Zentrum** (das Tool als kleine Karte unten links, ein Klick holt es groß). Die Wahl gilt für mich (`Vorlieben.layout`); mit **„Für alle übernehmen“** geht sie an alle (`Sitzung.layout` mit laufender Nummer, jede Übernahme kommt einmal an, danach stellt jeder wieder selbst um).

**Einstellungen wie in Big Blue Button (30.09.2026):** ⋮ → **Einstellungen**, links vier Reiter, oben Schließen und Speichern (Timo mit Bildschirmfotos aus BBB).
- **Anwendung** (nur für mich, im Browser, `vorlieben.ts`): Animationen, **Audiofilter** fürs Mikrofon (Rausch-, Echounterdrückung, automatische Lautstärke; `KreisRaum.mikroFilter`, LiveKit `restartTrack` ohne Neuverbindung), **Push-to-Talk** (Leertaste), **Selbstansicht**, Reaktionsleiste schließt sich, **Schriftgröße** 80 bis 130 %. Hell und dunkel bleibt oben in der App.
- **Benachrichtigungen:** Ton und Einblendung je Chatnachricht, Beitritt, Gehen, Hand heben; Vorgabe wie BBB nur beim Handheben.
- **Datensparmodus:** Kameras der anderen, geteilter Bildschirm der anderen (das eigene Bild bleibt).
- **Regeln des Raums** (für alle): Redezeit, danach, Stille, Dauer des Meetings.

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

Chat, Hand und Zeichen sind **flüchtig**: Sie reisen als Neben-Nachrichten über den Daten-Kanal und enden mit der Sitzung. Das Protokoll wird erst auf Wunsch ein Item (`post`, `data.content` als Markdown, `data.raum`, `data.teilnehmer`).

## Capabilities

| Capability | Verhalten, wenn vorhanden | Verhalten, wenn fehlt |
|---|---|---|
| `KreisRaumCapable` mit Medien | Bild, Ton, Bildschirm | ohne Medien (lokaler Adapter): Teilnehmer, Chat, Hand, Kreis; Kacheln mit Anfangsbuchstaben |
| `KreisRaumCapable` fehlt | — | Hinweis, dass die App keinen Raum gibt |
| `ItemWriter` | Protokoll speichern | Speichern ausblenden |
| `KreisRaum.mitschriftZugang` (Mitschrift-Dienst) | Mitschrift des eigenen Mikrofons mit Name, Zeit, Dauer | Protokoll-Eintrag ausblenden (lokaler Raum ohne Dienst) |

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
| Protokoll | Mitschrift-Dienst (Nemotron) | eigene Zeilen mit Beginn und Ende an alle |
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

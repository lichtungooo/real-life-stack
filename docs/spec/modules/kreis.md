# Kreis Module

**Status:** Entwurf v0.1 (lichtungooo, 29.09.2026), gedacht als Beitrag an den Real Life Stack

## Zweck

Der Kreis ist der Raum, in dem sich die Menschen eines Space treffen, wenn sie verstreut leben: im Bild, im Ton, und geführt von einem **Gruppenprozess**.

- **Problem im Current Space:** Gruppen arbeiten verteilt. Konflikte, die in verstreuten Gruppen aufkommen, lassen sich im Chat kaum klären, und ein gewöhnlicher Videoanruf hat keine Form, die ein Gespräch trägt. Wer lauter ist, füllt den Raum.
- **Wiederholte Nutzung:** Kennenlernrunden, Redestab-Runden, Reflexionskreise, Wir-Prozesse nach Scott Peck, Klärungskreise nach Eva Stützel. Jeder Prozess folgt Schritten, Fragen und Empfehlungen, die der Kreis gemeinsam sieht.
- **Wer davon profitiert:** Kalender (ein Treffen mit Datum führt in den Kreis), Wissensfeld und Feed (das Protokoll einer Sitzung wird ein Item), jede App, die Gemeinschaft tragen will.

Der Kreis ersetzt die Begegnung im echten Leben nicht. Er bereitet sie vor: Ist ein Konflikt geklärt, fällt die Begegnung leichter.

## Einordnung

| Frage | Antwort |
|---|---|
| Space Module? | Ja |
| App-Shell-Fläche? | Nein |
| Module Components | `KreisRund` (Teilnehmer im Kreis mit Mitte), `Redestab`, `Klangschale`, `ProzessLeiste` (Schritt, Anleitung, Fragen, Empfehlungen), `ProzessWahl`, `StilleSchleier`, `PausenSchleier` |
| Primäre Datenbasis | Capability `KreisRaumCapable` (Live-Raum), Items für Prozess-Vorlagen und Protokolle |
| Externe Semantik | keine. Die Prozesse sind Vorlagen, keine Regeln des Real Life Game |

## Datenmodell

| Projektion | Muss? | Quelle | Bedeutung im Modul |
|---|---:|---|---|
| Live-Raum | ja | `KreisRaumCapable` | Teilnehmer, Bild, Ton, gemeinsamer Zustand |
| Items | nein | `DataInterface` | Prozess-Vorlagen eines Space (`data.prozess`), Protokolle |
| Groups/Spaces | ja | App Shell | Der Space gibt den Raumnamen vor |
| Relations | nein | `RelationCapable` | Protokoll gehört zu einem Treffen (später) |

### Der gemeinsame Zustand ist flüchtig

Wer den Redestab hält, wann die Klangschale klang, welcher Schritt läuft: Das lebt **nur während der Sitzung** und nur im Raum. Es wird kein Item und keine Relation. Er reist als kleine Nachricht über den Daten-Kanal des Raums.

- Jede Änderung trägt eine **Fassung** `v` und ihren **Absender**. Es gilt die höhere Fassung, bei gleicher Fassung der größere Absender. So einigen sich alle Teilnehmer ohne Server auf einen Stand, auch wenn zwei im selben Augenblick nach dem Stab greifen.
- Wer neu hereinkommt, fragt nach dem Stand. Wer ihn kennt, antwortet.
- Zeiten (Stille bis, Pause bis) stehen als absolute Zeitpunkte. Geräte gehen in der Regel auf die Sekunde gleich; eine Abweichung verschiebt nur, wann die Stille endet.

### Prozess-Vorlagen sind Daten

Ein Prozess ist eine reine Beschreibung: Name, Herkunft, Empfehlungen, Schritte. Ein Schritt hat Titel, Dauer, Art (`stille`, `offen`, `reihum`, `kleingruppen`, `pause`), Anleitung und Fragen. Das Modul bringt sechs Vorlagen mit (siehe unten). Ein Space kann eigene als Item tragen: Feld `data.prozess` mit derselben Form. Eine Vorlage mit unbekannter Schritt-Art bleibt erhalten und wird als `offen` gezeigt (Muster: Unbekanntes bleibt erhalten).

Regeln:

1. Top-level Item-Felder bleiben auf den RLS-Core beschränkt.
2. Fachliche Felder liegen in `item.data` (`data.prozess`, beim Protokoll `data.text`, `data.raum`, `data.teilnehmer`).
3. Der flüchtige Sitzungszustand wird nie als Item geschrieben.

## Capabilities

| Capability | Verhalten, wenn vorhanden | Verhalten, wenn fehlt |
|---|---|---|
| `KreisRaumCapable` | Raum betreten, Bild und Ton, gemeinsamer Zustand | Das Modul zeigt die Prozesse zum Lesen und erklärt, dass für den Live-Raum ein Raum-Adapter fehlt |
| `DataInterface` | Eigene Prozess-Vorlagen des Space lesen | Nur die mitgelieferten Vorlagen |
| `ItemWriter` | Protokoll einer Sitzung speichern | Speichern ausblenden |
| `Authenticatable` | Anzeigename aus dem Profil vorschlagen | Name wird im Vorraum eingegeben |

### Der Raum-Adapter (`KreisRaumCapable`)

Wie die Karte ihren Karten-Library-Adapter hat, hat der Kreis einen **Raum-Adapter**. Das Modul kennt keinen Server und keine Bibliothek. Es spricht mit einem Vertrag:

```ts
interface KreisRaum {
  betreten(raum: string, name: string): Promise<void>
  verlassen(): Promise<void>
  teilnehmer(): readonly KreisTeilnehmer[]      // id, name, ichSelbst, spricht, mikroAn, kameraAn
  beiAenderung(fn: () => void): () => void      // Teilnehmer, Tracks, Sprechen
  senden(nachricht: unknown): void              // an alle, verlässlich, in Reihenfolge
  beiNachricht(fn: (n: unknown, von: string) => void): () => void
  mikro(an: boolean): Promise<void>
  kamera(an: boolean): Promise<void>
  bildAnhaengen?(id: string, el: HTMLVideoElement): () => void   // optional: ohne Bild bleibt es beim Ton
  tonAnhaengen?(id: string, el: HTMLAudioElement): () => void
}
```

Bereitgestellte Adapter:

| Adapter | Wofür |
|---|---|
| `lokalerKreisRaum()` | Mehrere Browser-Tabs auf einem Gerät, über `BroadcastChannel`. Ohne Server, ohne Bild und Ton. Zum Ausprobieren und für Tests |
| LiveKit-Adapter | Echte Sitzungen mit Bild und Ton, self-hosted (Apache 2.0). Kommt von der App, nicht vom Modul |

Eine App bindet den Adapter über einen Provider. Fehlt er, degradiert das Modul sichtbar.

## Aktionen

| Aktion | Voraussetzung | Effekt |
|---|---|---|
| Prozess wählen | im Raum | alle sehen den Prozess, Schritt 1 beginnt |
| Redestab nehmen | Stab liegt in der Mitte, keine Stille, keine Pause | ich halte den Stab; im Prozess „Nur wer den Stab hält, spricht" gehen die Mikrofone der anderen aus |
| Redestab zurücklegen | ich halte ihn | er liegt wieder in der Mitte |
| Redestab weitergeben | ich halte ihn, Schritt der Art `reihum` | er geht an den nächsten im Kreis |
| Klangschale schlagen | im Raum | alle hören sie, der Stab kehrt in die Mitte, Stille für die Dauer des Prozesses |
| Pause | im Raum | alle sehen die Pause mit Rückkehrzeit |
| Schritt vor und zurück | Prozess läuft | alle sehen den neuen Schritt |
| Kleingruppen einteilen | Schritt der Art `kleingruppen` | Einteilung für alle sichtbar |
| Protokoll speichern | `ItemWriter` | ein Item vom Typ `note` mit `data.text` |

Regeln:

1. Eine Aktion wird nur angeboten, wenn ihre Voraussetzung erfüllt ist.
2. Jede Aktion ist eine reine Funktion auf dem Sitzungszustand; der Raum-Adapter trägt das Ergebnis zu allen.
3. Wer den Stab hält und den Raum verlässt, gibt ihn frei: Ein Stab bei jemandem, der nicht mehr da ist, darf jeder nehmen.

## Komponenten

| Komponente | Rolle | Wiederverwendbar? |
|---|---|---|
| `KreisRund` | Teilnehmer auf einem Kreis, jeder sieht sich unten, gleiche Reihenfolge für alle | ja |
| `Redestab` | Anzeige in der Mitte, Nehmen, Zurücklegen, Weitergeben | ja |
| `Klangschale` | Ton aus der Web-Audio-Schnittstelle, ohne Tondatei | ja |
| `ProzessLeiste` | Schritt, Anleitung, Fragen, Empfehlungen, Zeit | ja |
| `ProzessWahl` | Liste der Vorlagen mit Herkunft und Dauer | ja |

## Mitgelieferte Prozesse

| Id | Name | Herkunft |
|---|---|---|
| `wir-prozess` | Wir-Prozess | M. Scott Peck, Gemeinschaftsbildung, in der Form von Schloss Tempelhof (18 Empfehlungen) |
| `klaerungskreis` | Klärungskreis | Eva Stützel, *Der Gemeinschaftskompass*, „Konflikte in der Gesamtgruppe bearbeiten" |
| `reflexionskreis` | Reflexionskreis | Real Life Network, fünf Fragen |
| `redestab-runde` | Redestab-Runde | Circle Way (Baldwin, Linnea) |
| `kennenlernen` | Kennenlernkreis | für neue Gruppen |
| `zwiegespraech` | Zwiegespräch | Michael Lukas Moeller |

## Cross-Module-Verhalten

- Ein Item mit `start` und `data.kreis` (Raumname) erscheint im Kalender und führt über `presents: ["kreis"]` in den Kreis.
- Ein gespeichertes Protokoll erscheint im Feed und in der Liste wie jede Notiz.

## Nicht-Ziele

- keine Aufzeichnung von Bild oder Ton,
- keine Moderatorenrechte, die andere stummschalten können (der Stab regelt nur das eigene Mikrofon),
- keine Diagnose, keine Therapie,
- kein Server im Modul,
- keine Spielregeln des Real Life Game.

## Implementierungsreferenzen

- Vorbild der Oberfläche und des LiveKit-Wegs: `lichtungooo/rln`, `src/modules/kreis/` (Kreis mit Bild, Ton, Live-Protokoll)
- Token-Dienst und LiveKit: `lichtungooo/kreis-server`
- Die Prozesse: *Der Gemeinschaftskompass* (Eva Stützel), *The Different Drum* (M. Scott Peck)

## Offene Punkte

- Eigene Prozess-Vorlagen als Item: welcher Typ? Vorschlag: `note` mit `data.prozess`, bis ein eigener Typ sich lohnt.
- Kleingruppen in eigenen Unterräumen: braucht der Raum-Adapter ein `wechseln(raum)`?
- Eli als Teilnehmer (Stufe 2 aus dem RLN-Kreis): ein Agent tritt dem Raum bei und liest das Protokoll.

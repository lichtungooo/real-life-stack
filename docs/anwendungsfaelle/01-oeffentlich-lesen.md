# Anwendungsfall: Ohne Anmeldung lesen

**Für Anton. Gefunden am 17.09.2026 beim Aufbau von trustdonation.org.**

Dies ist eine Frage, kein Pull Request. Sie berührt Spec 09 und `docs/concepts/access-control.md`, und die Antwort gehört dir.

## Die Lage

Eine Stiftung bekommt einen Link zu trustdonation.org. Sie klickt, und der Stack verlangt eine Identität, bevor sie irgendetwas sieht. Zwölf Wörter aufschreiben, ein Passwort setzen, ein Profil anlegen: für jemanden, der nur nachsehen wollte, ob sich das Hinsehen lohnt.

Timo hat es so beschrieben: *"Erst müssten die Daten angezeigt werden, und dann kann ich mich anmelden, damit ich da im Web of Trust interagieren kann."*

Wir helfen uns heute mit dem local-Connector: `trustdonation.org/app` zeigt ohne Anmeldung 234 recherchierte Stiftungen auf der Karte. Das sind Beispieldaten, eine Kopie. Was im Web of Trust lebt, erscheint dort nie.

## Was in deinem Stack dazu steht

`docs/concepts/access-control.md` nennt vier Stufen, darunter "Jeder mit link/secret/einladung" und "Jeder (öffentlich)". Code findet sich zu keiner der beiden.

Spec 09, Invariante 9, zieht die Grenze:

> Relay und Nicht-Mitglieder sehen weiterhin nur Ciphertext.

Wir verstehen die Invariante und wollen sie nicht umgehen. Darum fragen wir, statt zu bauen.

## Die zwei Fragen

### 1. Gibt es einen Leser-Rang?

Ein Space mit öffentlichem Schlüssel wäre der kurze Weg: Der Schlüssel steht in der Adresse, der Besucher bekommt eine Wegwerf-Identität (`authenticate("generate")` legt eine an, ohne Passwort und ohne Speichern) und tritt bei.

Daran hängt eine Frage, die wir nicht beantworten können: **Wer in einem Space ist, kann schreiben.** Ein öffentlicher Schlüssel macht jeden Besucher zum Autor, und von den Daten bliebe nichts.

Kennt der Stack eine Mitgliedschaft, die nur liest? Wenn ja, wo? Wenn nein, wäre sie vorstellbar, und zu welchem Preis?

### 2. Taugt ein Mirror als öffentliche Form?

Ein Mirror-Snapshot ist signiert statt verschlüsselt, read-only, und er entsteht nur durch eine bewusste Freigabe. Das sind genau die Eigenschaften, die etwas Öffentliches braucht.

`profiles.web-of-trust.de` tut für Profile offenbar etwas in dieser Richtung. Ließe sich derselbe Weg für Items gehen, sodass ein Space seine freigegebenen Einträge als offene Daten ausliefert?

Das ist der Weg, der wirklich trägt: lesbar ohne Client, von Suchmaschinen auffindbar, als Link teilbar. Eine Stiftung, die ihren Eintrag jemandem schicken will, braucht genau das.

## Was wir tun, solange die Antwort offen ist

- Die Beispielwelt bleibt die Startseite. Sie ist ehrlich gekennzeichnet.
- Wir bauen keinen eigenen Leseweg an deiner Verschlüsselung vorbei.
- Der Knopf zum Anmelden wandert ans Ende: Wer die Karte öffnet, sieht die Karte. Die Anmeldung steht dort, wo jemand etwas beitragen will.

Unsere Überlegungen dazu stehen in `docs/DEFINITION.md`, Teil 12.

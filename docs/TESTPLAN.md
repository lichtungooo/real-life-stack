# Testplan

**Wofuer:** Der grosse Durchgang, bevor der Prototyp einer Stiftung gezeigt wird.

Ein Test ohne Plan ist Herumklicken. Dieser Plan sagt, **was** geprueft wird, **woran** man sieht, dass es taugt, und **was ein Fund kostet**.

---

## Was vorher zu klaeren ist

Drei Entscheidungen. Ohne sie prueft der Test etwas anderes, als er soll.

### 1. Inhalte, oder bewusst leer?

**Der Prototyp zeigt heute fuenf Spaces mit Namen, Bildern und Farben, aber keine Inhalte.** Feed, Kalender und Karte sind leer, denn die Items aus Timos Dev-Server blieben draussen: Es waren echte Beitraege von Menschen (Entscheidung E3).

Damit hat der Test zwei moegliche Formen:

| Form | Was geprueft wird | Wann sie richtig ist |
|---|---|---|
| **Leer** | Traegt die Struktur? Netzwerke, Arten, Zuordnung, die beiden neuen Bereiche | Der Test prueft **uns**, nicht die Wirkung |
| **Gefuellt** | Wie sich die App anfuehlt, wenn etwas drinsteht | Der Test prueft, was eine Stiftung sehen wuerde |

**Empfehlung:** Erst leer testen, dann fuellt Timo ein bis zwei Spaces von Hand, dann gefuellt testen. Das trennt zwei Fragen, die sonst durcheinandergehen.

### 2. Die drei hellen Space-Farben

trustdonation (`#d97706`), Christianskies (`#e8e102`) und Lichtung (`#f3e3bb`) tragen helle Primaerfarben. Der aktive Modul-Reiter darauf hat zu wenig Kontrast (siehe `REIFE.md`). Das ist **beim Test sofort sichtbar** und lenkt ab.

**Ein Klick je Space** im Reiter Aussehen loest es. Vorher machen, sonst diskutieren wir im Test darueber.

### 3. Wer testet, und mit welchem Geraet?

Die Funde unterscheiden sich stark. Mindestens: ein Rechner mit grossem Bildschirm und ein Telefon. Wenn moeglich jemand, der die App **nicht** gebaut hat.

---

## Vor dem Test, maschinell

```bash
cd /d/Workspace/20-repos/rls-uebersicht
python td-tools/pruefen.py                             # sechs Tore, voll
python td-tools/anton-stand.py                         # steht Anton still?
pnpm --filter reference exec vite preview --port 4173 &
python td-tools/zugang.py                              # null Funde erwartet
python td-tools/startlast.py                           # unter 1200 KB
```

Und gegen die laufende Instanz:

```bash
python td-tools/zugang.py https://trustdonation.org/app/
python td-tools/startlast.py https://trustdonation.org/app/
curl -s -o /dev/null -w '%{http_code}\n' https://trustdonation.org/app/
```

**Ist etwas rot, wird nicht getestet, sondern behoben.** Ein Test auf kaputtem Stand findet die falschen Dinge.

---

## Der Durchgang

Jede Zeile ist eine Handlung mit einer Erwartung. Was abweicht, kommt in die Fundliste, ohne dass der Durchgang abbricht.

### A. Ankommen

| Handlung | Erwartung |
|---|---|
| `trustdonation.org/app` oeffnen, ohne Anmeldung | Die App laedt und zeigt etwas. Keine Anmeldemaske. |
| Auf den Umschalter oben links sehen | **Netzwerke:** Marker & Maps, Real Life, trustdonation, Lichtung. **Projekte:** Marker & Maps, Lichtung. **Stiftungen:** Loewenherz Stiftung. |
| Die Bilder ansehen | Jeder Space traegt sein eigenes Bild, keine Platzhalter. |
| Die Seite neu laden | Derselbe Space ist noch aktiv. |
| Die Seite im Telefon oeffnen | Bedienbar, nichts laeuft ueber den Rand. |
| Mit zwei Fingern vergroessern | **Geht.** (War bis heute abgeschaltet.) |

### B. Die Gliederung

| Handlung | Erwartung |
|---|---|
| In ein anderes Netzwerk wechseln | Darunter stehen nur dessen Spaces, nach Arten gegliedert. |
| Auf "Mein Netzwerk" gehen | Die Uebersicht ueber alle Spaces. |
| Einen Space oeffnen, der Projekt **und** Netzwerk ist (Lichtung) | Er steht bei den Netzwerken **und** als Projekt in trustdonation. Nur einmal je Abschnitt. |

### C. Der Bereich Netzwerk

| Handlung | Erwartung |
|---|---|
| Zahnrad an trustdonation, Reiter **Netzwerk** | Haekchen gesetzt, zwei Arten (Stiftung, Projekt) mit Farben. |
| Eine Art umbenennen | Der Umschalter zeigt den neuen Namen. Die Zuordnung der Spaces bleibt. |
| Eine Art hinzufuegen, ohne Mehrzahl | Wird nicht geschrieben, die uebrigen bleiben. |
| Eine Art entfernen, die Spaces nutzen | Die Spaces bleiben, sie stehen unter "Gruppen". |
| Bei einem anderen Space Netzwerk und Art waehlen | Er wandert im Umschalter in den richtigen Abschnitt. |
| Das Haekchen "Netzwerk" abwaehlen | Der Reiter **Landingpage** verschwindet. |

### D. Der Bereich Landingpage

| Handlung | Erwartung |
|---|---|
| Zahnrad an trustdonation, Reiter **Landingpage** | Domain (`wir.ooo`) und ein kopierbarer Link. |
| Domain auf `trustdonation.org` aendern | Der Link darunter baut sich neu. |
| Auf "Kopieren" | Haken erscheint, der Link liegt in der Ablage. |
| Den Link in einem neuen Fenster oeffnen | Fuehrt in diesen Space. |

### E. Aussehen

| Handlung | Erwartung |
|---|---|
| Reiter **Aussehen**, Primaerfarbe aendern | Die App uebernimmt sie sofort. |
| Auf hell und dunkel umschalten | Alles bleibt lesbar. |
| Ein Bild fuer den Space setzen | Erscheint im Umschalter. |

### F. Die Module

| Handlung | Erwartung |
|---|---|
| Reiter **Module**, eines abwaehlen | Der Tab verschwindet, die uebrigen bleiben. |
| Alle abwaehlen | Mindestens einer bleibt. Kein Space ohne Tab. |
| Auf die Karte gehen | Sie laedt (kurz "Karte wird geladen"), dann erscheint sie. |
| Zwischen Modulen wechseln und zurueck zur Karte | Sie baut sich **nicht** neu auf. |

### G. Was einen Menschen stoert

Ohne Erwartung, mit offenen Augen:

- Wo zoegert die App?
- Wo ist unklar, was ein Knopf tut?
- Wo steht ein Wort, das jemand von aussen nicht versteht?
- Wo sieht es nach Baustelle aus?

---

## Ein Fund wird so notiert

```markdown
### F<n>. <Was passiert>

- **Wo:** Space, Reiter, Geraet
- **Schritte:** 1. … 2. … 3. …
- **Erwartet:** …
- **Passiert:** …
- **Wiegt:** haelt auf / stoert / faellt auf
```

**"Haelt auf"** heisst: Damit zeigen wir es keiner Stiftung. Das wird behoben, bevor der Link rausgeht. Alles andere kommt in `REIFE.md` und wartet.

---

## Nach dem Test

1. Funde sortieren: was haelt auf, was stoert, was faellt auf.
2. Was aufhaelt, wird behoben, dann derselbe Durchgang noch einmal fuer die betroffenen Zeilen.
3. Der Rest kommt in `REIFE.md`.
4. `memory/stand_trustdonation.md` nachziehen.
5. **Was aufgefallen ist und niemand vorhergesehen hat, kommt in den passenden Skill**, nicht nur in den Stand. Eine Falle nur im Stand hilft niemandem, der sie gerade auslaeuft.

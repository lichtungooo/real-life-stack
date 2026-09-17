# Testplan

**Wofür:** Der große Durchgang, bevor der Prototyp einer Stiftung gezeigt wird.

Ein Test ohne Plan ist Herumklicken. Dieser Plan sagt, **was** geprüft wird, **woran** man sieht, dass es taugt, und **was ein Fund kostet**.

---

## Was vorher zu klären ist

Drei Entscheidungen. Ohne sie prüft der Test etwas anderes, als er soll.

### 1. Inhalte, oder bewusst leer?

**Der Prototyp zeigt heute fünf Spaces mit Namen, Bildern und Farben, aber keine Inhalte.** Feed, Kalender und Karte sind leer, denn die Items aus Timos Dev-Server blieben draußen: Es waren echte Beiträge von Menschen (Entscheidung E3).

Damit hat der Test zwei mögliche Formen:

| Form | Was geprüft wird | Wann sie richtig ist |
|---|---|---|
| **Leer** | Trägt die Struktur? Netzwerke, Arten, Zuordnung, die beiden neuen Bereiche | Der Test prüft **uns**, nicht die Wirkung |
| **Gefüllt** | Wie sich die App anfühlt, wenn etwas drinsteht | Der Test prüft, was eine Stiftung sehen würde |

**Empfehlung:** Erst leer testen, dann füllt Timo ein bis zwei Spaces von Hand, dann gefüllt testen. Das trennt zwei Fragen, die sonst durcheinandergehen.

### 2. Die Space-Farben: erledigt

trustdonation trug `#d97706` und kam mit weißem Text auf 3,19:1. Jetzt `#b16105`, derselbe Farbton eine Stufe dunkler, 4,58:1.

Gerechnet traf es **einen** von fünf Spaces, nicht drei: Lichtung bekommt schwarzen Text und liegt bei 16,5:1. Wer im Test eine Farbe ändert, prüft danach den Reiter noch einmal.

### 3. Wer testet, und mit welchem Gerät?

Die Funde unterscheiden sich stark. Mindestens: ein Rechner mit großem Bildschirm und ein Telefon. Wenn möglich jemand, der die App **nicht** gebaut hat.

---

## Der maschinelle Teil läuft von selbst

Die Abschnitte A bis F unten sind als Test geschrieben und laufen in achtzehn Sekunden:

```bash
cd apps/reference
npx playwright test --config playwright.trustdonation.config.ts
npx playwright test --config playwright.trustdonation.config.ts --headed   # zum Zusehen
```

Zwölf Erwartungen: Ankommen ohne Anmeldung, Ueberschrift, Zoomen, die fünf Spaces, Netzwerke oben, eigene Bilder, Gliederung nach Arten, ein Space in zwei Abschnitten, die sechs Dialog-Bereiche, Landingpage nur für Netzwerke, die Modul-Reiter, die Karte.

Sie sind auch das sechste Tor in `td-tools/pruefen.py`; das siebte ist das Gedächtnis.

**Was sie nicht können:** Abschnitt G. Ob sich etwas falsch anfühlt, ob ein Wort unverständlich ist, ob es nach Baustelle aussieht, sieht nur ein Mensch. Dafür ist der Durchgang da; die Maschine nimmt ihm die Buchhaltung ab.

## Vor dem Test, maschinell

```bash
cd /d/Workspace/20-repos/rls-uebersicht
python td-tools/pruefen.py                             # sieben Tore, voll
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

*Die ersten drei Zeilen und das Vergrößern prüfen sich selbst. Was bleibt: neu laden, Telefon, zwei Finger.*

| Handlung | Erwartung |
|---|---|
| `trustdonation.org/app` öffnen, ohne Anmeldung | Die App lädt und zeigt etwas. Keine Anmeldemaske. |
| Auf den Umschalter oben links sehen | **Netzwerke:** Marker & Maps, Real Life, trustdonation, Lichtung. **Projekte:** Marker & Maps, Lichtung. **Stiftungen:** Löwenherz Stiftung. |
| Die Bilder ansehen | Jeder Space trägt sein eigenes Bild, keine Platzhalter. |
| Die Seite neu laden | Derselbe Space ist noch aktiv. |
| Die Seite im Telefon öffnen | Bedienbar, nichts läuft über den Rand. |
| Mit zwei Fingern vergrößern | **Geht.** (War bis heute abgeschaltet.) |

### B. Die Gliederung

*Prüfen sich selbst. Was bleibt: wie es sich beim Wechseln anfühlt.*

| Handlung | Erwartung |
|---|---|
| In ein anderes Netzwerk wechseln | Darunter stehen nur dessen Spaces, nach Arten gegliedert. |
| Auf "Mein Netzwerk" gehen | Die Übersicht über alle Spaces. |
| Einen Space öffnen, der Projekt **und** Netzwerk ist (Lichtung) | Er steht bei den Netzwerken **und** als Projekt in trustdonation. Nur einmal je Abschnitt. |

### C. Der Bereich Netzwerk

| Handlung | Erwartung |
|---|---|
| Zahnrad an trustdonation, Reiter **Netzwerk** | Häkchen gesetzt, zwei Arten (Stiftung, Projekt) mit Farben. |
| Eine Art umbenennen | Der Umschalter zeigt den neuen Namen. Die Zuordnung der Spaces bleibt. |
| Eine Art hinzufügen, ohne Mehrzahl | Wird nicht geschrieben, die übrigen bleiben. |
| Eine Art entfernen, die Spaces nutzen | Die Spaces bleiben, sie stehen unter "Gruppen". |
| Bei einem anderen Space Netzwerk und Art wählen | Er wandert im Umschalter in den richtigen Abschnitt. |
| Das Häkchen "Netzwerk" abwählen | Der Reiter **Landingpage** verschwindet. |

### D. Der Bereich Landingpage

| Handlung | Erwartung |
|---|---|
| Zahnrad an trustdonation, Reiter **Landingpage** | Die Domain (heute noch `wir.ooo`) und ein kopierbarer Link. |
| Domain auf `trustdonation.org` ändern | Der Link darunter baut sich neu. |
| Auf "Kopieren" | Haken erscheint, der Link liegt in der Ablage. |
| Den Link in einem neuen Fenster öffnen | Führt in diesen Space. |

### E. Aussehen

| Handlung | Erwartung |
|---|---|
| Reiter **Aussehen**, Primärfarbe ändern | Die App übernimmt sie sofort. |
| Auf hell und dunkel umschalten | Alles bleibt lesbar. |
| Ein Bild für den Space setzen | Erscheint im Umschalter. |

### F. Die Module

*Der letzte Punkt prüft sich selbst. Was bleibt: ab- und anwählen.*

| Handlung | Erwartung |
|---|---|
| Reiter **Module**, eines abwählen | Der Tab verschwindet, die übrigen bleiben. |
| Alle abwählen | Mindestens einer bleibt. Kein Space ohne Tab. |
| Auf die Karte gehen | Sie lädt (kurz "Karte wird geladen"), dann erscheint sie. |
| Zwischen Modulen wechseln und zurück zur Karte | Sie baut sich **nicht** neu auf. |

### G. Was einen Menschen stört

Ohne Erwartung, mit offenen Augen:

- Wo zögert die App?
- Wo ist unklar, was ein Knopf tut?
- Wo steht ein Wort, das jemand von außen nicht versteht?
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

**"Hält auf"** heißt: Damit zeigen wir es keiner Stiftung. Das wird behoben, bevor der Link rausgeht. Alles andere kommt in `REIFE.md` und wartet.

---

## Nach dem Test

1. Funde sortieren: was hält auf, was stört, was fällt auf.
2. Was aufhält, wird behoben, dann derselbe Durchgang noch einmal für die betroffenen Zeilen.
3. Der Rest kommt in `REIFE.md`.
4. `memory/stand_trustdonation.md` nachziehen.
5. **Was aufgefallen ist und niemand vorhergesehen hat, kommt in den passenden Skill**, nicht nur in den Stand. Eine Falle nur im Stand hilft niemandem, der sie gerade ausläuft.

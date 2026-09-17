# Einstieg

**Ziel:** In einer halben Stunde vom leeren Ordner zum laufenden Prototyp, mit dem Wissen, wo was steht.

---

## Was das hier ist

Der Prototyp **trustdonation**: eine Karte, auf der Stiftungen und Projekte einander finden.

Er ist ein Abzweig vom [Real Life Stack](https://github.com/real-life-org/real-life-stack), den Anton Tranelis baut. Wir nutzen seinen Baukasten und ergaenzen, was unser Vorhaben braucht.

```text
trustdonation (unsere Ebene: Arten, Felder, Matching)
  → Real Life Stack (Antons Baukasten: Items, Module, Oberflaeche)
    → Web of Trust (Identitaet, Begegnung, Sync)
```

---

## In dreissig Minuten zum laufenden Stand

### 1. Holen

```bash
git clone git@github.com:lichtungooo/real-life-stack.git
cd real-life-stack
git checkout trustdonation
git remote add origin https://github.com/real-life-org/real-life-stack.git
```

Die Namen der Gegenstellen: `origin` ist **Antons** Stand, `fork` (oder `lichtungooo`) ist unserer.

### 2. Bauen

```bash
corepack enable
pnpm install
pnpm build
```

Node 22 oder neuer. Der erste Bau dauert ein paar Minuten.

### 3. Starten

```bash
pnpm dev:reference
```

**Port 5173, niemals ausweichen.** Der Browser-Speicher haengt am Ursprung; ein anderer Port zeigt leere Daten.

Im Browser: `http://localhost:5173/?connector=local`

Der Umschalter oben links zeigt vier Netzwerke, zwei Projekte und eine Stiftung. Das Zahnrad an einem Space oeffnet die Konfiguration mit den Bereichen **Netzwerk** und **Landingpage**.

### 4. Nachsehen, ob alles gruen ist

```bash
python td-tools/pruefen.py
```

Sechs Tore. Rot haelt die Auslieferung auf, gelb warnt.

---

## Die fuenf Dokumente

Lesereihenfolge fuer den ersten Tag:

| Datei | Was sie beantwortet | Lesezeit |
|---|---|---|
| [DEFINITION.md](DEFINITION.md) | **Was** wir bauen, und nach welchen sechs Mustern | 20 min |
| [ARCHITEKTUR.md](ARCHITEKTUR.md) | **Wo** es steht, welche Haken es gibt, wie Updates ankommen | 15 min |
| [NAEHTE.md](NAEHTE.md) | **Wo** wir Antons Code beruehren, und warum | 10 min |
| [PLAN.md](PLAN.md) | **Was** als Naechstes dran ist | 5 min |
| [ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md) | **Warum** es so ist und nicht anders | 10 min |

Dazu [REIFE.md](REIFE.md) fuer das, was noch fehlt, [AUSLIEFERUNGEN.md](AUSLIEFERUNGEN.md) fuer das, was live steht, und [TESTPLAN.md](TESTPLAN.md) fuer den grossen Durchgang.

Antons Vertrag liegt in [spec/](spec/). **Bei Widerspruch gewinnt die Spec.**

---

## Die drei Regeln, die hier wirklich zaehlen

1. **Erst definieren, dann bauen.** Eine neue Sache bekommt einen Abschnitt in `DEFINITION.md`, bevor sie Code wird. Er beantwortet: welche Frage, welche eine Quelle, welche Schicht haelt was, was bei Unbekanntem passiert.
2. **Antons Code nur an eingetragenen Naehten.** Vorher pruefen, ob ein Erweiterungspunkt reicht (ARCHITEKTUR Teil 2). Meistens reicht einer.
3. **Jede Liste bekommt einen Test.** Listen sind die Stelle, an der Software auseinanderlaeuft.

---

## Die Werkzeuge

```bash
python td-tools/anton-stand.py     # was hat Anton getan, was trifft uns, was hat er vor
python td-tools/pruefen.py         # sechs Tore, --schnell laesst Bau und Tests aus
python td-tools/startlast.py       # was beim ersten Aufruf wirklich geladen wird
python td-tools/zugang.py          # axe-core ueber die laufende App
```

Die letzten beiden brauchen eine laufende Vorschau:

```bash
pnpm --filter reference exec vite preview --port 4173 &
```

---

## Die Skills

Sie liegen im Projekt-Repo [lichtungooo/trustdonation](https://github.com/lichtungooo/trustdonation) unter `plugins/`. Wer mit Claude Code arbeitet:

```bash
git clone https://github.com/lichtungooo/trustdonation.git
cd trustdonation
python scripts/skills-spiegeln.py
```

Fuenfzehn Skills in zwei Plugins, darunter `td-stand` (am Anfang jeder Runde), `td-naht` (bevor Antons Code angefasst wird), `td-anton` (wo steht er), `td-definieren`, `td-modul`, `td-test`, `td-ausliefern`.

---

## Woran gerade gearbeitet wird

[PLAN.md](PLAN.md), Etappe 0.5: eigene Pakete, damit Antons Updates uns nicht treffen. Danach: eine Stiftung sagt, was sie foerdert.

---

## Wo etwas hingehoert

| Was | Wohin |
|---|---|
| Stack-Code, Prototyp, unsere Ebene | dieses Repo, Branch `trustdonation` |
| Landingpage, Instanz-Konfiguration, Konzept | [lichtungooo/trustdonation](https://github.com/lichtungooo/trustdonation) |
| Antons Baukasten | [real-life-org/real-life-stack](https://github.com/real-life-org/real-life-stack) |
| Etwas, das jede RLS-App braucht | Pull Request an Anton, Anwendungsfall zuerst |

---

## Wenn etwas klemmt

| Symptom | Ursache | Loesung |
|---|---|---|
| Neue Musterdaten erscheinen nicht | der local-Connector laedt seinen gespeicherten Stand | `SEED_VERSION` in `packages/local-connector/src/local-connector.ts` hochsetzen |
| `Cannot find module ...` | neue Abhaengigkeit | `pnpm install` |
| Leere App auf einem anderen Port | Browser-Speicher haengt am Ursprung | zurueck auf 5173 |
| Ein Item fehlt in der Uebersicht | es liegt in zwei Spaces | ein Item gehoert in genau einen Space |

---

## Wer daran arbeitet

| Rolle | Mensch |
|---|---|
| Vision, Pitch, Community | Timo |
| Architektur, Stack, Web of Trust | Anton |
| Vorab-Versionen, Prozess, Doku | Eli |

Traeger ist **Kollektiv Lichtung e.V.**

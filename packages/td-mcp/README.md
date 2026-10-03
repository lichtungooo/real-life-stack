# td-mcp: Profile mit dem eigenen Agenten

Ein MCP-Server, mit dem dein eigener Agent (Claude, Kimi oder ein offenes Modell) aus deinen Notizen oder einem Gespräch ein Profil für trustdonation entwirft: ein Projekt, eine Stiftung oder das Profil deiner Einrichtung (Verein, Initiative). Am Handy sprichst du einfach mit deinem Agenten.

**Er speichert nichts.** Am Ende steht ein Link. Du öffnest ihn, siehst die Vorschau, wählst deinen Space und speicherst selbst, mit deiner eigenen Identität. Das Profil einer Einrichtung speichert, wer ihren Space verwaltet. Der Entwurf steht im Teil des Links nach `#` und geht an keinen Server.

Definition: `docs/DEFINITION.md`, Abschnitte 13.6 und 13.8.

## Die Werkzeuge

| Werkzeug | Was es tut |
|---|---|
| `profil_art_klaeren` | die drei Arten (Projekt, Stiftung, Einrichtung) und woran man sie erkennt |
| `<art>_profil_vorgabe` | Ablauf, Felder mit Frage und Form, Regeln, ein Beispiel (Projekt, Stiftung) |
| `<art>_profil_pruefen` | was erscheint, was fehlt, was verworfen wird |
| `<art>_profil_link` | prüft, ergänzt die Koordinaten zur Anschrift (OpenStreetMap) und gibt den Link |

`<art>` ist `projekt`, `stiftung` oder `einrichtung`.

## Für alle: der Server des Netzwerks

trustdonation bietet den Server selbst an (DEFINITION 13.7). Nichts zu installieren, nur die Adresse eintragen:

**`https://trustdonation.org/mcp`**

| Agent | So |
|---|---|
| claude.ai | Einstellungen → Connectors → eigenen Connector hinzufügen, Adresse oben |
| Claude Desktop | wie claude.ai (eigener Connector) |
| Claude Code | `claude mcp add --transport http trustdonation-profil https://trustdonation.org/mcp` |
| Kimi Code | in `~/.kimi-code/mcp.json`: `"trustdonation-profil": { "url": "https://trustdonation.org/mcp" }` |

Der Server hält nichts: kein Konto, kein Speicher, jede Anfrage steht für sich. Die Ortssuche fragt OpenStreetMap höchstens einmal je Sekunde für alle und merkt sich jede Anschrift.

Ein anderes Netzwerk betreibt denselben Server mit eigener Einstellung: `TD_NETZWERK` (Name) und `TD_APP_URL` (wohin der Link führt). Bauplan: `deploy/mcp/`.

## Bauen

```bash
pnpm --filter @trustdonation/core build
pnpm --filter @trustdonation/mcp build
```

## Einrichten (stdio, bei sich)

Der Server läuft über stdio. Pfad anpassen.

**Kimi Code 2.0**: `~/.kimi-code/mcp.json` (gilt in jedem Ordner):

```json
{
  "mcpServers": {
    "trustdonation-profil": {
      "command": "node",
      "args": ["D:/Workspace/20-repos/rls-uebersicht/packages/td-mcp/dist/src/index.js"]
    }
  }
}
```

Eine `.mcp.json` im Projektordner liest Kimi nur, wenn der Ordner vertraut ist (einmal `kimi` starten, „Trust this folder“).

**Claude Code:**

```bash
claude mcp add trustdonation-profil -- node D:/Workspace/20-repos/rls-uebersicht/packages/td-mcp/dist/src/index.js
```

**Claude Desktop**: `claude_desktop_config.json`, derselbe Block wie bei Kimi unter `mcpServers`.

**Andere App-Adresse** (etwa die Demo oder eine eigene Instanz): Umgebungsvariable `TD_APP_URL`, zum Beispiel `https://trustdonation.org/app/?connector=local`.

## Benutzen

Sag deinem Agenten etwa:

> Wir sind der Verein Radwerkstatt Nord, wir reparieren mit Jugendlichen Fahrräder … Bau uns daraus ein Profil mit den Werkzeugen von trustdonation-profil. Frag nach, was fehlt. Erfinde nichts. Gib mir am Ende den Link.

Dann deine Notizen dazu: was entsteht, warum es fehlt, wo, was es kostet, wer Ansprechperson ist, Bild-Adressen.

## Erprobt

Am 01.10.2026 mit Kimi K3. Aus Notizen der „Bienenfreunde Nordhessen“ entstand ein Profil mit allen Kernfeldern, mit Bedarfen, Spendenziel (richtig zusammengerechnet), Schritten und Kontakt. Die Koordinaten der Schule kamen aus OpenStreetMap. Was fehlte, nannte Kimi selbst: Team und die Spendenseite.

## Tests

```bash
pnpm --filter @trustdonation/mcp test
```

# td-mcp: Projektprofile mit dem eigenen Agenten

Ein MCP-Server, mit dem dein eigener Agent (Claude, Kimi oder ein offenes Modell) aus deinen Notizen ein Projektprofil für trustdonation entwirft.

**Er speichert nichts.** Am Ende steht ein Link. Du öffnest ihn, siehst die Vorschau, wählst deinen Space und legst das Projekt selbst an, mit deiner eigenen Identität. Der Entwurf steht im Teil des Links nach `#` und geht an keinen Server.

Definition: `docs/DEFINITION.md`, Abschnitt 13.6.

## Die drei Werkzeuge

| Werkzeug | Was es tut |
|---|---|
| `projekt_profil_vorgabe` | Ablauf, Felder mit Frage und Form, Regeln, ein vollständiges Beispiel |
| `projekt_profil_pruefen` | was erscheint, was fehlt, was verworfen wird |
| `projekt_profil_link` | prüft, ergänzt die Koordinaten zur Anschrift (OpenStreetMap) und gibt den Link |

## Bauen

```bash
pnpm --filter @trustdonation/core build
pnpm --filter @trustdonation/mcp build
```

## Einrichten

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

> Erstelle aus diesen Notizen ein Projektprofil mit den Werkzeugen von trustdonation-profil. Erfinde nichts. Gib mir am Ende den Link.

Dann deine Notizen dazu: was entsteht, warum es fehlt, wo, was es kostet, wer Ansprechperson ist, Bild-Adressen.

## Erprobt

Am 01.10.2026 mit Kimi K3. Aus Notizen der „Bienenfreunde Nordhessen“ entstand ein Profil mit allen Kernfeldern, mit Bedarfen, Spendenziel (richtig zusammengerechnet), Schritten und Kontakt. Die Koordinaten der Schule kamen aus OpenStreetMap. Was fehlte, nannte Kimi selbst: Team und die Spendenseite.

## Tests

```bash
pnpm --filter @trustdonation/mcp test
```

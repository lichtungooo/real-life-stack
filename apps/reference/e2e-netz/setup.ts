import { spawn, type ChildProcess } from "child_process"
import { mkdtemp, writeFile } from "fs/promises"
import { existsSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { tmpdir } from "os"
import net from "net"

/**
 * Relay, Profilverzeichnis und Vault hochfahren — auch auf Windows.
 *
 * ⚠ Warum diese Datei es gibt.
 *
 * Antons `e2e/global-setup.ts` traegt drei Stellen, die allein auf POSIX
 * laufen. Alle drei am 18.09.2026 auf Timos Rechner gemessen, nicht vermutet:
 *
 *   1. **`spawn("tsx", …)` ohne Shell.** Auf Windows heisst das Programm
 *      `tsx.CMD`, und `spawn` ergaenzt keine Endung. Antwort:
 *      `Error: spawn tsx ENOENT`.
 *   2. **`STATE_FILE = "/tmp/rls-e2e-state.json"`.** Ein festgenagelter
 *      POSIX-Pfad. Auf Windows zeigt das auf `C:\tmp`, und dort liegt
 *      nichts.
 *   3. Dazu in `playwright.config.ts` das Praefix `VITE_RELAY_URL=… npx vite`,
 *      das `cmd` nicht kennt. Siehe `playwright.netz.config.ts`.
 *
 * Zusammen heisst das: **Antons zehn Netzwerk-Tests sind auf Windows noch
 * nie gelaufen** — und das sind genau die, die Synchronisation,
 * Schluesselwechsel, zwei Geraete und Offline-Verhalten pruefen.
 *
 * Diese Datei aendert seine nicht. Sie tut dasselbe, auf denselben Ports, und
 * raeumt die drei Stellen aus dem Weg. Dieselbe Loesung wie bei
 * `playwright.trustdonation.config.ts`: eine eigene Datei ist billiger als
 * eine Naht in fremdem Code.
 *
 * **Der Wunsch an Anton**, drei Zeilen: `shell: true` beim Starten (oder der
 * volle Pfad aus `node_modules/.bin`), `tmpdir()` statt `/tmp`, und
 * `webServer.env` statt des Praefix. Danach laufen seine Tests auf jeder
 * Maschine, und diese Datei kann weg.
 */

const __dirname = dirname(fileURLToPath(import.meta.url))
const WOT_ROOT = join(__dirname, "..", "..", "..", "..", "web-of-trust")

const RELAY_PORT = 9787
const PROFILES_PORT = 9788
const VAULT_PORT = 9789

/** ⚠ Nicht `/tmp`: Windows kennt das nicht. */
export const STATE_FILE = join(tmpdir(), "rls-e2e-state.json")

interface ServerState {
  relayPid: number
  profilesPid: number
  vaultPid: number
  tmpDir: string
}

function waitForPort(port: number, timeoutMs = 20_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const versuch = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Port ${port} war nach ${timeoutMs}ms nicht bereit`))
        return
      }
      const socket = new net.Socket()
      socket.once("connect", () => {
        socket.destroy()
        resolve()
      })
      socket.once("error", () => {
        socket.destroy()
        setTimeout(versuch, 250)
      })
      socket.connect(port, "127.0.0.1")
    }
    versuch()
  })
}

/**
 * Wo `tsx` wirklich liegt.
 *
 * pnpm legt in `node_modules/.bin` drei Dateien ab: `tsx` (ein Shell-Skript),
 * `tsx.CMD` und `tsx.ps1`. `CreateProcess` auf Windows kann allein die `.CMD`
 * starten, und die braucht `cmd /c` mit der Datei als **Argument**, nicht als
 * Teil einer Zeichenkette. Sonst zerlegt die Shell, was sie nicht zerlegen
 * soll.
 */
function tsxStarter(): { command: string; vorspann: string[] } {
  const bin = join(WOT_ROOT, "node_modules", ".bin")

  if (process.platform === "win32") {
    const cmd = join(bin, "tsx.CMD")
    if (!existsSync(cmd)) {
      throw new Error(
        `tsx fehlt in ${bin}. Im web-of-trust-Repo einmal "pnpm install" fahren.`,
      )
    }
    return {
      command: process.env["COMSPEC"] ?? "cmd.exe",
      vorspann: ["/d", "/s", "/c", cmd],
    }
  }

  const posix = join(bin, "tsx")
  return { command: existsSync(posix) ? posix : "tsx", vorspann: [] }
}

function dienstStarten(
  skript: string,
  env: Record<string, string>,
  name: string,
): ChildProcess {
  const { command, vorspann } = tsxStarter()

  const kind = spawn(command, [...vorspann, skript], {
    env: { ...process.env, ...env },
    cwd: WOT_ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    windowsVerbatimArguments: false,
  })

  kind.stdout?.on("data", (d: Buffer) => process.stdout.write(`[${name}] ${d}`))
  kind.stderr?.on("data", (d: Buffer) => process.stderr.write(`[${name}:err] ${d}`))

  // Ein Dienst, der gar nicht startet, darf nicht als Zeitablauf enden: Die
  // Meldung waere dann "Port nicht bereit", und die sagt nichts.
  kind.on("error", (fehler) => {
    process.stderr.write(`[${name}] laesst sich nicht starten: ${fehler.message}\n`)
  })

  return kind
}

export default async function setup() {
  const tmpDir = await mkdtemp(join(tmpdir(), "rls-netz-"))
  process.stdout.write(`[netz] Dienste starten (tmp: ${tmpDir})\n`)

  const relay = dienstStarten(
    join(WOT_ROOT, "packages/wot-relay/src/start.ts"),
    { PORT: String(RELAY_PORT), DB_PATH: join(tmpDir, "relay.db") },
    "relay",
  )
  const profiles = dienstStarten(
    join(WOT_ROOT, "packages/wot-profiles/src/start.ts"),
    { PORT: String(PROFILES_PORT), DB_PATH: join(tmpDir, "profiles.db") },
    "profile",
  )
  const vault = dienstStarten(
    join(WOT_ROOT, "packages/wot-vault/src/start.ts"),
    { PORT: String(VAULT_PORT), DB_PATH: join(tmpDir, "vault.db") },
    "vault",
  )

  await Promise.all([
    waitForPort(RELAY_PORT),
    waitForPort(PROFILES_PORT),
    waitForPort(VAULT_PORT),
  ])

  process.stdout.write(
    `[netz] Dienste bereit (relay ${RELAY_PORT}, profile ${PROFILES_PORT}, vault ${VAULT_PORT})\n`,
  )

  const state: ServerState = {
    relayPid: relay.pid!,
    profilesPid: profiles.pid!,
    vaultPid: vault.pid!,
    tmpDir,
  }
  await writeFile(STATE_FILE, JSON.stringify(state), "utf8")
}

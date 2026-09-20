import { readFile, rm, unlink } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"

/**
 * Die Dienste wieder abraeumen.
 *
 * Gegenstueck zu `setup.ts`. Liest dieselbe Zustandsdatei und nimmt
 * `tmpdir()` statt `/tmp`, aus demselben Grund.
 *
 * ⚠ Auf Windows kennt `process.kill` kein SIGTERM: Node bildet es dort auf
 * ein hartes Beenden ab, und ein Kindprozess unter `cmd /c` ist ein Enkel.
 * Darum zuerst der Weg ueber `taskkill /T`, der den ganzen Baum nimmt, und
 * erst danach der einfache Griff.
 */

const STATE_FILE = join(tmpdir(), "rls-e2e-state.json")

interface ServerState {
  relayPid: number
  profilesPid: number
  vaultPid: number
  tmpDir: string
}

async function beenden(pid: number): Promise<void> {
  if (process.platform === "win32") {
    const { spawnSync } = await import("child_process")
    const r = spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], {
      stdio: "ignore",
    })
    if (r.status === 0) return
  }

  try {
    process.kill(pid, "SIGTERM")
  } catch {
    /* ist schon weg */
  }
}

export default async function teardown() {
  let state: ServerState

  try {
    state = JSON.parse(await readFile(STATE_FILE, "utf8")) as ServerState
  } catch {
    process.stdout.write("[netz] Keine Zustandsdatei, nichts abzuraeumen\n")
    return
  }

  process.stdout.write("[netz] Dienste beenden\n")

  for (const pid of [state.relayPid, state.profilesPid, state.vaultPid].filter(Boolean)) {
    await beenden(pid)
  }

  try {
    await rm(state.tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  } catch {
    /* Windows haelt die Datenbankdatei noch einen Moment */
  }
  try {
    await unlink(STATE_FILE)
  } catch {
    /* schon weg */
  }

  process.stdout.write("[netz] Abgeraeumt\n")
}

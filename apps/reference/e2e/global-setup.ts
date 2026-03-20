import { spawn, type ChildProcess } from 'child_process'
import { mkdtemp, writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { tmpdir } from 'os'
import net from 'net'

const __dirname = dirname(fileURLToPath(import.meta.url))
const RELAY_PORT = 9787
const PROFILES_PORT = 9788
const VAULT_PORT = 9789
const STATE_FILE = '/tmp/rls-e2e-state.json'
const WOT_ROOT = join(__dirname, '..', '..', '..', '..', 'web-of-trust')

interface ServerState {
  relayPid: number
  profilesPid: number
  vaultPid: number
  tmpDir: string
}

function waitForPort(port: number, timeoutMs = 10_000): Promise<void> {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    function tryConnect() {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Port ${port} not ready after ${timeoutMs}ms`))
        return
      }
      const socket = new net.Socket()
      socket.once('connect', () => { socket.destroy(); resolve() })
      socket.once('error', () => { socket.destroy(); setTimeout(tryConnect, 200) })
      socket.connect(port, '127.0.0.1')
    }
    tryConnect()
  })
}

function spawnServer(script: string, env: Record<string, string>): ChildProcess {
  const child = spawn('tsx', [script], {
    env: { ...process.env, ...env },
    cwd: WOT_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  child.stdout?.on('data', (data: Buffer) => process.stdout.write(`[server] ${data}`))
  child.stderr?.on('data', (data: Buffer) => process.stderr.write(`[server:err] ${data}`))
  return child
}

export default async function globalSetup() {
  const tmpDir = await mkdtemp(join(tmpdir(), 'rls-e2e-'))
  console.log(`[e2e] Starting servers (tmp: ${tmpDir})`)

  const relay = spawnServer(
    join(WOT_ROOT, 'packages/wot-relay/src/start.ts'),
    { PORT: String(RELAY_PORT), DB_PATH: join(tmpDir, 'relay.db') },
  )
  const profiles = spawnServer(
    join(WOT_ROOT, 'packages/wot-profiles/src/start.ts'),
    { PORT: String(PROFILES_PORT), DB_PATH: join(tmpDir, 'profiles.db') },
  )
  const vault = spawnServer(
    join(WOT_ROOT, 'packages/wot-vault/src/start.ts'),
    { PORT: String(VAULT_PORT), DB_PATH: join(tmpDir, 'vault.db') },
  )

  await Promise.all([
    waitForPort(RELAY_PORT),
    waitForPort(PROFILES_PORT),
    waitForPort(VAULT_PORT),
  ])

  console.log(`[e2e] Servers ready (relay: ${RELAY_PORT}, profiles: ${PROFILES_PORT}, vault: ${VAULT_PORT})`)

  const state: ServerState = {
    relayPid: relay.pid!,
    profilesPid: profiles.pid!,
    vaultPid: vault.pid!,
    tmpDir,
  }
  await writeFile(STATE_FILE, JSON.stringify(state))
}

import { defineConfig, devices } from "@playwright/test"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Antons Netzwerk-Tests, fahrbar auf Windows.
 *
 *     cd apps/reference
 *     npx playwright test --config playwright.netz.config.ts
 *
 * ⚠ Warum diese Datei es gibt.
 *
 * `playwright.config.ts` setzt die drei Adressen als Praefix vor den Befehl:
 *
 *     VITE_RELAY_URL=ws://localhost:9787 … npx vite --port 5175
 *
 * Das ist POSIX-Schreibweise. Playwright gibt `webServer.command` an die
 * Shell, und auf Windows ist das `cmd`. Der antwortet:
 *
 *     Der Befehl "VITE_RELAY_URL" ist entweder falsch geschrieben oder
 *     konnte nicht gefunden werden.
 *
 * Damit sind Antons zehn Netzwerk-Tests auf Timos Rechner unfahrbar, und das
 * sind genau die, die Synchronisation, Schluesselwechsel, zwei Geraete und
 * Offline-Verhalten pruefen. Am 18.09.2026 gemessen, nicht vermutet.
 *
 * Diese Datei aendert seine nicht: Sie nimmt dasselbe `testDir`, dieselben
 * Ports, dasselbe `globalSetup`, und gibt die Adressen ueber `webServer.env`
 * statt als Praefix. Dieselbe Loesung wie bei
 * `playwright.trustdonation.config.ts`: eine eigene Konfiguration ist
 * billiger als seine anzupassen, und sie ist unsere Datei.
 *
 * **Der Wunsch an Anton:** `webServer.env` statt des Praefix. Eine Zeile,
 * und seine Tests laufen auf jeder Maschine. Gehoert als Anwendungsfall zu
 * ihm, siehe docs/NAEHTE.md.
 *
 * ⚠ Auf Windows steht kein `/usr/bin/chromium`. Der Pfad kommt aus
 * `E2E_CHROMIUM_PATH`, sonst nimmt diese Konfiguration das installierte
 * Chrome ueber `channel`.
 */

const RELAY_PORT = 9787
const PROFILES_PORT = 9788
const VAULT_PORT = 9789
const APP_PORT = 5175

export default defineConfig({
  testDir: path.resolve(__dirname, "e2e"),
  globalSetup: path.resolve(__dirname, "e2e-netz/setup.ts"),
  globalTeardown: path.resolve(__dirname, "e2e-netz/teardown.ts"),
  fullyParallel: false,
  workers: 1,
  timeout: 300_000,
  expect: { timeout: 15_000 },
  reporter: process.env["CI"] ? "github" : "list",

  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    locale: "de-DE",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: process.env["E2E_CHROMIUM_PATH"]
          ? { executablePath: process.env["E2E_CHROMIUM_PATH"] }
          : { channel: "chrome" },
      },
    },
  ],

  webServer: {
    // Kein Praefix: die Adressen gehen ueber `env`. Das ist der ganze
    // Unterschied zu seiner Konfiguration, und der ganze Grund dieser Datei.
    command: `npx vite --port ${APP_PORT}`,
    env: {
      VITE_RELAY_URL: `ws://localhost:${RELAY_PORT}`,
      VITE_PROFILE_SERVICE_URL: `http://localhost:${PROFILES_PORT}`,
      VITE_VAULT_URL: `http://localhost:${VAULT_PORT}`,
    },
    port: APP_PORT,
    reuseExistingServer: false,
    timeout: 60_000,
    cwd: path.resolve(__dirname),
  },
})

import { defineConfig, devices } from "@playwright/test"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Eigene, leichte Konfiguration fuer den Durchgang aus docs/TESTPLAN.md.
//
// Sie liegt hier und nicht in `td-tools/`, weil pnpm Abhaengigkeiten strikt
// ablegt: `@playwright/test` gehoert zu dieser App, und eine Konfiguration
// ausserhalb findet es nicht. Neue Datei mit eigenem Namen, darum kollidiert
// sie mit Antons `playwright.config.ts` nicht.
//
// Antons `apps/reference/playwright.config.ts` startet Relay, Profilverzeichnis
// und Vault: das braucht er fuer seine Web-of-Trust-Tests. Unser Durchgang
// laeuft gegen die Musterdaten im Browser und braucht nichts davon. Eine eigene
// Konfiguration ist billiger als seine anzupassen, und sie ist unsere Datei.
//
//     cd apps/reference
//     npx playwright test --config playwright.trustdonation.config.ts
//     npx playwright test --config playwright.trustdonation.config.ts --headed
const PORT = 5177

export default defineConfig({
  testDir: path.resolve(__dirname, "e2e-td"),
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    locale: "de-DE",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Auf diesem Rechner steht ein Chrome; in einer Sandbox setzt
        // E2E_CHROMIUM_PATH den Pfad.
        launchOptions: process.env.E2E_CHROMIUM_PATH
          ? { executablePath: process.env.E2E_CHROMIUM_PATH }
          : { channel: "chrome" },
      },
    },
  ],

  webServer: {
    // Die gebaute App, nicht der Entwicklungsserver: Getestet wird, was
    // ausgeliefert wird.
    command: `npx vite preview --port ${PORT}`,
    port: PORT,
    reuseExistingServer: true,
    timeout: 60_000,
    cwd: __dirname,
  },
})

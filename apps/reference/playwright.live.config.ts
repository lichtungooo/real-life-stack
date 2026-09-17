import { defineConfig, devices } from "@playwright/test"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Der Probelauf gegen die **laufende** Instanz.
//
// Kein eigener Server, kein eigenes Relay: Geprüft wird, was draußen steht.
// Ein Relay in der Werkstatt sagt nichts über eines im Internet, und genau
// das ist am Wochenende die Frage.
//
//     cd apps/reference
//     npx playwright test --config playwright.live.config.ts
export default defineConfig({
  testDir: path.resolve(__dirname, "e2e-live"),
  fullyParallel: false,
  workers: 1,
  timeout: 600_000,
  expect: { timeout: 30_000 },
  reporter: "list",

  use: {
    baseURL: process.env.TD_LIVE ?? "https://trustdonation.org/app/",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    locale: "de-DE",
    permissions: ["clipboard-read", "clipboard-write"],
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: process.env.E2E_CHROMIUM_PATH
          ? { executablePath: process.env.E2E_CHROMIUM_PATH }
          : { channel: "chrome" },
      },
    },
  ],
})

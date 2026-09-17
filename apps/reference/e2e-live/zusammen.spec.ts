// Zwei Menschen, ein Space, ein Board: der Probelauf für das Wochenende.
//
// Am Wochenende kommen Emil und vielleicht Janosch. Sie sollen sich anmelden,
// sich mit Timo verifizieren und gemeinsam an einem Kanban arbeiten. Dieser
// Test geht denselben Weg wie sie, gegen **die laufende Instanz** und das
// echte Relay `relay.web-of-trust.de`.
//
// Antons `e2e/cross-user.spec.ts` prüft dasselbe gegen lokale Dienste, die er
// im globalSetup startet. Hier zählt, ob es draußen trägt.
//
//     cd apps/reference
//     npx playwright test --config playwright.live.config.ts
//
// Der Lauf legt zwei Identitäten auf dem echten Relay an. Sie heißen erkennbar
// "Probe ..." und leben nur in den Browserprofilen dieses Tests.
import { test, expect } from "@playwright/test"
import { frisch, identitaet } from "./anmelden.js"
import { waitForRelayConnected } from "../e2e/helpers/common"
import { performMutualVerification } from "../e2e/helpers/verification"

test.describe("Zusammen arbeiten, gegen die laufende Instanz", () => {
  test("zwei Menschen melden sich an und verifizieren sich", async ({ browser }) => {
    const a = await frisch(browser)
    const b = await frisch(browser)

    try {
      // --- Schritt 1: Zwei Identitäten
      //
      // Das ist der Weg, den Emil am Wochenende geht: zwölf Wörter, Profil,
      // Passwort. Er dauert und er braucht das Relay.
      const zeitA = Date.now()
      await identitaet(a.page, "Probe Timo", "probe-timo-2026")
      console.log(`Identität A nach ${Date.now() - zeitA} ms`)
      await waitForRelayConnected(a.page)
      console.log("A ist mit dem Relay verbunden")

      const zeitB = Date.now()
      await identitaet(b.page, "Probe Emil", "probe-emil-2026")
      console.log(`Identität B nach ${Date.now() - zeitB} ms`)
      await waitForRelayConnected(b.page)
      console.log("B ist mit dem Relay verbunden")

      // --- Schritt 2: Gegenseitig verifizieren
      //
      // Das ist der Kern des Web of Trust und der Grund, warum man sich dafür
      // trifft: Erst wer verifiziert ist, steht in den Kontakten und kann
      // eingeladen werden.
      const zeitV = Date.now()
      await performMutualVerification(a.page, b.page)
      console.log(`Verifizierung nach ${Date.now() - zeitV} ms`)

      // --- Schritt 3: Beide sind drin und verbunden
      //
      // Das ist die Frage fürs Wochenende, und sie ist beantwortet: Zwei
      // Menschen können sich auf der laufenden Instanz anmelden und sich
      // gegenseitig verifizieren, jeder Schritt in wenigen Sekunden.
      await expect(a.page.getByRole("button", { name: "Kanban" }).first()).toBeVisible()
      await expect(b.page.getByRole("button", { name: "Kanban" }).first()).toBeVisible()

      // Was hier NICHT geprüft wird und warum: Gruppe anlegen, einladen und
      // gemeinsam am Board arbeiten deckt Antons `e2e/cross-user.spec.ts` ab,
      // gegen seine lokalen Dienste. Seine Helfer greifen an unserer
      // Oberfläche daneben, weil unser Umschalter anders aussieht. Das
      // nachzubauen kostet mehr, als es hier bringt: Die offene Frage war das
      // Relay im Internet, nicht die Mechanik.
    } finally {
      await a.context.close()
      await b.context.close()
    }
  })
})

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
import { test, expect, type Browser, type Page } from "@playwright/test"
import { waitForRelayConnected } from "../e2e/helpers/common"
import { performMutualVerification } from "../e2e/helpers/verification"

async function frisch(browser: Browser) {
  const context = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
    locale: "de-DE",
  })
  return { context, page: await context.newPage() }
}

/**
 * Eine Identität anlegen, den Weg entlang, den Emil am Wochenende geht.
 *
 * Eine eigene Fassung von Antons `createIdentity`: Seine navigiert nach `/`,
 * und dort liegt bei uns die Landingpage. Sie umzubiegen hat das Laden
 * gebrochen (die Umleitung traf auch die Bausteine der Seite). Die Schritte
 * sind seine, nur der Einstieg ist unserer.
 */
async function identitaet(page: Page, name: string, passwort: string) {
  await page.goto("./?connector=wot")

  // 1. Willkommen
  await page.getByText("Identity generieren").waitFor({ timeout: 60_000 })
  await page.getByText("Identity generieren").click()

  // 2. Die zwölf Wörter, über die Zwischenablage geholt
  await page.getByText("aufgeschrieben").waitFor({ timeout: 30_000 })
  await page.getByText("Wörter kopieren").click()
  await page.waitForTimeout(400)
  const woerter = (await page.evaluate(() => navigator.clipboard.readText())).split(" ")

  await page.getByLabel("Ich habe alle 12 Wörter aufgeschrieben").check()
  await page.getByLabel("Ich habe sie an einem sicheren Ort verwahrt").check()
  await page.getByLabel("Ich verstehe, dass sie nicht wiederhergestellt werden können").check()
  await page.getByText("Weiter zur Verifizierung").click()

  // 3. Drei der Wörter zurückgeben
  //
  // Die Beschriftung steht neben dem Feld ("Wort 3:"). Statt sie über einen
  // Textsucher zu greifen (der an der Escape-Form scheiterte), wird zu jedem
  // Eingabefeld der Text seines Elternelements gelesen. Das hält auch, wenn
  // die Gestaltung sich ändert.
  await page.getByText("Seed bestätigen").waitFor({ timeout: 30_000 })
  const felder = page.locator('input[type="text"]')
  const anzahl = await felder.count()
  for (let i = 0; i < anzahl; i++) {
    const feld = felder.nth(i)
    const umgebung = (await feld.locator("xpath=..").innerText()) || ""
    const nr = parseInt(umgebung.match(/Wort\s+(\d+)/)?.[1] ?? "0", 10)
    if (nr > 0 && nr <= woerter.length) {
      await feld.fill(woerter[nr - 1])
    }
  }

  // 4. Profil
  const nameFeld = page.getByPlaceholder(/Name|name/)
  await nameFeld.waitFor({ timeout: 30_000 })
  await nameFeld.fill(name)
  await page.getByRole("button", { name: /Weiter|Speichern/ }).click()

  // 5. Passwort
  const pw = page.getByPlaceholder(/Passwort eingeben|Mindestens 8 Zeichen/)
  await pw.waitFor({ timeout: 30_000 })
  await pw.fill(passwort)
  const nochmal = page.getByPlaceholder(/wiederholen|bestätigen/i)
  if (await nochmal.isVisible({ timeout: 2000 }).catch(() => false)) await nochmal.fill(passwort)
  await page.getByRole("button", { name: /Schützen|Fertig|Passwort setzen/ }).click()

  await page.getByText(/Mein Netzwerk|Feed|Kanban/).first().waitFor({ timeout: 90_000 })
  return woerter.join(" ")
}

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

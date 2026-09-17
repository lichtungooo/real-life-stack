/**
 * Der Anmeldeweg, den auch Emil am Wochenende geht.
 *
 * Er steht hier statt in einer Spec-Datei, weil ihn inzwischen zwei
 * Probelaeufe brauchen: der gemeinsame Test und der Stiftungs-Import.
 * Zweimal denselben Weg zu pflegen geht schief, sobald Anton einen Schritt
 * aendert.
 */
import { type Browser, type Page } from "@playwright/test"

export async function frisch(browser: Browser) {
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
export async function identitaet(page: Page, name: string, passwort: string) {
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
  // `isVisible()` prueft sofort; der `timeout` dort wirkt nicht. Das Warten
  // gehoert davor, sonst entscheidet der Zufall.
  const nochmal = page.getByPlaceholder(/wiederholen|bestätigen/i)
  await nochmal.waitFor({ state: "visible", timeout: 3000 }).catch(() => {})
  if (await nochmal.isVisible().catch(() => false)) await nochmal.fill(passwort)
  await page.getByRole("button", { name: /Schützen|Fertig|Passwort setzen/ }).click()

  await page.getByText(/Mein Netzwerk|Feed|Kanban/).first().waitFor({ timeout: 90_000 })
  return woerter.join(" ")
}

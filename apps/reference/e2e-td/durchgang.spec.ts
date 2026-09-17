// Der Durchgang aus docs/TESTPLAN.md, soweit er sich pruefen laesst.
//
// Ein Mensch prueft, was sich falsch anfuehlt (Abschnitt G im Testplan). Diese
// Datei prueft, was nachweislich da sein muss, und nimmt ihm die Buchhaltung
// ab. Sie ersetzt den Durchgang nicht.
//
//     npx playwright test --config td-tools/e2e/playwright.config.ts
import { test, expect, type Page } from "@playwright/test"

/** Die fuenf Spaces aus Timos Umschalter (docs/TESTPLAN.md, Abschnitt A). */
const SPACES = ["trustdonation", "Real Life", "Marker & Maps", "Lichtung", "Löwenherz Stiftung"]

/** Das Netzwerk, in dem Stiftungen und Projekte haengen. */
const TRUSTDONATION = "30455be1-a5f9-465d-8d19-a72dd8da2d83"

/**
 * Die App mit den Musterdaten oeffnen und warten, bis sie steht.
 *
 * `?connector=local` waehlt die Musterdaten. Ohne das Warten auf den
 * Umschalter laufen die Pruefungen gegen eine halbe Seite.
 */
async function appOeffnen(page: Page, pfad = "/") {
  await page.goto(`${pfad}?connector=local`)
  await expect(page.getByRole("button", { expanded: false }).first()).toBeVisible({ timeout: 30_000 })
}

/** Den Umschalter oeffnen und sein Menue zurueckgeben. */
async function umschalterOeffnen(page: Page) {
  const knopf = page.locator('header button[aria-haspopup="menu"], nav button[aria-haspopup="menu"]').first()
  await knopf.click()
  const menue = page.getByRole("menu").first()
  await expect(menue).toBeVisible()
  return menue
}

test.describe("A. Ankommen", () => {
  test("laedt ohne Anmeldung", async ({ page }) => {
    await appOeffnen(page)
    // Keine Anmeldemaske: der Prototyp zeigt sofort (Entscheidung E4).
    await expect(page.locator('input[type="password"]')).toHaveCount(0)
  })

  test("traegt eine Ueberschrift erster Ordnung", async ({ page }) => {
    await appOeffnen(page)
    // Wer mit einer Vorlesehilfe springt, findet sonst keinen Anfang.
    await expect(page.locator("h1")).toHaveCount(1)
    await expect(page.locator("h1")).not.toBeEmpty()
  })

  test("erlaubt das Vergroessern", async ({ page }) => {
    await appOeffnen(page)
    const viewport = await page.locator('meta[name="viewport"]').getAttribute("content")
    expect(viewport).not.toContain("user-scalable=no")
    expect(viewport).not.toContain("maximum-scale=1")
  })
})

test.describe("B. Der Umschalter", () => {
  test("zeigt alle fuenf Spaces", async ({ page }) => {
    await appOeffnen(page)
    const menue = await umschalterOeffnen(page)
    const text = await menue.innerText()
    for (const name of SPACES) {
      expect(text, `${name} fehlt im Umschalter`).toContain(name)
    }
  })

  test("fuehrt die Netzwerke oben", async ({ page }) => {
    await appOeffnen(page)
    const menue = await umschalterOeffnen(page)
    const text = await menue.innerText()
    expect(text).toContain("Netzwerke")
    // Die Uebersicht heisst "Mein Netzwerk", sobald es Netzwerke gibt
    // (Spec 01, Regel 2).
    expect(text).toContain("Mein Netzwerk")
    expect(text.indexOf("Netzwerke")).toBeLessThan(text.indexOf("Mein Netzwerk"))
  })

  test("gibt jedem Space sein eigenes Bild", async ({ page }) => {
    await appOeffnen(page)
    await umschalterOeffnen(page)
    const eigene = await page.locator('img[src^="data:"]').count()
    expect(eigene).toBeGreaterThanOrEqual(3)
  })
})

test.describe("C. Die Gliederung im Netzwerk", () => {
  test("gliedert nach Arten, sobald ein Netzwerk aktiv ist", async ({ page }) => {
    await appOeffnen(page, `/${TRUSTDONATION}/feed`)
    const menue = await umschalterOeffnen(page)
    const text = await menue.innerText()

    // Die Arten des Netzwerks trustdonation, in seiner Reihenfolge.
    expect(text, "Abschnitt Projekte fehlt").toContain("Projekte")
    expect(text, "Abschnitt Stiftungen fehlt").toContain("Stiftungen")

    // Die Stiftung steht unter ihrer Ueberschrift, nicht davor.
    expect(text.indexOf("Stiftungen")).toBeLessThan(text.indexOf("Löwenherz"))
  })

  test("zeigt einen Space, der Netzwerk und Projekt ist, in beiden Abschnitten", async ({ page }) => {
    await appOeffnen(page, `/${TRUSTDONATION}/feed`)
    const menue = await umschalterOeffnen(page)
    const text = await menue.innerText()
    // Die Lichtung ist ein Projekt in trustdonation und selbst ein Netzwerk.
    // Sie steht darum zweimal: oben bei den Netzwerken, unten als Projekt.
    const treffer = text.split("Lichtung").length - 1
    expect(treffer, "Lichtung sollte zweimal stehen").toBe(2)
  })
})

/**
 * Den Space-Dialog eines bestimmten Space oeffnen.
 *
 * Jede Zeile im Umschalter traegt rechts ihr Zahnrad. Das letzte Zahnrad im
 * Menue zu nehmen ist bequem und falsch: Es gehoert dem letzten Space, und der
 * Test prueft dann etwas anderes, als er behauptet. Hier wird die Zeile ueber
 * den Namen gesucht und darin das Zahnrad.
 */
async function spaceDialogOeffnen(page: Page, name: string) {
  const menue = await umschalterOeffnen(page)
  const zeile = menue.locator('[role="menuitem"], [role="option"], li, div')
    .filter({ hasText: name })
    .last()
  await zeile.locator("button").last().click()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  // Der Titel sagt, welcher Space es wirklich ist. Ohne diese Probe prueft
  // der Test womoeglich den falschen.
  await expect(dialog).toContainText(name)
  return dialog
}

test.describe("D. Die Bereiche des Space-Dialogs", () => {
  test("fuehrt sechs Bereiche fuer ein Netzwerk", async ({ page }) => {
    await appOeffnen(page, `/${TRUSTDONATION}/feed`)
    const dialog = await spaceDialogOeffnen(page, "trustdonation")
    const text = await dialog.innerText()

    // spaceConfigSections ist die eine Quelle fuer diese Liste
    // (docs/DEFINITION.md Teil 4.3).
    for (const bereich of ["Mitglieder", "Aussehen", "Module", "Netzwerk", "Landingpage"]) {
      expect(text, `Bereich ${bereich} fehlt`).toContain(bereich)
    }
  })

  test("zeigt Landingpage nur fuer ein Netzwerk", async ({ page }) => {
    // Die Loewenherz Stiftung ist kein Netzwerk. Ohne Netzwerk gibt es nichts
    // zu verlinken, also entfaellt der Bereich (docs/DEFINITION.md Teil 4.2).
    await appOeffnen(page, `/${TRUSTDONATION}/feed`)
    const dialog = await spaceDialogOeffnen(page, "Löwenherz Stiftung")
    const text = await dialog.innerText()
    expect(text, "Bereich Netzwerk sollte da sein").toContain("Netzwerk")
    expect(text, "Landingpage sollte ohne Netzwerk fehlen").not.toContain("Landingpage")
  })
})

test.describe("E. Die Module", () => {
  test("fuehrt die Module des Space als Reiter", async ({ page }) => {
    await appOeffnen(page, `/${TRUSTDONATION}/feed`)
    // trustdonation traegt feed, kanban, calendar, map (aus den Musterdaten).
    for (const modul of ["Feed", "Kalender", "Karte"]) {
      await expect(page.getByRole("button", { name: modul }).first()).toBeVisible()
    }
  })

  test("oeffnet die Karte, ohne die App zu brechen", async ({ page }) => {
    await appOeffnen(page, `/${TRUSTDONATION}/feed`)
    await page.getByRole("button", { name: "Karte" }).first().click()
    // Die Kartenbibliothek wird nachgeladen; das darf einen Moment dauern.
    await expect(page.locator("canvas, .maplibregl-map, .leaflet-container").first())
      .toBeVisible({ timeout: 30_000 })
  })
})

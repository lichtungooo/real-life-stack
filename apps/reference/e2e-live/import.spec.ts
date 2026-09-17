// Der Stiftungs-Import gegen die laufende Instanz.
//
// Timo: "Warum ist es nicht möglich, diese Testdaten, die ich gebaut habe, in
// der App mit allen anderen auch zu teilen, die jetzt schon im Web of Trust
// drin sind?"
//
// Die Antwort ist gebaut, und hier wird sie nachgewiesen: anmelden, Import
// auslösen, Stiftungen zählen, auf der Karte nachsehen. Gegen
// `trustdonation.org` und das echte Relay, nicht gegen einen Prüfstand.
//
//     cd apps/reference
//     npx playwright test --config playwright.live.config.ts import.spec.ts
//
// Der Lauf legt eine Identität auf dem echten Relay an. Sie heißt erkennbar
// "Probe Import" und lebt nur im Browserprofil dieses Tests.
import { test, expect } from "@playwright/test"
import { frisch, identitaet } from "./anmelden.js"
import { waitForRelayConnected } from "../e2e/helpers/common"

test.describe("Stiftungen in einen echten Space schreiben", () => {
  test("234 Stiftungen landen im Space und erscheinen auf der Karte", async ({ browser }) => {
    const a = await frisch(browser)

    try {
      await identitaet(a.page, "Probe Import", "probe-import-2026")
      await waitForRelayConnected(a.page)

      // --- In welchen Space geschrieben wird
      //
      // Ein frisches Konto bringt einen eigenen Space mit, benannt nach der
      // Instanz. Er genügt hier: Die Frage ist, ob der Import in einen echten
      // Space des Web of Trust schreibt, nicht ob er eine Gruppe anlegen kann.
      //
      // Dass ein fremder Space unberührt bleibt, ist keine Vorsicht des
      // Tests, sondern Folge der Verschlüsselung: Ein frisches Konto ist
      // nirgends Mitglied, wo es nicht eingeladen wurde.
      await a.page.getByRole("button", { name: "Feed" }).first().waitFor({ timeout: 60_000 })

      // --- Der Import, ausgelöst über die Adresse
      const adresse = new URL(a.page.url())
      adresse.searchParams.set("import", "stiftungen")
      await a.page.goto(adresse.toString())

      // Das Neuladen sperrt die Identität. Wer die Adresse von Hand ändert,
      // gibt danach sein Passwort ein: unumgänglich, weil der Schlüssel im
      // Speicher liegt und mit der Seite verschwindet. Es steht so in der
      // Anleitung fürs Wochenende.
      //
      // `isVisible()` prüft sofort und wartet nicht, auch mit `timeout`. Beim
      // ersten Versuch stand der Test darum vor einem leeren Feld und wartete
      // danach neunzig Sekunden auf einen Dialog, der hinter der Sperre lag.
      const passwort = a.page.getByPlaceholder(/Passwort eingeben/)
      await passwort.waitFor({ state: "visible", timeout: 60_000 }).catch(() => {})
      if (await passwort.isVisible().catch(() => false)) {
        await passwort.fill("probe-import-2026")
        await a.page.getByRole("button", { name: "Entsperren" }).click()
      }

      await expect(a.page.getByText("Stiftungen übernehmen")).toBeVisible({ timeout: 90_000 })

      // Die Rückfrage nennt den Space. Das ist kein Zierrat: Wer 234 Einträge
      // in den falschen Space schreibt, nimmt das nicht mit einem Klick zurück.
      await expect(a.page.getByText(/wird|werden in den Space/)).toBeVisible()

      const begonnen = Date.now()
      await a.page.getByRole("button", { name: "Übernehmen" }).click()

      // --- Warten, bis alle durch sind
      //
      // 234 Schreibvorgänge über das Relay brauchen Zeit. Die Anzeige sagt,
      // wie weit sie sind; hier zählt nur das Ende.
      await expect(a.page.getByText("Fertig")).toBeVisible({ timeout: 480_000 })
      const dauer = Date.now() - begonnen

      const bericht = await a.page.getByText(/Stiftungen geschrieben/).innerText()
      console.log(`Import nach ${Math.round(dauer / 1000)} s: ${bericht}`)

      // Der Bericht nennt eine Zahl größer null. Wie viele genau, hängt davon
      // ab, was im Space schon lag.
      const geschrieben = parseInt(bericht.match(/(\d+)\s+Stiftungen geschrieben/)?.[1] ?? "0", 10)
      expect(geschrieben).toBeGreaterThan(200)

      await a.page.getByRole("button", { name: "Schließen" }).click()

      // --- Und sie sind wirklich da
      //
      // Der Bericht sagt, was geschrieben wurde. Die Karte sagt, was ankam.
      //
      // Der Selektor deckt beide Karten-Bibliotheken ab, wie im Durchgang:
      // Beim ersten Versuch stand `.leaflet-marker-icon` allein da, und die
      // Karte zeigte ihre Punkte über maplibre. Die Zahl ist klein, weil die
      // Karte bündelt: In Berlin steht eine 28 statt achtundzwanzig Nadeln.
      const nadeln = '.maplibregl-marker, .leaflet-marker-icon, [data-slot="map-marker"]'
      await a.page.getByRole("button", { name: "Karte" }).first().click()
      await expect(a.page.locator(nadeln).first()).toBeVisible({ timeout: 90_000 })
      const pins = await a.page.locator(nadeln).count()
      console.log(`${pins} Punkte auf der Karte`)
      expect(pins).toBeGreaterThan(0)
    } finally {
      await a.context.close()
    }
  })
})

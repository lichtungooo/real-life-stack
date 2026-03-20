import { test, expect } from '@playwright/test'
import { createFreshContext, createIdentity, recoverIdentity, navigateTo, waitForRelayConnected } from './helpers/common'

test.describe('CRDT Merge — Concurrent Items', () => {
  test('two devices create tasks, sync via relay — no data loss', async ({ browser }) => {
    const { context: d1Ctx, page: d1Page } = await createFreshContext(browser)
    const { context: d2Ctx, page: d2Page } = await createFreshContext(browser)

    try {
      // Device 1: Create identity
      const { mnemonic } = await createIdentity(d1Page, {
        name: 'Alice',
        passphrase: 'alice123pw',
      })
      await waitForRelayConnected(d1Page)

      // Helper: create a task in Kanban
      async function createTask(page: typeof d1Page, title: string) {
        // Click "Task" button → creates empty card + opens edit panel via URL
        await page.getByRole('button', { name: 'Task', exact: true }).click()
        // Wait for URL to change to /kanban/item/{id} (panel route)
        await page.waitForURL(/\/kanban\/item\//, { timeout: 5_000 }).catch(() => {})

        // If edit panel didn't open via route, click on the card
        const titleInput = page.getByRole('textbox', { name: 'Titel' })
        if (!await titleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          // Find and click the newest empty card
          const cards = page.locator('[class*="rounded-lg"][class*="border"]').filter({ hasNotText: /.+/ })
          if (await cards.count() > 0) {
            await cards.last().click()
          }
        }

        // Fill title in the edit panel
        await titleInput.waitFor({ timeout: 5_000 })
        await titleInput.fill(title)

        // Close panel by navigating back to kanban
        await page.getByRole('button', { name: 'Schliessen' }).click()
        await page.waitForTimeout(500)
      }

      // Device 1: Navigate to Kanban
      await d1Page.getByRole('button', { name: 'Kanban' }).waitFor({ timeout: 30_000 })
      await d1Page.getByRole('button', { name: 'Kanban' }).click()
      await d1Page.getByText('To Do').waitFor({ timeout: 15_000 })

      // Device 1: Create task "Einkaufen"
      await createTask(d1Page, 'Einkaufen')
      await expect(d1Page.getByText('Einkaufen')).toBeVisible({ timeout: 10_000 })

      // Wait for sync
      await d1Page.waitForTimeout(5000)

      // Device 2: Recover same identity
      await recoverIdentity(d2Page, {
        mnemonic,
        passphrase: 'alice-d2-pw',
      })
      await waitForRelayConnected(d2Page)

      // Device 2: Navigate to Kanban
      await d2Page.getByRole('button', { name: 'Kanban' }).waitFor({ timeout: 30_000 })
      await d2Page.getByRole('button', { name: 'Kanban' }).click()
      await d2Page.getByText('To Do').waitFor({ timeout: 15_000 })

      // Device 2: Should see "Einkaufen" (synced from Device 1)
      await expect(d2Page.getByText('Einkaufen')).toBeVisible({ timeout: 30_000 })

      // Device 2: Create task "Kochen"
      await createTask(d2Page, 'Kochen')
      await expect(d2Page.getByText('Kochen')).toBeVisible({ timeout: 10_000 })

      // Wait for sync
      await d2Page.waitForTimeout(5000)

      // Both devices should see both tasks
      await expect(d1Page.getByText('Einkaufen')).toBeVisible({ timeout: 30_000 })
      await expect(d1Page.getByText('Kochen')).toBeVisible({ timeout: 30_000 })
      await expect(d2Page.getByText('Einkaufen')).toBeVisible({ timeout: 10_000 })
      await expect(d2Page.getByText('Kochen')).toBeVisible({ timeout: 10_000 })

    } finally {
      await d1Ctx.close()
      await d2Ctx.close()
    }
  })
})

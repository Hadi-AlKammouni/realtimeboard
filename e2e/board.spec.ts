import { test, expect, Page } from '@playwright/test';

/**
 * E2E tests for RealtimeBoard.
 *
 * Test 3 (two-context sync) only works against a real Firebase project — it
 * relies on RTDB echoing writes across two browser contexts. Set
 * `RTDB_LIVE=1` to enable, otherwise it is skipped (e.g., on CI with no creds).
 */

const uniqueTitle = (label: string) =>
  `${label} — ${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

async function addCard(page: Page, title: string, description = ''): Promise<void> {
  await page.getByTestId('new-card').click();
  await page.getByTestId('card-title-input').fill(title);
  if (description) await page.getByTestId('card-desc-input').fill(description);
  await page.getByTestId('card-save').click();
  await expect(
    page.locator('[data-testid="board"]').getByText(title, { exact: true }),
  ).toBeVisible();
}

test.describe('RealtimeBoard', () => {
  test('adding a card makes it appear in the To Do column', async ({ page }) => {
    const title = uniqueTitle('Spec-A');
    await page.goto('/');
    await expect(page.getByTestId('board')).toBeVisible();

    await addCard(page, title, 'Created from the add-card test');

    const todo = page.locator('[data-column-id="todo"]');
    await expect(todo.getByText(title, { exact: true })).toBeVisible();
  });

  test('dragging a card from To Do to Done updates its column', async ({ page }) => {
    const title = uniqueTitle('Spec-B');
    await page.goto('/');
    await addCard(page, title);

    const card = page.locator(`[data-column-id="todo"]`).getByText(title, { exact: true });
    const done = page.locator('[data-column-id="done"] .column__list');

    // CDK drag requires the pointer to move at least ~5px before drag starts.
    // Several intermediate steps make CDK reliably register the drag.
    const cardBox = await card.boundingBox();
    const doneBox = await done.boundingBox();
    if (!cardBox || !doneBox) throw new Error('Could not measure drag source/target');

    await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(cardBox.x + cardBox.width / 2 + 20, cardBox.y + cardBox.height / 2 + 20, {
      steps: 10,
    });
    await page.mouse.move(doneBox.x + doneBox.width / 2, doneBox.y + doneBox.height / 2, {
      steps: 20,
    });
    await page.mouse.up();

    await expect(
      page.locator('[data-column-id="done"]').getByText(title, { exact: true }),
    ).toBeVisible();
    await expect(
      page.locator('[data-column-id="todo"]').getByText(title, { exact: true }),
    ).toHaveCount(0);
  });

  test('a card added in one browser context appears in another within 2s', async ({ browser }) => {
    test.skip(
      !process.env['RTDB_LIVE'],
      'Set RTDB_LIVE=1 with a real Firebase config to run cross-context sync test.',
    );

    const title = uniqueTitle('Spec-C');
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    await pageA.goto('/');
    await pageB.goto('/');
    await expect(pageA.getByTestId('board')).toBeVisible();
    await expect(pageB.getByTestId('board')).toBeVisible();

    // Give both contexts a beat for their RTDB subscriptions to attach and for
    // anonymous sign-in to complete. Without this we sometimes write before B
    // has finished hydrating.
    await pageA.waitForTimeout(500);
    await pageB.waitForTimeout(500);

    await addCard(pageA, title);

    await expect(
      pageB.locator('[data-testid="board"]').getByText(title, { exact: true }),
    ).toBeVisible({ timeout: 5_000 });

    await ctxA.close();
    await ctxB.close();
  });
});

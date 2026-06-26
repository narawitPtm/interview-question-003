import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // wait for table rows to appear (skeleton gone)
  await page.waitForSelector('.grid__row:not(.grid__row--skeleton)');
});

test('page loads with document table', async ({ page }) => {
  await expect(page.locator('h1')).toContainText('รายการอนุมัติเอกสาร');
  await expect(page.locator('.grid__row:not(.grid__row--skeleton)')).not.toHaveCount(0);
});

test('masthead shows status counts', async ({ page }) => {
  await expect(page.locator('.stat--pending b')).not.toHaveText('');
  await expect(page.locator('.stat--approved b')).not.toHaveText('');
  await expect(page.locator('.stat--rejected b')).not.toHaveText('');
});

test('filter tab — pending shows only pending rows', async ({ page }) => {
  await page.locator('.filter-tab--pending').click();
  await page.waitForSelector('.grid__row:not(.grid__row--skeleton)');
  const pills = page.locator('.pill');
  const count = await pills.count();
  for (let i = 0; i < count; i++) {
    await expect(pills.nth(i)).toHaveClass(/pill--pending/);
  }
});

test('filter tab — approved shows only approved rows', async ({ page }) => {
  await page.locator('.filter-tab--approved').click();
  await page.waitForSelector('.grid__row:not(.grid__row--skeleton)');
  const pills = page.locator('.pill');
  const count = await pills.count();
  for (let i = 0; i < count; i++) {
    await expect(pills.nth(i)).toHaveClass(/pill--approved/);
  }
});

test('filter tab — rejected shows only rejected rows', async ({ page }) => {
  await page.locator('.filter-tab--rejected').click();
  await page.waitForSelector('.grid__row:not(.grid__row--skeleton)');
  const pills = page.locator('.pill');
  const count = await pills.count();
  for (let i = 0; i < count; i++) {
    await expect(pills.nth(i)).toHaveClass(/pill--rejected/);
  }
});

test('filter tab — all restores full list', async ({ page }) => {
  await page.locator('.filter-tab--pending').click();
  await page.waitForSelector('.grid__row:not(.grid__row--skeleton)');
  const pendingCount = await page.locator('.grid__row:not(.grid__row--skeleton)').count();

  await page.locator('.filter-tab').first().click();
  await page.waitForSelector('.grid__row:not(.grid__row--skeleton)');
  const allCount = await page.locator('.grid__row:not(.grid__row--skeleton)').count();

  expect(allCount).toBeGreaterThanOrEqual(pendingCount);
});

test('sort by column — click cycles asc/desc', async ({ page }) => {
  const codeHeader = page.locator('th.th-sort', { hasText: 'รหัส' });
  await codeHeader.click();
  await expect(codeHeader.locator('.sort-arrow')).toContainText('↓');
  await codeHeader.click();
  await expect(codeHeader.locator('.sort-arrow')).toContainText('↑');
});

test('sort arrow shows only on active column', async ({ page }) => {
  const nameHeader = page.locator('th.th-sort', { hasText: 'รายการ' });
  const codeHeader = page.locator('th.th-sort', { hasText: 'รหัส' });
  await codeHeader.click();
  await expect(codeHeader.locator('.sort-arrow')).not.toHaveText('');
  await expect(nameHeader.locator('.sort-arrow')).toHaveText('');
});

test('selecting a pending row enables approve/reject buttons', async ({ page }) => {
  await expect(page.locator('.btn--approve')).toBeDisabled();
  await expect(page.locator('.btn--reject')).toBeDisabled();

  const pendingRow = page.locator('.grid__row:not(.is-locked)').first();
  await pendingRow.click();

  await expect(page.locator('.btn--approve')).toBeEnabled();
  await expect(page.locator('.btn--reject')).toBeEnabled();
});

test('approve modal opens with correct IT code', async ({ page }) => {
  await page.locator('.grid__row:not(.is-locked)').first().click();
  await page.locator('.btn--approve').click();
  await expect(page.locator('.modal__code')).toContainText('IT 03-2');
  await expect(page.locator('.modal')).toBeVisible();
});

test('reject modal opens with correct IT code', async ({ page }) => {
  await page.locator('.grid__row:not(.is-locked)').first().click();
  await page.locator('.btn--reject').click();
  await expect(page.locator('.modal__code')).toContainText('IT 03-3');
  await expect(page.locator('.modal')).toBeVisible();
});

test('modal closes on cancel', async ({ page }) => {
  await page.locator('.grid__row:not(.is-locked)').first().click();
  await page.locator('.btn--approve').click();
  await page.locator('.btn--ghost').click();
  await expect(page.locator('.modal')).not.toBeVisible();
});

test('modal closes on backdrop click', async ({ page }) => {
  await page.locator('.grid__row:not(.is-locked)').first().click();
  await page.locator('.btn--approve').click();
  await expect(page.locator('.modal')).toBeVisible();
  // click in the top-left corner of the viewport — well outside the centered modal
  await page.mouse.click(10, 10);
  await expect(page.locator('.modal')).not.toBeVisible();
});

test('approve flow — confirm updates table', async ({ page }) => {
  const pendingBefore = await page.locator('.pill--pending').count();

  await page.locator('.grid__row:not(.is-locked)').first().click();
  await page.locator('.btn--approve').first().click();
  // click the confirm button inside the modal
  await page.locator('.modal .btn--approve').click();

  // wait for modal to close and table to reload
  await expect(page.locator('.modal')).not.toBeVisible();
  await page.waitForSelector('.grid__row:not(.grid__row--skeleton)');
  const pendingAfter = await page.locator('.pill--pending').count();
  expect(pendingAfter).toBeLessThan(pendingBefore);
});

test('quick action approve button visible on row hover', async ({ page }) => {
  const pendingRow = page.locator('.grid__row:not(.is-locked)').first();
  await pendingRow.hover();
  await expect(pendingRow.locator('.row-btn--approve')).toBeVisible();
  await expect(pendingRow.locator('.row-btn--reject')).toBeVisible();
});

test('header checkbox selects all pending rows', async ({ page }) => {
  // the real input is visually hidden; click the visible checkbox box label
  await page.locator('thead .checkbox__box').click();
  const count = await page.locator('.toolbar__count').textContent();
  expect(count).toMatch(/เลือก \d+/);
});

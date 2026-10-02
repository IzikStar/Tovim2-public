import { expect, test } from '@playwright/test';

// The demo matchmaker that SEED_DEMO creates (server/src/demo.ts)
const EMAIL = 'rachel@demo.tovim.example';
const PASSWORD = 'demo-password';

test('a matchmaker logs in and walks through the main pages', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('אימייל').fill(EMAIL);
  await page.getByLabel('סיסמה').fill(PASSWORD);
  await page.getByRole('button', { name: 'כניסה' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: /^שלום, / })).toBeVisible();

  // One of the demo singles opens with their full card
  const card = page.locator('a[href^="/singles/"]').first();
  await card.click();
  await expect(page).toHaveURL(/\/singles\/[a-f0-9]{24}$/);
  await expect(page.getByRole('button', { name: 'שיתוף עם שדכן/ית' })).toBeVisible();

  await page.getByRole('link', { name: /^הצעות/ }).first().click();
  await expect(page.getByRole('heading', { name: 'מעקב הצעות' })).toBeVisible();

  await page.getByRole('link', { name: 'סיעור מוחות' }).first().click();
  await expect(page.getByRole('heading', { name: 'סיעור מוחות' })).toBeVisible();

  await page.getByTitle('הפרופיל שלי').click();
  await expect(page.getByRole('heading', { name: 'הפרופיל שלי' })).toBeVisible();
  await expect(page.getByRole('form', { name: 'שינוי סיסמה' })).toBeVisible();

  await page.getByRole('button', { name: 'יציאה' }).click();
  await expect(page).toHaveURL(/\/$/);
});

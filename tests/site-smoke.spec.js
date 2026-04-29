const { test, expect } = require('@playwright/test');

test('homepage loads with key content', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Speed AI/i);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Everyday software, priced for everyone.');
  await expect(page.getByRole('button', { name: 'Download' })).toBeVisible();
});

test('about and pricing pages render expected headings', async ({ page }) => {
  await page.goto('/about.html');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('About Speed AI');

  await page.goto('/pricing.html');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Pricing');
});

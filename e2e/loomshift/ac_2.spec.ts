import { test, expect } from '@playwright/test';

test('ac_2 a public profile lists owned games with name and hours', async ({ page }) => {
  await page.route('**/api/steam/games**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        steamId: '76561197960287930',
        private: false,
        games: [
          { appid: 20, name: 'Portal Stub', hours: 3.5 },
          { appid: 30, name: 'Half-Life Stub', hours: 152.4 },
        ],
      }),
    });
  });

  await page.goto('/');
  await page.locator('#steam-profile').fill('76561197960287930');
  await page.getByRole('button', { name: 'Show games' }).click();

  const portal = page.getByRole('listitem').filter({ hasText: 'Portal Stub' });
  await expect(portal).toBeVisible();
  await expect(portal).toContainText('3.5 h');
  const halfLife = page.getByRole('listitem').filter({ hasText: 'Half-Life Stub' });
  await expect(halfLife).toBeVisible();
  await expect(halfLife).toContainText('152.4 h');
});

import { test, expect } from '@playwright/test';

test('ac_2 says no friends are playing right now instead of an empty list', async ({ page }) => {
  await page.route('**/api/steam/games**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ steamId: '76561197960287930', private: false, games: [] }),
    });
  });
  await page.route('**/api/steam/friends**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ private: false, friends: [] }),
    });
  });

  await page.goto('/');
  await page.locator('#steam-profile').fill('76561197960287930');
  await page.getByRole('button', { name: 'Show games' }).click();

  await expect(page.getByText('No friends are playing right now.')).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(0);
});

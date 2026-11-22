import { test, expect } from '@playwright/test';

test('ac_1 games section says games are private or there are none when Steam returns no games', async ({ page }) => {
  await page.route('**/api/steam/games**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ steamId: '76561197960287930', private: true, games: [] }),
    }),
  );
  await page.route('**/api/steam/friends**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ private: false, friends: [] }),
    }),
  );
  await page.goto('/');
  await page.locator('#steam-profile').fill('76561197960287930');
  await page.getByRole('button', { name: 'Show games' }).click();
  await expect(page.getByText(/games are private or there are none/i)).toBeVisible();
});

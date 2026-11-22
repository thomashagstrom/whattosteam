import { test, expect } from '@playwright/test';

test('ac_2 private friend list says friends could not be seen while games still show', async ({ page }) => {
  await page.route('**/api/steam/games**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        steamId: '76561197960287930',
        private: false,
        games: [{ appid: 440, name: 'Team Fortress 2', hours: 12 }],
      }),
    }),
  );
  await page.route('**/api/steam/friends**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ private: true, friends: [] }),
    }),
  );
  await page.goto('/');
  await page.locator('#steam-profile').fill('76561197960287930');
  await page.getByRole('button', { name: 'Show games' }).click();
  await expect(page.getByText(/friends could not be seen/i)).toBeVisible();
  await expect(page.getByText('Team Fortress 2')).toBeVisible();
});

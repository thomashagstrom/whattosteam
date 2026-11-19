import { test, expect } from '@playwright/test';

test('ac_1 lists friends in a game with the friend name and the game name', async ({ page }) => {
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
      body: JSON.stringify({
        private: false,
        friends: [
          { steamId: '76561197960287931', name: 'Alex Stub', game: 'Chess Stub' },
          { steamId: '76561197960287932', name: 'Sam Stub', game: 'Portal Stub' },
        ],
      }),
    });
  });

  await page.goto('/');
  await page.locator('#steam-profile').fill('76561197960287930');
  await page.getByRole('button', { name: 'Show games' }).click();

  const alex = page.getByRole('listitem').filter({ hasText: 'Alex Stub' });
  await expect(alex).toBeVisible();
  await expect(alex).toContainText('Chess Stub');
  const sam = page.getByRole('listitem').filter({ hasText: 'Sam Stub' });
  await expect(sam).toBeVisible();
  await expect(sam).toContainText('Portal Stub');
});

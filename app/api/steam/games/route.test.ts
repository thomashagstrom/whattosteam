import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const ID = '76561198000000001';

function call(profile: string) {
  return GET(new Request(`http://localhost/api/steam/games?profile=${encodeURIComponent(profile)}`));
}

function stubSteam(response: unknown) {
  const fetchMock = vi.fn(async () => Response.json({ response }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function stubSteamSequence(responses: unknown[]) {
  const fetchMock = vi.fn();
  for (const response of responses) {
    fetchMock.mockImplementationOnce(async () => Response.json({ response }));
  }
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.stubEnv('STEAM_API_KEY', 'fake-test-key');
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('steam games route', () => {
  it('lists owned games most recently played first, with name and hours', async () => {
    stubSteam({
      game_count: 3,
      games: [
        { appid: 1, name: 'Old', playtime_forever: 60, rtime_last_played: 100 },
        { appid: 2, name: 'Newest', playtime_forever: 150, rtime_last_played: 300 },
        { appid: 3, name: 'Middle', playtime_forever: 30, rtime_last_played: 200 },
      ],
    });
    const body = await (await call(ID)).json();
    expect(body.games.map((g: { name: string }) => g.name)).toEqual(['Newest', 'Middle', 'Old']);
    expect(body.games[0]).toMatchObject({ name: 'Newest', hours: 2.5 });
  });

  it('loads the same profile for a bare SteamID64 and a /profiles/ link', async () => {
    const fetchMock = stubSteam({ game_count: 0 });
    const bare = await (await call(ID)).json();
    const link = await (await call(`https://steamcommunity.com/profiles/${ID}/`)).json();
    expect(link).toEqual(bare);
    expect(bare.steamId).toBe(ID);
    const calls = fetchMock.mock.calls as unknown as [URL][];
    expect(calls.every(([url]) => url.searchParams.get('steamid') === ID)).toBe(true);
  });

  it('rejects input that is neither a SteamID64 nor a profiles link, without calling Steam', async () => {
    const fetchMock = stubSteam({});
    const response = await call('https://example.com/profiles/' + ID);
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports a private profile', async () => {
    stubSteam({});
    const body = await (await call(ID)).json();
    expect(body).toMatchObject({ private: true, games: [] });
  });

  it('resolves a custom profile link to the SteamID and shows that profile\'s games', async () => {
    const fetchMock = stubSteamSequence([
      { success: 1, steamid: ID },
      { game_count: 0 },
      { game_count: 0 },
    ]);
    const vanity = await (await call('https://steamcommunity.com/id/somename')).json();
    const bare = await (await call(ID)).json();
    expect(vanity).toEqual(bare);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('reports no profile found when Steam has no match for a custom name', async () => {
    const fetchMock = stubSteamSequence([{ success: 42 }]);
    const response = await call('https://steamcommunity.com/id/nosuchname');
    const body = await response.json();
    expect(response.status).toBe(404);
    expect(body.message).toMatch(/couldn't find a profile/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects a non-Steam link without calling Steam', async () => {
    const fetchMock = stubSteam({});
    const response = await call('https://example.com/id/somename');
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('answers with an error naming STEAM_API_KEY when it is not set', async () => {
    vi.stubEnv('STEAM_API_KEY', '');
    const fetchMock = stubSteam({});
    const response = await call(ID);
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body.message).toContain('STEAM_API_KEY');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

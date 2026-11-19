import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const ID = '76561198000000001';

function call(profile: string) {
  return GET(new Request(`http://localhost/api/steam/friends?profile=${encodeURIComponent(profile)}`));
}

function friendIds(count: number) {
  return Array.from({ length: count }, (_, i) => `7656119810${String(i).padStart(7, '0')}`);
}

function stubSteam(friends: string[], playing: Record<string, string>) {
  const fetchMock = vi.fn(async (input: URL) => {
    if (input.pathname.includes('GetFriendList')) {
      return Response.json({ friendslist: { friends: friends.map((steamid) => ({ steamid })) } });
    }
    const ids = input.searchParams.get('steamids')!.split(',');
    return Response.json({
      response: {
        players: ids.map((steamid) => ({
          steamid,
          personaname: `Friend ${steamid.slice(-3)}`,
          ...(playing[steamid] ? { gameid: '1', gameextrainfo: playing[steamid] } : {}),
        })),
      },
    });
  });
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

describe('steam friends route', () => {
  it('lists friends in a game with the friend name and the game name', async () => {
    const ids = friendIds(3);
    stubSteam(ids, { [ids[1]]: 'Chess' });
    const body = await (await call(ID)).json();
    expect(body.friends).toEqual([{ steamId: ids[1], name: `Friend ${ids[1].slice(-3)}`, game: 'Chess' }]);
  });

  it('does not list friends who are not in a game, and returns an empty list when nobody is', async () => {
    stubSteam(friendIds(3), {});
    const body = await (await call(ID)).json();
    expect(body).toMatchObject({ private: false, friends: [] });
  });

  it('lists every in-game friend when the friend list is larger than one summary batch', async () => {
    const ids = friendIds(250);
    const fetchMock = stubSteam(ids, { [ids[5]]: 'A', [ids[120]]: 'B', [ids[249]]: 'C' });
    const body = await (await call(ID)).json();
    expect(body.friends.map((f: { game: string }) => f.game)).toEqual(['A', 'B', 'C']);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('reports a private friend list', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 401 })));
    const body = await (await call(ID)).json();
    expect(body).toMatchObject({ private: true, friends: [] });
  });
});

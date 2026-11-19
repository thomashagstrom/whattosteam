/** Steam helpers. Server only: `fetchOwnedGames` reads STEAM_API_KEY, which must never reach the browser. */

export interface OwnedGame {
  appid: number;
  name: string;
  hours: number;
  lastPlayed: number;
}

const STEAM_ID = /^\d{17}$/;
const PROFILE_LINK = /^(?:https?:\/\/)?(?:www\.)?steamcommunity\.com\/profiles\/(\d{17})\/?(?:[?#].*)?$/i;
const VANITY_LINK = /^(?:https?:\/\/)?(?:www\.)?steamcommunity\.com\/id\/([^/?#]+)\/?(?:[?#].*)?$/i;

export type ParsedProfile = { kind: 'id'; steamId: string } | { kind: 'vanity'; name: string };

/**
 * What a bare 17-digit ID, a steamcommunity.com/profiles/<id> link, or a steamcommunity.com/id/<name>
 * link refers to, else null when the input is none of these.
 */
export function parseProfileInput(input: string): ParsedProfile | null {
  const text = input.trim();
  if (STEAM_ID.test(text)) return { kind: 'id', steamId: text };
  const profileMatch = PROFILE_LINK.exec(text)?.[1];
  if (profileMatch) return { kind: 'id', steamId: profileMatch };
  const vanityMatch = VANITY_LINK.exec(text)?.[1];
  if (vanityMatch) return { kind: 'vanity', name: vanityMatch };
  return null;
}

/** The SteamID64 from a bare 17-digit ID or a steamcommunity.com/profiles/<id> link, else null. */
export function parseSteamId(input: string): string | null {
  const parsed = parseProfileInput(input);
  return parsed?.kind === 'id' ? parsed.steamId : null;
}

function steamError(code: string, message: string): Error & { code: string } {
  return Object.assign(new Error(message), { code });
}

/** The SteamID64 for a vanity name (steamcommunity.com/id/<name>), or null when Steam has no such profile. */
export async function resolveVanityUrl(name: string): Promise<string | null> {
  const key = process.env.STEAM_API_KEY;
  if (!key) throw steamError('steam/missing-key', 'STEAM_API_KEY is not set');

  const url = new URL('https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/');
  url.searchParams.set('key', key);
  url.searchParams.set('vanityurl', name);

  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw steamError('steam/unavailable', `Steam answered ${response.status}`);

  const body = (await response.json()) as { response?: { success?: number; steamid?: string } };
  if (body.response?.success === 1 && body.response.steamid) return body.response.steamid;
  return null;
}

interface SteamGame {
  appid: number;
  name?: string;
  playtime_forever?: number;
  rtime_last_played?: number;
}

/**
 * The owned games of a public profile, most recently played first. Returns null when the
 * profile's game details are private (Steam then answers with no `games` field).
 */
export async function fetchOwnedGames(steamId: string): Promise<OwnedGame[] | null> {
  const key = process.env.STEAM_API_KEY;
  if (!key) throw steamError('steam/missing-key', 'STEAM_API_KEY is not set');

  const url = new URL('https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/');
  url.searchParams.set('key', key);
  url.searchParams.set('steamid', steamId);
  url.searchParams.set('include_appinfo', 'true');
  url.searchParams.set('format', 'json');

  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw steamError('steam/unavailable', `Steam answered ${response.status}`);

  const body = (await response.json()) as { response?: { games?: SteamGame[] } };
  const games = body.response?.games;
  if (!games) return 'game_count' in (body.response ?? {}) ? [] : null;
  return games
    .map((g) => ({
      appid: g.appid,
      name: g.name ?? `App ${g.appid}`,
      hours: Math.round(((g.playtime_forever ?? 0) / 60) * 10) / 10,
      lastPlayed: g.rtime_last_played ?? 0,
    }))
    .sort((a, b) => b.lastPlayed - a.lastPlayed);
}

export interface FriendInGame {
  steamId: string;
  name: string;
  game: string;
}

const SUMMARY_BATCH = 100;

/**
 * The friends of a profile who are in a game right now, with the game's name. Returns null when the
 * friend list is private. Friends are looked up in batches, as Steam answers at most 100 per summary request.
 */
export async function fetchFriendsInGame(steamId: string): Promise<FriendInGame[] | null> {
  const key = process.env.STEAM_API_KEY;
  if (!key) throw steamError('steam/missing-key', 'STEAM_API_KEY is not set');

  const listUrl = new URL('https://api.steampowered.com/ISteamUser/GetFriendList/v1/');
  listUrl.searchParams.set('key', key);
  listUrl.searchParams.set('steamid', steamId);
  listUrl.searchParams.set('relationship', 'friend');

  const listResponse = await fetch(listUrl, { cache: 'no-store' });
  if (listResponse.status === 401 || listResponse.status === 403) return null;
  if (!listResponse.ok) throw steamError('steam/unavailable', `Steam answered ${listResponse.status}`);
  const listBody = (await listResponse.json()) as { friendslist?: { friends?: { steamid: string }[] } };
  const ids = (listBody.friendslist?.friends ?? []).map((f) => f.steamid);

  const playing: FriendInGame[] = [];
  for (let i = 0; i < ids.length; i += SUMMARY_BATCH) {
    const url = new URL('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/');
    url.searchParams.set('key', key);
    url.searchParams.set('steamids', ids.slice(i, i + SUMMARY_BATCH).join(','));
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw steamError('steam/unavailable', `Steam answered ${response.status}`);
    const body = (await response.json()) as {
      response?: {
        players?: { steamid: string; personaname?: string; gameid?: string; gameextrainfo?: string }[];
      };
    };
    for (const p of body.response?.players ?? []) {
      if (!p.gameid && !p.gameextrainfo) continue;
      playing.push({
        steamId: p.steamid,
        name: p.personaname ?? p.steamid,
        game: p.gameextrainfo ?? `App ${p.gameid}`,
      });
    }
  }
  return playing;
}

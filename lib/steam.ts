/** Steam helpers. Server only: `fetchOwnedGames` reads STEAM_API_KEY, which must never reach the browser. */

export interface OwnedGame {
  appid: number;
  name: string;
  hours: number;
  lastPlayed: number;
}

const STEAM_ID = /^\d{17}$/;
const PROFILE_LINK = /^(?:https?:\/\/)?(?:www\.)?steamcommunity\.com\/profiles\/(\d{17})\/?(?:[?#].*)?$/i;

/** The SteamID64 from a bare 17-digit ID or a steamcommunity.com/profiles/<id> link, else null. */
export function parseSteamId(input: string): string | null {
  const text = input.trim();
  if (STEAM_ID.test(text)) return text;
  return PROFILE_LINK.exec(text)?.[1] ?? null;
}

function steamError(code: string, message: string): Error & { code: string } {
  return Object.assign(new Error(message), { code });
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

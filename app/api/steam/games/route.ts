import { routeError } from '@/lib/route-errors';
import { fetchOwnedGames, parseSteamId } from '@/lib/steam';

export async function GET(request: Request): Promise<Response> {
  try {
    const steamId = parseSteamId(new URL(request.url).searchParams.get('profile') ?? '');
    if (!steamId) {
      return Response.json(
        { error: 'invalid-profile', message: 'Enter a 17-digit SteamID or a steamcommunity.com/profiles/ link.' },
        { status: 400 },
      );
    }
    const games = await fetchOwnedGames(steamId);
    if (games === null) {
      return Response.json({
        steamId,
        private: true,
        games: [],
      });
    }
    return Response.json({ steamId, private: false, games });
  } catch (error) {
    return routeError('steam/games', error);
  }
}

import { routeError } from '@/lib/route-errors';
import { fetchFriendsInGame, parseProfileInput, resolveVanityUrl } from '@/lib/steam';

export async function GET(request: Request): Promise<Response> {
  try {
    const parsed = parseProfileInput(new URL(request.url).searchParams.get('profile') ?? '');
    if (!parsed) {
      return Response.json(
        {
          error: 'invalid-profile',
          message:
            'Enter a 17-digit SteamID, a steamcommunity.com/profiles/ link, or a steamcommunity.com/id/ link.',
        },
        { status: 400 },
      );
    }
    const steamId = parsed.kind === 'id' ? parsed.steamId : await resolveVanityUrl(parsed.name);
    if (!steamId) {
      return Response.json(
        { error: 'not-found', message: "We couldn't find a profile for that name." },
        { status: 404 },
      );
    }
    const friends = await fetchFriendsInGame(steamId);
    return Response.json({ steamId, private: friends === null, friends: friends ?? [] });
  } catch (error) {
    return routeError('steam/friends', error);
  }
}

'use client';

import { useState } from 'react';
import { describeRouteError } from '@/lib/route-errors';
import type { OwnedGame } from '@/lib/steam';

interface Result {
  steamId: string;
  private: boolean;
  games: OwnedGame[];
}

export default function SteamLookup() {
  const [profile, setProfile] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch(`/api/steam/games?profile=${encodeURIComponent(profile)}`);
      const body = await response.json();
      if (!response.ok) {
        setError(describeRouteError(body));
      } else {
        setResult(body as Result);
      }
    } catch (caught) {
      console.error('steam lookup failed', (caught as { code?: string })?.code ?? 'no-code');
      setError("Couldn't reach the app. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <form onSubmit={submit} className="flex flex-col gap-2">
        <label htmlFor="steam-profile" className="font-medium">
          SteamID or profile link
        </label>
        <input
          id="steam-profile"
          value={profile}
          onChange={(e) => setProfile(e.target.value)}
          placeholder="7656119…, https://steamcommunity.com/profiles/7656119…, or https://steamcommunity.com/id/name"
          className="rounded border border-gray-500 bg-white p-2 text-black"
          aria-describedby="steam-profile-help steam-profile-error"
        />
        <p id="steam-profile-help" className="text-sm">
          A 17-digit SteamID64, a steamcommunity.com/profiles/ link, or a steamcommunity.com/id/ link.
        </p>
        <button
          type="submit"
          disabled={loading}
          className="self-start rounded bg-blue-800 px-4 py-2 text-white disabled:opacity-70"
        >
          {loading ? 'Loading…' : 'Show games'}
        </button>
      </form>
      <p id="steam-profile-error" role="alert" className="text-red-700">
        {error}
      </p>
      {result?.private && <p>This profile&apos;s game details are private.</p>}
      {result && !result.private && result.games.length === 0 && (
        <p>This profile has no games. Check the ID.</p>
      )}
      {result && result.games.length > 0 && (
        <div>
          <h2 className="font-semibold">
            {result.steamId}: {result.games.length} games
          </h2>
          <ul className="flex flex-col gap-1">
            {result.games.map((game) => (
              <li key={game.appid} className="flex justify-between gap-4">
                <span className="truncate" title={game.name}>
                  {game.name}
                </span>
                <span>{game.hours} h</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

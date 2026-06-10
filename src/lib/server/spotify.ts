import { env } from '$env/dynamic/private';

// App-level (Client Credentials) token — no user login, so no 25-user dev-mode cap.
let cached: { value: string; exp: number } | null = null;

async function getAppToken(): Promise<string | null> {
  if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET) return null;
  if (cached && Date.now() < cached.exp) return cached.value;

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) return null;
  const d = await res.json();
  cached = { value: d.access_token, exp: Date.now() + (d.expires_in - 60) * 1000 };
  return cached.value;
}

export type SpotifyTrack = { spotifyId: string; title: string; artist: string; artistId: string | null; image: string | null };

// Returns null when Spotify isn't configured, [] on a failed/empty search.
export async function searchTracks(q: string): Promise<SpotifyTrack[] | null> {
  const token = await getAppToken();
  if (!token) return null;

  const res = await fetch(
    `https://api.spotify.com/v1/search?type=track&limit=8&q=${encodeURIComponent(q)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return [];
  const d = await res.json();
  return (d.tracks?.items ?? []).map((t: any): SpotifyTrack => ({
    spotifyId: t.id,
    title: t.name,
    artist: (t.artists ?? []).map((a: any) => a.name).join(', '),
    artistId: t.artists?.[0]?.id ?? null, // primary artist (genres live on the artist, not the track)
    image: t.album?.images?.at(-1)?.url ?? null, // smallest cover
  }));
}

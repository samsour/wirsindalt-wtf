import { json } from '@sveltejs/kit';
import { searchTracks } from '$lib/server/spotify';

export async function GET({ url }) {
  const q = url.searchParams.get('q')?.trim();
  if (!q) return json({ results: [] });

  const results = await searchTracks(q);
  if (results === null) {
    return json({ error: 'spotify_not_configured', results: [] }, { status: 503 });
  }
  return json({ results });
}

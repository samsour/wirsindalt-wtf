import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { fetchArtistGenres } from '$lib/server/musicbrainz';

// Spotify doesn't expose genres to app-token apps, so we use MusicBrainz (by artist name),
// cached per artist so we hit their ~1 req/s limit at most once per artist.
const MAX_NEW_PER_REQUEST = 8;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const primary = (artist: string) => (artist || '').split(',')[0].trim();

export async function GET() {
  const rows = await db.execute(`SELECT id, artist, votes FROM songs WHERE votes > 0`);
  const songs = rows.rows as any[];
  if (songs.length === 0) return json({ songGenres: {}, vibe: [], vibeMore: 0 });

  const names = [...new Set(songs.map(s => primary(s.artist)).filter(Boolean))] as string[];

  // Cache hits first.
  const genresByName: Record<string, string[]> = {};
  for (const n of names) {
    const c = await db.execute({ sql: `SELECT genres FROM artist_genres WHERE name = ?`, args: [n.toLowerCase()] });
    if (c.rows.length) {
      try { genresByName[n] = JSON.parse(c.rows[0].genres as string); } catch { genresByName[n] = []; }
    }
  }

  // Fetch the misses (bounded + rate-limited), then cache them.
  let fetched = 0;
  for (const n of names) {
    if (genresByName[n] !== undefined) continue;
    if (fetched >= MAX_NEW_PER_REQUEST) break;
    const g = await fetchArtistGenres(n);
    genresByName[n] = g;
    await db.execute({
      sql: `INSERT OR REPLACE INTO artist_genres (name, genres, fetched_at) VALUES (?, ?, datetime('now'))`,
      args: [n.toLowerCase(), JSON.stringify(g)],
    });
    fetched++;
    await sleep(1100);
  }

  // Per song: its artist's top 1–2 specific genres (in tag-rank order).
  const songGenres: Record<number, string[]> = {};
  // Overall vibe: count specific genres across the playlist (weighted by votes); keep the most common.
  const vibeCounts: Record<string, number> = {};
  for (const s of songs) {
    const raw = genresByName[primary(s.artist)] ?? [];
    songGenres[s.id as number] = raw.slice(0, 2);
    const weight = (s.votes as number) || 1;
    for (const g of new Set(raw.slice(0, 3))) vibeCounts[g] = (vibeCounts[g] ?? 0) + weight;
  }

  const ranked = Object.entries(vibeCounts).sort((a, b) => b[1] - a[1]).map(([g]) => g);
  const vibe = ranked.slice(0, 6);
  const vibeMore = Math.max(0, ranked.length - vibe.length);

  return json({ songGenres, vibe, vibeMore });
}

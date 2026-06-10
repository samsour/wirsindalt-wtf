import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { fetchArtistGenres } from '$lib/server/musicbrainz';

// Spotify doesn't expose genres to app-token apps, so we use MusicBrainz (by artist name),
// cached per artist so we hit their ~1 req/s limit at most once per artist.
const MAX_NEW_PER_REQUEST = 8;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const primary = (artist: string) => (artist || '').split(',')[0].trim();

// Collapse MusicBrainz's fine-grained tags into broad umbrella genres. First match wins,
// so order matters where keywords overlap (e.g. Reggae before Electronic for "dancehall").
const GROUPS: [string, string[]][] = [
  ['Hip-Hop', ['hip hop', 'hip-hop', 'rap', 'trap', 'grime', 'drill', 'boom bap', 'g-funk']],
  ['Metal', ['metal', 'metalcore', 'deathcore', 'grindcore', 'djent']],
  ['Punk', ['punk', 'hardcore', 'emo', 'screamo']],
  ['Reggae', ['reggae', 'dancehall', 'ska']],
  ['Jazz', ['jazz', 'swing', 'bebop', 'bossa']],
  ['Classical', ['classical', 'orchestral', 'baroque', 'opera', 'symphony']],
  ['Latin', ['latin', 'reggaeton', 'salsa', 'cumbia', 'bachata']],
  ['R&B / Soul', ['r&b', 'rnb', 'soul', 'funk', 'motown', 'disco']],
  ['Electronic', ['electronic', 'electro', 'house', 'techno', 'trance', 'dubstep', 'brostep', 'step', 'edm', 'drum and bass', 'dnb', 'idm', 'ambient', 'dance', 'synthwave', 'breakbeat', 'downtempo', 'big room', 'hardstyle']],
  ['Folk / Country', ['folk', 'country', 'americana', 'bluegrass', 'singer-songwriter']],
  ['Blues', ['blues']],
  ['Rock', ['rock', 'grunge', 'alternative', 'shoegaze', 'psychedelic', 'britpop', 'metalcore']],
  ['Indie', ['indie']],
  ['Pop', ['pop', 'schlager', 'chanson']],
];

function groupGenre(tag: string): string {
  const t = tag.toLowerCase();
  for (const [label, kws] of GROUPS) {
    if (kws.some(k => t.includes(k))) return label;
  }
  return tag;
}

export async function GET() {
  const rows = await db.execute(`SELECT id, artist, votes FROM songs WHERE votes > 0`);
  const songs = rows.rows as any[];
  if (songs.length === 0) return json({ songGenres: {} });

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

  // Each song shows its artist's top 1–2 umbrella genres (deduped, in tag-rank order).
  const songGenres: Record<number, string[]> = {};
  for (const s of songs) {
    const raw = genresByName[primary(s.artist)] ?? [];
    const grouped: string[] = [];
    for (const tag of raw) {
      const g = groupGenre(tag);
      if (!grouped.includes(g)) grouped.push(g);
      if (grouped.length >= 2) break;
    }
    songGenres[s.id as number] = grouped;
  }

  return json({ songGenres });
}

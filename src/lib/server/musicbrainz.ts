// Genre lookup via MusicBrainz (no API key). The artist search returns folksonomy
// `tags` inline with vote counts, so one request per artist is enough.

// MusicBrainz asks for an identifying User-Agent with contact info.
const UA = 'VennWhenParty/1.0 ( https://wirsindalt.wtf )';

// Tags that show up on MusicBrainz but aren't musical genres.
const STOP = new Set([
  'favourite', 'favourites', 'favorite', 'favorites', 'seen live', 'wp musicians',
  'male vocalists', 'female vocalists', 'american', 'british', 'english', 'german',
  'french', 'spanish', 'italian', 'european', 'canadian', 'australian', 'swedish',
  'usa', 'uk', 'love', 'fun',
]);

export async function fetchArtistGenres(name: string): Promise<string[]> {
  const q = encodeURIComponent(`artist:"${name.replace(/"/g, '')}"`);
  let res: Response;
  try {
    res = await fetch(`https://musicbrainz.org/ws/2/artist?query=${q}&fmt=json&limit=1`, {
      headers: { 'User-Agent': UA },
    });
  } catch {
    return [];
  }
  if (!res.ok) return [];
  const d = await res.json();
  const tags = d.artists?.[0]?.tags as { count: number; name: string }[] | undefined;
  if (!tags) return [];

  return tags
    .filter(t => (t.count ?? 0) >= 1 && !STOP.has((t.name || '').toLowerCase()))
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .slice(0, 4)
    .map(t => t.name.toLowerCase());
}

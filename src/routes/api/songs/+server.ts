import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { resolveToken } from '$lib/server/auth';

const MAX_PICKS = 3;

async function pickCount(userId: number): Promise<number> {
  const r = await db.execute({ sql: `SELECT COUNT(*) as n FROM song_votes WHERE user_id = ?`, args: [userId] });
  return r.rows[0].n as number;
}

export async function GET({ url }) {
  const token = url.searchParams.get('token');
  const songs = await db.execute(
    `SELECT id, spotify_id, title, artist, image, votes FROM songs WHERE votes > 0 ORDER BY votes DESC, created_at ASC`
  );

  const voterRows = await db.execute(
    `SELECT sv.song_id, u.name as user_name FROM song_votes sv JOIN users u ON u.id = sv.user_id`
  );
  const likersBySong: Record<number, string[]> = {};
  for (const r of voterRows.rows) {
    (likersBySong[r.song_id as number] ??= []).push(r.user_name as string);
  }

  const list = songs.rows.map(r => ({
    id: r.id, spotifyId: r.spotify_id, title: r.title, artist: r.artist,
    image: r.image, votes: r.votes, likers: likersBySong[r.id as number] ?? [],
  }));

  let myVotes: number[] = [];
  if (token) {
    try {
      const { userId } = await resolveToken(token);
      const vr = await db.execute({ sql: `SELECT song_id FROM song_votes WHERE user_id = ?`, args: [userId] });
      myVotes = vr.rows.map(r => r.song_id as number);
    } catch { /* invalid token, skip myVotes */ }
  }
  return json({ songs: list, myVotes, maxPicks: MAX_PICKS });
}

// Add a pick from a Spotify track — creates the song if new, otherwise just registers your vote.
export async function POST({ request }) {
  const { token, spotifyId, title, artist, artistId, image } = await request.json();
  const { userId, userName } = await resolveToken(token);
  if (!title?.trim()) return json({ error: 'missing' }, { status: 400 });

  // Find existing song for this track.
  let songId: number | undefined;
  if (spotifyId) {
    const ex = await db.execute({ sql: `SELECT id FROM songs WHERE spotify_id = ?`, args: [spotifyId] });
    if (ex.rows.length) songId = ex.rows[0].id as number;
  }

  if (songId) {
    // Already in the list — register the vote if not yet picked (respecting the cap).
    const v = await db.execute({ sql: `SELECT id FROM song_votes WHERE user_id = ? AND song_id = ?`, args: [userId, songId] });
    if (v.rows.length === 0) {
      if (await pickCount(userId) >= MAX_PICKS) return json({ error: 'max_picks' }, { status: 409 });
      await db.execute({ sql: `INSERT INTO song_votes (user_id, song_id) VALUES (?, ?)`, args: [userId, songId] });
      await db.execute({ sql: `UPDATE songs SET votes = votes + 1 WHERE id = ?`, args: [songId] });
    }
    return json({ ok: true });
  }

  // New track — needs a fresh pick, so enforce the cap before creating it.
  if (await pickCount(userId) >= MAX_PICKS) return json({ error: 'max_picks' }, { status: 409 });
  const ins = await db.execute({
    sql: `INSERT INTO songs (user_id, user_name, spotify_id, title, artist, image, votes) VALUES (?, ?, ?, ?, ?, ?, 0) RETURNING id`,
    args: [userId, userName, spotifyId ?? null, title.trim(), artist?.trim() || null, image ?? null],
  });
  songId = ins.rows[0].id as number;
  await db.execute({ sql: `INSERT INTO song_votes (user_id, song_id) VALUES (?, ?)`, args: [userId, songId] });
  await db.execute({ sql: `UPDATE songs SET votes = votes + 1 WHERE id = ?`, args: [songId] });
  return json({ ok: true });
}

// Toggle your pick on a song already in the list.
export async function PUT({ request }) {
  const { token, songId } = await request.json();
  const { userId } = await resolveToken(token);

  const existing = await db.execute({ sql: `SELECT id FROM song_votes WHERE user_id = ? AND song_id = ?`, args: [userId, songId] });
  if (existing.rows.length > 0) {
    await db.execute({ sql: `DELETE FROM song_votes WHERE user_id = ? AND song_id = ?`, args: [userId, songId] });
    await db.execute({ sql: `UPDATE songs SET votes = votes - 1 WHERE id = ?`, args: [songId] });
    await db.execute({ sql: `DELETE FROM songs WHERE id = ? AND votes <= 0`, args: [songId] });
    return json({ voted: false });
  }
  if (await pickCount(userId) >= MAX_PICKS) return json({ error: 'max_picks' }, { status: 409 });
  await db.execute({ sql: `INSERT INTO song_votes (user_id, song_id) VALUES (?, ?)`, args: [userId, songId] });
  await db.execute({ sql: `UPDATE songs SET votes = votes + 1 WHERE id = ?`, args: [songId] });
  return json({ voted: true });
}

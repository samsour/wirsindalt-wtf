import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { DATES } from '$lib/dates';

export async function GET() {
  // Aggregate vote counts per date
  const rows = await db.execute(`
    SELECT date_key, vote, COUNT(*) as count
    FROM date_votes
    GROUP BY date_key, vote
  `);

  const counts: Record<string, { yes: number; maybe: number; no: number }> = {};
  for (const d of DATES) {
    counts[d.key] = { yes: 0, maybe: 0, no: 0 };
  }
  for (const row of rows.rows) {
    const key = row.date_key as string;
    const vote = row.vote as 'yes' | 'maybe' | 'no';
    if (counts[key]) counts[key][vote] = row.count as number;
  }
  return json(counts);
}

export async function POST({ request }) {
  const { userId, dateKey, vote } = await request.json();
  if (!userId || !dateKey || !vote) return json({ error: 'Missing fields' }, { status: 400 });

  if (vote === null) {
    await db.execute({
      sql: `DELETE FROM date_votes WHERE user_id = ? AND date_key = ?`,
      args: [userId, dateKey],
    });
  } else {
    await db.execute({
      sql: `INSERT INTO date_votes (user_id, date_key, vote) VALUES (?, ?, ?)
            ON CONFLICT(user_id, date_key) DO UPDATE SET vote = excluded.vote`,
      args: [userId, dateKey, vote],
    });
  }
  return json({ ok: true });
}

// GET user's own votes
export async function PUT({ request }) {
  const { userId } = await request.json();
  const rows = await db.execute({
    sql: `SELECT date_key, vote FROM date_votes WHERE user_id = ?`,
    args: [userId],
  });
  const myVotes: Record<string, string> = {};
  for (const r of rows.rows) myVotes[r.date_key as string] = r.vote as string;
  return json(myVotes);
}

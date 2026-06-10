import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { TIME_SLOTS, DATE_ANNOUNCED } from '$lib/dates';
import { resolveToken } from '$lib/server/auth';

export async function GET() {
  const [rows, uniqueRow] = await Promise.all([
    db.execute(`SELECT slot_key, vote, COUNT(*) as count FROM time_votes GROUP BY slot_key, vote`),
    db.execute(`SELECT COUNT(DISTINCT user_id) as n FROM time_votes`),
  ]);

  const counts: Record<string, { yes: number; maybe: number; no: number }> = {};
  for (const s of TIME_SLOTS) {
    counts[s.key] = { yes: 0, maybe: 0, no: 0 };
  }
  for (const row of rows.rows) {
    const key = row.slot_key as string;
    const vote = row.vote as 'yes' | 'maybe' | 'no';
    if (counts[key]) counts[key][vote] = row.count as number;
  }

  return json({ counts, uniqueVoters: uniqueRow.rows[0].n as number });
}

export async function POST({ request }) {
  // The time vote only opens once the date is locked in.
  if (!DATE_ANNOUNCED) {
    return json({ error: 'Die Uhrzeit-Abstimmung ist noch nicht offen.' }, { status: 409 });
  }

  const { token, slotKey, vote } = await request.json();
  const { userId } = await resolveToken(token);
  if (!slotKey || !TIME_SLOTS.some(s => s.key === slotKey)) {
    return json({ error: 'Invalid slot' }, { status: 400 });
  }
  if (vote !== null && !['yes', 'maybe', 'no'].includes(vote)) {
    return json({ error: 'Invalid vote value' }, { status: 400 });
  }

  if (vote === null) {
    await db.execute({
      sql: `DELETE FROM time_votes WHERE user_id = ? AND slot_key = ?`,
      args: [userId, slotKey],
    });
  } else {
    await db.execute({
      sql: `INSERT INTO time_votes (user_id, slot_key, vote) VALUES (?, ?, ?)
            ON CONFLICT(user_id, slot_key) DO UPDATE SET vote = excluded.vote`,
      args: [userId, slotKey, vote],
    });
  }
  return json({ ok: true });
}

export async function PUT({ request }) {
  const { token } = await request.json();
  const { userId } = await resolveToken(token);
  const rows = await db.execute({
    sql: `SELECT slot_key, vote FROM time_votes WHERE user_id = ?`,
    args: [userId],
  });
  const myVotes: Record<string, string> = {};
  for (const r of rows.rows) myVotes[r.slot_key as string] = r.vote as string;
  return json(myVotes);
}

import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { resolveToken } from '$lib/server/auth';

export async function GET({ url }) {
  const token = url.searchParams.get('token');
  const ideas = await db.execute(
    `SELECT id, user_id, user_name, text, tag, votes, created_at FROM ideas ORDER BY votes DESC, created_at DESC`
  );
  let myVotes: number[] = [];
  if (token) {
    try {
      const { userId } = await resolveToken(token);
      const vr = await db.execute({
        sql: `SELECT idea_id FROM idea_votes WHERE user_id = ?`,
        args: [userId],
      });
      myVotes = vr.rows.map(r => r.idea_id as number);
    } catch { /* invalid token, skip myVotes */ }
  }
  return json({ ideas: ideas.rows, myVotes });
}

export async function POST({ request }) {
  const { token, text, tag } = await request.json();
  const { userId, userName } = await resolveToken(token);
  if (!text?.trim()) return json({ error: 'Missing fields' }, { status: 400 });

  const result = await db.execute({
    sql: `INSERT INTO ideas (user_id, user_name, text, tag, votes) VALUES (?, ?, ?, ?, 1) RETURNING *`,
    args: [userId, userName, text.trim(), tag],
  });
  await db.execute({
    sql: `INSERT OR IGNORE INTO idea_votes (user_id, idea_id) VALUES (?, ?)`,
    args: [userId, result.rows[0].id as number],
  });
  return json(result.rows[0]);
}

export async function DELETE({ request }) {
  const { token, ideaId } = await request.json();
  const { userId } = await resolveToken(token);
  await db.execute({ sql: `DELETE FROM idea_votes WHERE idea_id = ?`, args: [ideaId] });
  await db.execute({ sql: `DELETE FROM ideas WHERE id = ? AND user_id = ?`, args: [ideaId, userId] });
  return json({ ok: true });
}

export async function PUT({ request }) {
  const { token, ideaId } = await request.json();
  const { userId } = await resolveToken(token);
  const existing = await db.execute({
    sql: `SELECT id FROM idea_votes WHERE user_id = ? AND idea_id = ?`,
    args: [userId, ideaId],
  });
  if (existing.rows.length > 0) {
    await db.execute({ sql: `DELETE FROM idea_votes WHERE user_id = ? AND idea_id = ?`, args: [userId, ideaId] });
    await db.execute({ sql: `UPDATE ideas SET votes = votes - 1 WHERE id = ?`, args: [ideaId] });
    return json({ voted: false });
  } else {
    await db.execute({ sql: `INSERT INTO idea_votes (user_id, idea_id) VALUES (?, ?)`, args: [userId, ideaId] });
    await db.execute({ sql: `UPDATE ideas SET votes = votes + 1 WHERE id = ?`, args: [ideaId] });
    return json({ voted: true });
  }
}

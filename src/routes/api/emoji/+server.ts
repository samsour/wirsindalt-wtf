import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { resolveToken } from '$lib/server/auth';

export async function GET() {
  const rows = await db.execute(
    `SELECT id, user_name, emoji FROM emoji_events
     WHERE created_at > datetime('now', '-30 seconds')
     ORDER BY created_at ASC`
  );
  return json(rows.rows);
}

export async function POST({ request }) {
  const { token, emoji } = await request.json();
  const { userName } = await resolveToken(token);
  // keep the table tidy
  await db.execute(`DELETE FROM emoji_events WHERE created_at < datetime('now', '-60 seconds')`);
  const result = await db.execute({
    sql: `INSERT INTO emoji_events (user_name, emoji) VALUES (?, ?) RETURNING id`,
    args: [userName, emoji],
  });
  return json({ ok: true, id: result.rows[0].id });
}

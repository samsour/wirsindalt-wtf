import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { resolveToken } from '$lib/server/auth';

export async function GET() {
  const rows = await db.execute(
    `SELECT user_name FROM presence WHERE last_seen > datetime('now', '-45 seconds')`
  );
  return json({ count: rows.rows.length, names: rows.rows.map(r => r.user_name as string) });
}

export async function POST({ request }) {
  const { token } = await request.json();
  const { userId, userName } = await resolveToken(token);
  await db.execute({
    sql: `INSERT INTO presence (user_id, user_name, last_seen) VALUES (?, ?, datetime('now'))
          ON CONFLICT(user_id) DO UPDATE SET last_seen = datetime('now'), user_name = excluded.user_name`,
    args: [userId, userName],
  });
  return json({ ok: true });
}

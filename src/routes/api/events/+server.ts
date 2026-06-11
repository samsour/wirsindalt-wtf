import { json } from '@sveltejs/kit';
import { db } from '$lib/db';

// Live activity feed: returns recent events newer than `since` (the client's last seen id).
export async function GET({ url }) {
  const since = parseInt(url.searchParams.get('since') ?? '0') || 0;
  const rows = await db.execute({
    sql: `SELECT id, user_name, type, detail FROM events
          WHERE id > ? AND created_at > datetime('now', '-120 seconds')
          ORDER BY id ASC LIMIT 50`,
    args: [since],
  });
  return json(rows.rows);
}

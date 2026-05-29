import { error } from '@sveltejs/kit';
import { db } from '$lib/db';

export async function resolveToken(token: string | undefined): Promise<{ userId: number; userName: string }> {
  if (!token) throw error(401, 'Not authenticated');
  const row = await db.execute({
    sql: `SELECT u.id, u.name FROM users u JOIN sessions s ON s.user_id = u.id WHERE s.token = ?`,
    args: [token],
  });
  if (!row.rows.length) throw error(401, 'Invalid session');
  return { userId: row.rows[0].id as number, userName: row.rows[0].name as string };
}

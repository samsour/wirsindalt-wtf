import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { resolveToken } from '$lib/server/auth';

export async function GET() {
  const rows = await db.execute(
    `SELECT id, user_name, description, address, created_at FROM locations ORDER BY created_at ASC`
  );
  return json(rows.rows);
}

export async function POST({ request }) {
  const { token, description, address } = await request.json();
  const { userId, userName } = await resolveToken(token);
  if (!description?.trim()) return json({ error: 'Missing fields' }, { status: 400 });

  const result = await db.execute({
    sql: `INSERT INTO locations (user_id, user_name, description, address) VALUES (?, ?, ?, ?) RETURNING *`,
    args: [userId, userName, description.trim(), address?.trim() ?? null],
  });
  return json(result.rows[0]);
}

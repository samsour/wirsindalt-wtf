import { json } from '@sveltejs/kit';
import { db } from '$lib/db';

export async function GET() {
  const rows = await db.execute(
    `SELECT id, user_name, item, category, created_at FROM contributions ORDER BY created_at DESC`
  );
  return json(rows.rows);
}

export async function POST({ request }) {
  const { userId, userName, item, category } = await request.json();
  if (!userId || !item?.trim()) return json({ error: 'Missing fields' }, { status: 400 });

  const result = await db.execute({
    sql: `INSERT INTO contributions (user_id, user_name, item, category) VALUES (?, ?, ?, ?) RETURNING *`,
    args: [userId, userName, item.trim(), category],
  });
  return json(result.rows[0]);
}

export async function DELETE({ request }) {
  const { id, userId } = await request.json();
  await db.execute({
    sql: `DELETE FROM contributions WHERE id = ? AND user_id = ?`,
    args: [id, userId],
  });
  return json({ ok: true });
}

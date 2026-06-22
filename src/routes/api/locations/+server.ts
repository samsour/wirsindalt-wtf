import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { db } from '$lib/db';
import { resolveToken } from '$lib/server/auth';
import { logEvent } from '$lib/server/events';

export async function GET() {
  const rows = await db.execute(
    `SELECT id, user_id, user_name, description, address, contact, struck, created_at FROM locations ORDER BY created_at ASC`
  );
  return json(rows.rows);
}

export async function PATCH({ request }) {
  const { token, id, struck } = await request.json();
  await resolveToken(token);
  await db.execute({ sql: `UPDATE locations SET struck = ? WHERE id = ?`, args: [struck ? 1 : 0, id] });
  return json({ ok: true });
}

export async function PUT({ request }) {
  const { token, id, description, address, contact } = await request.json();
  await resolveToken(token);
  if (!description?.trim()) return json({ error: 'Missing fields' }, { status: 400 });
  const result = await db.execute({
    sql: `UPDATE locations SET description = ?, address = ?, contact = ? WHERE id = ? RETURNING *`,
    args: [description.trim(), address?.trim() || null, contact?.trim() || null, id],
  });
  return json(result.rows[0]);
}

export async function POST({ request }) {
  // Venue is locked in — no more location suggestions.
  if (env.LOCATION_ADDRESS) return json({ error: 'Der Ort steht bereits fest.' }, { status: 409 });

  const { token, description, address, contact } = await request.json();
  const { userId, userName } = await resolveToken(token);
  if (!description?.trim()) return json({ error: 'Missing fields' }, { status: 400 });

  const result = await db.execute({
    sql: `INSERT INTO locations (user_id, user_name, description, address, contact) VALUES (?, ?, ?, ?, ?) RETURNING *`,
    args: [userId, userName, description.trim(), address?.trim() ?? null, contact?.trim() || null],
  });
  await logEvent(userName, 'location_add', description.trim());
  return json(result.rows[0]);
}

export async function DELETE({ request }) {
  const { token, id } = await request.json();
  const { userId } = await resolveToken(token);
  await db.execute({
    sql: `DELETE FROM locations WHERE id = ? AND user_id = ?`,
    args: [id, userId],
  });
  return json({ ok: true });
}

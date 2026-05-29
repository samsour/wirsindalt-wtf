import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { checkMotto } from '$lib/dates';

export async function POST({ request }) {
  const { name, motto } = await request.json();

  if (!checkMotto(motto)) {
    return json({ error: 'Motto falsch - versuch es nochmal!' }, { status: 401 });
  }
  if (!name?.trim()) {
    return json({ error: 'Bitte Namen eingeben.' }, { status: 400 });
  }

  // Find or create user by name (case-insensitive)
  const existing = await db.execute({
    sql: `SELECT id, name FROM users WHERE lower(name) = lower(?) LIMIT 1`,
    args: [name.trim()],
  });

  let userId: number;
  let userName: string;

  if (existing.rows.length > 0) {
    userId = existing.rows[0].id as number;
    userName = existing.rows[0].name as string;
  } else {
    const result = await db.execute({
      sql: `INSERT INTO users (name) VALUES (?) RETURNING id, name`,
      args: [name.trim()],
    });
    userId = result.rows[0].id as number;
    userName = result.rows[0].name as string;
  }

  return json({ userId, userName });
}

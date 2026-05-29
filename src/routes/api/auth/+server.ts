import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { checkMotto } from '$lib/dates';

export async function POST({ request }) {
  const { clientId, name, motto } = await request.json();

  if (checkMotto(motto) === 'wrong') {
    return json({ error: 'Motto falsch - versuch es nochmal!' }, { status: 401 });
  }
  if (!name?.trim()) {
    return json({ error: 'Bitte Namen eingeben.' }, { status: 400 });
  }
  if (!clientId) {
    return json({ error: 'Missing client ID.' }, { status: 400 });
  }

  const existing = await db.execute({
    sql: `SELECT id, name FROM users WHERE client_id = ? LIMIT 1`,
    args: [clientId],
  });

  let userId: number;
  let userName: string;

  if (existing.rows.length > 0) {
    userId = existing.rows[0].id as number;
    userName = existing.rows[0].name as string;
  } else {
    const result = await db.execute({
      sql: `INSERT INTO users (client_id, name) VALUES (?, ?) RETURNING id, name`,
      args: [clientId, name.trim()],
    });
    userId = result.rows[0].id as number;
    userName = result.rows[0].name as string;
  }

  const token = crypto.randomUUID();
  await db.execute({
    sql: `INSERT INTO sessions (token, user_id) VALUES (?, ?)`,
    args: [token, userId],
  });

  return json({ userId, userName, token });
}

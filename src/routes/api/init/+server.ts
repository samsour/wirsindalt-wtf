import { json } from '@sveltejs/kit';
import { initDb } from '$lib/db';

// Call once to set up tables: GET /api/init
export async function GET() {
  await initDb();
  return json({ ok: true, message: 'DB initialized' });
}

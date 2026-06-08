import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { resolveToken } from '$lib/server/auth';
import { DATE_ANNOUNCED } from '$lib/dates';

export async function GET() {
  const rows = await db.execute(`
    SELECT attending, SUM(guests) as total_guests, COUNT(*) as count
    FROM rsvp GROUP BY attending
  `);
  let attending = 0, notAttending = 0, totalGuests = 0;
  for (const r of rows.rows) {
    if (r.attending) { attending = r.count as number; totalGuests = r.total_guests as number; }
    else notAttending = r.count as number;
  }
  return json({ attending, notAttending, totalGuests });
}

export async function POST({ request }) {
  // RSVP stays closed until the planning team has locked in the final date.
  if (!DATE_ANNOUNCED) {
    return json({ ok: false, error: 'Der Termin steht noch nicht fest.' }, { status: 409 });
  }

  const { token, attending, guests, dietary, note } = await request.json();
  const { userId } = await resolveToken(token);

  await db.execute({
    sql: `INSERT INTO rsvp (user_id, attending, guests, dietary, note) VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET
            attending = excluded.attending,
            guests = excluded.guests,
            dietary = excluded.dietary,
            note = excluded.note`,
    args: [userId, attending ? 1 : 0, guests ?? 1, dietary ?? null, note ?? null],
  });
  return json({ ok: true });
}

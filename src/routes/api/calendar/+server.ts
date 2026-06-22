import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { DATE_ANNOUNCED, FINAL_DATE } from '$lib/dates';

const TITLE = '10 Jahre blau, trotzdem schlau 🎓';
const START_HOUR = 17;
const DURATION_HOURS = 7; // 17:00 → 00:00 (midnight)

// Format a Date's wall-clock as a floating ICS timestamp (no timezone = local).
function fmt(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}00`;
}

export async function GET() {
  if (!DATE_ANNOUNCED || !FINAL_DATE) throw error(404, 'Kein Termin festgelegt');

  const location = [env.LOCATION_ADDRESS, env.POSTCODE_CITY].filter(Boolean).join(', ');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  // Build start/end in UTC so the wall-clock components are exact, then emit as floating.
  const start = new Date(`${FINAL_DATE}T${String(START_HOUR).padStart(2, '0')}:00:00Z`);
  const end = new Date(start.getTime() + DURATION_HOURS * 3_600_000);

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//wirsindalt.wtf//Reunion//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:reunion-${FINAL_DATE}@wirsindalt.wtf`,
    `DTSTAMP:${stamp}`,
    'SEQUENCE:2', // bump when event details change so calendars apply the update
    `LAST-MODIFIED:${stamp}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${TITLE}`,
    location ? `LOCATION:${location.replace(/,/g, '\\,')}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="reunion.ics"',
      'Cache-Control': 'no-store',
    },
  });
}

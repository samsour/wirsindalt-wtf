import { db } from '$lib/db';

// Best-effort activity log for live toasts. Never throws — an action must not fail
// just because the event couldn't be recorded (e.g. table not migrated yet).
export async function logEvent(userName: string, type: string, detail?: string | null) {
  try {
    await db.execute({
      sql: `INSERT INTO events (user_name, type, detail) VALUES (?, ?, ?)`,
      args: [userName, type, detail?.slice(0, 80) ?? null],
    });
    await db.execute(`DELETE FROM events WHERE created_at < datetime('now', '-120 seconds')`);
  } catch { /* events are non-critical */ }
}

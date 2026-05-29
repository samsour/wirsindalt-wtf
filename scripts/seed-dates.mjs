import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Load .env manually
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.split("=").map((s) => s.trim()))
    .filter(([k]) => k)
    .map(([k, ...v]) => [k, v.join("=")])
);

const client = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

// German public holidays in late June – August 2026 that aren't Fri/Sat
// (regional ones worth noting)
const HOLIDAY_LABELS = {
  "2026-06-04": "Fronleichnam", // Thursday — regional (BY, BW, HE, NW, RP, SL)
  "2026-08-15": "Maria Himmelfahrt", // Saturday — regional (BY, SL)
};

function getWeekday(dateStr) {
  // Returns 0=Sun,1=Mon,...,5=Fri,6=Sat
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

function dateRange(start, end) {
  const dates = [];
  const cur = new Date(start);
  const last = new Date(end);
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

async function main() {
  // Get the event
  const evRes = await client.execute("SELECT id FROM event LIMIT 1");
  if (evRes.rows.length === 0) {
    console.error("No event found in DB.");
    process.exit(1);
  }
  const eventId = evRes.rows[0][0];
  console.log("Event ID:", eventId);

  // Get existing date options to avoid duplicates
  const existingRes = await client.execute(
    "SELECT date FROM date_option WHERE eventId = ?",
    [eventId]
  );
  const existing = new Set(existingRes.rows.map((r) => r[0]));
  console.log("Existing dates:", [...existing]);

  // Build candidate list: all Fri (5) and Sat (6) from June 19 – Aug 29 2026
  const allDays = dateRange("2026-06-19", "2026-08-29");
  const fridaysSaturdays = allDays.filter((d) => {
    const day = getWeekday(d);
    return day === 5 || day === 6;
  });

  // Also include Fronleichnam (Thursday June 4) as a bonus holiday date
  const bonusHolidays = Object.keys(HOLIDAY_LABELS).filter(
    (d) => getWeekday(d) !== 5 && getWeekday(d) !== 6
  );

  const candidates = [...fridaysSaturdays, ...bonusHolidays].sort();

  const toInsert = candidates.filter((d) => !existing.has(d));
  console.log(`\nDates to insert (${toInsert.length}):`);
  toInsert.forEach((d, i) => {
    const label = HOLIDAY_LABELS[d] || null;
    const day = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][getWeekday(d)];
    console.log(`  ${i + 1}. ${d} (${day})${label ? " — " + label : ""}`);
  });

  if (toInsert.length === 0) {
    console.log("\nNothing to insert.");
    return;
  }

  // Insert in a batch
  const now = Date.now();
  let sortBase = (
    await client.execute(
      "SELECT MAX(sortOrder) as m FROM date_option WHERE eventId = ?",
      [eventId]
    )
  ).rows[0][0];
  let sortOrder = typeof sortBase === "number" ? sortBase + 1 : 0;

  const statements = toInsert.map((date) => ({
    sql: "INSERT INTO date_option (id, eventId, date, label, sortOrder, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
    args: [
      crypto.randomUUID(),
      eventId,
      date,
      HOLIDAY_LABELS[date] ?? null,
      sortOrder++,
      now,
    ],
  }));

  await client.batch(statements);
  console.log(`\nInserted ${statements.length} date options.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

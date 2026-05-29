import { NextResponse } from "next/server";
import { db } from "@/db";
import { event, dateOptions, voteSelections, rsvps } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const ev = await db.query.event.findFirst();
  if (!ev) {
    return NextResponse.json({
      name: "Abitur 2016 · 10 Jahre Treffen",
      description: null,
      finalDateOptionId: null,
      location: null,
      time: null,
      rsvpsEnabled: false,
      dateOptions: [],
      rsvpCounts: { attending: 0, maybe: 0, not_attending: 0 },
    });
  }

  const options = await db
    .select({
      id: dateOptions.id,
      date: dateOptions.date,
      label: dateOptions.label,
      sortOrder: dateOptions.sortOrder,
      voteCount: sql<number>`count(${voteSelections.voteId})`,
    })
    .from(dateOptions)
    .leftJoin(voteSelections, eq(voteSelections.dateOptionId, dateOptions.id))
    .where(eq(dateOptions.eventId, ev.id))
    .groupBy(dateOptions.id)
    .orderBy(dateOptions.sortOrder);

  const rsvpRows = await db.select({ status: rsvps.status }).from(rsvps);
  const rsvpCounts = { attending: 0, maybe: 0, not_attending: 0 };
  for (const r of rsvpRows) rsvpCounts[r.status]++;

  return NextResponse.json({ ...ev, dateOptions: options, rsvpCounts });
}

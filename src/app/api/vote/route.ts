import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { votes, voteSelections, dateOptions, event } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function DELETE(req: NextRequest) {
  const { voteId } = await req.json() as { voteId: string };
  if (!voteId) return NextResponse.json({ error: "Missing voteId" }, { status: 400 });
  await db.delete(votes).where(eq(votes.id, voteId));
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const { voterName, dateOptionIds } = await req.json() as { voterName: string; dateOptionIds: string[] };

  if (!voterName?.trim() || !Array.isArray(dateOptionIds) || dateOptionIds.length === 0) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const ev = await db.query.event.findFirst();
  if (!ev) return NextResponse.json({ error: "No event" }, { status: 404 });

  // Verify all selected options belong to this event
  const validOptions = await db
    .select({ id: dateOptions.id })
    .from(dateOptions)
    .where(eq(dateOptions.eventId, ev.id));
  const validIds = new Set(validOptions.map((o) => o.id));
  const safeIds = dateOptionIds.filter((id) => validIds.has(id));
  if (safeIds.length === 0) return NextResponse.json({ error: "No valid options" }, { status: 400 });

  const [vote] = await db.insert(votes).values({ voterName: voterName.trim() }).returning();
  await db.insert(voteSelections).values(safeIds.map((id) => ({ voteId: vote.id, dateOptionId: id })));

  return NextResponse.json({ ok: true, voteId: vote.id });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rsvps, event } from "@/db/schema";

const VALID_STATUSES = ["attending", "maybe", "not_attending"] as const;

export async function POST(req: NextRequest) {
  const { name, status } = await req.json() as { name: string; status: string };

  if (!name?.trim() || !VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const ev = await db.query.event.findFirst();
  if (!ev?.rsvpsEnabled) return NextResponse.json({ error: "RSVPs not open" }, { status: 403 });

  await db.insert(rsvps).values({ name: name.trim(), status: status as typeof VALID_STATUSES[number] });
  return NextResponse.json({ ok: true });
}

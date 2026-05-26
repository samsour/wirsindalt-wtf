import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { groups, memberships, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Heatmap } from "@/components/Heatmap";
import { InviteBox } from "@/components/InviteBox";

export default async function GroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ welcome?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { slug } = await params;
  const { welcome } = await searchParams;

  const group = await db.query.groups.findFirst({ where: eq(groups.slug, slug) });
  if (!group) notFound();

  const members = await db
    .select({ id: users.id, name: users.name, image: users.image })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(eq(memberships.groupId, group.id));

  const isMember = members.some((m) => m.id === session.user!.id);
  if (!isMember) redirect(`/join/${slug}`);

  // Phase 1: mock busy data. Phase 3 will replace this with real synced blocks.
  const mockBlocks = generateMockBusyBlocks(members.map((m) => m.id));

  return (
    <div className="mx-auto max-w-[1280px] px-12 py-12">
      {welcome && <InviteBox slug={group.slug} />}

      <header className="flex items-end justify-between mb-12 pb-6 border-b border-line">
        <div>
          <h1 className="font-serif text-[44px] tracking-tight leading-none mb-2.5">
            {group.name.split(" ")[0]}{" "}
            <em className="italic">{group.name.split(" ").slice(1).join(" ") || "group"}</em>
          </h1>
          <div className="font-mono text-[11px] uppercase tracking-wider text-ink-muted flex gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-accent" />
              {members.length} member{members.length === 1 ? "" : "s"}
            </span>
            <span>vennwhen.app/g/{group.slug}</span>
          </div>
        </div>
      </header>

      <Heatmap members={members} blocks={mockBlocks} />
    </div>
  );
}

// ─── Phase 1 mock data ───
// Generates plausible busy blocks for the next 7 days so the heatmap has something to show.
function generateMockBusyBlocks(memberIds: string[]) {
  const blocks: Array<{ userId: string; startTs: number; endTs: number }> = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let day = 0; day < 7; day++) {
    const dayStart = now + day * dayMs;
    for (const uid of memberIds) {
      // Work hours: most days, 9-17
      if (day < 5) {
        blocks.push({
          userId: uid,
          startTs: dayStart + 9 * 3600 * 1000,
          endTs: dayStart + 17 * 3600 * 1000,
        });
      }
      // A few random evening conflicts
      if (Math.random() > 0.6) {
        const hour = 18 + Math.floor(Math.random() * 4);
        blocks.push({
          userId: uid,
          startTs: dayStart + hour * 3600 * 1000,
          endTs: dayStart + (hour + 2) * 3600 * 1000,
        });
      }
    }
  }
  return blocks;
}

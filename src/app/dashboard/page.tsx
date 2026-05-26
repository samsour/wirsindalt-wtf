import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { groups, memberships } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const myGroups = await db
    .select({ id: groups.id, name: groups.name, slug: groups.slug })
    .from(memberships)
    .innerJoin(groups, eq(memberships.groupId, groups.id))
    .where(eq(memberships.userId, session.user.id));

  return (
    <div className="mx-auto max-w-[900px] px-12 py-20">
      <div className="flex items-baseline justify-between mb-10 pb-6 border-b border-line">
        <div>
          <h1 className="font-serif text-[42px] tracking-tight">Your <em className="italic">groups</em></h1>
          <p className="text-ink-muted text-sm mt-1">Welcome back, {session.user.name}.</p>
        </div>
        <Link href="/groups/new" className="btn-primary">+ New group</Link>
      </div>

      {myGroups.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-line rounded-lg">
          <p className="font-serif italic text-2xl mb-2">No groups yet.</p>
          <p className="text-ink-muted mb-6">Create one to start finding overlap.</p>
          <Link href="/groups/new" className="btn-primary">Create your first group</Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {myGroups.map((g) => (
            <Link
              key={g.id}
              href={`/g/${g.slug}`}
              className="block bg-surface border border-line rounded-lg p-5 hover:border-ink transition"
            >
              <div className="font-serif text-xl font-medium tracking-tight">{g.name}</div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-ink-muted mt-1">/g/{g.slug}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import { redirect, notFound } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { db } from "@/db";
import { groups, memberships } from "@/db/schema";
import { eq, and } from "drizzle-orm";

async function joinGroup(formData: FormData) {
  "use server";
  const slug = String(formData.get("slug"));
  const session = await auth();

  if (!session?.user?.id) {
    await signIn("google", { redirectTo: `/join/${slug}` });
    return;
  }

  const group = await db.query.groups.findFirst({ where: eq(groups.slug, slug) });
  if (!group) return;

  const existing = await db.query.memberships.findFirst({
    where: and(eq(memberships.userId, session.user.id), eq(memberships.groupId, group.id)),
  });
  if (!existing) {
    await db.insert(memberships).values({ userId: session.user.id, groupId: group.id });
  }
  redirect(`/g/${slug}`);
}

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const group = await db.query.groups.findFirst({ where: eq(groups.slug, code) });
  if (!group) notFound();

  const session = await auth();

  return (
    <div className="mx-auto max-w-[480px] px-12 py-24 text-center">
      <div className="font-mono text-[11px] uppercase tracking-wider text-ink-muted mb-4">You&apos;ve been invited</div>
      <h1 className="font-serif text-[44px] tracking-tight mb-3">
        Join <em className="italic">{group.name}</em>
      </h1>
      <p className="text-ink-muted mb-10">
        Connect your Google Calendar to show your free time. We&apos;ll never see event details.
      </p>

      <form action={joinGroup}>
        <input type="hidden" name="slug" value={group.slug} />
        <button type="submit" className="btn-primary">
          {session?.user ? "Join group →" : "Sign in & join →"}
        </button>
      </form>
    </div>
  );
}

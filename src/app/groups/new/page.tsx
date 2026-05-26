import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { groups, memberships } from "@/db/schema";
import { makeSlug } from "@/lib/slug";

async function createGroup(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const name = String(formData.get("name") || "").trim();
  const horizonWeeks = Number(formData.get("horizonWeeks") || 4);
  if (!name) return;

  const slug = makeSlug(name);
  const [group] = await db.insert(groups).values({
    name,
    slug,
    ownerId: session.user.id,
    horizonWeeks,
  }).returning();

  await db.insert(memberships).values({
    userId: session.user.id,
    groupId: group.id,
  });

  redirect(`/g/${slug}?welcome=1`);
}

export default async function NewGroupPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  return (
    <div className="mx-auto max-w-[560px] px-12 py-20">
      <a href="/dashboard" className="label inline-flex items-center gap-2 mb-8">← Back</a>
      <h1 className="font-serif text-[42px] tracking-tight mb-3">
        Create a <em className="italic">group</em>
      </h1>
      <p className="text-ink-muted mb-12">Name it, pick a horizon, get a shareable link.</p>

      <form action={createGroup} className="space-y-7">
        <div>
          <label className="label block mb-2.5">Group name</label>
          <input
            name="name"
            required
            placeholder="e.g. Friday hangout"
            className="w-full px-4 py-3.5 text-base bg-surface border border-line-strong rounded-[10px] focus:outline-none focus:border-ink transition"
          />
        </div>

        <div>
          <label className="label block mb-2.5">Planning horizon</label>
          <div className="grid grid-cols-3 gap-2">
            <RadioPill name="horizonWeeks" value="1" label="This week" />
            <RadioPill name="horizonWeeks" value="4" label="Next 4 weeks" defaultChecked />
            <RadioPill name="horizonWeeks" value="8" label="Next 8 weeks" />
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <button type="submit" className="btn-primary">Create group →</button>
        </div>
      </form>
    </div>
  );
}

function RadioPill({ name, value, label, defaultChecked }: { name: string; value: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="block cursor-pointer">
      <input type="radio" name={name} value={value} defaultChecked={defaultChecked} className="peer sr-only" />
      <div className="px-3 py-3 text-center text-sm border border-line-strong rounded-[10px] bg-surface transition peer-checked:bg-ink peer-checked:text-bg peer-checked:border-ink hover:border-ink">
        {label}
      </div>
    </label>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { event, dateOptions, votes, voteSelections, rsvps } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { Toast } from "@/components/Toast";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// ─── Server actions ───

async function ensureEvent() {
  const ev = await db.query.event.findFirst();
  if (ev) return ev;
  const [created] = await db.insert(event).values({}).returning();
  return created;
}

async function saveEventDetails(formData: FormData) {
  "use server";
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL) redirect("/");

  const ev = await ensureEvent();
  await db
    .update(event)
    .set({
      name: String(formData.get("name") || "").trim() || "Abitur 2016 · 10 Jahre Treffen",
      description: String(formData.get("description") || "").trim() || null,
      location: String(formData.get("location") || "").trim() || null,
      time: String(formData.get("time") || "").trim() || null,
      rsvpsEnabled: formData.get("rsvpsEnabled") === "on",
    })
    .where(eq(event.id, ev.id));
  redirect("/dashboard?toast=event-saved");
}

async function addDateOption(formData: FormData) {
  "use server";
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL) redirect("/");

  const date = String(formData.get("date") || "").trim();
  const label = String(formData.get("label") || "").trim() || null;
  if (!date) return;

  const ev = await ensureEvent();
  const existing = await db.select({ sortOrder: dateOptions.sortOrder }).from(dateOptions).where(eq(dateOptions.eventId, ev.id));
  const nextOrder = existing.length > 0 ? Math.max(...existing.map((o) => o.sortOrder)) + 1 : 0;

  await db.insert(dateOptions).values({ eventId: ev.id, date, label, sortOrder: nextOrder });
  redirect("/dashboard?toast=date-added");
}

async function removeDateOption(formData: FormData) {
  "use server";
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL) redirect("/");

  const id = String(formData.get("id"));
  await db.delete(dateOptions).where(eq(dateOptions.id, id));
  revalidatePath("/dashboard");
}

async function setFinalDate(formData: FormData) {
  "use server";
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL) redirect("/");

  const optionId = String(formData.get("optionId") || "").trim() || null;
  const ev = await ensureEvent();
  await db.update(event).set({ finalDateOptionId: optionId }).where(eq(event.id, ev.id));
  redirect("/dashboard?toast=date-set");
}

// ─── Page ───

const TOAST_MESSAGES: Record<string, string> = {
  "event-saved": "Event-Details gespeichert",
  "date-added": "Termin hinzugefügt",
  "date-set": "Termin festgelegt",
};

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ toast?: string }> }) {
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL) redirect("/");

  const { toast } = await searchParams;
  const toastMessage = toast ? (TOAST_MESSAGES[toast] ?? null) : null;

  const ev = await db.query.event.findFirst();

  const options = ev
    ? await db
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
        .orderBy(dateOptions.sortOrder)
    : [];

  const allVoteRows = ev
    ? await db
        .select({
          id: votes.id,
          voterName: votes.voterName,
          createdAt: votes.createdAt,
          dateOptionId: voteSelections.dateOptionId,
        })
        .from(votes)
        .leftJoin(voteSelections, eq(voteSelections.voteId, votes.id))
        .orderBy(votes.createdAt)
    : [];

  const allRsvps = await db.select().from(rsvps).orderBy(rsvps.createdAt);
  const rsvpCounts = { attending: 0, maybe: 0, not_attending: 0 } as Record<string, number>;
  for (const r of allRsvps) rsvpCounts[r.status]++;

  const voterMap = new Map<string, { name: string; createdAt: Date; optionIds: string[] }>();
  for (const row of allVoteRows) {
    if (!voterMap.has(row.id)) voterMap.set(row.id, { name: row.voterName, createdAt: row.createdAt!, optionIds: [] });
    if (row.dateOptionId) voterMap.get(row.id)!.optionIds.push(row.dateOptionId);
  }
  const voters = [...voterMap.values()].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const totalVotes = voters.length;
  const maxVotes = Math.max(...options.map((o) => o.voteCount), 1);
  const sortedOptions = [...options].sort((a, b) => b.voteCount - a.voteCount);

  return (
    <div className="mx-auto max-w-[800px] px-8 py-12 space-y-10">
      <header className="flex items-start justify-between">
        <div>
          <p className="label mb-1">Admin</p>
          <h1 className="font-serif text-[38px] tracking-tight">wirsindalt<em className="italic">.wtf</em></h1>
        </div>
        <Link href="/" className="label hover:text-ink transition mt-1">← Zur Website</Link>
      </header>

      {/* Event details */}
      <section className="bg-surface border border-line rounded-xl p-6 space-y-5">
        <h2 className="font-serif text-xl tracking-tight">Event-Details</h2>
        <form action={saveEventDetails} className="space-y-4">
          <div>
            <label className="label block mb-2">Name</label>
            <input
              name="name"
              defaultValue={ev?.name ?? "Abitur 2016 · 10 Jahre Treffen"}
              className="w-full px-4 py-3 text-base bg-bg border border-line-strong rounded-[10px] focus:outline-none focus:border-ink transition"
            />
          </div>
          <div>
            <label className="label block mb-2">
              Beschreibung <span className="font-normal text-ink-faint">(optional)</span>
            </label>
            <textarea
              name="description"
              defaultValue={ev?.description ?? ""}
              rows={2}
              className="w-full px-4 py-3 text-base bg-bg border border-line-strong rounded-[10px] focus:outline-none focus:border-ink transition resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label block mb-2">
                Uhrzeit <span className="font-normal text-ink-faint">(optional)</span>
              </label>
              <input
                type="time"
                name="time"
                lang="de"
                defaultValue={ev?.time ?? ""}
                className="w-full px-4 py-3 text-base bg-bg border border-line-strong rounded-[10px] focus:outline-none focus:border-ink transition"
              />
            </div>
            <div>
              <label className="label block mb-2">
                Location <span className="font-normal text-ink-faint">(optional)</span>
              </label>
              <input
                type="text"
                name="location"
                defaultValue={ev?.location ?? ""}
                placeholder="z.B. Hausbar Berlin"
                className="w-full px-4 py-3 text-base bg-bg border border-line-strong rounded-[10px] focus:outline-none focus:border-ink transition"
              />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="rsvpsEnabled"
              defaultChecked={ev?.rsvpsEnabled ?? false}
              className="w-4 h-4 rounded border-line-strong accent-ink"
            />
            <span className="text-sm font-medium">RSVP aktivieren</span>
            <span className="text-xs text-ink-muted">(Teilnehmer können zusagen/absagen)</span>
          </label>
          <button type="submit" className="btn-secondary">Speichern</button>
        </form>
      </section>

      {/* Date options + results merged, sorted by votes */}
      <section className="bg-surface border border-line rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl tracking-tight">Terminoptionen</h2>
          {totalVotes > 0 && <span className="label">{totalVotes} Abstimmungen</span>}
        </div>

        {sortedOptions.length > 0 && (
          <div className="space-y-3">
            {sortedOptions.map((opt) => {
              const d = new Date(opt.date + "T12:00:00");
              const isWinner = ev?.finalDateOptionId === opt.id;
              const ratio = maxVotes > 0 ? opt.voteCount / maxVotes : 0;
              return (
                <div
                  key={opt.id}
                  className={`px-4 py-3.5 rounded-[10px] border transition ${isWinner ? "border-accent bg-accent-soft" : "border-line bg-bg"}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">
                        {d.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
                      </span>
                      {opt.label && <span className="text-xs text-ink-muted ml-2">{opt.label}</span>}
                      {isWinner && <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-accent">Gewählt</span>}
                    </div>
                    <span className="font-mono text-sm font-medium tabular-nums">{opt.voteCount}</span>
                    <form action={setFinalDate}>
                      <input type="hidden" name="optionId" value={isWinner ? "" : opt.id} />
                      <button
                        type="submit"
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition ${
                          isWinner
                            ? "border-accent text-accent hover:bg-accent hover:text-bg"
                            : "bg-ink text-bg border-ink hover:bg-ink/80"
                        }`}
                      >
                        {isWinner ? "Abwählen" : "Als Termin wählen ✓"}
                      </button>
                    </form>
                    <form action={removeDateOption}>
                      <input type="hidden" name="id" value={opt.id} />
                      <button type="submit" className="text-xs text-ink-faint hover:text-ink transition px-1">✕</button>
                    </form>
                  </div>
                  <div className="h-1.5 bg-line rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isWinner ? "bg-accent" : "bg-ink/30"}`}
                      style={{ width: `${ratio * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <form action={addDateOption} className="flex gap-3 items-end pt-1">
          <div className="flex-1">
            <label className="label block mb-2">Datum hinzufügen</label>
            <input
              type="date"
              name="date"
              required
              className="w-full px-4 py-3 text-base bg-bg border border-line-strong rounded-[10px] focus:outline-none focus:border-ink transition"
            />
          </div>
          <div className="flex-1">
            <label className="label block mb-2">
              Label <span className="font-normal text-ink-faint">(optional)</span>
            </label>
            <input
              type="text"
              name="label"
              placeholder="z.B. Pfingstsamstag"
              className="w-full px-4 py-3 text-base bg-bg border border-line-strong rounded-[10px] focus:outline-none focus:border-ink transition"
            />
          </div>
          <button type="submit" className="btn-primary whitespace-nowrap">+ Hinzufügen</button>
        </form>
      </section>

      {/* RSVP list */}
      {allRsvps.length > 0 && (
        <section className="bg-surface border border-line rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl tracking-tight">RSVPs</h2>
            <span className="label">
              {rsvpCounts.attending} dabei · {rsvpCounts.maybe} vielleicht · {rsvpCounts.not_attending} nicht dabei
            </span>
          </div>
          <div className="divide-y divide-line">
            {allRsvps.map((r) => (
              <div key={r.id} className="flex items-center gap-4 py-2.5 first:pt-0 last:pb-0">
                <div className="w-7 h-7 rounded-full bg-accent-soft text-accent flex items-center justify-center text-xs font-medium flex-shrink-0">
                  {r.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-sm font-medium flex-1">{r.name}</span>
                <span className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  r.status === "attending" ? "bg-accent-soft text-accent" :
                  r.status === "maybe" ? "bg-warm-soft text-warm" :
                  "bg-line text-ink-muted"
                }`}>
                  {r.status === "attending" ? "Dabei" : r.status === "maybe" ? "Vielleicht" : "Nicht dabei"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Voter list */}
      {voters.length > 0 && (
        <section className="bg-surface border border-line rounded-xl p-6 space-y-4">
          <h2 className="font-serif text-xl tracking-tight">Wer hat abgestimmt</h2>
          <div className="divide-y divide-line">
            {voters.map((v, i) => (
              <div key={i} className="flex items-start gap-4 py-3 first:pt-0 last:pb-0">
                <div className="w-7 h-7 rounded-full bg-accent-soft text-accent flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                  {v.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{v.name}</div>
                  <div className="text-xs text-ink-muted mt-0.5">
                    {v.optionIds
                      .map((id) => {
                        const opt = options.find((o) => o.id === id);
                        if (!opt) return null;
                        return new Date(opt.date + "T12:00:00").toLocaleDateString("de-DE", { day: "numeric", month: "short" });
                      })
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                <span className="text-[11px] text-ink-faint whitespace-nowrap">
                  {v.createdAt.toLocaleString("de-DE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
      <Toast message={toastMessage} />
    </div>
  );
}

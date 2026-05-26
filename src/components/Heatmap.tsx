"use client";

import { Fragment, useMemo, useState } from "react";
import { computeOverlap, findCandidates, SLOT_MS } from "@/lib/overlap";

type Member = { id: string; name: string | null; image: string | null };
type Block = { userId: string; startTs: number; endTs: number };

export function Heatmap({ members, blocks }: { members: Member[]; blocks: Block[] }) {
  // 7-day window starting today, displayed as a day×hour grid
  const windowStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);
  const days = 7;
  const hoursPerDay = 14; // 9 AM → 11 PM (2-hour blocks for display density)
  const startHour = 9;
  const displayStep = 2 * 3600 * 1000; // each visible cell = 2 hours

  const slots = useMemo(
    () => computeOverlap(blocks, members.map((m) => m.id), windowStart, windowStart + days * 24 * 3600 * 1000),
    [blocks, members, windowStart]
  );

  // Reduce 30-min slots → 2-hour display cells by taking the minimum free count
  // (a cell is only as "free" as its most-conflicted half hour)
  const cells = useMemo(() => {
    const slotsPerCell = displayStep / SLOT_MS;
    const result: Array<{ startTs: number; freeCount: number; free: string[]; busy: string[] }> = [];
    for (let i = 0; i < slots.length; i += slotsPerCell) {
      const group = slots.slice(i, i + slotsPerCell);
      const minSlot = group.reduce((min, s) => (s.freeUserIds.length < min.freeUserIds.length ? s : min), group[0]);
      result.push({
        startTs: group[0].startTs,
        freeCount: minSlot.freeUserIds.length,
        free: minSlot.freeUserIds,
        busy: minSlot.busyUserIds,
      });
    }
    return result;
  }, [slots]);

  const suggestions = useMemo(
    () => findCandidates(slots, members.length, { limit: 4, minFreeRatio: 0.6 }),
    [slots, members.length]
  );

  const [selected, setSelected] = useState<number | null>(null);

  const colorFor = (count: number) => {
    const ratio = members.length === 0 ? 0 : count / members.length;
    if (ratio === 0) return "bg-heat-0";
    if (ratio < 0.25) return "bg-heat-1";
    if (ratio < 0.5) return "bg-heat-2";
    if (ratio < 0.75) return "bg-heat-3";
    if (ratio < 1) return "bg-heat-4";
    return "bg-heat-5";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-start">
      {/* Heatmap */}
      <div className="bg-surface border border-line rounded-lg p-7">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-serif font-medium text-xl tracking-tight">Overlap this week</h2>
          <div className="flex items-center gap-2 label">
            <span>Busy</span>
            <div className="flex gap-0.5">
              {[0, 1, 2, 3, 4, 5].map((v) => (
                <span key={v} className={`block w-3.5 h-3.5 rounded-sm ${colorFor((v / 5) * members.length)}`} />
              ))}
            </div>
            <span>All free</span>
          </div>
        </div>

        <div className="grid gap-1" style={{ gridTemplateColumns: "48px repeat(7, 1fr)" }}>
          <div />
          {Array.from({ length: days }).map((_, di) => {
            const d = new Date(windowStart + di * 24 * 3600 * 1000);
            return (
              <div key={di} className="text-center label pb-2">
                {d.toLocaleDateString("en-US", { weekday: "short" })}
                <span className="block font-serif italic text-lg text-ink mt-0.5 normal-case tracking-normal">
                  {d.getDate()}
                </span>
              </div>
            );
          })}

          {Array.from({ length: hoursPerDay / 2 }).map((_, hi) => {
            const hour = startHour + hi * 2;
            return (
              <Fragment key={`row-${hi}`}>
                <div className="text-right pr-2 font-mono text-[10px] text-ink-faint self-center h-8 leading-8">
                  {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </div>
                {Array.from({ length: days }).map((_, di) => {
                  const idx = di * (24 * 3600 * 1000 / displayStep) + (hour * 3600 * 1000) / displayStep;
                  const cell = cells[Math.floor(idx)];
                  if (!cell) return <div key={`c-${hi}-${di}`} className="h-8" />;
                  const isSelected = selected === Math.floor(idx);
                  return (
                    <button
                      key={`c-${hi}-${di}`}
                      onClick={() => setSelected(Math.floor(idx))}
                      title={`${cell.freeCount} of ${members.length} free`}
                      className={`h-8 rounded-[4px] transition-transform hover:scale-[1.06] hover:outline hover:outline-[1.5px] hover:outline-ink ${colorFor(cell.freeCount)} ${isSelected ? "outline outline-2 outline-ink" : ""}`}
                    />
                  );
                })}
              </Fragment>
            );
          })}
        </div>
      </div>

      {/* Sidebar */}
      <aside className="flex flex-col gap-6">
        {selected !== null && cells[selected] && (
          <div className="bg-ink text-bg rounded-lg p-5">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-white/50 mb-3">Selected slot</h3>
            <div className="font-serif text-xl mb-2">
              {new Date(cells[selected].startTs).toLocaleString("en-US", { weekday: "long" })}{" "}
              <em className="italic text-accent-mid">
                at {new Date(cells[selected].startTs).toLocaleTimeString("en-US", { hour: "numeric" })}
              </em>
            </div>
            <div className="text-sm text-white/70 mb-4">
              {cells[selected].freeCount} of {members.length} free
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/40 mb-1.5">Free</div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {cells[selected].free.map((uid) => (
                <span key={uid} className="bg-white/10 px-2.5 py-1 rounded-full text-xs">
                  {members.find((m) => m.id === uid)?.name || "Member"}
                </span>
              ))}
            </div>
            {cells[selected].busy.length > 0 && (
              <>
                <div className="font-mono text-[10px] uppercase tracking-wider text-white/40 mb-1.5">Busy</div>
                <div className="flex flex-wrap gap-1.5">
                  {cells[selected].busy.map((uid) => (
                    <span key={uid} className="border border-white/20 text-white/50 line-through px-2.5 py-1 rounded-full text-xs">
                      {members.find((m) => m.id === uid)?.name || "Member"}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="bg-surface border border-line rounded-lg p-5">
          <h3 className="label mb-4">Top suggestions</h3>
          {suggestions.length === 0 ? (
            <p className="text-sm text-ink-muted">No overlap found yet — wait for more members to sync.</p>
          ) : (
            suggestions.map((s, i) => (
              <div key={i} className="py-3.5 border-b border-line last:border-0 first:pt-0 last:pb-0">
                <div className="font-serif font-medium text-[17px] tracking-tight mb-1">
                  {new Date(s.startTs).toLocaleDateString("en-US", { weekday: "long" })},{" "}
                  {new Date(s.startTs).toLocaleTimeString("en-US", { hour: "numeric" })} – {new Date(s.endTs).toLocaleTimeString("en-US", { hour: "numeric" })}
                </div>
                <div className="text-xs text-ink-muted flex items-center gap-2">
                  <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full ${s.freeCount === members.length ? "bg-accent-soft text-accent" : "bg-warm-soft text-warm"}`}>
                    {s.freeCount} / {members.length}
                  </span>
                  {s.busyUserIds.length > 0 && (
                    <span>
                      {s.busyUserIds.map((uid) => members.find((m) => m.id === uid)?.name || "?").join(", ")} busy
                    </span>
                  )}
                  {s.busyUserIds.length === 0 && <span>everyone&apos;s in</span>}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-surface border border-line rounded-lg p-5">
          <h3 className="label mb-4">Members · {members.length}</h3>
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0 first:pt-0">
              <div className="w-7 h-7 rounded-full bg-accent-soft text-accent flex items-center justify-center text-xs font-medium">
                {(m.name || "?").slice(0, 2).toUpperCase()}
              </div>
              <span className="text-sm font-medium flex-1">{m.name || "Member"}</span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">Mock</span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

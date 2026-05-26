/**
 * Time-overlap engine.
 *
 * Given a set of users' busy blocks and a time window, slice the window into
 * fixed-size slots (e.g. 30 minutes) and compute how many users are free in
 * each slot. This drives both the heatmap and the top-suggestions list.
 */

export type BusyBlock = { userId: string; startTs: number; endTs: number };
export type Slot = { startTs: number; endTs: number; freeUserIds: string[]; busyUserIds: string[] };

export const SLOT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Compute slot-by-slot overlap.
 *
 * Returns one entry per slot in [windowStart, windowEnd), telling us which
 * users are free vs busy in that slot.
 */
export function computeOverlap(
  blocks: BusyBlock[],
  memberIds: string[],
  windowStart: number,
  windowEnd: number,
  slotMs: number = SLOT_MS
): Slot[] {
  // Group blocks by user for fast lookup
  const byUser = new Map<string, BusyBlock[]>();
  for (const b of blocks) {
    if (!byUser.has(b.userId)) byUser.set(b.userId, []);
    byUser.get(b.userId)!.push(b);
  }

  const slots: Slot[] = [];
  for (let t = windowStart; t < windowEnd; t += slotMs) {
    const slotEnd = t + slotMs;
    const free: string[] = [];
    const busy: string[] = [];
    for (const uid of memberIds) {
      const userBlocks = byUser.get(uid) || [];
      // A user is busy in this slot if ANY of their blocks overlaps it.
      // Overlap test: block.start < slotEnd AND block.end > slotStart
      const isBusy = userBlocks.some((b) => b.startTs < slotEnd && b.endTs > t);
      (isBusy ? busy : free).push(uid);
    }
    slots.push({ startTs: t, endTs: slotEnd, freeUserIds: free, busyUserIds: busy });
  }
  return slots;
}

/**
 * Find contiguous candidate windows.
 *
 * A "suggestion" is the longest contiguous stretch where at least `minFree`
 * members are free. Returns top N candidates ranked by:
 *   1. Number of free members (more = better)
 *   2. Duration (longer = better)
 *
 * @param minFreeRatio  e.g. 0.6 = at least 60% of members free
 * @param minDurationMs minimum slot length to surface (e.g. 90 min)
 */
export function findCandidates(
  slots: Slot[],
  memberCount: number,
  opts: { minFreeRatio?: number; minDurationMs?: number; limit?: number } = {}
): Array<{ startTs: number; endTs: number; freeCount: number; busyUserIds: string[] }> {
  const minFreeRatio = opts.minFreeRatio ?? 0.6;
  const minDuration = opts.minDurationMs ?? 90 * 60 * 1000;
  const limit = opts.limit ?? 5;
  const minFree = Math.ceil(memberCount * minFreeRatio);

  // Build runs of consecutive slots with the same free-set
  const runs: Array<{ startTs: number; endTs: number; freeUserIds: string[]; busyUserIds: string[] }> = [];
  let cur: (typeof runs)[number] | null = null;

  for (const slot of slots) {
    if (slot.freeUserIds.length < minFree) {
      cur = null;
      continue;
    }
    // Continue the run only if the SAME people are free (so a suggestion
    // doesn't span a slot where membership flipped).
    if (cur && setsEqual(cur.freeUserIds, slot.freeUserIds) && cur.endTs === slot.startTs) {
      cur.endTs = slot.endTs;
    } else {
      cur = { startTs: slot.startTs, endTs: slot.endTs, freeUserIds: [...slot.freeUserIds], busyUserIds: [...slot.busyUserIds] };
      runs.push(cur);
    }
  }

  return runs
    .filter((r) => r.endTs - r.startTs >= minDuration)
    .map((r) => ({
      startTs: r.startTs,
      endTs: r.endTs,
      freeCount: r.freeUserIds.length,
      busyUserIds: r.busyUserIds,
    }))
    .sort((a, b) => {
      if (b.freeCount !== a.freeCount) return b.freeCount - a.freeCount;
      return (b.endTs - b.startTs) - (a.endTs - a.startTs);
    })
    .slice(0, limit);
}

function setsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = new Set(a);
  for (const x of b) if (!sa.has(x)) return false;
  return true;
}

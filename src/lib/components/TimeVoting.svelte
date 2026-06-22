<script lang="ts">
  import { TIME_SLOTS, FINAL_TIME } from '$lib/dates';

  const finalTime = FINAL_TIME;

  let { timeCounts, myTimeVotes, votingTimeKey, dateLabel = '', oncastvote, afterHero }: {
    timeCounts: Record<string, { yes: number; maybe: number; no: number }>;
    myTimeVotes: Record<string, string>;
    votingTimeKey: string | null;
    dateLabel?: string;
    oncastvote: (slotKey: string, vote: string) => void;
    afterHero?: import('svelte').Snippet;
  } = $props();

  // Slot with the broadest support (yes + maybe*0.5), only once anyone has voted.
  let leader = $derived.by(() => {
    let best: string | null = null;
    let bestScore = 0;
    for (const s of TIME_SLOTS) {
      const c = timeCounts[s.key] ?? { yes: 0, maybe: 0, no: 0 };
      const score = c.yes + c.maybe * 0.5;
      if (score > bestScore) { bestScore = score; best = s.key; }
    }
    return best;
  });
</script>

<div class="hero">
  <div class="eyebrow">{finalTime ? 'Termin & Uhrzeit stehen 🎉' : 'Termin steht. Fehlt nur die Zeit.'}</div>
  <h1>Wann <em>geht's los?</em></h1>
  {#if finalTime}
    <p class="hero-sub">Danke fürs Mitvoten! Wie lange gefeiert wird, hängt noch von der Location ab.</p>
    <div class="winner-card">
      <div class="winner-eyebrow">🎉 Die Uhrzeit steht fest</div>
      <div class="winner-date">{finalTime}</div>
    </div>
  {:else}
    <p class="hero-sub">Erstmal nur die ungefähre Startzeit{dateLabel ? ` am ${dateLabel}` : ''}. Wie lange dann gefeiert wird, hängt noch von der Location ab. Im Idealfall bis open-end. Stimm bei jeder Uhrzeit ab: passt, egal, oder nope (mehrere „passt" sind okay).</p>
  {/if}
</div>

{@render afterHero?.()}

<div class="section time-vote">

  {#each TIME_SLOTS as s}
    {@const c = timeCounts[s.key] ?? { yes: 0, maybe: 0, no: 0 }}
    {@const total = c.yes + c.maybe + c.no || 1}
    {@const mv = myTimeVotes[s.key]}
    <div class="slot-card" class:voted-yes={mv === 'yes'} class:voted-maybe={mv === 'maybe'} class:voted-no={mv === 'no'}>
      {#if s.key === leader}<span class="top-badge">🔥</span>{/if}
      <div class="slot-head">
        <span class="slot-emoji">{s.emoji}</span>
        <div>
          <div class="slot-label">{s.label}</div>
          <div class="slot-sub">{s.sub}</div>
        </div>
      </div>
      <div class="vote-bar">
        <div class="vote-bar-yes" style="width:{Math.round(c.yes/total*100)}%"></div>
        <div class="vote-bar-maybe" style="width:{Math.round(c.maybe/total*100)}%"></div>
        <div class="vote-bar-no" style="width:{Math.round(c.no/total*100)}%"></div>
      </div>
      <div class="vote-count">{c.yes} ✓ · {c.maybe} ~ · {c.no} ✗</div>
      <div class="vote-actions">
        <button class="vbtn yes"   class:active={mv === 'yes'}   disabled={!!finalTime || votingTimeKey === s.key} onclick={() => oncastvote(s.key, 'yes')}>✓ Passt</button>
        <button class="vbtn maybe" class:active={mv === 'maybe'} disabled={!!finalTime || votingTimeKey === s.key} onclick={() => oncastvote(s.key, 'maybe')}>~ Egal</button>
        <button class="vbtn no"    class:active={mv === 'no'}    disabled={!!finalTime || votingTimeKey === s.key} onclick={() => oncastvote(s.key, 'no')}>✗ Nope</button>
      </div>
    </div>
  {/each}
</div>

<style>

  .winner-card { margin-top: 1.25rem; background: color-mix(in srgb, var(--green) 12%, var(--surface)); border: 1.5px solid var(--green); border-radius: 16px; padding: 1.25rem 1.5rem; text-align: center; }
  .winner-eyebrow { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: var(--green); margin-bottom: .4rem; }
  .winner-date { font-family: var(--serif); font-size: 1.75rem; color: var(--ink); line-height: 1.1; }

  .slot-card { background: var(--surface); border: 1.5px solid var(--border); border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: .75rem; position: relative; overflow: hidden; transition: border-color .15s; }
  .slot-card.voted-yes { border-color: var(--green); background: color-mix(in srgb, var(--green) 8%, var(--surface)); }
  .slot-card.voted-maybe { border-color: var(--maybe); background: color-mix(in srgb, var(--maybe) 8%, var(--surface)); }
  .slot-card.voted-no { border-color: var(--border); opacity: .6; }
  .top-badge { position: absolute; top: 8px; right: 10px; font-size: 14px; }

  .slot-head { display: flex; align-items: center; gap: .75rem; }
  .slot-emoji { font-size: 1.6rem; flex-shrink: 0; }
  .slot-label { font-family: var(--serif); font-size: 1.2rem; color: var(--ink); line-height: 1.1; }
  .slot-sub { font-size: 12px; color: var(--ink3); margin-top: 1px; }

  .vote-bar { height: 5px; background: var(--muted); border-radius: 3px; margin: .8rem 0 .4rem; overflow: hidden; display: flex; }
  .vote-bar-yes   { height: 100%; background: var(--green); transition: width .4s; }
  .vote-bar-maybe { height: 100%; background: var(--maybe); transition: width .4s; }
  .vote-bar-no    { height: 100%; background: var(--red);   transition: width .4s; opacity: .6; }
  .vote-count { font-size: 11px; color: var(--ink3); margin-bottom: .6rem; }

  .vote-actions { display: flex; gap: 6px; }
  .vbtn { flex: 1; padding: 7px 3px; border: 1px solid var(--border); border-radius: 7px; background: none; cursor: pointer; font-size: 12px; font-family: var(--sans); color: var(--ink2); transition: all .12s; }
  .vbtn:disabled { opacity: .5; cursor: not-allowed; }
  .vbtn:active:not(:disabled) { transform: scale(.94); transition: transform .08s; }
  .vbtn.yes.active, .vbtn.yes:not(:disabled):hover { background: color-mix(in srgb, var(--green) 14%, transparent); color: var(--green); border-color: var(--green); }
  .vbtn.maybe.active, .vbtn.maybe:not(:disabled):hover { background: color-mix(in srgb, var(--maybe) 14%, transparent); color: var(--maybe); border-color: var(--maybe); }
  .vbtn.no.active, .vbtn.no:not(:disabled):hover { background: color-mix(in srgb, var(--red) 14%, transparent); color: var(--red); border-color: var(--red); }
</style>

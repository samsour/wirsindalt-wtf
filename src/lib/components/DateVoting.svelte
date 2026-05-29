<script lang="ts">
  import { DATES } from '$lib/dates';

  let { voteCounts, myVotes, voteLeader, votingKey, myVoteCount, oncastvote }: {
    voteCounts: Record<string, { yes: number; maybe: number; no: number }>;
    myVotes: Record<string, string>;
    voteLeader: string | undefined;
    votingKey: string | null;
    myVoteCount: number;
    oncastvote: (dateKey: string, vote: string) => void;
  } = $props();

  const byMonth = DATES.reduce((acc, d) => {
    (acc[d.month] ||= []).push(d);
    return acc;
  }, {} as Record<string, typeof DATES>);
</script>

<div class="hero">
  <div class="eyebrow">10 Jahre Abi 2016. uff</div>
  <h1>Wann feiern wir <em>zusammen?</em></h1>
  <p class="hero-sub">Stimme für alle Wochenenden, die dir passen.<br />Wir finden erstmal nen Termin.</p>
</div>

<div class="section">
  {#each Object.entries(byMonth) as [month, ds]}
    <div class="date-week">
      <div class="week-label">{month}</div>
      <div class="date-row">
        {#each ds as d}
          {@const c = voteCounts[d.key] ?? { yes: 0, maybe: 0, no: 0 }}
          {@const total = c.yes + c.maybe + c.no || 1}
          {@const mv = myVotes[d.key]}
          <div class="date-card" class:voted-yes={mv === 'yes'} class:voted-maybe={mv === 'maybe'} class:voted-no={mv === 'no'}>
            {#if d.key === voteLeader}<span class="top-badge">🔥 Favorit</span>{/if}
            <div class="date-top">
              <div>
                <div class="date-day">{d.label.split('–')[0].trim()}</div>
                <div class="date-month">{d.label} · Fr–Sa</div>
              </div>
            </div>
            <div class="vote-bar">
              <div class="vote-bar-yes" style="width:{Math.round(c.yes/total*100)}%"></div>
            </div>
            <div class="vote-count">{c.yes} ✓ · {c.maybe} ~ · {c.no} ✗</div>
            <div class="vote-actions">
              <button class="vbtn yes" class:active={mv === 'yes'} disabled={votingKey === d.key} onclick={() => oncastvote(d.key, 'yes')}>✓ Ja</button>
              <button class="vbtn maybe" class:active={mv === 'maybe'} disabled={votingKey === d.key} onclick={() => oncastvote(d.key, 'maybe')}>~ Vielleicht</button>
              <button class="vbtn no" class:active={mv === 'no'} disabled={votingKey === d.key} onclick={() => oncastvote(d.key, 'no')}>✗ Nein</button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/each}

  {#if Object.keys(voteCounts).length}
    <div class="results-panel">
      <h3>Aktuelle Ergebnisse</h3>
      {#each [...DATES].sort((a, b) => (voteCounts[b.key]?.yes ?? 0) - (voteCounts[a.key]?.yes ?? 0)).slice(0, 5) as d}
        {@const yes = voteCounts[d.key]?.yes ?? 0}
        {@const max = Math.max(...DATES.map(x => voteCounts[x.key]?.yes ?? 0), 1)}
        <div class="result-row">
          <span class="result-label">{d.label}</span>
          <div class="result-track"><div class="result-fill" style="width:{Math.round(yes/max*100)}%"></div></div>
          <span class="result-num">{yes}</span>
        </div>
      {/each}
    </div>
  {/if}

  <div class="vote-stat">
    <div class="stat-pill"><span class="sn">{myVoteCount}</span><span class="sl">meine Stimmen</span></div>
  </div>
</div>

<style>
  .vote-intro { background: #fff; border: 1px solid var(--border); border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 2rem; display: flex; align-items: center; gap: 1rem; font-size: 14px; color: var(--ink2); line-height: 1.6; }
  .vote-intro strong { color: var(--ink); }
  .date-week { margin-bottom: 1.5rem; }
  .week-label { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--ink3); font-weight: 500; margin-bottom: .75rem; }
  .date-row { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
  .date-card { background: #fff; border: 1.5px solid var(--border); border-radius: 12px; padding: 1rem 1.25rem; position: relative; overflow: hidden; transition: border-color .15s; }
  .date-card.voted-yes { border-color: var(--green); background: #f4faf5; }
  .date-card.voted-maybe { border-color: var(--maybe); background: #fffdf0; }
  .date-card.voted-no { border-color: #ddd; opacity: .55; }
  .top-badge { position: absolute; top: 8px; right: 8px; font-size: 10px; padding: 2px 8px; background: #fff3e0; color: #b86000; border-radius: 100px; font-weight: 500; border: 1px solid #f0c060; }
  .date-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: .6rem; }
  .date-day { font-family: var(--serif); font-size: 1.5rem; color: var(--ink); line-height: 1; }
  .date-month { font-size: 11px; color: var(--ink3); margin-top: 2px; }
  .vote-bar { height: 4px; background: #eee; border-radius: 2px; margin: .75rem 0 .4rem; overflow: hidden; }
  .vote-bar-yes { height: 100%; background: var(--green); border-radius: 2px; transition: width .4s; }
  .vote-count { font-size: 11px; color: var(--ink3); margin-bottom: .6rem; }
  .vote-actions { display: flex; gap: 5px; }
  .vbtn { flex: 1; padding: 5px 3px; border: 1px solid var(--border); border-radius: 6px; background: none; cursor: pointer; font-size: 11px; font-family: var(--sans); color: var(--ink2); transition: all .12s; }
  .vbtn:disabled { opacity: .5; cursor: not-allowed; }
  .vbtn.yes.active, .vbtn.yes:not(:disabled):hover { background: #e8f5e9; color: var(--green); border-color: var(--green); }
  .vbtn.maybe.active, .vbtn.maybe:not(:disabled):hover { background: #fffde7; color: var(--maybe); border-color: #c8a400; }
  .vbtn.no.active, .vbtn.no:not(:disabled):hover { background: #fdecea; color: var(--red); border-color: var(--red); }
  .results-panel { background: #fff; border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem 1.5rem; margin-top: 2rem; }
  .results-panel h3 { font-family: var(--serif); font-size: 1.1rem; margin-bottom: 1rem; }
  .result-row { display: flex; align-items: center; gap: 10px; margin-bottom: .5rem; font-size: 13px; }
  .result-label { width: 110px; color: var(--ink2); flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .result-track { flex: 1; height: 7px; background: #eee; border-radius: 4px; overflow: hidden; }
  .result-fill { height: 100%; background: var(--accent); border-radius: 4px; transition: width .5s; }
  .result-num { font-size: 12px; color: var(--ink3); min-width: 24px; text-align: right; }
  .vote-stat { padding-top: 1.5rem; margin-top: 1rem; border-top: 1px solid var(--border); }
  @media (max-width: 500px) { .date-row { grid-template-columns: 1fr; } }
</style>

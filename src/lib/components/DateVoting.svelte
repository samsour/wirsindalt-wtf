<script lang="ts">
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import { DATES } from '$lib/dates';

  let showSepHint = $state(false);

  onMount(() => {
    if (!localStorage.getItem('abi2016_sep_hint_seen')) showSepHint = true;
  });

  function dismissSepHint() {
    showSepHint = false;
    localStorage.setItem('abi2016_sep_hint_seen', '1');
  }

  let { voteCounts, myVotes, voteLeader, votingKey, userName = '', uniqueVoters = 0, totalUsers = 0, voteDeadline = null, oncastvote }: {
    voteCounts: Record<string, { yes: number; maybe: number; no: number }>;
    myVotes: Record<string, string>;
    voteLeader: string | undefined;
    votingKey: string | null;
    userName?: string;
    uniqueVoters?: number;
    totalUsers?: number;
    voteDeadline?: string | null;
    oncastvote: (dateKey: string, vote: string) => void;
  } = $props();

  let now = $state(Date.now());
  onMount(() => {
    const t = setInterval(() => (now = Date.now()), 60_000);
    return () => clearInterval(t);
  });

  let countdown = $derived.by(() => {
    if (!voteDeadline) return null;
    const diff = new Date(voteDeadline).getTime() + 86_400_000 - now; // end of deadline day
    if (diff <= 0) return { expired: true, days: 0, hours: 0 };
    const days = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff % 86_400_000) / 3_600_000);
    return { expired: false, days, hours };
  });

  let myYes   = $derived(Object.values(myVotes).filter(v => v === 'yes').length);
  let myMaybe = $derived(Object.values(myVotes).filter(v => v === 'maybe').length);
  let myNo    = $derived(Object.values(myVotes).filter(v => v === 'no').length);

  // Group by month, then by weekend within each month
  const byMonth = DATES.reduce((acc, d) => {
    if (!acc[d.month]) acc[d.month] = {};
    (acc[d.month][d.weekend] ||= []).push(d);
    return acc;
  }, {} as Record<string, Record<string, typeof DATES>>);

  let manualCollapsed = $state(new Set<string>());
  let manualExpanded  = $state(new Set<string>());

  function isCollapsed(label: string, days: typeof DATES): boolean {
    if (manualExpanded.has(label)) return false;
    if (manualCollapsed.has(label)) return true;
    return days.filter(d => !(d as any).isQuestion).every(d => myVotes[d.key] === 'no');
  }

  function toggle(label: string, days: typeof DATES) {
    if (isCollapsed(label, days)) {
      const me = new Set(manualExpanded); me.add(label);
      const mc = new Set(manualCollapsed); mc.delete(label);
      manualExpanded = me; manualCollapsed = mc;
    } else {
      const mc = new Set(manualCollapsed); mc.add(label);
      const me = new Set(manualExpanded); me.delete(label);
      manualCollapsed = mc; manualExpanded = me;
    }
  }
</script>

<div class="hero">
  <div class="eyebrow">10 Jahre. uff.</div>
  <h1>Wann passt's dir, <em>{userName}?</em></h1>
  <p class="hero-sub">Klick einfach bei jedem Wochenende an ob du kannst: ja, vielleicht, oder nope. Mehrfach erlaubt.</p>
  {#if countdown}
    {#if countdown.expired}
      <div class="deadline-badge expired">Abstimmung beendet</div>
    {:else if countdown.days === 0}
      <div class="deadline-badge urgent">Heute ist der letzte Tag! ⏰</div>
    {:else}
      <div class="deadline-badge">
        ⏳ Noch {countdown.days} {countdown.days === 1 ? 'Tag' : 'Tage'}{countdown.hours > 0 ? ` und ${countdown.hours} Std.` : ''} zum Abstimmen
      </div>
    {/if}
  {/if}
</div>

<div class="section">
  {#if showSepHint}
    <div class="sep-hint">
      <span>🎉 Neu: September ist jetzt auch dabei!</span>
      <button onclick={dismissSepHint}>✕</button>
    </div>
  {/if}

  {#if Object.keys(voteCounts).length}
    {@const scored = [...DATES]
      .filter(d => !d.isQuestion)
      .map(d => {
        const c = voteCounts[d.key] ?? { yes: 0, maybe: 0, no: 0 };
        return { ...d, yes: c.yes, maybe: c.maybe, no: c.no, score: c.yes + c.maybe * 0.5 };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)}
    {@const maxScore = Math.max(...scored.map(d => d.score), 1)}
    <div class="results-panel">
      <div class="results-header">
        <h3>Stand der Dinge 🗳️ {#if totalUsers > 0}<span class="voter-count">{uniqueVoters} von {totalUsers} abgestimmt</span>{:else if uniqueVoters > 0}<span class="voter-count">{uniqueVoters} dabei</span>{/if}</h3>
        <span class="results-legend">
          <span class="leg-yes"></span> Ja &nbsp;
          <span class="leg-maybe"></span> Vielleicht &nbsp;
          <span class="leg-no"></span> Nein
        </span>
      </div>
      {#each scored as d, i}
        {@const yesW = Math.round(d.yes / maxScore * 100)}
        {@const maybeW = Math.round(d.maybe * 0.5 / maxScore * 100)}
        <div class="result-row" class:top-one={i === 0}>
          <span class="result-rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
          <span class="result-label">{d.label}</span>
          <div class="result-track">
            <div class="result-fill-yes" style="width:{yesW}%"></div>
            <div class="result-fill-maybe" style="width:{maybeW}%"></div>
          </div>
          <span class="result-num">
            {#if d.yes > 0}<span class="num-yes">{d.yes} ✓</span>{/if}
            {#if d.maybe > 0}<span class="num-maybe">{d.maybe} ~</span>{/if}
            {#if d.no > 0}<span class="num-no">{d.no} ✗</span>{/if}
          </span>
        </div>
      {/each}
    </div>
  {/if}

  {#each Object.entries(byMonth) as [month, weekends]}
    <div class="date-month-group">
      <div class="month-label">{month}</div>
      {#each Object.entries(weekends) as [weekendLabel, days]}
        {@const isQuestion = days[0]?.isQuestion}
        {#if isQuestion}
          {@const d = days[0]}
          {@const c = voteCounts[d.key] ?? { yes: 0, maybe: 0, no: 0 }}
          {@const mv = myVotes[d.key]}
          <div class="question-card" class:voted-yes={mv === 'yes'} class:voted-maybe={mv === 'maybe'} class:voted-no={mv === 'no'}>
            <div class="question-text">September auch ne Option?</div>
            <div class="question-sub">Braucht ihr noch mehr Termine?</div>
            <div class="vote-count" style="margin:.5rem 0">{c.yes} dafür · {c.maybe} vielleicht · {c.no} nope</div>
            <div class="vote-actions">
              <button class="vbtn yes" class:active={mv === 'yes'} disabled={votingKey === d.key} onclick={() => oncastvote(d.key, 'yes')}>✓ Ja, gerne</button>
              <button class="vbtn maybe" class:active={mv === 'maybe'} disabled={votingKey === d.key} onclick={() => oncastvote(d.key, 'maybe')}>~ Egal</button>
              <button class="vbtn no" class:active={mv === 'no'} disabled={votingKey === d.key} onclick={() => oncastvote(d.key, 'no')}>✗ Zu spät</button>
            </div>
          </div>
        {:else}
          <div class="date-week">
            <button class="week-label" onclick={() => toggle(weekendLabel, days)}>
              {weekendLabel}
              <svg class="week-arrow" class:open={!isCollapsed(weekendLabel, days)} width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="2,4 6,8 10,4"/>
              </svg>
            </button>
            {#if !isCollapsed(weekendLabel, days)}
            <div class="date-row" transition:slide={{ duration: 220 }}>
              {#each days as d}
                {@const c = voteCounts[d.key] ?? { yes: 0, maybe: 0, no: 0 }}
                {@const total = c.yes + c.maybe + c.no || 1}
                {@const mv = myVotes[d.key]}
                <div class="date-card" class:voted-yes={mv === 'yes'} class:voted-maybe={mv === 'maybe'} class:voted-no={mv === 'no'}>
                  {#if d.key === voteLeader}<span class="top-badge">🔥</span>{/if}
                  <div class="date-day">{d.day}</div>
                  <div class="date-month">{d.label}</div>
                  <div class="vote-bar">
                    <div class="vote-bar-yes" style="width:{Math.round(c.yes/total*100)}%"></div>
                    <div class="vote-bar-maybe" style="width:{Math.round(c.maybe/total*100)}%"></div>
                    <div class="vote-bar-no" style="width:{Math.round(c.no/total*100)}%"></div>
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
            {/if}
          </div>
        {/if}
      {/each}
    </div>
  {/each}

  <div class="my-votes-card">
    <div class="my-votes-title">Deine Stimmen</div>
    <div class="my-votes-row">
      {#if myYes === 0 && myMaybe === 0 && myNo === 0}
        <span class="my-votes-empty">Noch keine Stimmen abgegeben</span>
      {:else}
        {#if myYes > 0}
          <div class="my-vote-pill yes"><span>{myYes}</span> ✓ Ja</div>
        {/if}
        {#if myMaybe > 0}
          <div class="my-vote-pill maybe"><span>{myMaybe}</span> ~ Vielleicht</div>
        {/if}
        {#if myNo > 0}
          <div class="my-vote-pill no"><span>{myNo}</span> ✗ Nein</div>
        {/if}
      {/if}
    </div>
  </div>
</div>

<style>
  .date-week { margin-bottom: 1.5rem; }
  .week-label { display: flex; align-items: center; justify-content: space-between; width: 100%; background: none; border: none; padding: 0; margin-bottom: .75rem; cursor: pointer; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--ink3); font-weight: 500; font-family: var(--sans); }
  .week-label:hover { color: var(--ink); }
  .deadline-badge { display: inline-block; margin-top: .75rem; font-size: 13px; font-weight: 500; background: #fff8f0; color: #b86000; border: 1px solid #f0c060; border-radius: 100px; padding: 4px 14px; }
  .deadline-badge.urgent { background: #fdecea; color: var(--red); border-color: #f5c0c0; }
  .deadline-badge.expired { background: #f5f5f5; color: var(--ink3); border-color: var(--border); }
  .week-arrow { color: var(--ink3); flex-shrink: 0; transform: rotate(-90deg); transition: transform .2s; }
  .week-arrow.open { transform: rotate(0deg); }
  .date-row { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
  .date-card { background: #fff; border: 1.5px solid var(--border); border-radius: 12px; padding: 1rem 1.25rem; position: relative; overflow: hidden; transition: border-color .15s; }
  .date-card.voted-yes { border-color: var(--green); background: #f4faf5; }
  .date-card.voted-maybe { border-color: var(--maybe); background: #fffdf0; }
  .date-card.voted-no { border-color: #ddd; opacity: .55; }
  .date-month-group { margin-bottom: 2rem; }
  .month-label { font-size: 13px; font-weight: 600; color: var(--ink); margin-bottom: 1rem; }
  .question-card { background: #fff; border: 1.5px dashed var(--border); border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem; }
  .question-card.voted-yes { border-color: var(--green); border-style: solid; background: #f4faf5; }
  .question-card.voted-maybe { border-color: var(--maybe); border-style: solid; background: #fffdf0; }
  .question-card.voted-no { border-color: #ddd; border-style: solid; opacity: .6; }
  .question-text { font-family: var(--serif); font-size: 1.1rem; margin-bottom: .25rem; }
  .question-sub { font-size: 13px; color: var(--ink2); margin-bottom: .25rem; }
  .top-badge { position: absolute; top: 6px; right: 6px; font-size: 12px; }
  .date-day { font-family: var(--serif); font-size: 1.4rem; color: var(--ink); line-height: 1; margin-bottom: 2px; }
  .date-month { font-size: 11px; color: var(--ink3); margin-top: 2px; }
  .vote-bar { height: 4px; background: #eee; border-radius: 2px; margin: .75rem 0 .4rem; overflow: hidden; display: flex; }
  .vote-bar-yes { height: 100%; background: var(--green); border-radius: 2px; transition: width .4s; }
  .vote-bar-maybe { height: 100%; background: #c8a400; transition: width .4s; }
  .vote-bar-no { height: 100%; background: var(--red); transition: width .4s; opacity: .6; }
  .vote-count { font-size: 11px; color: var(--ink3); margin-bottom: .6rem; }
  .vote-actions { display: flex; gap: 5px; }
  .vbtn { flex: 1; padding: 5px 3px; border: 1px solid var(--border); border-radius: 6px; background: none; cursor: pointer; font-size: 11px; font-family: var(--sans); color: var(--ink2); transition: all .12s; }
  .vbtn:disabled { opacity: .5; cursor: not-allowed; }
  .vbtn:active:not(:disabled) { transform: scale(.94); transition: transform .08s; }
  .vbtn.yes.active, .vbtn.yes:not(:disabled):hover { background: #e8f5e9; color: var(--green); border-color: var(--green); }
  .vbtn.maybe.active, .vbtn.maybe:not(:disabled):hover { background: #fffde7; color: var(--maybe); border-color: #c8a400; }
  .vbtn.no.active, .vbtn.no:not(:disabled):hover { background: #fdecea; color: var(--red); border-color: var(--red); }
  .results-panel { background: #fff; border: 1px solid var(--border); border-radius: 14px; padding: 1.25rem 1.5rem; margin-bottom: 2rem; }
  .results-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.1rem; }
  .results-header h3 { font-family: var(--serif); font-size: 1.15rem; display: flex; align-items: center; gap: .6rem; }
  .voter-count { font-family: var(--sans); font-size: 11px; font-weight: 500; color: var(--ink3); background: #f0f0f0; padding: 2px 8px; border-radius: 100px; }
  .results-legend { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--ink3); }
  .leg-yes { display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: var(--green); }
  .leg-maybe { display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: #c8a400; }
  .leg-no { display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: var(--red); }
  .result-row { display: flex; align-items: center; gap: 9px; margin-bottom: .55rem; }
  .result-row.top-one .result-label { font-weight: 600; color: var(--ink); }
  .result-row.top-one .result-track { height: 12px; }
  .result-rank { font-size: 13px; width: 22px; flex-shrink: 0; text-align: center; line-height: 1; }
  .result-label { width: 90px; color: var(--ink2); flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }
  .result-track { flex: 1; height: 9px; background: #eee; border-radius: 100px; overflow: hidden; display: flex; transition: height .2s; }
  .result-fill-yes { height: 100%; background: var(--green); transition: width .6s ease; }
  .result-fill-maybe { height: 100%; background: #c8a400; transition: width .6s ease; }
  .result-num { display: flex; gap: 5px; flex-shrink: 0; white-space: nowrap; font-size: 11px; width: 100px; justify-content: flex-end; font-variant-numeric: tabular-nums; }
  .num-yes { color: var(--green); font-weight: 600; }
  .num-maybe { color: var(--maybe); }
  .num-no { color: var(--red); }
  .sep-hint { display: flex; align-items: center; justify-content: space-between; gap: 1rem; background: #f0faf2; border: 1px solid var(--green); border-radius: 10px; padding: .75rem 1rem; margin-bottom: 1.25rem; font-size: 14px; color: var(--green); font-weight: 500; }
  .sep-hint button { border: none; background: none; cursor: pointer; color: var(--green); font-size: 14px; opacity: .6; flex-shrink: 0; }
  .sep-hint button:hover { opacity: 1; }
  .my-votes-card { background: #fff; border: 1px solid var(--border); border-radius: 12px; padding: 1rem 1.25rem; margin-top: 1.5rem; }
  .my-votes-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: var(--ink3); margin-bottom: .75rem; }
  .my-votes-row { display: flex; gap: .5rem; flex-wrap: wrap; }
  .my-vote-pill { display: flex; align-items: center; gap: .35rem; font-size: 13px; padding: .35rem .75rem; border-radius: 100px; font-weight: 500; }
  .my-vote-pill span { font-family: var(--serif); font-size: 1rem; }
  .my-vote-pill.yes { background: #e8f5e9; color: var(--green); }
  .my-vote-pill.maybe { background: #fffde7; color: var(--maybe); }
  .my-vote-pill.no { background: #f5f5f5; color: var(--ink3); }
  .my-votes-empty { font-size: 13px; color: var(--ink3); }
  @media (max-width: 500px) {
    .date-row { grid-template-columns: 1fr; }
    .results-panel { padding: 1rem; }
    .results-header { flex-direction: column; align-items: flex-start; gap: .4rem; margin-bottom: .875rem; }
    .result-row { flex-wrap: wrap; gap: 4px 8px; margin-bottom: .75rem; }
    .result-label { width: auto; flex: 1; min-width: 0; }
    .result-num { margin-left: auto; }
    .result-track { width: 100%; flex-basis: 100%; order: 3; height: 8px; }
    .result-row.top-one .result-track { height: 10px; }
  }
</style>

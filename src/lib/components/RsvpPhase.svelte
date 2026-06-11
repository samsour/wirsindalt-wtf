<script lang="ts">
  import { onMount } from 'svelte';
  import { DATES, DATE_ANNOUNCED, resolveFinalDate } from '$lib/dates';
  import FlipNumber from './FlipNumber.svelte';

  let {
    rsvpStats,
    voteLeader,
    voteDeadline = null,
    rsvpDone = $bindable(false),
    rsvpChoice = $bindable<'yes' | 'no' | null>(null),
    rsvpGuests = $bindable(1),
    rsvpDietary = $bindable(''),
    rsvpNote = $bindable(''),
    rsvpLoading,
    onsubmit,
    onnext,
    afterHero,
  }: {
    rsvpStats: { attending: number; notAttending: number; totalGuests: number };
    voteLeader: string | undefined;
    voteDeadline?: string | null;
    rsvpDone?: boolean;
    rsvpChoice?: 'yes' | 'no' | null;
    rsvpGuests?: number;
    rsvpDietary?: string;
    rsvpNote?: string;
    rsvpLoading: boolean;
    onsubmit: () => void;
    onnext?: () => void;
    afterHero?: import('svelte').Snippet;
  } = $props();

  let now = $state(Date.now());
  onMount(() => {
    const t = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(t);
  });

  let deadlineExpired = $derived(!voteDeadline || now > new Date(voteDeadline).getTime() + 86_400_000);

  // Date is only final (show it + allow RSVP) once voting is done AND the team confirmed it.
  let dateConfirmed = $derived(deadlineExpired && DATE_ANNOUNCED);

  // The current vote leader (shown while voting runs) and the announced final date.
  let leaderDate = $derived(voteLeader ? DATES.find(d => d.key === voteLeader) : undefined);
  let finalDate = $derived(resolveFinalDate(voteLeader));

  // Which variant of the date card to render, by phase.
  let showVotingLeader = $derived(!deadlineExpired && !!leaderDate);
  let showPending = $derived(deadlineExpired && !DATE_ANNOUNCED);
  let showFinal = $derived(dateConfirmed && !!finalDate);

  let countdown = $derived.by(() => {
    if (!voteDeadline || deadlineExpired) return null;
    const diff = new Date(voteDeadline).getTime() + 86_400_000 - now;
    const days = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff % 86_400_000) / 3_600_000);
    return { days, hours };
  });

  // Countdown to the party itself, once the final date is announced. Party kicks off at 17:00.
  let eventCountdown = $derived.by(() => {
    if (!showFinal || !finalDate) return null;
    const diff = new Date(`${finalDate.key}T17:00:00`).getTime() - now;
    if (diff <= 0) return { past: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
    const days = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff % 86_400_000) / 3_600_000);
    const minutes = Math.floor((diff % 3_600_000) / 60_000);
    const seconds = Math.floor((diff % 60_000) / 1000);
    return { past: false, days, hours, minutes, seconds };
  });
</script>

<div class="hero">
  <div class="eyebrow">So, einmal durchzählen bidde</div>
  <h1>Kommst du <em>oder was?</em></h1>
  <p class="hero-sub">Kurz Bescheid geben, gerne mit +1 Bescheid geben, damit wir wissen, mit wie vielen Leuten wir insgesamt rechnen müssen.</p>
</div>

{@render afterHero?.()}

<div class="section">
  {#if showVotingLeader || showPending || showFinal}
    <div class="chosen-date" class:pending={!dateConfirmed}>
      <span class="chosen-icon">{dateConfirmed ? '📅' : '🗳️'}</span>
      <div>
        <div class="chosen-label">{showVotingLeader ? 'Aktuell vorne' : 'Der Termin'}</div>
        <div class="chosen-value">{showFinal ? finalDate?.label : showVotingLeader ? leaderDate?.label : 'Wird noch bekannt gegeben'}</div>
        {#if countdown}
          <div class="chosen-countdown">
          </div>
          Termin wird fixiert in {countdown.days > 0 ? `${countdown.days} Tag${countdown.days !== 1 ? 'en' : ''}` : `${countdown.hours} Std.`}. Änderungen vorbehalten, falls wir keine gescheite Location finden.
        {:else if showPending}
          <div class="chosen-note">
            Die Abstimmung ist durch — danke fürs Mitvoten! Den endgültigen Termin stimmen wir noch im Planungsteam ab und geben ihn hier bekannt. Sobald er steht, kannst du zusagen.
          </div>
        {/if}
      </div>
    </div>
  {/if}

  {#if eventCountdown}
    <div class="event-countdown" class:party-time={eventCountdown.past}>
      {#if eventCountdown.past}
        <div class="ec-emoji">🎉</div>
        <div class="ec-title">Es ist so weit — heute wird gefeiert!</div>
      {:else}
        <div class="ec-title">Noch bis zur Feier 🎉</div>
        <div class="ec-units">
          <div class="ec-unit">
            <FlipNumber value={eventCountdown.days} />
            <span class="ec-lbl">{eventCountdown.days === 1 ? 'Tag' : 'Tage'}</span>
          </div>
          <div class="ec-unit">
            <FlipNumber value={eventCountdown.hours} />
            <span class="ec-lbl">Std.</span>
          </div>
          <div class="ec-unit">
            <FlipNumber value={eventCountdown.minutes} />
            <span class="ec-lbl">Min.</span>
          </div>
          <div class="ec-unit">
            <FlipNumber value={eventCountdown.seconds} />
            <span class="ec-lbl">Sek.</span>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  {#if dateConfirmed}
    <div class="stat-row" style="margin-bottom:2rem">
      <div class="stat-pill"><span class="sn" style="color:var(--green)">{rsvpStats.attending}</span><span class="sl">dabei 🙌</span></div>
      <div class="stat-pill"><span class="sn" style="color:var(--red)">{rsvpStats.notAttending}</span><span class="sl">kann nicht</span></div>
      <div class="stat-pill"><span class="sn">{rsvpStats.totalGuests}</span><span class="sl">Leute insgesamt (inkl. +1)</span></div>
    </div>
  {/if}

  {#if rsvpDone && dateConfirmed}
    <div class="done-card">
      <div class="done-icon">{rsvpChoice === 'yes' ? '🎉' : '😔'}</div>
      <h3>{rsvpChoice === 'yes' ? 'Nice, du bist dabei!' : 'Schade — nächstes Mal!'}</h3>
      <p>{rsvpChoice === 'yes' ? 'Wir freuen uns auf dich!' : ''}</p>
      <div class="done-actions">
        {#if rsvpChoice === 'yes'}
          <button
            class="btn btn-outline"
            class:plus-active={rsvpGuests > 1}
            disabled={rsvpLoading}
            onclick={() => { rsvpGuests = rsvpGuests > 1 ? 1 : 2; onsubmit(); }}
          >{rsvpGuests > 1 ? '✓ +1 dabei' : '+1 mitbringen'}</button>
        {/if}
        <button class="btn btn-outline" onclick={() => (rsvpDone = false)}>Doch nochmal ändern</button>
      </div>
    </div>
  {:else}
    {#if !dateConfirmed}
      <p class="pending-label">Sobald der Termin feststeht, kannst du hier zusagen.</p>
    {/if}
    <div class="rsvp-grid">
      <button class="rsvp-card" class:attending={rsvpChoice === 'yes'} disabled={rsvpLoading || !dateConfirmed} onclick={() => { rsvpChoice = 'yes'; onsubmit(); }}>
        <div class="rsvp-icon">🎉</div>
        <h3>Ja, ich komm!</h3>
        <p>Ich bin dabei</p>
      </button>
      <button class="rsvp-card" class:declining={rsvpChoice === 'no'} disabled={rsvpLoading || !dateConfirmed} onclick={() => { rsvpChoice = 'no'; onsubmit(); }}>
        <div class="rsvp-icon">😔</div>
        <h3>Geht leider nicht</h3>
        <p>Schade, aber okay</p>
      </button>
    </div>
  {/if}

  {#if onnext}
    <div class="plan-nudge">
      Schon neugierig? <button class="plan-link" onclick={onnext}>Zur Planung schauen →</button>
    </div>
  {/if}

</div>

<style>
  .rsvp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
  .rsvp-card { background: var(--surface); border: 1.5px solid var(--border); border-radius: 12px; padding: 1.5rem; cursor: pointer; transition: all .15s; text-align: center; font-family: var(--sans); }
  .rsvp-card:hover:not(:disabled) { transform: translateY(-2px); }
  .rsvp-card:disabled { opacity: .35; cursor: default; filter: grayscale(0.4); }
  .rsvp-card.attending { border-color: var(--green); background: color-mix(in srgb, var(--green) 12%, var(--surface)); }
  .rsvp-card.declining { border-color: var(--red); background: color-mix(in srgb, var(--red) 12%, var(--surface)); }
  .rsvp-icon { font-size: 2.5rem; margin-bottom: .75rem; }
  .event-countdown { background: linear-gradient(135deg, var(--accent), #d04b3c); color: #fff; border-radius: 16px; padding: 1.25rem 1.5rem; margin-bottom: 2rem; text-align: center; box-shadow: 0 6px 20px color-mix(in srgb, var(--accent) 35%, transparent); }
  .event-countdown.party-time { background: linear-gradient(135deg, var(--green), #2f6b39); box-shadow: 0 6px 20px color-mix(in srgb, var(--green) 35%, transparent); }
  .ec-emoji { font-size: 2.5rem; line-height: 1; margin-bottom: .5rem; animation: ec-pop 0.5s cubic-bezier(0.34,1.56,0.64,1); }
  @keyframes ec-pop { from { transform: scale(0); } to { transform: scale(1); } }
  .ec-title { font-family: var(--serif); font-size: 1.15rem; margin-bottom: 1rem; }
  .event-countdown.party-time .ec-title { margin-bottom: 0; font-size: 1.4rem; }
  .ec-units { display: flex; justify-content: center; gap: .7rem; padding: 0 .5rem; flex-wrap: wrap; }
  .ec-unit { display: flex; flex-direction: column; align-items: center; gap: .45rem; }
  .ec-lbl { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; opacity: .85; }
  .chosen-date { display: flex; align-items: center; gap: 1rem; background: var(--surface); border: 2px solid var(--accent); border-radius: 14px; padding: 1rem 1.25rem; margin-bottom: 2rem; }
  .chosen-date.pending { border-color: var(--border); border-style: dashed; background: var(--muted); }
  .chosen-icon { font-size: 1.75rem; flex-shrink: 0; }
  .chosen-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: var(--accent); margin-bottom: 2px; }
  .chosen-date.pending .chosen-label { color: var(--ink3); }
  .chosen-value { font-family: var(--serif); font-size: 1.3rem; color: var(--ink); }
  .chosen-countdown { font-size: 11px; color: var(--ink3); margin-top: 3px; }
  .chosen-note { font-size: 12px; line-height: 1.5; color: var(--ink2); margin-top: 6px; }
  .pending-label { text-align: center; font-size: 13px; color: var(--ink3); margin-bottom: 1rem; }
  .rsvp-card h3 { font-family: var(--serif); font-size: 1.25rem; margin-bottom: .25rem; color: var(--ink); }
  .rsvp-card p { font-size: 13px; color: var(--ink2); }
  .done-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 2rem; text-align: center; margin-bottom: 2rem; }
  .done-icon { font-size: 3rem; margin-bottom: 1rem; }
  .done-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: .6rem; margin-top: 1rem; }
  .done-actions .plus-active { border-color: var(--green); color: var(--green); background: color-mix(in srgb, var(--green) 10%, transparent); }
  .done-card h3 { font-family: var(--serif); font-size: 1.4rem; margin-bottom: .4rem; }
  .done-card p { font-size: 14px; color: var(--ink2); }
  .rsvp-form { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
  .counter-row { display: flex; align-items: center; gap: 10px; }
  .ctr-btn { width: 32px; height: 32px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; font-family: monospace; }
  .ctr-btn:hover { background: var(--muted); }
  .ctr-val { font-size: 20px; font-weight: 500; min-width: 2rem; text-align: center; }
  .ctr-label { font-size: 13px; color: var(--ink2); }
  .plan-nudge { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border); font-size: 14px; color: var(--ink3); text-align: center; }
  .plan-link { background: none; border: none; color: var(--accent); cursor: pointer; font-family: var(--sans); font-size: 14px; font-weight: 500; padding: 0; }
  .plan-link:hover { text-decoration: underline; }
  @media (max-width: 500px) { .rsvp-grid { grid-template-columns: 1fr; } }
</style>

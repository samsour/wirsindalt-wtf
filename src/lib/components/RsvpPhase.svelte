<script lang="ts">
  import { onMount } from 'svelte';
  import { DATES } from '$lib/dates';

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
  } = $props();

  let now = $state(Date.now());
  onMount(() => {
    const t = setInterval(() => (now = Date.now()), 60_000);
    return () => clearInterval(t);
  });

  let deadlineExpired = $derived(!voteDeadline || now > new Date(voteDeadline).getTime() + 86_400_000);

  let countdown = $derived.by(() => {
    if (!voteDeadline || deadlineExpired) return null;
    const diff = new Date(voteDeadline).getTime() + 86_400_000 - now;
    const days = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff % 86_400_000) / 3_600_000);
    return { days, hours };
  });
</script>

<div class="hero">
  <div class="eyebrow">So, einmal durchzählen bidde</div>
  <h1>Kommst du <em>oder was?</em></h1>
  <p class="hero-sub">Kurz Bescheid geben, bring ruhig jemanden mit.</p>
</div>

<div class="section">
  {#if voteLeader}
    {@const winDate = DATES.find(d => d.key === voteLeader)}
    {#if winDate}
      <div class="chosen-date" class:pending={!deadlineExpired}>
        <span class="chosen-icon">{deadlineExpired ? '📅' : '🗳️'}</span>
        <div>
          <div class="chosen-label">{deadlineExpired ? 'Der Termin' : 'Aktuell vorne'}</div>
          <div class="chosen-value">{winDate.label}</div>
          {#if countdown}
            <div class="chosen-countdown">
            </div>
            Termin wird fixiert in {countdown.days > 0 ? `${countdown.days} Tag${countdown.days !== 1 ? 'en' : ''}` : `${countdown.hours} Std.`}. Änderungen vorbehalten, falls wir keine gescheite Location finden.
          {/if}
        </div>
      </div>
    {/if}
  {/if}

  {#if deadlineExpired}
    <div class="stat-row" style="margin-bottom:2rem">
      <div class="stat-pill"><span class="sn" style="color:var(--green)">{rsvpStats.attending}</span><span class="sl">dabei 🙌</span></div>
      <div class="stat-pill"><span class="sn" style="color:var(--red)">{rsvpStats.notAttending}</span><span class="sl">kann nicht</span></div>
      <div class="stat-pill"><span class="sn">{rsvpStats.totalGuests}</span><span class="sl">Leute insgesamt</span></div>
    </div>
  {/if}

  {#if rsvpDone && deadlineExpired}
    <div class="done-card">
      <div class="done-icon">{rsvpChoice === 'yes' ? '🎉' : '😔'}</div>
      <h3>{rsvpChoice === 'yes' ? 'Nice, du bist dabei!' : 'Schade — nächstes Mal!'}</h3>
      <p>{rsvpChoice === 'yes' ? 'Wir freuen uns auf dich!' : ''}</p>
      <button class="btn btn-outline" style="margin-top:1rem" onclick={() => (rsvpDone = false)}>Doch nochmal ändern</button>
    </div>
  {:else}
    {#if !deadlineExpired}
      <p class="pending-label">Sobald der Termin feststeht, kannst du hier zusagen.</p>
    {/if}
    <div class="rsvp-grid">
      <button class="rsvp-card" class:attending={rsvpChoice === 'yes'} disabled={rsvpLoading || !deadlineExpired} onclick={() => { rsvpChoice = 'yes'; onsubmit(); }}>
        <div class="rsvp-icon">🎉</div>
        <h3>Ja, ich komm!</h3>
        <p>Ich bin dabei</p>
      </button>
      <button class="rsvp-card" class:declining={rsvpChoice === 'no'} disabled={rsvpLoading || !deadlineExpired} onclick={() => { rsvpChoice = 'no'; onsubmit(); }}>
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
  .rsvp-card { background: #fff; border: 1.5px solid var(--border); border-radius: 12px; padding: 1.5rem; cursor: pointer; transition: all .15s; text-align: center; font-family: var(--sans); }
  .rsvp-card:hover:not(:disabled) { transform: translateY(-2px); }
  .rsvp-card:disabled { opacity: .35; cursor: default; filter: grayscale(0.4); }
  .rsvp-card.attending { border-color: var(--green); background: #f4faf5; }
  .rsvp-card.declining { border-color: var(--red); background: #fdf4f4; }
  .rsvp-icon { font-size: 2.5rem; margin-bottom: .75rem; }
  .chosen-date { display: flex; align-items: center; gap: 1rem; background: #fff; border: 2px solid var(--accent); border-radius: 14px; padding: 1rem 1.25rem; margin-bottom: 2rem; }
  .chosen-date.pending { border-color: var(--border); border-style: dashed; background: #fafafa; }
  .chosen-icon { font-size: 1.75rem; flex-shrink: 0; }
  .chosen-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: var(--accent); margin-bottom: 2px; }
  .chosen-date.pending .chosen-label { color: var(--ink3); }
  .chosen-value { font-family: var(--serif); font-size: 1.3rem; color: var(--ink); }
  .chosen-countdown { font-size: 11px; color: var(--ink3); margin-top: 3px; }
  .pending-label { text-align: center; font-size: 13px; color: var(--ink3); margin-bottom: 1rem; }
  .rsvp-card h3 { font-family: var(--serif); font-size: 1.25rem; margin-bottom: .25rem; }
  .rsvp-card p { font-size: 13px; color: var(--ink2); }
  .done-card { background: #fff; border: 1px solid var(--border); border-radius: 12px; padding: 2rem; text-align: center; margin-bottom: 2rem; }
  .done-icon { font-size: 3rem; margin-bottom: 1rem; }
  .done-card h3 { font-family: var(--serif); font-size: 1.4rem; margin-bottom: .4rem; }
  .done-card p { font-size: 14px; color: var(--ink2); }
  .rsvp-form { background: #fff; border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
  .counter-row { display: flex; align-items: center; gap: 10px; }
  .ctr-btn { width: 32px; height: 32px; border: 1px solid var(--border); border-radius: 8px; background: #fff; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; font-family: monospace; }
  .ctr-btn:hover { background: #f0f0f0; }
  .ctr-val { font-size: 20px; font-weight: 500; min-width: 2rem; text-align: center; }
  .ctr-label { font-size: 13px; color: var(--ink2); }
  .plan-nudge { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border); font-size: 14px; color: var(--ink3); text-align: center; }
  .plan-link { background: none; border: none; color: var(--accent); cursor: pointer; font-family: var(--sans); font-size: 14px; font-weight: 500; padding: 0; }
  .plan-link:hover { text-decoration: underline; }
  @media (max-width: 500px) { .rsvp-grid { grid-template-columns: 1fr; } }
</style>

<script lang="ts">
  import { DATES } from '$lib/dates';

  let {
    rsvpStats,
    voteLeader,
    rsvpDone = $bindable(false),
    rsvpChoice = $bindable<'yes' | 'no' | null>(null),
    rsvpGuests = $bindable(1),
    rsvpDietary = $bindable(''),
    rsvpNote = $bindable(''),
    rsvpLoading,
    onsubmit,
  }: {
    rsvpStats: { attending: number; notAttending: number; totalGuests: number };
    voteLeader: string | undefined;
    rsvpDone?: boolean;
    rsvpChoice?: 'yes' | 'no' | null;
    rsvpGuests?: number;
    rsvpDietary?: string;
    rsvpNote?: string;
    rsvpLoading: boolean;
    onsubmit: () => void;
  } = $props();
</script>

<div class="hero">
  <div class="eyebrow">Termin steht — jetzt zählen wir durch.</div>
  <h1>Kommst du <em>oder was?</em></h1>
  <p class="hero-sub">Kurz Bescheid geben — bring ruhig jemanden mit.</p>
</div>

<div class="section">
  {#if voteLeader}
    {@const winDate = DATES.find(d => d.key === voteLeader)}
    {#if winDate}
      <div class="chosen-date">
        <span class="chosen-icon">📅</span>
        <div>
          <div class="chosen-label">Der Termin</div>
          <div class="chosen-value">{winDate.label} · Freitag–Samstag</div>
        </div>
      </div>
    {/if}
  {/if}

  <div class="stat-row" style="margin-bottom:2rem">
    <div class="stat-pill"><span class="sn" style="color:var(--green)">{rsvpStats.attending}</span><span class="sl">dabei 🙌</span></div>
    <div class="stat-pill"><span class="sn" style="color:var(--red)">{rsvpStats.notAttending}</span><span class="sl">kann nicht</span></div>
    <div class="stat-pill"><span class="sn">{rsvpStats.totalGuests}</span><span class="sl">Leute insgesamt</span></div>
  </div>

  {#if rsvpDone}
    <div class="done-card">
      <div class="done-icon">{rsvpChoice === 'yes' ? '🎉' : '😔'}</div>
      <h3>{rsvpChoice === 'yes' ? 'Nice, du bist dabei!' : 'Schade — nächstes Mal!'}</h3>
      <p>{rsvpChoice === 'yes' ? 'Wir freuen uns auf dich!' : ''}</p>
      <button class="btn btn-outline" style="margin-top:1rem" onclick={() => (rsvpDone = false)}>Doch nochmal ändern</button>
    </div>
  {:else}
    <div class="rsvp-grid">
      <button class="rsvp-card" class:attending={rsvpChoice === 'yes'} disabled={rsvpLoading} onclick={() => { rsvpChoice = 'yes'; onsubmit(); }}>
        <div class="rsvp-icon">🎉</div>
        <h3>Ja, ich komm!</h3>
        <p>Ich bin dabei</p>
      </button>
      <button class="rsvp-card" class:declining={rsvpChoice === 'no'} disabled={rsvpLoading} onclick={() => { rsvpChoice = 'no'; onsubmit(); }}>
        <div class="rsvp-icon">😔</div>
        <h3>Geht leider nicht</h3>
        <p>Schade, aber okay</p>
      </button>
    </div>
  {/if}

</div>

<style>
  .rsvp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
  .rsvp-card { background: #fff; border: 1.5px solid var(--border); border-radius: 12px; padding: 1.5rem; cursor: pointer; transition: all .15s; text-align: center; font-family: var(--sans); }
  .rsvp-card:hover { transform: translateY(-2px); }
  .rsvp-card.attending { border-color: var(--green); background: #f4faf5; }
  .rsvp-card.declining { border-color: var(--red); background: #fdf4f4; }
  .rsvp-icon { font-size: 2.5rem; margin-bottom: .75rem; }
  .chosen-date { display: flex; align-items: center; gap: 1rem; background: #fff; border: 2px solid var(--accent); border-radius: 14px; padding: 1rem 1.25rem; margin-bottom: 2rem; }
  .chosen-icon { font-size: 1.75rem; flex-shrink: 0; }
  .chosen-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: var(--accent); margin-bottom: 2px; }
  .chosen-value { font-family: var(--serif); font-size: 1.3rem; color: var(--ink); }
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
  @media (max-width: 500px) { .rsvp-grid { grid-template-columns: 1fr; } }
</style>

<script lang="ts">
  let {
    rsvpStats,
    rsvpDone = $bindable(false),
    rsvpChoice = $bindable<'yes' | 'no' | null>(null),
    rsvpGuests = $bindable(1),
    rsvpDietary = $bindable(''),
    rsvpNote = $bindable(''),
    rsvpLoading,
    onsubmit,
    onback,
    onnext,
  }: {
    rsvpStats: { attending: number; notAttending: number; totalGuests: number };
    rsvpDone?: boolean;
    rsvpChoice?: 'yes' | 'no' | null;
    rsvpGuests?: number;
    rsvpDietary?: string;
    rsvpNote?: string;
    rsvpLoading: boolean;
    onsubmit: () => void;
    onback: () => void;
    onnext: () => void;
  } = $props();
</script>

<div class="hero">
  <div class="eyebrow">Phase 2 · Anmeldung</div>
  <h1>Bist du <em>dabei?</em></h1>
  <p class="hero-sub">Sag uns, ob du kommst — und wie viele ihr seid.</p>
</div>

<div class="section">
  <div class="stat-row" style="margin-bottom:2rem">
    <div class="stat-pill"><span class="sn" style="color:var(--green)">{rsvpStats.attending}</span><span class="sl">zugesagt</span></div>
    <div class="stat-pill"><span class="sn" style="color:var(--red)">{rsvpStats.notAttending}</span><span class="sl">abgesagt</span></div>
    <div class="stat-pill"><span class="sn">{rsvpStats.totalGuests}</span><span class="sl">Personen gesamt</span></div>
  </div>

  {#if rsvpDone}
    <div class="done-card">
      <div class="done-icon">{rsvpChoice === 'yes' ? '🎉' : '😔'}</div>
      <h3>{rsvpChoice === 'yes' ? 'Du bist angemeldet!' : 'Schade — bis nächstes Mal!'}</h3>
      <p>{rsvpChoice === 'yes' ? `${rsvpGuests} Person(en) · ${rsvpDietary || 'keine Ernährungshinweise'}` : ''}</p>
      <button class="btn btn-outline" style="margin-top:1rem" onclick={() => (rsvpDone = false)}>Ändern</button>
    </div>
  {:else}
    <div class="rsvp-grid">
      <button class="rsvp-card" class:attending={rsvpChoice === 'yes'} onclick={() => (rsvpChoice = 'yes')}>
        <div class="rsvp-icon">🎉</div>
        <h3>Ich bin dabei!</h3>
        <p>Ich feiere mit euch</p>
      </button>
      <button class="rsvp-card" class:declining={rsvpChoice === 'no'} onclick={() => (rsvpChoice = 'no')}>
        <div class="rsvp-icon">😔</div>
        <h3>Leider nicht</h3>
        <p>Diesmal klappt's nicht</p>
      </button>
    </div>

    {#if rsvpChoice}
      <div class="rsvp-form">
        {#if rsvpChoice === 'yes'}
          <div class="form-row">
            <label>Wie viele Personen kommt ihr? (inkl. dir)</label>
            <div class="counter-row">
              <button class="ctr-btn" onclick={() => rsvpGuests = Math.max(1, rsvpGuests - 1)}>−</button>
              <span class="ctr-val">{rsvpGuests}</span>
              <button class="ctr-btn" onclick={() => rsvpGuests = Math.min(10, rsvpGuests + 1)}>+</button>
              <span class="ctr-label">Person(en)</span>
            </div>
          </div>
          <div class="form-row">
            <label>Ernährungshinweise</label>
            <select bind:value={rsvpDietary}>
              <option value="">Keine besonderen</option>
              <option>Vegetarisch</option><option>Vegan</option>
              <option>Laktosefrei</option><option>Glutenfrei</option><option>Mehreres</option>
            </select>
          </div>
        {/if}
        <div class="form-row">
          <label>Nachricht ans Orga-Team (optional)</label>
          <textarea bind:value={rsvpNote} placeholder="Alles Wichtige hier…"></textarea>
        </div>
        <div style="display:flex;gap:.75rem;flex-wrap:wrap">
          <button class="btn btn-primary" onclick={onsubmit} disabled={rsvpLoading}>
            {rsvpLoading ? 'Wird gespeichert…' : 'Anmeldung absenden ✓'}
          </button>
          <button class="btn btn-outline" onclick={() => (rsvpChoice = null)}>Zurück</button>
        </div>
      </div>
    {/if}
  {/if}

  <div class="footer-nav">
    <button class="btn btn-outline" onclick={onback}>← Zurück</button>
    <button class="btn btn-primary" onclick={onnext}>Zur Planung →</button>
  </div>
</div>

<style>
  .rsvp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
  .rsvp-card { background: #fff; border: 1.5px solid var(--border); border-radius: 12px; padding: 1.5rem; cursor: pointer; transition: all .15s; text-align: center; font-family: var(--sans); }
  .rsvp-card:hover { transform: translateY(-2px); }
  .rsvp-card.attending { border-color: var(--green); background: #f4faf5; }
  .rsvp-card.declining { border-color: var(--red); background: #fdf4f4; }
  .rsvp-icon { font-size: 2.5rem; margin-bottom: .75rem; }
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

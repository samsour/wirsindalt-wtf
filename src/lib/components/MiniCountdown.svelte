<script lang="ts">
  import FlipNumber from './FlipNumber.svelte';

  // Date key like '2026-08-15'; the party kicks off at 17:00.
  let { targetKey }: { targetKey: string } = $props();

  let now = $state(Date.now());
  $effect(() => {
    const t = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(t);
  });

  let cd = $derived.by(() => {
    const diff = new Date(`${targetKey}T17:00:00`).getTime() - now;
    if (diff <= 0) return null;
    return {
      days: Math.floor(diff / 86_400_000),
      hours: Math.floor((diff % 86_400_000) / 3_600_000),
      minutes: Math.floor((diff % 3_600_000) / 60_000),
      seconds: Math.floor((diff % 60_000) / 1000),
    };
  });
</script>

{#if cd}
  <div class="mini-cd" title="Countdown bis zur Feier">
    <span class="mc-emoji">🎉</span>
    <div class="mc-cell"><FlipNumber value={cd.days} compact /><span class="mc-l">T</span></div>
    <div class="mc-cell"><FlipNumber value={cd.hours} compact /><span class="mc-l">Std</span></div>
    <div class="mc-cell"><FlipNumber value={cd.minutes} compact /><span class="mc-l">Min</span></div>
    <div class="mc-cell"><FlipNumber value={cd.seconds} compact /><span class="mc-l">Sek</span></div>
  </div>
{/if}

<style>
  .mini-cd {
    position: fixed; bottom: 1.5rem; left: 1.5rem; z-index: 480;
    display: flex; align-items: center; gap: .4rem;
    background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
    padding: .45rem .6rem; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16);
    animation: mc-in .4s cubic-bezier(.34, 1.56, .64, 1) both;
  }
  @keyframes mc-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .mc-emoji { font-size: 1rem; }
  .mc-cell { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .mc-l { font-size: 8px; text-transform: uppercase; letter-spacing: .5px; color: var(--ink3); }
  @media (max-width: 380px) {
    .mini-cd { gap: .3rem; padding: .4rem .5rem; }
    .mc-l { display: none; }
  }
</style>

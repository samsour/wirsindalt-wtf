<script lang="ts">
  const EMOJIS = ['🎉', '🍺', '🎊', '🥳', '🎸', '🍕', '✨', '🎈', '🎤', '🎀', '🪩', '🍾', '⚡', '🎲', '💃', '🎓'];
  const COLS = 6;
  const PER_COL = 5;
  const BASE_DUR = 20;

  const columns = Array.from({ length: COLS }, (_, c) => {
    const dur = BASE_DUR + c * 1.8;
    const stagger = c % 2 === 1 ? -dur / 2 : 0;
    return {
      emojis: Array.from({ length: PER_COL }, (_, r) => EMOJIS[(c * 3 + r * 2) % EMOJIS.length]),
      dur,
      delay: stagger - c * 0.6,
    };
  });
</script>

<div class="rain-bg" aria-hidden="true">
  {#each columns as col}
    <div class="rain-col" style="--dur:{col.dur}s; --delay:{col.delay}s">
      {#each col.emojis as emoji}<span>{emoji}</span>{/each}
      {#each col.emojis as emoji}<span>{emoji}</span>{/each}
    </div>
  {/each}
</div>

<style>
  .rain-bg {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    display: flex;
    overflow: hidden;
    opacity: 0.04;
    user-select: none;
  }

  .rain-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 3.5rem;
    line-height: 2;
    animation: rain var(--dur) var(--delay) linear infinite;
  }

  @keyframes rain {
    from { transform: translateY(-50%); }
    to   { transform: translateY(0); }
  }
</style>

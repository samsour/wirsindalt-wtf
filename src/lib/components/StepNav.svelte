<script lang="ts">
  let { backLabel = '', nextLabel = '', onback, onnext }: {
    backLabel?: string;
    nextLabel?: string;
    onback?: () => void;
    onnext?: () => void;
  } = $props();
</script>

<div class="step-nav">
  {#if onback && backLabel}
    <button class="sn-btn sn-back" onclick={onback}>← {backLabel}</button>
  {:else}
    <span></span>
  {/if}
  {#if onnext && nextLabel}
    <button class="sn-btn sn-next" onclick={onnext}>{nextLabel} →</button>
  {/if}
</div>

<style>
  .step-nav { display: flex; justify-content: space-between; align-items: center; gap: 1rem; max-width: 760px; margin: 0 auto 1.5rem; padding: 0 1.5rem; }
  @media (max-width: 500px) { .step-nav { padding: 0 1rem; } }
  .sn-btn { border-radius: 10px; padding: .6rem 1.4rem; font-size: 14px; font-weight: 600; font-family: var(--sans); cursor: pointer; transition: all .15s; white-space: nowrap; }
  .sn-back { background: none; border: 1.5px solid var(--border); color: var(--ink2); }
  .sn-back:hover { border-color: var(--ink3); color: var(--ink); }
  .sn-next { background: var(--accent); color: #fff; border: none; }
  .sn-next:hover { opacity: .85; }
</style>

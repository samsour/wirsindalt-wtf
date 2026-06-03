<script lang="ts">
  let { message }: { message: string } = $props();
</script>

{#if message}
  <div class="toast show">{message}</div>
{/if}

<style>
  .toast {
    position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
    background: var(--ink); color: var(--paper); padding: 10px 20px; border-radius: 8px;
    font-size: 13px; opacity: 0; transition: opacity .25s; pointer-events: none;
    z-index: 999; white-space: nowrap;
  }
  .toast.show { opacity: 1; }
</style>

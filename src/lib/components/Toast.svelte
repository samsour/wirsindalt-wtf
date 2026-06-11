<script lang="ts">
  import { fade } from 'svelte/transition';

  let { message }: { message: string } = $props();
</script>

{#if message}
  {#key message}
    <div class="toast" out:fade={{ duration: 180 }}>{message}</div>
  {/key}
{/if}

<style>
  .toast {
    position: fixed; bottom: 2rem; left: 50%;
    background: var(--ink); color: var(--paper); padding: 11px 20px; border-radius: 10px;
    font-size: 13px; line-height: 1.35; text-align: center; font-weight: 500;
    box-shadow: 0 8px 24px rgba(0,0,0,0.22);
    pointer-events: none; z-index: 999; max-width: min(90vw, 24rem);
    transform: translateX(-50%);
    animation: toast-pop .5s cubic-bezier(.34, 1.56, .64, 1) both;
  }
  @keyframes toast-pop {
    0%   { opacity: 0; transform: translateX(-50%) translateY(40px) scale(.7); }
    60%  { opacity: 1; }
    100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  }
  @media (prefers-reduced-motion: reduce) {
    .toast { animation-duration: .01ms; }
  }
</style>

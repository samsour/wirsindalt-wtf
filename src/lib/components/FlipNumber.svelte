<script lang="ts">
  import { untrack } from 'svelte';

  let { value, compact = false }: { value: number; compact?: boolean } = $props();

  let current = $state(untrack(() => value));
  let prev = $state(untrack(() => value));
  let anim = $state(0);

  // When the value changes, keep the old one around and (re)trigger the fold animation.
  $effect(() => {
    if (value === current) return;
    prev = current;
    current = value;
    anim += 1;
  });
</script>

<div class="flip" class:compact>
  <div class="half top"><span>{current}</span></div>
  <div class="half bottom"><span>{prev}</span></div>
  {#if anim > 0}
    {#key anim}
      <div class="half top foldtop"><span>{prev}</span></div>
      <div class="half bottom foldbottom"><span>{current}</span></div>
    {/key}
  {/if}
</div>

<style>
  .flip {
    --h: 6rem;
    position: relative; display: inline-block;
    height: var(--h); min-width: 4.4rem; padding: 0 .9rem;
    font-family: var(--serif); font-size: 4rem; font-variant-numeric: tabular-nums;
    perspective: 400px; color: #fff;
  }
  .half {
    position: absolute; left: 0; right: 0; height: 50%; overflow: hidden;
    display: flex; justify-content: center;
    background: #161616;
    backface-visibility: hidden;
  }
  .top { top: 0; align-items: flex-start; border-radius: 9px 9px 0 0; border-bottom: 1px solid rgba(255, 255, 255, 0.14); }
  .bottom { bottom: 0; align-items: flex-end; border-radius: 0 0 9px 9px; box-shadow: 0 5px 10px rgba(0, 0, 0, 0.22); }
  .half span { display: block; height: var(--h); line-height: var(--h); }

  @media (max-width: 430px) {
    .flip:not(.compact) { --h: 4.2rem; min-width: 2.5rem; padding: 0 .45rem; font-size: 2.6rem; }
  }
  @media (min-width: 768px) {
    .flip:not(.compact) { --h: 7.6rem; min-width: 5.4rem; padding: 0 1.2rem; font-size: 5.2rem; }
  }

  /* Compact variant for the sticky mini countdown. */
  .flip.compact { --h: 2rem; min-width: 1.5rem; padding: 0 .3rem; font-size: 1.25rem; }
  .flip.compact .top { border-radius: 4px 4px 0 0; }
  .flip.compact .bottom { border-radius: 0 0 4px 4px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); }

  .foldtop { z-index: 3; transform-origin: bottom; animation: fold-top .28s ease-in forwards; }
  .foldbottom { z-index: 3; transform-origin: top; transform: rotateX(90deg); animation: fold-bottom .28s .28s ease-out forwards; }
  @keyframes fold-top    { to { transform: rotateX(-90deg); } }
  @keyframes fold-bottom { to { transform: rotateX(0deg); } }

  @media (prefers-reduced-motion: reduce) {
    .foldtop, .foldbottom { animation: none; }
    .foldtop { display: none; }
    .foldbottom { transform: none; }
  }
</style>

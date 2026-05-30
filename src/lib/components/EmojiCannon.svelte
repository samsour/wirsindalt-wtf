<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  let { token }: { token: string } = $props();

  const EMOJIS = ['🎉', '🍺', '🥂', '🔥', '😂', '💃', '🕺', '❤️', '🤙', '🎶', '👏', '🥳'];

  type Flying = { id: number; emoji: string; x: number; dur: number; size: number };

  let open = $state(false);
  let flying: Flying[] = $state([]);
  const seenIds = new Set<number>();
  let nextId = 0;
  let thumbIndex = $state(Math.floor(Math.random() * EMOJIS.length));
  let thumbInterval: ReturnType<typeof setInterval>;

  function spawnEmoji(emoji: string) {
    const id = nextId++;
    const dur = 2.4 + Math.random() * 1.2;
    flying = [...flying, { id, emoji, x: 5 + Math.random() * 85, dur, size: 1.8 + Math.random() }];
    setTimeout(() => { flying = flying.filter(f => f.id !== id); }, (dur + .3) * 1000);
  }

  async function shoot(emoji: string) {
    open = false;
    spawnEmoji(emoji);
    const res = await fetch('/api/emoji', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, emoji }),
    });
    const { id } = await res.json();
    seenIds.add(id); // prevent poller from re-spawning our own emoji
  }

  async function poll() {
    const rows: { id: number; emoji: string }[] = await (await fetch('/api/emoji')).json();
    for (const row of rows) {
      if (!seenIds.has(row.id)) {
        seenIds.add(row.id);
        spawnEmoji(row.emoji);
      }
    }
  }

  let interval: ReturnType<typeof setInterval>;

  onMount(async () => {
    const initial: { id: number }[] = await (await fetch('/api/emoji')).json();
    for (const row of initial) seenIds.add(row.id);
    interval = setInterval(poll, 2000);
    thumbInterval = setInterval(() => {
      thumbIndex = Math.floor(Math.random() * EMOJIS.length);
    }, 2000);
  });

  onDestroy(() => { clearInterval(interval); clearInterval(thumbInterval); });
</script>

{#each flying as f (f.id)}
  <div class="flying" style="left:{f.x}%;font-size:{f.size}rem;animation-duration:{f.dur}s">{f.emoji}</div>
{/each}

<div class="cannon-wrap">
  {#if open}
    <div class="emoji-grid">
      {#each EMOJIS as e}
        <button onclick={() => shoot(e)}>{e}</button>
      {/each}
    </div>
  {/if}
  <button class="cannon-btn" onclick={() => (open = !open)} title="Emoji abfeuern">
    {open ? '✕' : EMOJIS[thumbIndex]}
  </button>
</div>

<style>
  .flying {
    position: fixed; bottom: 5rem; pointer-events: none; z-index: 9999;
    animation: fly-up linear forwards;
    line-height: 1;
  }
  @keyframes fly-up {
    0%   { transform: translateY(0) rotate(-10deg) scale(1); opacity: 1; }
    80%  { opacity: 1; }
    100% { transform: translateY(-92vh) rotate(25deg) scale(.6); opacity: 0; }
  }

  .cannon-wrap { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 500; display: flex; flex-direction: column; align-items: flex-end; gap: .5rem; }

  .cannon-btn {
    width: 46px; height: 46px; border-radius: 50%; border: 1px solid var(--border);
    background: #fff; cursor: pointer; font-size: 1.3rem;
    box-shadow: 0 2px 10px rgba(0,0,0,0.12); transition: transform .15s;
    display: flex; align-items: center; justify-content: center;
  }
  .cannon-btn:hover { transform: scale(1.1); }
  .cannon-btn:active { transform: scale(.92); transition: transform .08s; }

  .emoji-grid {
    background: #fff; border: 1px solid var(--border); border-radius: 14px;
    padding: .5rem; display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.12);
  }
  .emoji-grid button {
    border: none; background: none; cursor: pointer;
    font-size: 1.4rem; padding: 7px; border-radius: 8px; line-height: 1;
    transition: background .1s;
  }
  .emoji-grid button:hover { background: #f0f0f0; transform: scale(1.2); }
  .emoji-grid button:active { transform: scale(.9); transition: transform .08s; }
</style>

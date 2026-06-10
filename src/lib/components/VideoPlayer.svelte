<script lang="ts">
  let { src, poster = '' }: { src: string; poster?: string } = $props();

  let video = $state<HTMLVideoElement>();
  let playing = $state(false);
  let muted = $state(false);
  let current = $state(0);
  let duration = $state(0);

  function toggle() {
    if (!video) return;
    if (video.paused) video.play(); else video.pause();
  }
  function seek(e: Event) {
    if (!video) return;
    const t = +(e.target as HTMLInputElement).value;
    video.currentTime = t;
    current = t;
  }
  function toggleMute() {
    if (!video) return;
    video.muted = !video.muted;
    muted = video.muted;
  }
  function fullscreen() {
    video?.requestFullscreen?.();
  }
  function fmt(s: number) {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }
  let progress = $derived(duration ? (current / duration) * 100 : 0);
</script>

<div class="player">
  <!-- svelte-ignore a11y_media_has_caption -->
  <video
    bind:this={video}
    {src}
    poster={poster || undefined}
    playsinline
    preload="metadata"
    onclick={toggle}
    onplay={() => (playing = true)}
    onpause={() => (playing = false)}
    ontimeupdate={() => (current = video?.currentTime ?? 0)}
    onloadedmetadata={() => (duration = video?.duration ?? 0)}
  ></video>

  {#if !playing}
    <button class="big-play" onclick={toggle} aria-label="Abspielen">
      <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
    </button>
  {/if}

  <div class="controls" style="--p:{progress}%">
    <button class="ctrl" onclick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
      {#if playing}
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
      {:else}
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
      {/if}
    </button>
    <span class="time">{fmt(current)}</span>
    <input class="seek" type="range" min="0" max={duration || 0} step="0.1" value={current} oninput={seek} aria-label="Suchleiste" />
    <span class="time">{fmt(duration)}</span>
    <button class="ctrl" onclick={toggleMute} aria-label={muted ? 'Ton an' : 'Stumm'}>
      {#if muted}
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-1.3-3.2l-1.1 1.1A3 3 0 0 1 15 12a3 3 0 0 1-.9 2.1l1.1 1.1A4.5 4.5 0 0 0 16.5 12z" opacity=".5"/><path d="M19 12a7 7 0 0 0-3.5-6l-1 1.7A5 5 0 0 1 17 12a5 5 0 0 1-2.5 4.3l1 1.7A7 7 0 0 0 19 12z" opacity=".5"/></svg>
      {:else}
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4l0 8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>
      {/if}
    </button>
    <button class="ctrl" onclick={fullscreen} aria-label="Vollbild">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M4 9V4h5v2H6v3H4zm14 0V6h-3V4h5v5h-2zM4 15h2v3h3v2H4v-5zm14 0h2v5h-5v-2h3v-3z"/></svg>
    </button>
  </div>
</div>

<style>
  .player { position: relative; aspect-ratio: 4 / 3; background: #000; border-radius: 12px; overflow: hidden; }
  video { width: 100%; height: 100%; object-fit: contain; display: block; cursor: pointer; }

  .big-play {
    position: absolute; inset: 0; margin: auto; width: 64px; height: 64px;
    display: flex; align-items: center; justify-content: center;
    border: none; border-radius: 50%; cursor: pointer;
    background: rgba(0,0,0,0.55); color: #fff; backdrop-filter: blur(2px);
    transition: transform .15s, background .15s;
  }
  .big-play:hover { background: var(--accent); transform: scale(1.06); }
  .big-play svg { margin-left: 3px; }

  .controls {
    position: absolute; left: 0; right: 0; bottom: 0;
    display: flex; align-items: center; gap: .5rem;
    padding: .9rem .7rem .5rem;
    background: linear-gradient(transparent, rgba(0,0,0,0.65));
    opacity: 0; transition: opacity .2s;
  }
  .player:hover .controls, .player:focus-within .controls { opacity: 1; }

  .ctrl { display: flex; align-items: center; justify-content: center; background: none; border: none; color: #fff; cursor: pointer; padding: 3px; flex-shrink: 0; opacity: .9; transition: opacity .12s; }
  .ctrl:hover { opacity: 1; }
  .time { font-size: 11px; color: #fff; font-variant-numeric: tabular-nums; font-family: var(--sans); flex-shrink: 0; }

  .seek { flex: 1; min-width: 0; height: 4px; cursor: pointer; accent-color: var(--accent); }
</style>

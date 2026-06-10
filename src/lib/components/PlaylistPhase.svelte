<script lang="ts">
  import VideoPlayer from './VideoPlayer.svelte';

  const MAX_PICKS = 3;

  let { songs, myVotes, onaddpick, ontogglepick, afterHero }: {
    songs: any[];
    myVotes: number[];
    onaddpick: (track: { spotifyId: string; title: string; artist: string; image: string | null }) => void;
    ontogglepick: (songId: number) => void;
    afterHero?: import('svelte').Snippet;
  } = $props();

  let pickCount = $derived(myVotes.length);
  let atMax = $derived(pickCount >= MAX_PICKS);

  let query = $state('');
  let results = $state<any[]>([]);
  let searching = $state(false);
  let notConfigured = $state(false);
  let timer: ReturnType<typeof setTimeout>;

  function onInput() {
    clearTimeout(timer);
    const q = query.trim();
    if (!q) { results = []; searching = false; return; }
    searching = true;
    timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/songs/search?q=${encodeURIComponent(q)}`);
        const d = await res.json();
        notConfigured = res.status === 503 || d.error === 'spotify_not_configured';
        results = d.results ?? [];
      } catch {
        results = [];
      }
      searching = false;
    }, 300);
  }

  function add(track: any) {
    if (atMax) return;
    onaddpick(track);
    query = ''; results = [];
  }
</script>

<div class="hero">
  <div class="eyebrow">Für die Ohren</div>
  <h1>Deine <em>Top 3</em></h1>
  <p class="hero-sub">Such deine 3 Lieblingssongs für die Party. Je öfter ein Song gewählt wird, desto weiter wandert er nach oben — die Top-Tracks landen in der Playlist.</p>
</div>

{@render afterHero?.()}

<div class="section">
  <div class="pick-bar">
    <span class="pick-count" class:full={atMax}>Deine Picks: {pickCount}/{MAX_PICKS}</span>
  </div>

  <div class="search-wrap">
    <input
      class="search-input"
      bind:value={query}
      oninput={onInput}
      placeholder={atMax ? 'Max. 3 erreicht — erst einen entfernen' : 'Song suchen …'}
      disabled={atMax}
    />
    {#if query.trim() && !atMax}
      <div class="search-results">
        {#if notConfigured}
          <div class="search-msg">Spotify-Suche ist noch nicht eingerichtet.</div>
        {:else if searching}
          <div class="search-msg">Suche …</div>
        {:else if results.length === 0}
          <div class="search-msg">Nichts gefunden.</div>
        {:else}
          {#each results as t}
            <button class="result-row" onclick={() => add(t)}>
              {#if t.image}<img class="cover" src={t.image} alt="" />{:else}<div class="cover ph">🎵</div>{/if}
              <div class="result-body">
                <span class="result-title">{t.title}</span>
                <span class="result-artist">{t.artist}</span>
              </div>
              <span class="result-add">＋</span>
            </button>
          {/each}
        {/if}
      </div>
    {/if}
  </div>

  <div class="song-list">
    {#each songs as song, i}
      <div class="song-card" style="--i:{i}">
        <div class="song-rank">{i + 1}</div>
        {#if song.image}<img class="cover" src={song.image} alt="" />{:else}<div class="cover ph">🎵</div>{/if}
        <div class="song-body">
          <span class="song-title">{song.title}</span>
          <span class="song-artist">{song.artist}</span>
        </div>
        <div class="like-wrap">
          <button
            class="like-pill"
            class:liked={myVotes.includes(song.id)}
            disabled={!myVotes.includes(song.id) && atMax}
            onclick={() => ontogglepick(song.id)}
            title={myVotes.includes(song.id) ? 'Pick entfernen' : atMax ? 'Max. 3 erreicht' : 'Auch wählen'}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 14s-6-3.9-6-8a4 4 0 0 1 6-3.46A4 4 0 0 1 14 6c0 4.1-6 8-6 8z"/></svg>
            {song.votes}
          </button>
          {#if song.likers?.length}
            <div class="like-tooltip">{song.likers.join(', ')}</div>
          {/if}
        </div>
      </div>
    {/each}
    {#if songs.length === 0}<p class="empty">Noch keine Songs.<br />Such deinen ersten Track. 🎧</p>{/if}
  </div>

  <div class="vibe">
    <h4 class="vibe-title">5000W Bassmachine</h4>
    <VideoPlayer src="/aULpFqR8APQ.mp4" poster="/aULpFqR8APQ.jpg" ratio="352 / 162" fit="cover" />
  </div>
</div>

<style>
  @keyframes item-up {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .pick-bar { display: flex; justify-content: flex-end; margin-bottom: .6rem; }
  .pick-count { font-size: 12px; font-weight: 600; color: var(--ink3); }
  .pick-count.full { color: var(--accent); }

  .search-wrap { position: relative; margin-bottom: 1.5rem; }
  .search-input { width: 100%; padding: 11px 14px; border: 1.5px solid var(--border); border-radius: 10px; font-size: 16px; font-family: var(--sans); background: var(--surface); color: var(--ink); outline: none; transition: border-color .15s; }
  .search-input:focus { border-color: var(--accent); }
  .search-input:disabled { opacity: .55; cursor: not-allowed; }
  .search-results { position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); z-index: 20; overflow: hidden; max-height: 22rem; overflow-y: auto; }
  .search-msg { padding: .9rem 1rem; font-size: 13px; color: var(--ink3); text-align: center; }
  .result-row { display: flex; align-items: center; gap: .7rem; width: 100%; padding: .55rem .75rem; background: none; border: none; border-bottom: 1px solid var(--border); cursor: pointer; font-family: var(--sans); text-align: left; transition: background .12s; }
  .result-row:last-child { border-bottom: none; }
  .result-row:hover { background: var(--muted); }
  .result-body { flex: 1; min-width: 0; }
  .result-title { display: block; font-size: 14px; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .result-artist { display: block; font-size: 12px; color: var(--ink3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .result-add { flex-shrink: 0; font-size: 18px; color: var(--accent); font-weight: 600; }

  .cover { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
  .cover.ph { display: flex; align-items: center; justify-content: center; background: var(--muted); font-size: 18px; }

  .song-list { display: flex; flex-direction: column; gap: .6rem; margin-bottom: 1.5rem; }
  .song-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: .6rem .85rem; display: flex; align-items: center; gap: .7rem; animation: item-up 0.35s ease-out calc(var(--i,0) * 60ms + 50ms) backwards; }
  .song-rank { font-family: var(--serif); font-size: 1.1rem; color: var(--ink3); min-width: 1.2rem; text-align: center; flex-shrink: 0; }
  .song-body { flex: 1; min-width: 0; }
  .song-title { font-size: 14px; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .song-artist { font-size: 12px; color: var(--ink3); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .like-wrap { position: relative; flex-shrink: 0; }
  .like-tooltip { position: absolute; bottom: calc(100% + 6px); right: 0; background: var(--ink); color: var(--paper); font-size: 11px; padding: 5px 10px; border-radius: 8px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity .15s; z-index: 10; }
  .like-tooltip::after { content: ''; position: absolute; top: 100%; right: 12px; border: 5px solid transparent; border-top-color: var(--ink); }
  .like-wrap:hover .like-tooltip { opacity: 1; }
  .like-pill { display: flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 100px; border: 1px solid var(--border); background: none; cursor: pointer; font-size: 13px; font-family: var(--sans); color: var(--ink3); transition: all .15s; }
  .like-pill:disabled { opacity: .4; cursor: not-allowed; }
  .like-pill:not(:disabled):hover { border-color: color-mix(in srgb, var(--accent) 50%, transparent); color: var(--accent); }
  .like-pill.liked { background: color-mix(in srgb, var(--accent) 12%, transparent); border-color: var(--accent); color: var(--accent); }

  .vibe { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border); }
  .vibe-title { font-size: 13px; font-weight: 600; color: var(--ink2); text-align: center; margin-bottom: .75rem; }
</style>

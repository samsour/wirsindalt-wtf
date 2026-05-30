<script lang="ts">
  let { authName = $bindable(''), authMotto = $bindable(''), authError, authLoading, mottoHint, onlogin }: {
    authName?: string;
    authMotto?: string;
    authError: string;
    authLoading: boolean;
    mottoHint: string;
    onlogin: () => void;
  } = $props();
</script>

<div class="gate-bg">
  <div class="gate-card">
    {#if mottoHint}
      <div class="motto-stamp" aria-hidden="true">{mottoHint}</div>
    {/if}
    <div class="gate-year">2016 → 2026</div>
    <h1 class="gate-title">Zeig, dass du dabei warst.</h1>
    <p class="gate-sub">
      Wie lautete unser Abi-Motto?
      <span class="gate-tip" aria-label="Hinweis">ℹ︎
        <span class="gate-tip-text">Das mit dem Captain Blaubährt, komm schon…</span>
      </span>
    </p>
    <input class="gate-input" bind:value={authMotto} placeholder="Abi-Motto eingeben…" onkeydown={e => e.key === 'Enter' && onlogin()} />
    <input class="gate-input" bind:value={authName} placeholder="Dein Name" onkeydown={e => e.key === 'Enter' && onlogin()} />
    {#if authError}<p class="gate-error">{authError}</p>{/if}
    <button class="btn btn-primary gate-btn" onclick={onlogin} disabled={authLoading}>
      {authLoading ? 'Limes gegen Null geht auf' : 'Rein da →'}
    </button>
    <p class="gate-hint">Kein Account nötig — nur dein Name und das Motto.</p>
  </div>
</div>

<style>
  .gate-bg { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; background: #faf9f6; }
  .gate-card { background: #fff; border: 1px solid var(--border); border-radius: 16px; padding: 3rem 2.5rem; max-width: 420px; width: 100%; text-align: center; position: relative; overflow: hidden; }
  .motto-stamp { position: absolute; top: 38%; left: 50%; transform: translate(-50%, -50%) rotate(-12deg); background: #fffbe6; border: 2px solid #c8a400; border-radius: 5px; padding: 4px 12px; font-family: var(--serif); font-size: .8rem; color: #8a6a00; white-space: nowrap; pointer-events: none; z-index: 10; box-shadow: 2px 2px 0 rgba(0,0,0,0.07); letter-spacing: .02em; animation: stamp-in .2s ease-out; }
  @keyframes stamp-in {
    from { transform: translate(-50%, -50%) rotate(-12deg) scale(.7); opacity: 0; }
    to   { transform: translate(-50%, -50%) rotate(-12deg) scale(1);  opacity: 1; }
  }
  .gate-year { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: var(--accent); font-weight: 500; margin-bottom: 1rem; }
  .gate-title { font-family: var(--serif); font-size: 2rem; margin-bottom: .5rem; line-height: 1.2; }
  .gate-sub { color: var(--ink2); font-size: 14px; margin-bottom: 1.5rem; }
  .gate-tip { position: relative; display: inline-flex; align-items: center; justify-content: center; cursor: default; font-size: 11px; color: var(--ink3); vertical-align: middle; margin-left: 4px; width: 16px; height: 16px; border-radius: 50%; background: #eee; }
  .gate-tip-text { visibility: hidden; opacity: 0; position: absolute; top: calc(100% + 6px); right: 0; background: var(--ink); color: #fff; font-size: 12px; white-space: nowrap; padding: 5px 10px; border-radius: 6px; transition: opacity .15s; pointer-events: none; }
  .gate-tip-text::after { content: ''; position: absolute; bottom: 100%; right: 8px; border: 5px solid transparent; border-bottom-color: var(--ink); }
  .gate-tip:hover .gate-tip-text { visibility: visible; opacity: 1; }
  .gate-input { display: block; width: 100%; padding: 11px 14px; border: 1px solid var(--border); border-radius: 8px; font-size: 15px; font-family: var(--sans); background: #faf9f6; margin-bottom: .75rem; outline: none; }
  .gate-input:focus { border-color: var(--accent); }
  .gate-error { color: var(--red); font-size: 13px; margin: .5rem 0; }
  .gate-btn { width: 100%; justify-content: center; margin-top: .5rem; }
  .gate-hint { font-size: 12px; color: var(--ink3); margin-top: 1rem; }
</style>

<script lang="ts">
  import { onMount } from 'svelte';

  let { userName, phase, maxPhase, onlineCount = 0, onlineNames = [], onlogout, onphase, onplaylist }: {
    userName: string;
    phase: number;
    maxPhase: number;
    onlineCount?: number;
    onlineNames?: string[];
    onlogout: () => void;
    onphase: (p: number) => void;
    onplaylist?: () => void;
  } = $props();

  const steps = ['Wann klappt\'s?', 'Uhrzeit?', 'Wer ist dabei?', 'Wo, was und wie?'];

  function initials(name: string) {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  }

  let showOnline = $state(false);
  let menuOpen = $state(false);
  let theme = $state<'auto' | 'light' | 'dark'>('auto');

  onMount(() => {
    theme = (localStorage.getItem('abi2016_theme') as 'auto' | 'light' | 'dark') ?? 'auto';
  });

  function setTheme(t: 'auto' | 'light' | 'dark') {
    theme = t;
    localStorage.setItem('abi2016_theme', t);
    if (t === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
  }
</script>

{#if menuOpen}
  <button class="menu-backdrop" onclick={() => (menuOpen = false)} aria-label="Menü schließen"></button>
{/if}

<header class="app-header">
  <div class="header-top">
    <img src="/immerblau.png" class="nav-logo-img" alt="ABI '16" />

    {#if onlineCount > 0}
      <div class="online-wrap">
        <button class="online-pill" onclick={() => (showOnline = !showOnline)}>
          <span class="online-dot"></span>{onlineCount} gerade hier
        </button>
        {#if showOnline}
          <div class="online-popover">
            {#each onlineNames as name}
              <div class="online-row">
                <div class="online-avatar">{initials(name)}</div>
                <span class="online-name">{name}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <div class="menu-wrap">
      <button class="hamburger" onclick={() => (menuOpen = !menuOpen)} aria-label="Menü öffnen">
        <span class="bar" class:open={menuOpen}></span>
        <span class="bar" class:open={menuOpen}></span>
        <span class="bar" class:open={menuOpen}></span>
      </button>

      {#if menuOpen}
        <div class="menu-popover">
          <div class="menu-user">
            <div class="user-avatar">{initials(userName)}</div>
            <span class="menu-username">{userName}</span>
          </div>
          <div class="menu-divider"></div>
          <div class="menu-theme">
            <button class="theme-btn" class:active={theme === 'auto'}  onclick={() => setTheme('auto')}>Auto</button>
            <button class="theme-btn" class:active={theme === 'light'} onclick={() => setTheme('light')}>☀️</button>
            <button class="theme-btn" class:active={theme === 'dark'}  onclick={() => setTheme('dark')}>🌙</button>
          </div>
          <div class="menu-divider"></div>
          {#if onplaylist}
            <button class="menu-item" onclick={() => { menuOpen = false; onplaylist(); }}>
              🎵
              <span class="menu-item-label">
                Playlist
                <span class="menu-tag">experimentell</span>
              </span>
            </button>
            <div class="menu-divider"></div>
          {/if}
          <button class="menu-logout" onclick={() => { menuOpen = false; onlogout(); }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/><path d="M11 12l4-4-4-4"/><line x1="15" y1="8" x2="7" y2="8"/>
            </svg>
            Ausloggen
          </button>
        </div>
      {/if}
    </div>
  </div>

  <div class="stepper">
    {#each steps as label, i}
      <div class="step" class:active={i === phase} class:done={i < phase}
        role="button"
        tabindex={i !== phase ? 0 : -1}
        onclick={i !== phase ? () => onphase(i) : undefined}
        onkeydown={i !== phase ? (e) => e.key === 'Enter' && onphase(i) : undefined}
        style={`${i !== phase ? 'cursor:pointer;' : ''}--i:${i}`}>
        <div class="step-circle">
          {#if i < maxPhase}✓{:else}{i + 1}{/if}
        </div>
        <span class="step-label">{label}</span>
      </div>
      {#if i < steps.length - 1}
        <div class="step-line" class:filled={i < maxPhase} style="--i:{i}"></div>
      {/if}
    {/each}
  </div>
</header>

<style>
  @keyframes header-down {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pop-in {
    from { opacity: 0; transform: scale(0.3); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes grow-right {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }

  .app-header { background: var(--surface); border-bottom: 1px solid var(--border); animation: header-down 0.3s ease-out backwards; }

  .header-top { display: flex; align-items: center; justify-content: space-between; padding: .75rem 1.5rem; }

  .nav-logo-img { height: 44px; width: 44px; border-radius: 12px; object-fit: cover; flex-shrink: 0; }

  .online-wrap { position: relative; margin-left: .5rem; }
  .online-pill { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--ink3); background: none; border: none; cursor: pointer; padding: 2px 0; font-family: var(--sans); }
  .online-pill:hover { color: var(--ink); }
  .online-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); flex-shrink: 0; animation: pulse 2s ease-in-out infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }

  .online-popover {
    position: absolute; top: calc(100% + 8px); left: 0;
    background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
    padding: .4rem; display: flex; flex-direction: column; gap: .15rem;
    box-shadow: 0 4px 16px rgba(0,0,0,0.1); z-index: 200;
    min-width: 160px; max-height: 280px; overflow-y: auto;
  }
  .online-row { display: flex; align-items: center; gap: .5rem; padding: .3rem .4rem; border-radius: 8px; }
  .online-avatar {
    width: 28px; height: 28px; border-radius: 50%;
    background: #f0e8e0; color: var(--accent); flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 600;
  }
  .online-name { font-size: 13px; color: var(--ink); white-space: nowrap; }

  .menu-backdrop { position: fixed; inset: 0; z-index: 150; background: none; border: none; cursor: default; }

  .menu-wrap { position: relative; }

  .hamburger { display: flex; flex-direction: column; justify-content: center; gap: 5px; width: 36px; height: 36px; padding: 6px; background: none; border: none; border-radius: 8px; cursor: pointer; }
  .hamburger:hover { background: var(--muted); }
  .bar { display: block; height: 1.5px; background: var(--ink); border-radius: 2px; transition: all .2s; }
  .bar.open:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
  .bar.open:nth-child(2) { opacity: 0; }
  .bar.open:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

  .menu-popover {
    position: absolute; top: calc(100% + 8px); right: 0;
    background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.1); z-index: 200;
    min-width: 180px; overflow: hidden;
  }

  .menu-user { display: flex; align-items: center; gap: 10px; padding: .9rem 1rem; }
  .user-avatar { width: 32px; height: 32px; border-radius: 50%; background: #f0e8e0; color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; flex-shrink: 0; }
  .menu-username { font-size: 14px; font-weight: 500; color: var(--ink); }

  .menu-divider { height: 1px; background: var(--border); }

  .menu-theme { display: flex; gap: .4rem; padding: .6rem 1rem; }
  .theme-btn { flex: 1; padding: .35rem .25rem; border: 1px solid var(--border); border-radius: 8px; background: none; cursor: pointer; font-size: 12px; font-family: var(--sans); color: var(--ink3); transition: all .12s; }
  .theme-btn:hover { background: var(--muted); color: var(--ink); }
  .theme-btn.active { background: var(--ink); color: var(--paper); border-color: var(--ink); }
  .menu-logout { display: flex; align-items: center; gap: 8px; width: 100%; padding: .75rem 1rem; background: none; border: none; cursor: pointer; font-size: 14px; font-family: var(--sans); color: var(--ink3); transition: all .12s; }
  .menu-logout:hover { background: var(--muted); color: var(--red); }
  .menu-item { display: flex; align-items: center; gap: 8px; width: 100%; padding: .75rem 1rem; background: none; border: none; cursor: pointer; font-size: 14px; font-family: var(--sans); color: var(--ink); transition: all .12s; }
  .menu-item:hover { background: var(--muted); }
  .menu-item-label { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; }
  .menu-tag { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; color: var(--accent); border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent); border-radius: 5px; padding: 1px 5px; }

  .stepper { display: flex; align-items: center; padding: 0 1.5rem 2.5rem; }
  .step { position: relative; flex-shrink: 0; }
  .step-circle { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; border: 2px solid var(--border); background: var(--surface); color: var(--ink3); transition: all .2s; animation: pop-in 0.35s cubic-bezier(0.34,1.56,0.64,1) calc(var(--i,0) * 90ms + 200ms) backwards; }
  .step.active .step-circle { border-color: var(--accent); color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, var(--surface)); }
  .step.done .step-circle { border-color: var(--green); background: var(--green); color: #fff; }
  .step-label { position: absolute; top: calc(100% + 6px); left: 50%; transform: translateX(-50%); width: 4.75rem; text-align: center; line-height: 1.2; font-size: 10px; font-weight: 500; color: var(--ink3); letter-spacing: .2px; }
  .step.active .step-label { color: var(--accent); font-weight: 600; }
  .step.done .step-label { color: var(--green); }
  .step-line { flex: 1; height: 2px; background: var(--border); margin: 0 6px; transition: background .3s; transform-origin: left; animation: grow-right 0.4s ease-out calc(var(--i,0) * 90ms + 280ms) backwards; }
  .step-line.filled { background: var(--green); }
</style>

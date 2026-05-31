<script lang="ts">
  let { userName, phase, maxPhase, onlineCount = 0, onlineNames = [], onlogout, onphase }: {
    userName: string;
    phase: number;
    maxPhase: number;
    onlineCount?: number;
    onlineNames?: string[];
    onlogout: () => void;
    onphase: (p: number) => void;
  } = $props();

  const steps = ['Wann klappt\'s?', 'Wer ist dabei?', 'Was, wie wo?'];

  function initials(name: string) {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  }

  let showOnline = $state(false);
  let menuOpen = $state(false);
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
              <div class="online-avatar" title={name}>{initials(name)}</div>
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
      <div class="step" class:active={i === phase} class:done={i < phase} class:upcoming={i > maxPhase}
        role={i >= 1 && i <= maxPhase ? 'button' : undefined}
        tabindex={i >= 1 && i <= maxPhase ? 0 : undefined}
        onclick={i >= 1 && i <= maxPhase ? () => onphase(i) : undefined}
        onkeydown={i >= 1 && i <= maxPhase ? (e) => e.key === 'Enter' && onphase(i) : undefined}
        style={i >= 1 && i <= maxPhase ? 'cursor:pointer' : ''}>
        <div class="step-circle">
          {#if i < maxPhase}✓{:else}{i + 1}{/if}
        </div>
        <span class="step-label">{label}</span>
      </div>
      {#if i < steps.length - 1}
        <div class="step-line" class:filled={i < maxPhase}></div>
      {/if}
    {/each}
  </div>
</header>

<style>
  .app-header { background: #fff; border-bottom: 1px solid var(--border); }

  .header-top { display: flex; align-items: center; justify-content: space-between; padding: .75rem 1.5rem; }

  .nav-logo-img { height: 44px; width: 44px; border-radius: 12px; object-fit: cover; flex-shrink: 0; }

  .online-wrap { position: relative; margin-left: .5rem; }
  .online-pill { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--ink3); background: none; border: none; cursor: pointer; padding: 2px 0; font-family: var(--sans); }
  .online-pill:hover { color: var(--ink); }
  .online-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); flex-shrink: 0; animation: pulse 2s ease-in-out infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }

  .online-popover {
    position: absolute; top: calc(100% + 8px); left: 0;
    background: #fff; border: 1px solid var(--border); border-radius: 12px;
    padding: .6rem; display: flex; flex-wrap: wrap; gap: .4rem;
    box-shadow: 0 4px 16px rgba(0,0,0,0.1); z-index: 200;
    min-width: 120px;
  }
  .online-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: #f0e8e0; color: var(--accent);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 600;
  }

  .menu-backdrop { position: fixed; inset: 0; z-index: 150; background: none; border: none; cursor: default; }

  .menu-wrap { position: relative; }

  .hamburger { display: flex; flex-direction: column; justify-content: center; gap: 5px; width: 36px; height: 36px; padding: 6px; background: none; border: none; border-radius: 8px; cursor: pointer; }
  .hamburger:hover { background: #f5f5f5; }
  .bar { display: block; height: 1.5px; background: var(--ink); border-radius: 2px; transition: all .2s; }
  .bar.open:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
  .bar.open:nth-child(2) { opacity: 0; }
  .bar.open:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

  .menu-popover {
    position: absolute; top: calc(100% + 8px); right: 0;
    background: #fff; border: 1px solid var(--border); border-radius: 14px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.1); z-index: 200;
    min-width: 180px; overflow: hidden;
  }

  .menu-user { display: flex; align-items: center; gap: 10px; padding: .9rem 1rem; }
  .user-avatar { width: 32px; height: 32px; border-radius: 50%; background: #f0e8e0; color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; flex-shrink: 0; }
  .menu-username { font-size: 14px; font-weight: 500; color: var(--ink); }

  .menu-divider { height: 1px; background: var(--border); }

  .menu-logout { display: flex; align-items: center; gap: 8px; width: 100%; padding: .75rem 1rem; background: none; border: none; cursor: pointer; font-size: 14px; font-family: var(--sans); color: var(--ink3); transition: all .12s; }
  .menu-logout:hover { background: #fdecea; color: var(--red); }

  .stepper { display: flex; align-items: center; padding: 0 1.5rem 1rem; overflow-x: auto; scrollbar-width: none; }
  .stepper::-webkit-scrollbar { display: none; }
  .step { display: flex; flex-direction: column; align-items: center; gap: 5px; }
  .step-circle { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; border: 2px solid var(--border); background: #fff; color: var(--ink3); transition: all .2s; }
  .step.active .step-circle { border-color: var(--accent); color: var(--accent); background: #fff8f5; }
  .step.done .step-circle { border-color: var(--green); background: var(--green); color: #fff; }
  .step.upcoming .step-circle { opacity: .4; }
  .step-label { font-size: 10px; font-weight: 500; color: var(--ink3); white-space: nowrap; letter-spacing: .2px; }
  .step.active .step-label { color: var(--accent); font-weight: 600; }
  .step.done .step-label { color: var(--green); }
  .step.upcoming .step-label { opacity: .4; }
  .step-line { flex: 1; height: 2px; background: var(--border); margin: 0 8px 15px; transition: background .3s; }
  .step-line.filled { background: var(--green); }
</style>

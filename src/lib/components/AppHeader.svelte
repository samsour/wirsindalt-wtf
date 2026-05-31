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
</script>

<header class="app-header">
  <div class="header-top">
    <span class="nav-logo">ABI '16</span>

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

    <button class="nav-user" onclick={onlogout} title="Ausloggen">
      <span class="user-avatar">{initials(userName)}</span>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/><path d="M11 12l4-4-4-4"/><line x1="15" y1="8" x2="7" y2="8"/>
      </svg>
    </button>
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
  .nav-logo { font-family: var(--serif); font-size: 18px; color: var(--accent); }

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

  .nav-user { display: flex; align-items: center; gap: 7px; padding: 5px 10px 5px 5px; border: 1px solid var(--border); border-radius: 8px; background: none; cursor: pointer; font-family: var(--sans); font-size: 13px; color: var(--ink3); transition: all .15s; }
  .nav-user:hover { background: #fdf4f4; border-color: #f5c0c0; color: var(--red); }
  .nav-user:hover .user-avatar { background: #fdecea; color: var(--red); }
  .user-avatar { width: 28px; height: 28px; border-radius: 50%; background: #f0e8e0; color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; flex-shrink: 0; transition: all .15s; }

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

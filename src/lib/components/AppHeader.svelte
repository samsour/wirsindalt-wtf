<script lang="ts">
  let { userName, phase, maxPhase, onlogout, onphase }: {
    userName: string;
    phase: number;
    maxPhase: number;
    onlogout: () => void;
    onphase: (p: number) => void;
  } = $props();

  const steps = ['Wann klappt\'s?', 'Ich bin dabei!', 'Wer bringt was?'];

  function initials(name: string) {
    return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  }
</script>

<header class="app-header">
  <div class="header-top">
    <span class="nav-logo">ABI '16</span>
    <button class="nav-user" onclick={onlogout} title="Ausloggen">
      <span class="user-avatar">{initials(userName)}</span>
      <span class="user-name">{userName}</span>
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
  .app-header { background: #fff; border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; }

  .header-top { display: flex; align-items: center; justify-content: space-between; padding: .75rem 1.5rem; }
  .nav-logo { font-family: var(--serif); font-size: 18px; color: var(--accent); }
  .nav-user { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border: 1px solid var(--border); border-radius: 8px; background: none; cursor: pointer; font-family: var(--sans); font-size: 13px; color: var(--ink2); }
  .nav-user:hover { background: #f5f5f5; }
  .user-avatar { width: 26px; height: 26px; border-radius: 50%; background: #f0e8e0; color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; flex-shrink: 0; }
  .user-name { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .stepper { display: flex; align-items: center; padding: 0 1.5rem 1rem; }
  .step { display: flex; flex-direction: column; align-items: center; gap: 5px; }
  .step-circle {
    width: 30px; height: 30px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 600;
    border: 2px solid var(--border);
    background: #fff; color: var(--ink3);
    transition: all .2s;
  }
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

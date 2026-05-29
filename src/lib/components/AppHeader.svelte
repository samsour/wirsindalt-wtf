<script lang="ts">
  let { userName, phase, onlogout, onphase }: {
    userName: string;
    phase: number;
    onlogout: () => void;
    onphase: (p: number) => void;
  } = $props();

  function initials(name: string) {
    return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  }
</script>

<nav>
  <div class="nav-logo">ABI '16</div>
  <div class="nav-phases">
    {#each [['Terminwahl', 0], ['Anmeldung', 1], ['Planung', 2]] as [label, i]}
      <button class="nav-phase" class:active={phase === i} class:done={phase > i} onclick={() => onphase(i)}>
        <span class="phase-dot"></span> Phase {i + 1} · {label}
      </button>
    {/each}
  </div>
  <button class="nav-user" onclick={onlogout} title="Ausloggen">
    <span class="user-avatar">{initials(userName)}</span>
    <span class="user-name">{userName}</span>
  </button>
</nav>

<style>
  nav { display: flex; align-items: center; gap: 0; border-bottom: 1px solid var(--border); background: #fff; padding: 0 1.5rem; position: sticky; top: 0; z-index: 100; }
  .nav-logo { font-family: var(--serif); font-size: 18px; color: var(--accent); padding: 1rem 1.25rem 1rem 0; border-right: 1px solid var(--border); margin-right: 1.25rem; white-space: nowrap; }
  .nav-phases { display: flex; flex: 1; overflow-x: auto; }
  .nav-phase { display: flex; align-items: center; gap: 7px; padding: 0 1rem; height: 54px; font-size: 13px; font-weight: 500; color: var(--ink3); cursor: pointer; border: none; background: none; border-bottom: 2px solid transparent; transition: all .18s; white-space: nowrap; }
  .nav-phase:hover { color: var(--ink); }
  .nav-phase.active { color: var(--ink); border-bottom-color: var(--accent); }
  .nav-phase.done { color: var(--green); }
  .phase-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; opacity: .45; }
  .nav-phase.active .phase-dot, .nav-phase.done .phase-dot { opacity: 1; }
  .nav-user { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border: 1px solid var(--border); border-radius: 8px; background: none; cursor: pointer; font-family: var(--sans); font-size: 13px; color: var(--ink2); margin-left: auto; flex-shrink: 0; }
  .nav-user:hover { background: #f5f5f5; }
  .user-avatar { width: 26px; height: 26px; border-radius: 50%; background: #f0e8e0; color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 500; }
  .user-name { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>

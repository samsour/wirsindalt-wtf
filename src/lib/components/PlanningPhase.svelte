<script lang="ts">
  let {
    ideas, myIdeaVotes, contributions, locations, userId,
    planTab = $bindable<'contrib' | 'ideas' | 'locations'>('contrib'),
    newContribItem = $bindable(''), newContribCat = $bindable('Essen'),
    newIdeaText = $bindable(''), newIdeaTag = $bindable('Programm'),
    newLocDesc = $bindable(''), newLocAddr = $bindable(''),
    onaddcontrib, ondeletecontrib, onaddidea, ontoggleideavote, onaddlocation, onback, onshare,
  }: {
    ideas: any[];
    myIdeaVotes: number[];
    contributions: any[];
    locations: any[];
    userId: number;
    planTab?: 'contrib' | 'ideas' | 'locations';
    newContribItem?: string;
    newContribCat?: string;
    newIdeaText?: string;
    newIdeaTag?: string;
    newLocDesc?: string;
    newLocAddr?: string;
    onaddcontrib: () => void;
    ondeletecontrib: (id: number) => void;
    onaddidea: () => void;
    ontoggleideavote: (id: number) => void;
    onaddlocation: () => void;
    onback: () => void;
    onshare: () => void;
  } = $props();

  function initials(name: string) {
    return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  }

  const catClass: Record<string, string> = {
    Essen: 'badge-food', Getränke: 'badge-drinks', Equipment: 'badge-equipment', Sonstiges: 'badge-other',
  };
</script>

<div class="hero">
  <div class="eyebrow">Phase 3 · Planung</div>
  <h1>Lass uns <em>planen!</em></h1>
  <p class="hero-sub">Wer bringt was? Welche Ideen haben wir? Wo feiern wir?</p>
</div>

<div class="section">
  <div class="plan-tabs">
    {#each [['contrib','🙋 Mitbringen'], ['ideas','💡 Ideen'], ['locations','📍 Ort']] as [tab, label]}
      <button class="plan-tab" class:active={planTab === tab} onclick={() => (planTab = tab)}>{label}</button>
    {/each}
  </div>

  {#if planTab === 'contrib'}
    <div class="contrib-list">
      {#each contributions as c}
        <div class="contrib-card">
          <div class="avatar">{initials(c.user_name)}</div>
          <div class="contrib-info">
            <div class="contrib-name">{c.user_name}</div>
            <div class="contrib-item">{c.item}</div>
          </div>
          <span class="badge {catClass[c.category] ?? 'badge-other'}">{c.category}</span>
          {#if userId === c.user_id}
            <button class="del-btn" onclick={() => ondeletecontrib(c.id)} title="Löschen">✕</button>
          {/if}
        </div>
      {/each}
      {#if contributions.length === 0}
        <p class="empty">Noch keine Beiträge – sei die/der Erste!</p>
      {/if}
    </div>
    <div class="add-box">
      <h4>+ Ich bringe etwas mit</h4>
      <div class="form-2col">
        <div class="form-row">
          <label>Was bringst du mit?</label>
          <input bind:value={newContribItem} placeholder="z.B. Salat, Grill, Musik…" onkeydown={e => e.key === 'Enter' && onaddcontrib()} />
        </div>
        <div class="form-row">
          <label>Kategorie</label>
          <select bind:value={newContribCat}>
            <option>Essen</option><option>Getränke</option><option>Equipment</option><option>Sonstiges</option>
          </select>
        </div>
      </div>
      <button class="btn btn-primary btn-sm" onclick={onaddcontrib}>Eintragen</button>
    </div>

  {:else if planTab === 'ideas'}
    <div class="ideas-list">
      {#each ideas as idea}
        <div class="idea-card">
          <div class="idea-votes">
            <button class="idea-vote-btn" class:voted={myIdeaVotes.includes(idea.id)} onclick={() => ontoggleideavote(idea.id)}>▲</button>
            <span class="idea-count">{idea.votes}</span>
          </div>
          <span class="idea-text">{idea.text}</span>
          <span class="idea-tag">{idea.tag}</span>
        </div>
      {/each}
      {#if ideas.length === 0}<p class="empty">Noch keine Ideen – leg los!</p>{/if}
    </div>
    <div class="add-box">
      <h4>💡 Neue Idee</h4>
      <div style="display:flex;gap:.75rem;margin-bottom:.75rem;flex-wrap:wrap">
        <input bind:value={newIdeaText} placeholder="Deine Idee…" style="flex:1;min-width:200px;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-family:var(--sans);font-size:14px;background:var(--paper)" onkeydown={e => e.key === 'Enter' && onaddidea()} />
        <select bind:value={newIdeaTag} style="padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-family:var(--sans);font-size:13px;background:var(--paper)">
          <option>Programm</option><option>Deko</option><option>Musik</option><option>Spiel</option><option>Sonstiges</option>
        </select>
      </div>
      <button class="btn btn-primary btn-sm" onclick={onaddidea}>Einreichen</button>
    </div>

  {:else}
    <div class="contrib-list">
      {#each locations as loc}
        <div class="contrib-card">
          <div class="avatar" style="background:#e8f0f8;color:#2a5c8a">📍</div>
          <div class="contrib-info">
            <div class="contrib-name">{loc.description}</div>
            <div class="contrib-item">{loc.address || 'Keine Adresse angegeben'} · von {loc.user_name}</div>
          </div>
        </div>
      {/each}
      {#if locations.length === 0}<p class="empty">Noch kein Ort vorgeschlagen!</p>{/if}
    </div>
    <div class="add-box">
      <h4>📍 Ort vorschlagen</h4>
      <div class="form-row"><label>Beschreibung</label><input bind:value={newLocDesc} placeholder="z.B. Garten bei Familie Müller, Grillplatz Stadtpark…" /></div>
      <div class="form-row"><label>Adresse / Hinweis</label><input bind:value={newLocAddr} placeholder="Straße, PLZ oder Link" /></div>
      <button class="btn btn-primary btn-sm" onclick={onaddlocation}>Vorschlagen</button>
    </div>
  {/if}

  <div class="footer-nav">
    <button class="btn btn-outline" onclick={onback}>← Zurück</button>
    <button class="btn btn-primary" onclick={onshare}>Link teilen ↗</button>
  </div>
</div>

<style>
  .plan-tabs { display: flex; gap: .5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .plan-tab { padding: 7px 16px; border: 1px solid var(--border); border-radius: 100px; font-size: 13px; cursor: pointer; background: #fff; color: var(--ink2); font-family: var(--sans); transition: all .15s; }
  .plan-tab:hover { background: #f0f0f0; }
  .plan-tab.active { background: var(--ink); color: #fff; border-color: var(--ink); }
  .contrib-list { display: flex; flex-direction: column; gap: .65rem; margin-bottom: 1.5rem; }
  .contrib-card { background: #fff; border: 1px solid var(--border); border-radius: 10px; padding: .9rem 1.1rem; display: flex; align-items: center; gap: .9rem; }
  .avatar { width: 36px; height: 36px; border-radius: 50%; background: #f0e8e0; color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 500; flex-shrink: 0; }
  .contrib-info { flex: 1; min-width: 0; }
  .contrib-name { font-weight: 500; font-size: 13px; }
  .contrib-item { font-size: 12px; color: var(--ink2); }
  .badge { font-size: 11px; padding: 2px 10px; border-radius: 100px; font-weight: 500; flex-shrink: 0; }
  .badge-food { background: #e8f5e9; color: #2e7d32; }
  .badge-drinks { background: #e3f2fd; color: #1565c0; }
  .badge-equipment { background: #f3e5f5; color: #6a1b9a; }
  .badge-other { background: #f5f5f5; color: #555; }
  .del-btn { border: none; background: none; cursor: pointer; color: var(--ink3); font-size: 14px; padding: 4px; }
  .del-btn:hover { color: var(--red); }
  .ideas-list { display: flex; flex-direction: column; gap: .6rem; margin-bottom: 1.5rem; }
  .idea-card { background: #fff; border: 1px solid var(--border); border-radius: 10px; padding: .85rem 1rem; display: flex; align-items: center; gap: .75rem; }
  .idea-votes { display: flex; flex-direction: column; align-items: center; gap: 1px; min-width: 30px; }
  .idea-vote-btn { border: none; background: none; cursor: pointer; font-size: 14px; color: var(--ink3); transition: color .1s; line-height: 1; padding: 2px; }
  .idea-vote-btn:hover, .idea-vote-btn.voted { color: var(--accent); }
  .idea-count { font-family: var(--serif); font-size: 1rem; color: var(--ink); }
  .idea-text { flex: 1; font-size: 14px; }
  .idea-tag { font-size: 11px; padding: 2px 8px; border-radius: 100px; background: #f0f0f0; color: var(--ink2); flex-shrink: 0; }
</style>

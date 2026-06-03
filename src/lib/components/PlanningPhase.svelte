<script lang="ts">
  let {
    ideas, myIdeaVotes, contributions, locations, userId,
    planTab = $bindable<'contrib' | 'ideas' | 'locations'>('locations'),
    newContribItem = $bindable(''), newContribCat = $bindable('Essen'),
    newIdeaText = $bindable(''),
    newLocDesc = $bindable(''), newLocAddr = $bindable(''),
    onaddcontrib, ondeletecontrib, onaddidea, ondeleteidea, ontoggleideavote, onaddlocation, ondeletelocation, onstrikelocation, onunstrikelocation,
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
    newLocDesc?: string;
    newLocAddr?: string;
    onaddcontrib: () => void;
    ondeletecontrib: (id: number) => void;
    onaddidea: () => void;
    ondeleteidea: (id: number) => void;
    ontoggleideavote: (id: number) => void;
    onaddlocation: () => void;
    ondeletelocation: (id: number) => void;
    onstrikelocation: (id: number) => void;
    onunstrikelocation: (id: number) => void;
  } = $props();

  const catEmoji: Record<string, string> = {
    Essen: '🍕', Getränke: '🍺', Equipment: '🎒', Sonstiges: '✨',
  };
  const cats = Object.keys(catEmoji);
</script>

<div class="hero">
  <div class="eyebrow">Meeehr Plaaanung.</div>
  <h1>Wo, was, <em>und wie?</em></h1>
  <p class="hero-sub">Ein Ort wäre cool. Ansonsten einfach mal Brainstormen.<br />Kann jemand was mitbringen, wird irgendwas organisiert?<br />Seid kreativ!</p>
</div>

<div class="section">
  <div class="plan-tabs">
    {#each [['locations','📍 Ort'], ['contrib','🙋 Mitbringen'], ['ideas','💡 Ideen']] as [tab, label]}
      <button class="plan-tab" class:active={planTab === tab} onclick={() => (planTab = tab)}>{label}</button>
    {/each}
  </div>

  {#if planTab === 'contrib'}
    <div class="contrib-list">
      {#each contributions as c}
        <div class="contrib-card">
          <div class="avatar cat-avatar">{catEmoji[c.category] ?? '✨'}</div>
          <div class="contrib-info">
            <div class="contrib-name">{c.item}</div>
            <div class="contrib-item">{c.user_name}</div>
          </div>
          {#if userId === c.user_id}
            <button class="icon-btn strike-btn" onclick={() => ondeletecontrib(c.id)} title="Löschen">✕</button>
          {/if}
        </div>
      {/each}
      {#if contributions.length === 0}
        <p class="empty">Noch keine Beiträge - kommmt rannnn!</p>
      {/if}
    </div>
    <div class="add-box">
      <h4>+ Ich bringe etwas mit</h4>
      <div class="cat-pills">
        {#each cats as cat}
          <button type="button" class="cat-pill" class:selected={newContribCat === cat} onclick={() => (newContribCat = cat)}>
            {catEmoji[cat]} {cat}
          </button>
        {/each}
      </div>
      <div class="form-row" style="margin-top:.75rem"><label for="contrib-item">Was bringst du mit?</label>
        <div style="display:flex;gap:.5rem">
          <input id="contrib-item" bind:value={newContribItem} placeholder="z.B. Salat, Grill, 5000W Bassmachine..." onkeydown={e => e.key === 'Enter' && onaddcontrib()} style="flex:1" />
          <button class="submit-icon-btn" onclick={onaddcontrib} title="Eintragen">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M9 3l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </div>
    </div>

  {:else if planTab === 'ideas'}
    <div class="ideas-list">
      {#each ideas as idea}
        <div class="idea-card">
          <div class="idea-body">
            <span class="idea-text">{idea.text}</span>
            <span class="idea-author">{idea.user_name}</span>
          </div>
          <div class="idea-actions">
            <button class="like-pill" class:liked={myIdeaVotes.includes(idea.id)} onclick={() => ontoggleideavote(idea.id)}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 14s-6-3.9-6-8a4 4 0 0 1 6-3.46A4 4 0 0 1 14 6c0 4.1-6 8-6 8z"/></svg>
              {idea.votes}
            </button>
            {#if userId === idea.user_id}
              <button class="icon-btn strike-btn" onclick={() => ondeleteidea(idea.id)} title="Löschen">✕</button>
            {/if}
          </div>
        </div>
      {/each}
      {#if ideas.length === 0}<p class="empty">Noch keine Beiträge.<br />Boa ist das langweilig hier.</p>{/if}
    </div>
    <div class="add-box">
      <h4>💡 Neue Idee</h4>
      <div class="form-row" style="margin-bottom:0">
        <div style="display:flex;gap:.5rem">
          <input bind:value={newIdeaText} placeholder="Bierpong Turnier, Karaoke, ..." style="flex:1" onkeydown={e => e.key === 'Enter' && onaddidea()} />
          <button class="submit-icon-btn" onclick={onaddidea} title="Einreichen">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M9 3l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </div>
    </div>

  {:else}
    <div class="contrib-list">
      {#each locations as loc}
        {@const struck = !!loc.struck}
        <div class="contrib-card" class:loc-struck={struck}>
          <div class="avatar" style="background:#e8f0f8;color:#2a5c8a">{struck ? '🚫' : '📍'}</div>
          <div class="contrib-info">
            <div class="contrib-name" class:strike={struck}>{loc.description}</div>
            <div class="contrib-item" class:strike={struck}>{[loc.address, `von ${loc.user_name}`].filter(Boolean).join(' · ')}</div>
            {#if struck}<div class="struck-label">Nicht verfügbar</div>{/if}
          </div>
          {#if struck}
            <button class="icon-btn restore" onclick={() => onunstrikelocation(loc.id)} title="Wiederherstellen">↩</button>
            <button class="icon-btn del-confirm" onclick={() => ondeletelocation(loc.id)} title="Endgültig löschen">🗑</button>
          {:else}
            <button class="icon-btn strike-btn" onclick={() => onstrikelocation(loc.id)} title="Als nicht verfügbar markieren">✕</button>
          {/if}
        </div>
      {/each}
      {#if locations.length === 0}<p class="empty">Noch kein Ort vorgeschlagen!<br />Irgendwo müssen wir aber hin :D</p>{/if}
    </div>
    <div class="add-box">
      <h4>📍 Ort vorschlagen</h4>
      <div class="form-row"><label>Beschreibung</label><input bind:value={newLocDesc} placeholder="z.B. Gänsi, Waldi, irgendne Halle, ..." onkeydown={e => e.key === 'Enter' && newLocAddr ? onaddlocation() : null} /></div>
      <div class="form-row"><label>Adresse / Hinweis</label>
        <div style="display:flex;gap:.5rem">
          <input bind:value={newLocAddr} placeholder="Straße, PLZ oder Link" onkeydown={e => e.key === 'Enter' && onaddlocation()} style="flex:1" />
          <button class="submit-icon-btn" onclick={onaddlocation} title="Vorschlagen">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M9 3l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </div>
    </div>
  {/if}

</div>

<style>
  .plan-tabs { display: flex; gap: .5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .plan-tab { padding: 7px 16px; border: 1px solid var(--border); border-radius: 100px; font-size: 13px; cursor: pointer; background: var(--surface); color: var(--ink2); font-family: var(--sans); transition: all .15s; }
  .plan-tab:hover { background: var(--muted); }
  .plan-tab.active { background: var(--ink); color: var(--paper); border-color: var(--ink); }
  .contrib-list { display: flex; flex-direction: column; gap: .65rem; margin-bottom: 1.5rem; }
  .contrib-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: .9rem 1.1rem; display: flex; align-items: center; gap: .9rem; }
  .avatar { width: 36px; height: 36px; border-radius: 50%; background: #f0e8e0; color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 500; flex-shrink: 0; }
  .cat-avatar { background: var(--muted); font-size: 18px; }
  .cat-pills { display: flex; gap: .4rem; flex-wrap: wrap; margin-bottom: .25rem; }
  .cat-pill { padding: 5px 12px; border-radius: 100px; border: 1px solid var(--border); background: var(--surface); font-size: 13px; cursor: pointer; font-family: var(--sans); color: var(--ink2); transition: all .15s; }
  .cat-pill:hover { border-color: var(--ink2); }
  .cat-pill.selected { background: var(--ink); color: var(--paper); border-color: var(--ink); }
  .contrib-info { flex: 1; min-width: 0; }
  .contrib-name { font-weight: 500; font-size: 13px; }
  .contrib-item { font-size: 12px; color: var(--ink2); }
  .badge { font-size: 11px; padding: 2px 10px; border-radius: 100px; font-weight: 500; flex-shrink: 0; }
  .badge-food { background: #e8f5e9; color: #2e7d32; }
  .badge-drinks { background: #e3f2fd; color: #1565c0; }
  .badge-equipment { background: #f3e5f5; color: #6a1b9a; }
  .badge-other { background: var(--muted); color: #555; }
  .submit-icon-btn { display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 8px; border: none; background: var(--ink); color: var(--paper); cursor: pointer; flex-shrink: 0; transition: background .15s; }
  .submit-icon-btn:hover { background: #333; }
  .icon-btn { border: none; background: none; cursor: pointer; font-size: 14px; padding: 4px; flex-shrink: 0; transition: color .12s; }
  .strike-btn { color: var(--ink3); }
  .strike-btn:hover { color: var(--red); }
  .restore { color: var(--ink3); }
  .restore:hover { color: var(--green); }
  .del-confirm { color: var(--red); opacity: .7; }
  .del-confirm:hover { opacity: 1; }
  .loc-struck { opacity: .6; background: var(--muted); }
  .strike { text-decoration: line-through; color: var(--ink3); }
  .struck-label { font-size: 11px; color: var(--red); margin-top: 2px; font-weight: 500; }
  .ideas-list { display: flex; flex-direction: column; gap: .6rem; margin-bottom: 1.5rem; }
  .idea-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: .85rem 1rem; display: flex; align-items: center; gap: .75rem; }
  .idea-body { flex: 1; min-width: 0; }
  .idea-text { font-size: 14px; display: block; }
  .idea-author { font-size: 11px; color: var(--ink3); margin-top: 2px; display: block; }
  .idea-actions { display: flex; align-items: center; gap: .25rem; flex-shrink: 0; }
  .like-pill { display: flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 100px; border: 1px solid var(--border); background: none; cursor: pointer; font-size: 13px; font-family: var(--sans); color: var(--ink3); transition: all .15s; }
  .like-pill:hover { border-color: #e8a0a0; color: #c0392b; }
  .like-pill.liked { background: #fdecea; border-color: #e88; color: #c0392b; }
</style>

<script lang="ts">
  import LocationMap from './LocationMap.svelte';

  let {
    ideas, myIdeaVotes, contributions, locations, userId, finalLocation = null,
    planTab = $bindable<'contrib' | 'ideas' | 'locations'>('locations'),
    newContribItem = $bindable(''), newContribCat = $bindable('Essen'),
    newIdeaText = $bindable(''),
    newLocDesc = $bindable(''), newLocAddr = $bindable(''), newLocContact = $bindable(''),
    onaddcontrib, ondeletecontrib, onaddidea, ondeleteidea, ontoggleideavote, onaddlocation, oneditlocation, ondeletelocation, onstrikelocation, onunstrikelocation,
    afterHero,
  }: {
    ideas: any[];
    myIdeaVotes: number[];
    contributions: any[];
    locations: any[];
    userId: number;
    finalLocation?: { address: string; city: string } | null;
    planTab?: 'contrib' | 'ideas' | 'locations';
    newContribItem?: string;
    newContribCat?: string;
    newIdeaText?: string;
    newLocDesc?: string;
    newLocAddr?: string;
    newLocContact?: string;
    onaddcontrib: () => void;
    ondeletecontrib: (id: number) => void;
    onaddidea: () => void;
    ondeleteidea: (id: number) => void;
    ontoggleideavote: (id: number) => void;
    onaddlocation: () => void;
    oneditlocation: (id: number, fields: { description: string; address: string; contact: string }) => void;
    ondeletelocation: (id: number) => void;
    onstrikelocation: (id: number) => void;
    onunstrikelocation: (id: number) => void;
    afterHero?: import('svelte').Snippet;
  } = $props();

  const catEmoji: Record<string, string> = {
    Essen: '🍕', Getränke: '🍺', Equipment: '🎒', Sonstiges: '✨',
  };
  const cats = Object.keys(catEmoji);

  let mapsUrl = $derived(finalLocation
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([finalLocation.address, finalLocation.city].filter(Boolean).join(', '))}`
    : '');

  // Inline editing of an existing location.
  let editingLoc = $state<number | null>(null);
  let editDesc = $state('');
  let editAddr = $state('');
  let editContact = $state('');

  function startEditLoc(loc: any) {
    editingLoc = loc.id;
    editDesc = loc.description ?? '';
    editAddr = loc.address ?? '';
    editContact = loc.contact ?? '';
  }
  function saveEditLoc() {
    if (editingLoc === null || !editDesc.trim()) return;
    oneditlocation(editingLoc, { description: editDesc, address: editAddr, contact: editContact });
    editingLoc = null;
  }
</script>

<div class="hero">
  <div class="eyebrow">Meeehr Plaaanung.</div>
  <h1>Wo, was, <em>und wie?</em></h1>
  <p class="hero-sub">Ein Ort wäre cool. Ansonsten einfach mal Brainstormen.<br />Kann jemand was mitbringen, wird irgendwas organisiert?<br />Seid kreativ!</p>
</div>

{@render afterHero?.()}

<div class="section">
  <div class="plan-tabs">
    {#each [['locations','📍 Ort'], ['contrib','🙋 Mitbringen'], ['ideas','💡 Ideen']] as [tab, label]}
      <button class="plan-tab" class:active={planTab === tab} onclick={() => (planTab = tab)}>{label}</button>
    {/each}
  </div>

  {#if planTab === 'contrib'}
    <div class="contrib-list">
      {#each contributions as c, i}
        <div class="contrib-card" style="--i:{i}">
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
      {#each ideas as idea, i}
        <div class="idea-card" style="--i:{i}">
          <div class="idea-body">
            <span class="idea-text">{idea.text}</span>
            <span class="idea-author">{idea.user_name}</span>
          </div>
          <div class="idea-actions">
            <div class="like-wrap">
              <button class="like-pill" class:liked={myIdeaVotes.includes(idea.id)} onclick={() => ontoggleideavote(idea.id)}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 14s-6-3.9-6-8a4 4 0 0 1 6-3.46A4 4 0 0 1 14 6c0 4.1-6 8-6 8z"/></svg>
                {idea.votes}
              </button>
              {#if idea.likers?.length}
                <div class="like-tooltip">{idea.likers.join(', ')}</div>
              {/if}
            </div>
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
    {#if finalLocation}
      <a class="final-loc" href={mapsUrl} target="_blank" rel="noopener">
        <span class="fl-icon">📍</span>
        <div class="fl-body">
          <div class="fl-label">Der Ort steht fest</div>
          <div class="fl-addr">{finalLocation.address}</div>
          {#if finalLocation.city}<div class="fl-city">{finalLocation.city}</div>{/if}
        </div>
        <span class="fl-go">Karte ↗</span>
      </a>
      <LocationMap query={[finalLocation.address, finalLocation.city].filter(Boolean).join(', ')} />
    {/if}

    {#if finalLocation && locations.length}
      <div class="loc-archive-label">Frühere Vorschläge</div>
    {/if}
    <div class="contrib-list">
      {#each locations as loc, i}
        {@const struck = !!loc.struck}
        {#if editingLoc === loc.id}
          <div class="contrib-card loc-edit" style="--i:{i}">
            <div class="loc-edit-fields">
              <input bind:value={editDesc} placeholder="Beschreibung" onkeydown={e => e.key === 'Enter' && saveEditLoc()} />
              <input bind:value={editAddr} placeholder="Adresse / Hinweis" onkeydown={e => e.key === 'Enter' && saveEditLoc()} />
              <input bind:value={editContact} placeholder="Ansprechpartner" onkeydown={e => e.key === 'Enter' && saveEditLoc()} />
            </div>
            <button class="icon-btn save-btn" onclick={saveEditLoc} title="Speichern">✓</button>
            <button class="icon-btn" onclick={() => (editingLoc = null)} title="Abbrechen">✕</button>
          </div>
        {:else}
          <div class="contrib-card" class:loc-struck={struck} style="--i:{i}">
            <div class="avatar" style="background:#e8f0f8;color:#2a5c8a">{struck ? '🚫' : '📍'}</div>
            <div class="contrib-info">
              <div class="contrib-name" class:strike={struck}>{loc.description}</div>
              <div class="contrib-item" class:strike={struck}>{[loc.address, loc.contact ? `Ansprechpartner: ${loc.contact}` : null].filter(Boolean).join(' · ')}</div>
              {#if struck}<div class="struck-label">Nicht verfügbar</div>{/if}
            </div>
            {#if struck}
              <button class="icon-btn restore" onclick={() => onunstrikelocation(loc.id)} title="Wiederherstellen">↩</button>
              <button class="icon-btn del-confirm" onclick={() => ondeletelocation(loc.id)} title="Endgültig löschen">🗑</button>
            {:else}
              <button class="icon-btn edit-btn" onclick={() => startEditLoc(loc)} title="Bearbeiten">✎</button>
              <button class="icon-btn strike-btn" onclick={() => onstrikelocation(loc.id)} title="Als nicht verfügbar markieren">✕</button>
            {/if}
          </div>
        {/if}
      {/each}
      {#if locations.length === 0 && !finalLocation}<p class="empty">Noch kein Ort vorgeschlagen!<br />Irgendwo müssen wir aber hin :D</p>{/if}
    </div>
    {#if !finalLocation}
    <div class="add-box">
      <h4>📍 Ort vorschlagen</h4>
      <div class="form-row"><label>Beschreibung</label><input bind:value={newLocDesc} placeholder="z.B. Gänsi, Waldi, irgendne Halle, ..." onkeydown={e => e.key === 'Enter' && newLocAddr ? onaddlocation() : null} /></div>
      <div class="form-row"><label>Adresse / Hinweis</label>
        <input bind:value={newLocAddr} placeholder="Straße, PLZ oder Link" onkeydown={e => e.key === 'Enter' && onaddlocation()} />
      </div>
      <div class="form-row" style="margin-bottom:0"><label>Ansprechpartner</label>
        <div style="display:flex;gap:.5rem">
          <input bind:value={newLocContact} placeholder="Wer kümmert sich drum?" onkeydown={e => e.key === 'Enter' && onaddlocation()} style="flex:1" />
          <button class="submit-icon-btn" onclick={onaddlocation} title="Vorschlagen">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M9 3l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </div>
    </div>
    {/if}
  {/if}

</div>

<style>
  .plan-tabs { display: flex; gap: .5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .plan-tab { padding: 7px 16px; border: 1px solid var(--border); border-radius: 100px; font-size: 13px; cursor: pointer; background: var(--surface); color: var(--ink2); font-family: var(--sans); transition: all .15s; }
  .plan-tab:hover { background: var(--muted); }
  .plan-tab.active { background: var(--ink); color: var(--paper); border-color: var(--ink); }
  @keyframes item-up {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .contrib-list { display: flex; flex-direction: column; gap: .65rem; margin-bottom: 1.5rem; }
  .contrib-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: .9rem 1.1rem; display: flex; align-items: center; gap: .9rem; animation: item-up 0.35s ease-out calc(var(--i,0) * 60ms + 50ms) backwards; }
  .idea-card    { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: .85rem 1rem; display: flex; align-items: center; gap: .75rem; animation: item-up 0.35s ease-out calc(var(--i,0) * 60ms + 50ms) backwards; }
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

  .final-loc { display: flex; align-items: center; gap: 1rem; text-decoration: none; background: color-mix(in srgb, var(--green) 12%, var(--surface)); border: 2px solid var(--green); border-radius: 14px; padding: 1rem 1.25rem; margin-bottom: 1.5rem; transition: transform .15s; }
  .final-loc:hover { transform: translateY(-2px); }
  .fl-icon { font-size: 1.75rem; flex-shrink: 0; }
  .fl-body { flex: 1; min-width: 0; }
  .fl-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: var(--green); margin-bottom: 2px; }
  .fl-addr { font-family: var(--serif); font-size: 1.25rem; color: var(--ink); line-height: 1.15; }
  .fl-city { font-size: 13px; color: var(--ink2); margin-top: 1px; }
  .fl-go { flex-shrink: 0; font-size: 13px; font-weight: 600; color: var(--green); white-space: nowrap; }
  .loc-archive-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--ink3); margin-bottom: .6rem; }
  .edit-btn { color: var(--ink3); }
  .edit-btn:hover { color: var(--accent); }
  .save-btn { color: var(--green); font-weight: 700; }
  .loc-edit { align-items: center; gap: .5rem; }
  .loc-edit-fields { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: .4rem; }
  .loc-edit-fields input { width: 100%; padding: 7px 10px; border: 1px solid var(--border); border-radius: 7px; font-size: 14px; font-family: var(--sans); background: var(--surface); color: var(--ink); outline: none; }
  .loc-edit-fields input:focus { border-color: var(--accent); }
  .strike { text-decoration: line-through; color: var(--ink3); }
  .struck-label { font-size: 11px; color: var(--red); margin-top: 2px; font-weight: 500; }
  .ideas-list { display: flex; flex-direction: column; gap: .6rem; margin-bottom: 1.5rem; }
  .idea-body { flex: 1; min-width: 0; }
  .idea-text { font-size: 14px; display: block; }
  .idea-author { font-size: 11px; color: var(--ink3); margin-top: 2px; display: block; }
  .idea-actions { display: flex; align-items: center; gap: .25rem; flex-shrink: 0; }
  .like-wrap { position: relative; }
  .like-tooltip { position: absolute; bottom: calc(100% + 6px); right: 0; background: var(--ink); color: var(--paper); font-size: 11px; padding: 5px 10px; border-radius: 8px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity .15s; z-index: 10; }
  .like-tooltip::after { content: ''; position: absolute; top: 100%; right: 12px; border: 5px solid transparent; border-top-color: var(--ink); }
  .like-wrap:hover .like-tooltip { opacity: 1; }
  .like-pill { display: flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 100px; border: 1px solid var(--border); background: none; cursor: pointer; font-size: 13px; font-family: var(--sans); color: var(--ink3); transition: all .15s; }
  .like-pill:hover { border-color: #e8a0a0; color: #c0392b; }
  .like-pill.liked { background: #fdecea; border-color: #e88; color: #c0392b; }
</style>

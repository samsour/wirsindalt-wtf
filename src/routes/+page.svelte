<script lang="ts">
  import { onMount } from 'svelte';
  import { DATES, checkMotto } from '$lib/dates';

  // --- Auth state ---
  let user: { userId: number; userName: string; token: string } | null = $state(null);
  let authName = $state('');
  let authMotto = $state('');
  let authError = $state('');
  let authLoading = $state(false);
  let mottoHint = $derived(checkMotto(authMotto) === 'comma_missing' ? 'Interpunktion üben wir nochmal, ja?' : '');

  function getClientId(): string {
    let id = localStorage.getItem('abi2016_clientId');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('abi2016_clientId', id);
    }
    return id;
  }

  // --- Nav ---
  let phase = $state(0);

  // --- Phase 1: Votes ---
  let voteCounts: Record<string, { yes: number; maybe: number; no: number }> = $state({});
  let myVotes: Record<string, string> = $state({});
  let votingKey = $state<string | null>(null);

  // --- Phase 2: RSVP ---
  let rsvpStats = $state({ attending: 0, notAttending: 0, totalGuests: 0 });
  let rsvpChoice: 'yes' | 'no' | null = $state(null);
  let rsvpGuests = $state(1);
  let rsvpDietary = $state('');
  let rsvpNote = $state('');
  let rsvpDone = $state(false);
  let rsvpLoading = $state(false);

  // --- Phase 3: Plan ---
  let planTab: 'contrib' | 'inventory' | 'ideas' | 'locations' = $state('contrib');
  let contributions: any[] = $state([]);
  let ideas: any[] = $state([]);
  let myIdeaVotes: number[] = $state([]);
  let locations: any[] = $state([]);

  let newContribItem = $state('');
  let newContribCat = $state('Essen');
  let newIdeaText = $state('');
  let newIdeaTag = $state('Programm');
  let newLocDesc = $state('');
  let newLocAddr = $state('');

  let toast = $state('');
  let toastTimer: ReturnType<typeof setTimeout>;

  function showToast(msg: string) {
    toast = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast = ''), 2600);
  }

  onMount(async () => {
    const stored = localStorage.getItem('abi2016_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.token) {
        user = parsed;
        await loadAll();
      } else {
        localStorage.removeItem('abi2016_user');
      }
    }
    await loadVotes();
    await loadRsvpStats();
  });

  async function login() {
    authLoading = true;
    authError = '';
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: getClientId(), name: authName, motto: authMotto }),
    });
    const data = await res.json();
    authLoading = false;
    if (!res.ok) { authError = data.error; return; }
    user = data;
    localStorage.setItem('abi2016_user', JSON.stringify(user));
    await loadAll();
    showToast(`Willkommen, ${user!.userName}! 🎉`);
  }

  function logout() {
    user = null;
    localStorage.removeItem('abi2016_user');
    myVotes = {};
  }

  async function loadAll() {
    await Promise.all([loadVotes(), loadMyVotes(), loadRsvpStats(), loadContribs(), loadIdeas(), loadLocations()]);
  }

  async function loadVotes() {
    const res = await fetch('/api/votes');
    voteCounts = await res.json();
  }

  async function loadMyVotes() {
    if (!user) return;
    const res = await fetch('/api/votes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: user.token }),
    });
    myVotes = await res.json();
  }

  async function castVote(dateKey: string, vote: string) {
    if (!user) { showToast('Bitte zuerst einloggen!'); return; }
    if (votingKey === dateKey) return;
    votingKey = dateKey;
    const prev = myVotes[dateKey];
    const newVote = prev === vote ? null : vote;
    // Optimistic
    if (newVote) myVotes[dateKey] = newVote;
    else delete myVotes[dateKey];
    myVotes = { ...myVotes };
    if (voteCounts[dateKey]) {
      if (prev) (voteCounts[dateKey] as any)[prev] = Math.max(0, (voteCounts[dateKey] as any)[prev] - 1);
      if (newVote) (voteCounts[dateKey] as any)[newVote]++;
      voteCounts = { ...voteCounts };
    }
    await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: user.token, dateKey, vote: newVote }),
    });
    votingKey = null;
    showToast(newVote === 'yes' ? '✓ Stimme gezählt!' : newVote === 'maybe' ? '~ Als Vielleicht vermerkt' : newVote === 'no' ? '✗ Abgesagt' : 'Stimme zurückgezogen');
  }

  async function loadRsvpStats() {
    const res = await fetch('/api/rsvp');
    rsvpStats = await res.json();
  }

  async function submitRsvp() {
    if (!user) return;
    rsvpLoading = true;
    await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: user.token, attending: rsvpChoice === 'yes', guests: rsvpGuests, dietary: rsvpDietary, note: rsvpNote }),
    });
    rsvpLoading = false;
    rsvpDone = true;
    await loadRsvpStats();
    showToast(rsvpChoice === 'yes' ? 'Anmeldung gespeichert! 🎉' : 'Schade! Bis zum nächsten Mal.');
  }

  async function loadContribs() {
    const res = await fetch('/api/contributions');
    contributions = await res.json();
  }

  async function addContrib() {
    if (!user || !newContribItem.trim()) return;
    const res = await fetch('/api/contributions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: user.token, item: newContribItem, category: newContribCat }),
    });
    const c = await res.json();
    contributions = [c, ...contributions];
    newContribItem = '';
    showToast('Eingetragen! Danke 🙌');
  }

  async function deleteContrib(id: number) {
    if (!user) return;
    await fetch('/api/contributions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, token: user.token }),
    });
    contributions = contributions.filter(c => c.id !== id);
  }

  async function loadIdeas() {
    const res = await fetch(`/api/ideas${user ? '?token=' + user.token : ''}`);
    const d = await res.json();
    ideas = d.ideas;
    myIdeaVotes = d.myVotes;
  }

  async function addIdea() {
    if (!user || !newIdeaText.trim()) return;
    const res = await fetch('/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: user.token, text: newIdeaText, tag: newIdeaTag }),
    });
    const idea = await res.json();
    ideas = [idea, ...ideas];
    myIdeaVotes = [...myIdeaVotes, idea.id];
    newIdeaText = '';
    showToast('Idee eingereicht! 💡');
  }

  async function toggleIdeaVote(ideaId: number) {
    if (!user) { showToast('Bitte zuerst einloggen!'); return; }
    const res = await fetch('/api/ideas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: user.token, ideaId }),
    });
    const d = await res.json();
    if (d.voted) {
      myIdeaVotes = [...myIdeaVotes, ideaId];
      ideas = ideas.map(i => i.id === ideaId ? { ...i, votes: i.votes + 1 } : i);
    } else {
      myIdeaVotes = myIdeaVotes.filter(v => v !== ideaId);
      ideas = ideas.map(i => i.id === ideaId ? { ...i, votes: i.votes - 1 } : i);
    }
    ideas = [...ideas].sort((a, b) => b.votes - a.votes);
  }

  async function loadLocations() {
    const res = await fetch('/api/locations');
    locations = await res.json();
  }

  async function addLocation() {
    if (!user || !newLocDesc.trim()) return;
    const res = await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: user.token, description: newLocDesc, address: newLocAddr }),
    });
    const loc = await res.json();
    locations = [...locations, loc];
    newLocDesc = ''; newLocAddr = '';
    showToast('Ort vorgeschlagen! 📍');
  }

  function initials(name: string) {
    return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  }

  let voteLeader = $derived(Object.entries(voteCounts).sort((a, b) => b[1].yes - a[1].yes)[0]?.[0]);
  let myVoteCount = $derived(Object.values(myVotes).filter(v => v !== 'no').length);

  const catClass: Record<string, string> = {
    Essen: 'badge-food', Getränke: 'badge-drinks', Equipment: 'badge-equipment', Sonstiges: 'badge-other',
  };
</script>

<svelte:head>
  <title>ABI '16 – 10 Jahre Reunion</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap" rel="stylesheet" />
</svelte:head>

<!-- TOAST -->
{#if toast}
  <div class="toast show">{toast}</div>
{/if}

<!-- LOGIN GATE -->
{#if !user}
  <div class="gate-bg">
    <div class="gate-card">
      {#if mottoHint}
        <div class="motto-stamp" aria-hidden="true">{mottoHint}</div>
      {/if}
      <div class="gate-year">2016 → 2026</div>
      <h1 class="gate-title">Zeig, dass du dabei warst.</h1>
      <p class="gate-sub">Wie lautete unser Abi-Motto? <span class="gate-tip" aria-label="Hinweis">ℹ︎<span class="gate-tip-text">Captain Blaubär, komm schon...</span></span></p>
      <input class="gate-input" bind:value={authMotto} placeholder="Abi-Motto eingeben…" onkeydown={e => e.key === 'Enter' && login()} />
      <input class="gate-input" bind:value={authName} placeholder="Dein Name" onkeydown={e => e.key === 'Enter' && login()} />
      {#if authError}<p class="gate-error">{authError}</p>{/if}
      <button class="btn btn-primary gate-btn" onclick={login} disabled={authLoading}>
        {authLoading ? 'Löse binomische Formeln auf...' : 'Rein da →'}
      </button>
      <p class="gate-hint">Kein Account nötig — nur dein Name und das Motto.</p>
    </div>
  </div>

<!-- MAIN APP -->
{:else}
  <nav>
    <div class="nav-logo">ABI '16</div>
    <div class="nav-phases">
      {#each [['Terminwahl', 0], ['Anmeldung', 1], ['Planung', 2]] as [label, i]}
        <button class="nav-phase" class:active={phase === i} class:done={phase > i} onclick={() => (phase = i)}>
          <span class="phase-dot"></span> Phase {i + 1} · {label}
        </button>
      {/each}
    </div>
    <button class="nav-user" onclick={logout} title="Ausloggen">
      <span class="user-avatar">{initials(user.userName)}</span>
      <span class="user-name">{user.userName}</span>
    </button>
  </nav>

  <!-- ── PHASE 0: DATE VOTING ── -->
  {#if phase === 0}
    <div class="hero">
      <div class="eyebrow">10 Jahre Abitur 2016</div>
      <h1>Wann feiern wir <em>zusammen?</em></h1>
      <p class="hero-sub">Stimme für alle Wochenenden, die dir passen. Mehr als eine Stimme erlaubt!</p>
    </div>

    <div class="section">
      <div class="vote-intro">
        <span>🗳️</span>
        <p><strong>Für jedes Wochenende:</strong> ✓ Ja, ~ Vielleicht oder ✗ Nein. Nochmal klicken = zurücknehmen.</p>
      </div>

      {#each Object.entries(DATES.reduce((acc, d) => { (acc[d.month] ||= []).push(d); return acc; }, {} as Record<string, typeof DATES>)) as [month, ds]}
        <div class="date-week">
          <div class="week-label">{month}</div>
          <div class="date-row">
            {#each ds as d}
              {@const c = voteCounts[d.key] ?? { yes: 0, maybe: 0, no: 0 }}
              {@const total = c.yes + c.maybe + c.no || 1}
              {@const mv = myVotes[d.key]}
              <div class="date-card" class:voted-yes={mv === 'yes'} class:voted-maybe={mv === 'maybe'} class:voted-no={mv === 'no'}>
                {#if d.key === voteLeader}<span class="top-badge">🔥 Favorit</span>{/if}
                <div class="date-top">
                  <div>
                    <div class="date-day">{d.label.split('–')[0].trim()}</div>
                    <div class="date-month">{d.label} · Fr–Sa</div>
                  </div>
                </div>
                <div class="vote-bar">
                  <div class="vote-bar-yes" style="width:{Math.round(c.yes/total*100)}%"></div>
                </div>
                <div class="vote-count">{c.yes} ✓ · {c.maybe} ~ · {c.no} ✗</div>
                <div class="vote-actions">
                  <button class="vbtn yes" class:active={mv === 'yes'} disabled={votingKey === d.key} onclick={() => castVote(d.key, 'yes')}>✓ Ja</button>
                  <button class="vbtn maybe" class:active={mv === 'maybe'} disabled={votingKey === d.key} onclick={() => castVote(d.key, 'maybe')}>~ Vielleicht</button>
                  <button class="vbtn no" class:active={mv === 'no'} disabled={votingKey === d.key} onclick={() => castVote(d.key, 'no')}>✗ Nein</button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}

      {#if Object.keys(voteCounts).length}
        <div class="results-panel">
          <h3>Aktuelle Ergebnisse</h3>
          {#each [...DATES].sort((a, b) => (voteCounts[b.key]?.yes ?? 0) - (voteCounts[a.key]?.yes ?? 0)).slice(0, 5) as d}
            {@const yes = voteCounts[d.key]?.yes ?? 0}
            {@const max = Math.max(...DATES.map(x => voteCounts[x.key]?.yes ?? 0), 1)}
            <div class="result-row">
              <span class="result-label">{d.label}</span>
              <div class="result-track"><div class="result-fill" style="width:{Math.round(yes/max*100)}%"></div></div>
              <span class="result-num">{yes}</span>
            </div>
          {/each}
        </div>
      {/if}

      <div class="footer-nav">
        <div class="stat-row">
          <div class="stat-pill"><span class="sn">{myVoteCount}</span><span class="sl">meine Stimmen</span></div>
        </div>
        <button class="btn btn-primary" onclick={() => (phase = 1)}>Weiter zur Anmeldung →</button>
      </div>
    </div>

  <!-- ── PHASE 1: RSVP ── -->
  {:else if phase === 1}
    <div class="hero">
      <div class="eyebrow">Phase 2 · Anmeldung</div>
      <h1>Bist du <em>dabei?</em></h1>
      <p class="hero-sub">Sag uns, ob du kommst — und wie viele ihr seid.</p>
    </div>

    <div class="section">
      <div class="stat-row" style="margin-bottom:2rem">
        <div class="stat-pill"><span class="sn" style="color:var(--green)">{rsvpStats.attending}</span><span class="sl">zugesagt</span></div>
        <div class="stat-pill"><span class="sn" style="color:var(--red)">{rsvpStats.notAttending}</span><span class="sl">abgesagt</span></div>
        <div class="stat-pill"><span class="sn">{rsvpStats.totalGuests}</span><span class="sl">Personen gesamt</span></div>
      </div>

      {#if rsvpDone}
        <div class="done-card">
          <div class="done-icon">{rsvpChoice === 'yes' ? '🎉' : '😔'}</div>
          <h3>{rsvpChoice === 'yes' ? 'Du bist angemeldet!' : 'Schade — bis nächstes Mal!'}</h3>
          <p>{rsvpChoice === 'yes' ? `${rsvpGuests} Person(en) · ${rsvpDietary || 'keine Ernährungshinweise'}` : ''}</p>
          <button class="btn btn-outline" style="margin-top:1rem" onclick={() => (rsvpDone = false)}>Ändern</button>
        </div>
      {:else}
        <div class="rsvp-grid">
          <button class="rsvp-card" class:attending={rsvpChoice === 'yes'} onclick={() => (rsvpChoice = 'yes')}>
            <div class="rsvp-icon">🎉</div>
            <h3>Ich bin dabei!</h3>
            <p>Ich feiere mit euch</p>
          </button>
          <button class="rsvp-card" class:declining={rsvpChoice === 'no'} onclick={() => (rsvpChoice = 'no')}>
            <div class="rsvp-icon">😔</div>
            <h3>Leider nicht</h3>
            <p>Diesmal klappt's nicht</p>
          </button>
        </div>

        {#if rsvpChoice}
          <div class="rsvp-form">
            {#if rsvpChoice === 'yes'}
              <div class="form-row">
                <label>Wie viele Personen kommt ihr? (inkl. dir)</label>
                <div class="counter-row">
                  <button class="ctr-btn" onclick={() => rsvpGuests = Math.max(1, rsvpGuests - 1)}>−</button>
                  <span class="ctr-val">{rsvpGuests}</span>
                  <button class="ctr-btn" onclick={() => rsvpGuests = Math.min(10, rsvpGuests + 1)}>+</button>
                  <span class="ctr-label">Person(en)</span>
                </div>
              </div>
              <div class="form-row">
                <label>Ernährungshinweise</label>
                <select bind:value={rsvpDietary}>
                  <option value="">Keine besonderen</option>
                  <option>Vegetarisch</option>
                  <option>Vegan</option>
                  <option>Laktosefrei</option>
                  <option>Glutenfrei</option>
                  <option>Mehreres</option>
                </select>
              </div>
            {/if}
            <div class="form-row">
              <label>Nachricht ans Orga-Team (optional)</label>
              <textarea bind:value={rsvpNote} placeholder="Alles Wichtige hier…"></textarea>
            </div>
            <div style="display:flex;gap:.75rem">
              <button class="btn btn-primary" onclick={submitRsvp} disabled={rsvpLoading}>
                {rsvpLoading ? 'Wird gespeichert…' : 'Anmeldung absenden ✓'}
              </button>
              <button class="btn btn-outline" onclick={() => (rsvpChoice = null)}>Zurück</button>
            </div>
          </div>
        {/if}
      {/if}

      <div class="footer-nav">
        <button class="btn btn-outline" onclick={() => (phase = 0)}>← Zurück</button>
        <button class="btn btn-primary" onclick={() => (phase = 2)}>Zur Planung →</button>
      </div>
    </div>

  <!-- ── PHASE 2: PLANNING ── -->
  {:else}
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

      <!-- CONTRIB -->
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
              {#if user?.userId === c.user_id}
                <button class="del-btn" onclick={() => deleteContrib(c.id)} title="Löschen">✕</button>
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
              <input bind:value={newContribItem} placeholder="z.B. Salat, Grill, Musik…" onkeydown={e => e.key === 'Enter' && addContrib()} />
            </div>
            <div class="form-row">
              <label>Kategorie</label>
              <select bind:value={newContribCat}>
                <option>Essen</option><option>Getränke</option><option>Equipment</option><option>Sonstiges</option>
              </select>
            </div>
          </div>
          <button class="btn btn-primary btn-sm" onclick={addContrib}>Eintragen</button>
        </div>

      <!-- IDEAS -->
      {:else if planTab === 'ideas'}
        <div class="ideas-list">
          {#each ideas as idea}
            <div class="idea-card">
              <div class="idea-votes">
                <button class="idea-vote-btn" class:voted={myIdeaVotes.includes(idea.id)} onclick={() => toggleIdeaVote(idea.id)}>▲</button>
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
            <input bind:value={newIdeaText} placeholder="Deine Idee…" style="flex:1;min-width:200px;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-family:var(--sans);font-size:14px;background:var(--paper)" onkeydown={e => e.key === 'Enter' && addIdea()} />
            <select bind:value={newIdeaTag} style="padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-family:var(--sans);font-size:13px;background:var(--paper)">
              <option>Programm</option><option>Deko</option><option>Musik</option><option>Spiel</option><option>Sonstiges</option>
            </select>
          </div>
          <button class="btn btn-primary btn-sm" onclick={addIdea}>Einreichen</button>
        </div>

      <!-- LOCATIONS -->
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
          <button class="btn btn-primary btn-sm" onclick={addLocation}>Vorschlagen</button>
        </div>
      {/if}

      <div class="footer-nav">
        <button class="btn btn-outline" onclick={() => (phase = 1)}>← Zurück</button>
        <button class="btn btn-primary" onclick={() => { navigator.clipboard?.writeText(window.location.href); showToast('Link kopiert! Teile ihn in der Gruppe 🎉'); }}>Link teilen ↗</button>
      </div>
    </div>
  {/if}
{/if}

<style>
  :global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(body) {
    font-family: 'DM Sans', system-ui, sans-serif;
    background: #faf9f6;
    color: #1a1a1a;
    min-height: 100vh;
  }
  :global(:root) {
    --serif: 'DM Serif Display', Georgia, serif;
    --sans: 'DM Sans', system-ui, sans-serif;
    --ink: #1a1a1a; --ink2: #555; --ink3: #999;
    --paper: #faf9f6; --card: #ffffff; --border: rgba(0,0,0,0.1);
    --accent: #c8531a; --green: #3a7d44; --red: #b52020; --maybe: #8a6a00;
  }

  /* GATE */
  .gate-bg { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; background: #faf9f6; }
  .gate-card { background: #fff; border: 1px solid var(--border); border-radius: 16px; padding: 3rem 2.5rem; max-width: 420px; width: 100%; text-align: center; position: relative; overflow: hidden; }
  .motto-stamp {
    position: absolute;
    top: 38%; left: 50%;
    transform: translate(-50%, -50%) rotate(-12deg);
    background: #fffbe6;
    border: 2px solid #c8a400;
    border-radius: 5px;
    padding: 4px 12px;
    font-family: var(--serif);
    font-size: .8rem;
    color: #8a6a00;
    white-space: nowrap;
    pointer-events: none;
    z-index: 10;
    box-shadow: 2px 2px 0 rgba(0,0,0,0.07);
    letter-spacing: .02em;
    animation: stamp-in .2s ease-out;
  }
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

  /* NAV */
  nav { display: flex; align-items: center; gap: 0; border-bottom: 1px solid var(--border); background: #fff; padding: 0 1.5rem; position: sticky; top: 0; z-index: 100; }
  .nav-logo { font-family: var(--serif); font-size: 18px; color: var(--accent); padding: 1rem 1.25rem 1rem 0; border-right: 1px solid var(--border); margin-right: 1.25rem; white-space: nowrap; }
  .nav-phases { display: flex; flex: 1; }
  .nav-phase { display: flex; align-items: center; gap: 7px; padding: 0 1rem; height: 54px; font-size: 13px; font-weight: 500; color: var(--ink3); cursor: pointer; border: none; background: none; border-bottom: 2px solid transparent; transition: all .18s; white-space: nowrap; }
  .nav-phase:hover { color: var(--ink); }
  .nav-phase.active { color: var(--ink); border-bottom-color: var(--accent); }
  .nav-phase.done { color: var(--green); }
  .phase-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; opacity: .45; }
  .nav-phase.active .phase-dot, .nav-phase.done .phase-dot { opacity: 1; }
  .nav-user { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border: 1px solid var(--border); border-radius: 8px; background: none; cursor: pointer; font-family: var(--sans); font-size: 13px; color: var(--ink2); margin-left: auto; }
  .nav-user:hover { background: #f5f5f5; }
  .user-avatar { width: 26px; height: 26px; border-radius: 50%; background: #f0e8e0; color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 500; }
  .user-name { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* HERO */
  .hero { text-align: center; padding: 4rem 2rem 2.5rem; }
  .eyebrow { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: var(--accent); font-weight: 500; margin-bottom: 1rem; }
  .hero h1 { font-family: var(--serif); font-size: clamp(2.2rem, 5vw, 3.5rem); line-height: 1.1; margin-bottom: .75rem; }
  .hero h1 em { font-style: italic; color: var(--accent); }
  .hero-sub { color: var(--ink2); font-size: 15px; max-width: 440px; margin: 0 auto; line-height: 1.6; }

  /* SECTION */
  .section { max-width: 760px; margin: 0 auto; padding: 0 1.5rem 4rem; }
  .vote-intro { background: #fff; border: 1px solid var(--border); border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 2rem; display: flex; align-items: center; gap: 1rem; font-size: 14px; color: var(--ink2); line-height: 1.6; }
  .vote-intro strong { color: var(--ink); }

  /* DATES */
  .date-week { margin-bottom: 1.5rem; }
  .week-label { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--ink3); font-weight: 500; margin-bottom: .75rem; }
  .date-row { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
  .date-card { background: #fff; border: 1.5px solid var(--border); border-radius: 12px; padding: 1rem 1.25rem; position: relative; overflow: hidden; transition: border-color .15s; }
  .date-card.voted-yes { border-color: var(--green); background: #f4faf5; }
  .date-card.voted-maybe { border-color: var(--maybe); background: #fffdf0; }
  .date-card.voted-no { border-color: #ddd; opacity: .55; }
  .top-badge { position: absolute; top: 8px; right: 8px; font-size: 10px; padding: 2px 8px; background: #fff3e0; color: #b86000; border-radius: 100px; font-weight: 500; border: 1px solid #f0c060; }
  .date-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: .6rem; }
  .date-day { font-family: var(--serif); font-size: 1.5rem; color: var(--ink); line-height: 1; }
  .date-month { font-size: 11px; color: var(--ink3); margin-top: 2px; }
  .vote-bar { height: 4px; background: #eee; border-radius: 2px; margin: .75rem 0 .4rem; overflow: hidden; }
  .vote-bar-yes { height: 100%; background: var(--green); border-radius: 2px; transition: width .4s; }
  .vote-count { font-size: 11px; color: var(--ink3); margin-bottom: .6rem; }
  .vote-actions { display: flex; gap: 5px; }
  .vbtn { flex: 1; padding: 5px 3px; border: 1px solid var(--border); border-radius: 6px; background: none; cursor: pointer; font-size: 11px; font-family: var(--sans); color: var(--ink2); transition: all .12s; }
  .vbtn.yes.active, .vbtn.yes:hover { background: #e8f5e9; color: var(--green); border-color: var(--green); }
  .vbtn.maybe.active, .vbtn.maybe:hover { background: #fffde7; color: var(--maybe); border-color: #c8a400; }
  .vbtn.no.active, .vbtn.no:hover { background: #fdecea; color: var(--red); border-color: var(--red); }

  /* RESULTS */
  .results-panel { background: #fff; border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem 1.5rem; margin-top: 2rem; }
  .results-panel h3 { font-family: var(--serif); font-size: 1.1rem; margin-bottom: 1rem; }
  .result-row { display: flex; align-items: center; gap: 10px; margin-bottom: .5rem; font-size: 13px; }
  .result-label { width: 110px; color: var(--ink2); flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .result-track { flex: 1; height: 7px; background: #eee; border-radius: 4px; overflow: hidden; }
  .result-fill { height: 100%; background: var(--accent); border-radius: 4px; transition: width .5s; }
  .result-num { font-size: 12px; color: var(--ink3); min-width: 24px; text-align: right; }

  /* STATS */
  .stat-row { display: flex; gap: .75rem; flex-wrap: wrap; }
  .stat-pill { background: #fff; border: 1px solid var(--border); border-radius: 10px; padding: .5rem .9rem; display: flex; align-items: center; gap: .4rem; }
  .sn { font-family: var(--serif); font-size: 1.2rem; }
  .sl { font-size: 12px; color: var(--ink2); }

  /* RSVP */
  .rsvp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
  .rsvp-card { background: #fff; border: 1.5px solid var(--border); border-radius: 12px; padding: 1.5rem; cursor: pointer; transition: all .15s; text-align: center; font-family: var(--sans); }
  .rsvp-card:hover { transform: translateY(-2px); }
  .rsvp-card.attending { border-color: var(--green); background: #f4faf5; }
  .rsvp-card.declining { border-color: var(--red); background: #fdf4f4; }
  .rsvp-icon { font-size: 2.5rem; margin-bottom: .75rem; }
  .rsvp-card h3 { font-family: var(--serif); font-size: 1.25rem; margin-bottom: .25rem; }
  .rsvp-card p { font-size: 13px; color: var(--ink2); }
  .done-card { background: #fff; border: 1px solid var(--border); border-radius: 12px; padding: 2rem; text-align: center; margin-bottom: 2rem; }
  .done-icon { font-size: 3rem; margin-bottom: 1rem; }
  .done-card h3 { font-family: var(--serif); font-size: 1.4rem; margin-bottom: .4rem; }
  .done-card p { font-size: 14px; color: var(--ink2); }

  /* FORMS */
  .rsvp-form { background: #fff; border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
  .form-row { margin-bottom: 1.1rem; }
  .form-row label { display: block; font-size: 11px; font-weight: 500; color: var(--ink2); text-transform: uppercase; letter-spacing: .8px; margin-bottom: 5px; }
  .form-row input, .form-row select, .form-row textarea { width: 100%; padding: 9px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; font-family: var(--sans); background: #faf9f6; color: var(--ink); outline: none; }
  .form-row input:focus, .form-row select:focus, .form-row textarea:focus { border-color: var(--accent); }
  .form-row textarea { resize: vertical; min-height: 80px; }
  .form-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: .75rem; }
  .counter-row { display: flex; align-items: center; gap: 10px; }
  .ctr-btn { width: 32px; height: 32px; border: 1px solid var(--border); border-radius: 8px; background: #fff; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; font-family: monospace; }
  .ctr-btn:hover { background: #f0f0f0; }
  .ctr-val { font-size: 20px; font-weight: 500; min-width: 2rem; text-align: center; }
  .ctr-label { font-size: 13px; color: var(--ink2); }

  /* PLAN TABS */
  .plan-tabs { display: flex; gap: .5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .plan-tab { padding: 7px 16px; border: 1px solid var(--border); border-radius: 100px; font-size: 13px; cursor: pointer; background: #fff; color: var(--ink2); font-family: var(--sans); transition: all .15s; }
  .plan-tab:hover { background: #f0f0f0; }
  .plan-tab.active { background: var(--ink); color: #fff; border-color: var(--ink); }

  /* CONTRIB */
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
  .empty { color: var(--ink3); font-size: 14px; padding: 1.5rem 0; text-align: center; }

  /* ADD BOX */
  .add-box { background: #fff; border: 1.5px dashed var(--border); border-radius: 10px; padding: 1.25rem; }
  .add-box h4 { font-size: 14px; font-weight: 500; margin-bottom: 1rem; }

  /* IDEAS */
  .ideas-list { display: flex; flex-direction: column; gap: .6rem; margin-bottom: 1.5rem; }
  .idea-card { background: #fff; border: 1px solid var(--border); border-radius: 10px; padding: .85rem 1rem; display: flex; align-items: center; gap: .75rem; }
  .idea-votes { display: flex; flex-direction: column; align-items: center; gap: 1px; min-width: 30px; }
  .idea-vote-btn { border: none; background: none; cursor: pointer; font-size: 14px; color: var(--ink3); transition: color .1s; line-height: 1; padding: 2px; }
  .idea-vote-btn:hover, .idea-vote-btn.voted { color: var(--accent); }
  .idea-count { font-family: var(--serif); font-size: 1rem; color: var(--ink); }
  .idea-text { flex: 1; font-size: 14px; }
  .idea-tag { font-size: 11px; padding: 2px 8px; border-radius: 100px; background: #f0f0f0; color: var(--ink2); flex-shrink: 0; }

  /* BTN */
  .btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 18px; border-radius: 8px; font-family: var(--sans); font-size: 14px; font-weight: 500; cursor: pointer; transition: all .15s; border: 1.5px solid; }
  .btn:disabled { opacity: .55; cursor: not-allowed; }
  .btn-primary { background: var(--ink); color: #fff; border-color: var(--ink); }
  .btn-primary:hover:not(:disabled) { background: #333; }
  .btn-outline { background: transparent; color: var(--ink); border-color: var(--border); }
  .btn-outline:hover { background: #f5f5f5; }
  .btn-sm { padding: 6px 14px; font-size: 13px; }

  /* FOOTER NAV */
  .footer-nav { display: flex; justify-content: space-between; align-items: center; padding-top: 2rem; border-top: 1px solid var(--border); margin-top: 1rem; }

  /* TOAST */
  .toast { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); background: var(--ink); color: #fff; padding: 10px 20px; border-radius: 8px; font-size: 13px; opacity: 0; transition: opacity .25s; pointer-events: none; z-index: 999; white-space: nowrap; }
  .toast.show { opacity: 1; }
</style>

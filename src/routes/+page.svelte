<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { checkMotto, DATE_ANNOUNCED, resolveFinalDate } from '$lib/dates';
  import Toast from '$lib/components/Toast.svelte';
  import GateCard from '$lib/components/GateCard.svelte';
  import AppHeader from '$lib/components/AppHeader.svelte';
  import DateVoting from '$lib/components/DateVoting.svelte';
  import TimeVoting from '$lib/components/TimeVoting.svelte';
  import StepNav from '$lib/components/StepNav.svelte';
  import RsvpPhase from '$lib/components/RsvpPhase.svelte';
  import PlanningPhase from '$lib/components/PlanningPhase.svelte';
  import PlaylistPhase from '$lib/components/PlaylistPhase.svelte';
  import EmojiCannon from '$lib/components/EmojiCannon.svelte';

  // --- Auth ---
  let user: { userId: number; userName: string; token: string } | null = $state(null);
  let authName = $state('');
  let authMotto = $state('');
  let authError = $state('');
  let authLoading = $state(false);
  let mottoHint = $derived(checkMotto(authMotto) === 'comma_missing' ? 'Passt. Aber Interpunktion üben wir nochmal, ja?' : '');

  function getClientId(): string {
    let id = localStorage.getItem('abi2016_clientId');
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('abi2016_clientId', id); }
    return id;
  }

  let { data } = $props();
  let maxPhase = $derived(data.maxPhase); // default landing step + steps marked done; set MAX_PHASE in .env (0=Datum, 1=Uhrzeit, 2=Wer ist dabei, 3=Planung)
  let voteDeadline = $derived(data.voteDeadline); // set VOTE_DEADLINE in .env: YYYY-MM-DD
  let deadlineExpired = $derived(!voteDeadline || Date.now() > new Date(voteDeadline).getTime() + 86_400_000);
  let phase = $state(0);

  // Experimental playlist lives at phase 4 — reachable from the menu, not the step bar.
  const PLAYLIST_PHASE = 4;
  let prePlaylistPhase = $state(0);
  function openPlaylist() { if (phase !== PLAYLIST_PHASE) prePlaylistPhase = phase; phase = PLAYLIST_PHASE; }

  onMount(() => {
    const p = new URLSearchParams(window.location.search).get('step');
    phase = p !== null && !isNaN(+p) ? Math.min(4, Math.max(0, +p)) : maxPhase;
  });

  $effect(() => {
    const url = new URL(window.location.href);
    if (phase === 0) url.searchParams.delete('step');
    else url.searchParams.set('step', String(phase));
    history.replaceState({}, '', url);
  });

  let onlineCount = $state(0);
  let onlineNames = $state<string[]>([]);
  let presenceInterval: ReturnType<typeof setInterval>;
  let pingInterval: ReturnType<typeof setInterval>;

  async function fetchPresence() {
    const d = await (await fetch('/api/presence')).json();
    onlineCount = d.count;
    onlineNames = d.names;
  }

  function startPresence() {
    fetchPresence();
    presenceInterval = setInterval(fetchPresence, 10_000);
    const ping = async () => {
      if (!user) return;
      await fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: user.token }),
      });
    };
    ping();
    pingInterval = setInterval(ping, 20_000);
  }

  // --- Live activity toasts ---
  let activityInterval: ReturnType<typeof setInterval>;
  let lastEventId = $state(0);

  function activityMsg(e: { user_name: string; type: string; detail: string | null }): string {
    const n = e.user_name;
    switch (e.type) {
      case 'song_add':     return `🎵 ${n} hat „${e.detail}" zur Playlist`;
      case 'song_like':    return `❤️ ${n} feiert „${e.detail}"`;
      case 'idea_add':     return `💡 ${n} hatte eine Idee`;
      case 'idea_like':    return `❤️ ${n} mag eine Idee`;
      case 'location_add': return `📍 ${n} hat einen Ort vorgeschlagen`;
      case 'contrib_add':  return `🙋 ${n} bringt „${e.detail}" mit`;
      case 'rsvp_yes':     return `🎉 ${n} ist dabei!`;
      default:             return `${n} war aktiv`;
    }
  }

  async function fetchActivity() {
    if (!user) return;
    let rows: { id: number; user_name: string; type: string; detail: string | null }[];
    try {
      rows = await (await fetch(`/api/events?since=${lastEventId}`)).json();
    } catch { return; }
    if (!Array.isArray(rows) || rows.length === 0) return;
    lastEventId = rows.reduce((m, r) => Math.max(m, r.id), lastEventId);
    const others = rows.filter(r => r.user_name !== user!.userName);
    if (others.length === 1) showToast(activityMsg(others[0]));
    else if (others.length > 1) showToast(`🎉 ${others.length} Sachen gerade passiert`);
  }

  async function startActivity() {
    // Seed lastEventId so we don't replay events that happened before we joined.
    try {
      const rows = await (await fetch('/api/events?since=0')).json();
      lastEventId = Array.isArray(rows) ? rows.reduce((m: number, r: any) => Math.max(m, r.id), 0) : 0;
    } catch { /* ignore */ }
    clearInterval(activityInterval);
    activityInterval = setInterval(fetchActivity, 4_000);
  }

  let pollInterval: ReturnType<typeof setInterval>;

  function startPoll() {
    clearInterval(pollInterval);
    pollInterval = setInterval(() => {
      if (phase === 0) loadVotes();
      else if (phase === 1) loadTimeVotes();
      else if (phase === 2) loadRsvpStats();
      else if (phase === 3) Promise.all([loadContribs(), loadIdeas(), loadLocations()]);
      else if (phase === 4) loadSongs();
    }, 5_000);
  }

  $effect(() => {
    phase; // reactive — restart poll whenever phase changes
    if (!loading) startPoll();
  });

  // Refresh the playlist "vibe" only when its song set actually changes (not on every poll tick).
  $effect(() => {
    if (phase !== PLAYLIST_PHASE) return;
    const sig = songs.map(s => s.id).join(',');
    if (sig === genresFor) return;
    genresFor = sig;
    loadGenres();
  });

  onDestroy(() => {
    clearInterval(presenceInterval);
    clearInterval(pingInterval);
    clearInterval(pollInterval);
    clearInterval(activityInterval);
  });

  let voteCounts: Record<string, { yes: number; maybe: number; no: number }> = $state({});
  let uniqueVoters = $state(0);
  let totalUsers = $state(0);
  let myVotes: Record<string, string> = $state({});
  let votingKey = $state<string | null>(null);

  // Time-of-day vote (own poll, opens once the date is announced)
  let timeCounts: Record<string, { yes: number; maybe: number; no: number }> = $state({});
  let myTimeVotes: Record<string, string> = $state({});
  let votingTimeKey = $state<string | null>(null);

  let rsvpStats = $state({ attending: 0, notAttending: 0, totalGuests: 0 });
  let rsvpChoice = $state<'yes' | 'no' | null>(null);
  let rsvpGuests = $state(1);
  let rsvpDietary = $state('');
  let rsvpNote = $state('');
  let rsvpDone = $state(false);
  let rsvpLoading = $state(false);

  let contributions: any[] = $state([]);
  let ideas: any[] = $state([]);
  let myIdeaVotes: number[] = $state([]);
  let locations: any[] = $state([]);
  let planTab = $state<'contrib' | 'ideas' | 'locations'>('locations');
  let newContribItem = $state('');
  let newContribCat = $state('Essen');
  let newIdeaText = $state('');
  let newLocDesc = $state('');
  let newLocAddr = $state('');
  let newLocContact = $state('');

  let songs: any[] = $state([]);
  let mySongVotes: number[] = $state([]);
  let songGenres: Record<number, string[]> = $state({});
  let vibe: string[] = $state([]);
  let vibeMore = $state(0);
  let genresFor = $state('');

  let toast = $state('');
  let toastTimer: ReturnType<typeof setTimeout>;
  function showToast(msg: string) {
    toast = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast = ''), 2600);
  }

  let loading = $state(true);

  onMount(async () => {
    const stored = localStorage.getItem('abi2016_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.token) {
        user = parsed;
        try {
          await loadAll();
          startPresence();
          startActivity();
        } catch {
          logout();
        }
      } else {
        localStorage.removeItem('abi2016_user');
      }
    }
    await loadVotes();
    await loadTimeVotes();
    await loadRsvpStats();
    loading = false;
  });

  async function login() {
    authLoading = true; authError = '';
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
    startPresence();
    startActivity();
    showToast(`Willkommen, ${user!.userName}!`);
  }

  function logout() { user = null; localStorage.removeItem('abi2016_user'); myVotes = {}; }

  async function loadAll() {
    await Promise.all([loadVotes(), loadMyVotes(), loadTimeVotes(), loadMyTimeVotes(), loadRsvpStats(), loadMyRsvp(), loadContribs(), loadIdeas(), loadLocations(), loadSongs()]);
  }

  async function loadVotes() {
    const d = await (await fetch('/api/votes')).json();
    voteCounts = d.counts;
    uniqueVoters = d.uniqueVoters;
    totalUsers = d.totalUsers;
  }

  async function loadMyVotes() {
    if (!user) return;
    const res = await fetch('/api/votes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: user.token }),
    });
    if (res.status === 401) throw new Error('invalid session');
    myVotes = await res.json();
  }

  async function castVote(dateKey: string, vote: string) {
    if (!user) { showToast('Bitte zuerst einloggen!'); return; }
    if (votingKey === dateKey) return;
    votingKey = dateKey;
    const prev = myVotes[dateKey];
    const newVote = prev === vote ? null : vote;
    if (newVote) myVotes[dateKey] = newVote; else delete myVotes[dateKey];
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

  async function loadTimeVotes() {
    const d = await (await fetch('/api/time-votes')).json();
    timeCounts = d.counts;
  }

  async function loadMyTimeVotes() {
    if (!user) return;
    const res = await fetch('/api/time-votes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: user.token }),
    });
    if (res.status === 401) throw new Error('invalid session');
    myTimeVotes = await res.json();
  }

  async function castTimeVote(slotKey: string, vote: string) {
    if (!user) { showToast('Bitte zuerst einloggen!'); return; }
    if (votingTimeKey === slotKey) return;
    votingTimeKey = slotKey;
    const prev = myTimeVotes[slotKey];
    const newVote = prev === vote ? null : vote;
    if (newVote) myTimeVotes[slotKey] = newVote; else delete myTimeVotes[slotKey];
    myTimeVotes = { ...myTimeVotes };
    if (timeCounts[slotKey]) {
      if (prev) (timeCounts[slotKey] as any)[prev] = Math.max(0, (timeCounts[slotKey] as any)[prev] - 1);
      if (newVote) (timeCounts[slotKey] as any)[newVote]++;
      timeCounts = { ...timeCounts };
    }
    await fetch('/api/time-votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: user.token, slotKey, vote: newVote }),
    });
    votingTimeKey = null;
    showToast(newVote === 'yes' ? '✓ Stimme gezählt!' : newVote === 'maybe' ? '~ Als Egal vermerkt' : newVote === 'no' ? '✗ Nope vermerkt' : 'Stimme zurückgezogen');
  }

  async function loadRsvpStats() {
    rsvpStats = await (await fetch('/api/rsvp')).json();
  }

  // Restore the user's own RSVP after a refresh (once on load — not in the poll, so it
  // never overrides them while they're mid-change).
  async function loadMyRsvp() {
    if (!user) return;
    const d = await (await fetch(`/api/rsvp?token=${user.token}`)).json();
    if (d.mine) {
      rsvpChoice = d.mine.attending ? 'yes' : 'no';
      rsvpGuests = d.mine.guests ?? 1;
      rsvpDone = true;
    }
  }

  async function submitRsvp() {
    if (!user) return;
    rsvpLoading = true;
    await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: user.token, attending: rsvpChoice === 'yes', guests: rsvpGuests, dietary: rsvpDietary, note: rsvpNote }),
    });
    rsvpLoading = false; rsvpDone = true;
    await loadRsvpStats();
    showToast(rsvpChoice === 'yes' ? 'Anmeldung gespeichert!' : 'Schade! Bis zum nächsten Mal.');
  }

  async function loadContribs() {
    contributions = await (await fetch('/api/contributions')).json();
  }

  async function addContrib() {
    if (!user || !newContribItem.trim()) return;
    const c = await (await fetch('/api/contributions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: user.token, item: newContribItem, category: newContribCat }),
    })).json();
    contributions = [c, ...contributions];
    newContribItem = '';
    showToast('Eingetragen! Danke');
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
    const d = await (await fetch(`/api/ideas${user ? '?token=' + user.token : ''}`)).json();
    ideas = d.ideas; myIdeaVotes = d.myVotes;
  }

  async function addIdea() {
    if (!user || !newIdeaText.trim()) return;
    const idea = await (await fetch('/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: user.token, text: newIdeaText, tag: 'Sonstiges' }),
    })).json();
    ideas = [idea, ...ideas];
    myIdeaVotes = [...myIdeaVotes, idea.id];
    newIdeaText = '';
    showToast('Idee eingereicht!');
  }

  async function toggleIdeaVote(ideaId: number) {
    if (!user) { showToast('Bitte zuerst einloggen!'); return; }
    const d = await (await fetch('/api/ideas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: user.token, ideaId }),
    })).json();
    if (d.voted) {
      myIdeaVotes = [...myIdeaVotes, ideaId];
      ideas = ideas.map(i => i.id === ideaId ? { ...i, votes: i.votes + 1 } : i);
    } else {
      myIdeaVotes = myIdeaVotes.filter(v => v !== ideaId);
      ideas = ideas.map(i => i.id === ideaId ? { ...i, votes: i.votes - 1 } : i);
    }
    ideas = [...ideas].sort((a, b) => b.votes - a.votes);
  }

  async function deleteIdea(ideaId: number) {
    if (!user) return;
    await fetch('/api/ideas', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: user.token, ideaId }),
    });
    ideas = ideas.filter(i => i.id !== ideaId);
    myIdeaVotes = myIdeaVotes.filter(v => v !== ideaId);
  }

  async function loadSongs() {
    const d = await (await fetch(`/api/songs${user ? '?token=' + user.token : ''}`)).json();
    songs = d.songs; mySongVotes = d.myVotes;
  }

  async function loadGenres() {
    try {
      const d = await (await fetch('/api/songs/genres')).json();
      songGenres = d.songGenres ?? {};
      vibe = d.vibe ?? [];
      vibeMore = d.vibeMore ?? 0;
    } catch {
      songGenres = {}; vibe = []; vibeMore = 0;
    }
  }

  async function addSongPick(track: { spotifyId: string; title: string; artist: string; artistId: string | null; image: string | null }) {
    if (!user) return;
    const res = await fetch('/api/songs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: user.token, spotifyId: track.spotifyId, title: track.title, artist: track.artist, artistId: track.artistId, image: track.image }),
    });
    const d = await res.json();
    if (!res.ok) { showToast(d.error === 'max_picks' ? 'Max. 3 Songs — erst einen entfernen!' : 'Hat nicht geklappt'); return; }
    await loadSongs();
    showToast('🎵 Song hinzugefügt!');
  }

  async function toggleSongPick(songId: number) {
    if (!user) return;
    const res = await fetch('/api/songs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: user.token, songId }),
    });
    const d = await res.json();
    if (!res.ok) { showToast(d.error === 'max_picks' ? 'Max. 3 Songs — erst einen entfernen!' : 'Hat nicht geklappt'); return; }
    await loadSongs();
  }

  async function loadLocations() {
    locations = await (await fetch('/api/locations')).json();
  }

  async function strikeLocation(id: number, struck: boolean) {
    if (!user) return;
    await fetch('/api/locations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: user.token, id, struck }),
    });
    locations = locations.map(l => l.id === id ? { ...l, struck: struck ? 1 : 0 } : l);
  }

  async function deleteLocation(id: number) {
    if (!user) return;
    await fetch('/api/locations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: user.token, id }),
    });
    locations = locations.filter(l => l.id !== id);
  }

  async function editLocation(id: number, fields: { description: string; address: string; contact: string }) {
    if (!user || !fields.description.trim()) return;
    const loc = await (await fetch('/api/locations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: user.token, id, ...fields }),
    })).json();
    locations = locations.map(l => l.id === id ? loc : l);
    showToast('Ort aktualisiert!');
  }

  async function addLocation() {
    if (!user || !newLocDesc.trim()) return;
    const loc = await (await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: user.token, description: newLocDesc, address: newLocAddr, contact: newLocContact }),
    })).json();
    locations = [...locations, loc];
    newLocDesc = ''; newLocAddr = ''; newLocContact = '';
    showToast('Ort vorgeschlagen!');
  }

  function shareLink() {
    navigator.clipboard?.writeText(window.location.href);
    showToast('Link kopiert! Teile ihn in der Gruppe');
  }

  let voteLeader = $derived(Object.entries(voteCounts).sort((a, b) => (b[1].yes + b[1].maybe * 0.5) - (a[1].yes + a[1].maybe * 0.5))[0]?.[0]);
</script>

<svelte:head>
  <title>ABI '16 - 10 Jahre Reunion</title>
</svelte:head>

<Toast message={toast} />

{#if !user}
  {#if loading}
    <div class="loading-screen">
      <img src="/immerblau.png" alt="" class="loading-logo" />
    </div>
  {:else}
    <GateCard
      bind:authName
      bind:authMotto
      {authError}
      {authLoading}
      {mottoHint}
      onlogin={login}
    />
  {/if}
{:else}
  <EmojiCannon token={user.token} />
  <AppHeader
    userName={user.userName}
    {phase}
    {maxPhase}
    {onlineCount}
    {onlineNames}
    onlogout={logout}
    onphase={(p) => (phase = p)}
    onplaylist={openPlaylist}
  />

  {#if loading}
    <div class="loading-screen loading-content">
      <img src="/immerblau.png" alt="" class="loading-logo" />
    </div>
  {:else if phase === 0}
    <DateVoting
      {voteCounts}
      {myVotes}
      {voteLeader}
      {votingKey}
      userName={user.userName}
      {uniqueVoters}
      {totalUsers}
      {voteDeadline}
      oncastvote={castVote}
      onnext={() => (phase = 1)}
    >
      {#snippet afterHero()}
        <StepNav nextLabel="Weiter zur Uhrzeit" onnext={() => (phase = 1)} />
      {/snippet}
    </DateVoting>
  {:else if phase === 1}
    <TimeVoting
      {timeCounts}
      {myTimeVotes}
      {votingTimeKey}
      dateLabel={resolveFinalDate(voteLeader)?.label ?? ''}
      oncastvote={castTimeVote}
    >
      {#snippet afterHero()}
        <StepNav backLabel="Zurück" nextLabel="Weiter zu Wer ist dabei" onback={() => (phase = 0)} onnext={() => (phase = 2)} />
      {/snippet}
    </TimeVoting>
  {:else if phase === 2}
    <RsvpPhase
      {rsvpStats}
      {voteLeader}
      {voteDeadline}
      bind:rsvpDone
      bind:rsvpChoice
      bind:rsvpGuests
      bind:rsvpDietary
      bind:rsvpNote
      {rsvpLoading}
      onsubmit={submitRsvp}
    >
      {#snippet afterHero()}
        <StepNav backLabel="Zurück" nextLabel="Weiter zur Planung" onback={() => (phase = 1)} onnext={() => (phase = 3)} />
      {/snippet}
    </RsvpPhase>
  {:else if phase === 3}
    <PlanningPhase
      {ideas}
      {myIdeaVotes}
      {contributions}
      {locations}
      userId={user.userId}
      bind:planTab
      bind:newContribItem
      bind:newContribCat
      bind:newIdeaText
      bind:newLocDesc
      bind:newLocAddr
      bind:newLocContact
      onaddcontrib={addContrib}
      ondeletecontrib={deleteContrib}
      onaddidea={addIdea}
      ondeleteidea={deleteIdea}
      ontoggleideavote={toggleIdeaVote}
      onaddlocation={addLocation}
      oneditlocation={editLocation}
      ondeletelocation={deleteLocation}
      onstrikelocation={(id) => strikeLocation(id, true)}
      onunstrikelocation={(id) => strikeLocation(id, false)}
    >
      {#snippet afterHero()}
        <StepNav backLabel="Zurück" onback={() => (phase = 2)} />
      {/snippet}
    </PlanningPhase>
  {:else if phase === 4}
    <PlaylistPhase
      {songs}
      myVotes={mySongVotes}
      {songGenres}
      {vibe}
      {vibeMore}
      onaddpick={addSongPick}
      ontogglepick={toggleSongPick}
    >
      {#snippet afterHero()}
        <StepNav backLabel="Zurück" onback={() => (phase = prePlaylistPhase)} />
      {/snippet}
    </PlaylistPhase>
  {/if}
{/if}

<style>
  .loading-screen { display: flex; align-items: center; justify-content: center; min-height: 100dvh; }
  .loading-content { min-height: 50dvh; }
  .loading-logo { width: 52px; height: 52px; border-radius: 12px; animation: spin 1.2s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>

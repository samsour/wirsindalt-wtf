<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { checkMotto } from '$lib/dates';
  import Toast from '$lib/components/Toast.svelte';
  import GateCard from '$lib/components/GateCard.svelte';
  import AppHeader from '$lib/components/AppHeader.svelte';
  import DateVoting from '$lib/components/DateVoting.svelte';
  import RsvpPhase from '$lib/components/RsvpPhase.svelte';
  import PlanningPhase from '$lib/components/PlanningPhase.svelte';
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
  let maxPhase = $derived(data.maxPhase); // set MAX_PHASE in .env: 0=Terminwahl only, 1=+Anmeldung, 2=all
  let voteDeadline = $derived(data.voteDeadline); // set VOTE_DEADLINE in .env: YYYY-MM-DD
  let deadlineExpired = $derived(!voteDeadline || Date.now() > new Date(voteDeadline).getTime() + 86_400_000);
  let phase = $state(0);
  $effect(() => { phase = maxPhase; }); // start at the current active phase

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

  let votePollInterval: ReturnType<typeof setInterval>;

  function startVotePoll() {
    votePollInterval = setInterval(loadVotes, 5_000);
  }

  onDestroy(() => {
    clearInterval(presenceInterval);
    clearInterval(pingInterval);
    clearInterval(votePollInterval);
  });

  let voteCounts: Record<string, { yes: number; maybe: number; no: number }> = $state({});
  let uniqueVoters = $state(0);
  let totalUsers = $state(0);
  let myVotes: Record<string, string> = $state({});
  let votingKey = $state<string | null>(null);

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
        try {
          await loadAll();
          startPresence();
        } catch {
          // token invalid — wipe session and show gate
          logout();
        }
      } else {
        localStorage.removeItem('abi2016_user');
      }
    }
    await loadVotes();
    await loadRsvpStats();
    startVotePoll();
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
    showToast(`Willkommen, ${user!.userName}!`);
  }

  function logout() { user = null; localStorage.removeItem('abi2016_user'); myVotes = {}; }

  async function loadAll() {
    await Promise.all([loadVotes(), loadMyVotes(), loadRsvpStats(), loadContribs(), loadIdeas(), loadLocations()]);
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

  async function loadRsvpStats() {
    rsvpStats = await (await fetch('/api/rsvp')).json();
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
    showToast(rsvpChoice === 'yes' ? 'Anmeldung gespeichert!' : 'Schade! Bis zum naechsten Mal.');
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

  async function addLocation() {
    if (!user || !newLocDesc.trim()) return;
    const loc = await (await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: user.token, description: newLocDesc, address: newLocAddr }),
    })).json();
    locations = [...locations, loc];
    newLocDesc = ''; newLocAddr = '';
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
  <GateCard
    bind:authName
    bind:authMotto
    {authError}
    {authLoading}
    {mottoHint}
    onlogin={login}
  />
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
  />

  {#if phase === 0}
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
    />
  {:else if phase === 1}
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
      onaddcontrib={addContrib}
      ondeletecontrib={deleteContrib}
      onaddidea={addIdea}
      ondeleteidea={deleteIdea}
      ontoggleideavote={toggleIdeaVote}
      onaddlocation={addLocation}
      ondeletelocation={deleteLocation}
      onstrikelocation={(id) => strikeLocation(id, true)}
      onunstrikelocation={(id) => strikeLocation(id, false)}
    />
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
    />
  {/if}
{/if}

# Vennwhen

> Find the *when* in everyone's calendar.

Group scheduling without the polling. Members connect their calendars privately; the app surfaces when you're all free.

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind
- **Turso** (libSQL) + **Drizzle ORM** for the database
- **Auth.js v5** for Google OAuth (uses the same OAuth grant for Calendar API access in Phase 3)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Then fill in:

#### `AUTH_SECRET`
```bash
openssl rand -base64 32
```

#### Google OAuth credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com) → your project → APIs & Services → Credentials
2. Make sure **Google Calendar API** is enabled (APIs & Services → Library)
3. Create OAuth client ID (Web application)
4. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID → `AUTH_GOOGLE_ID`, Client Secret → `AUTH_GOOGLE_SECRET`

#### Turso credentials
1. From the Turso dashboard, create a database (or use an existing one)
2. Get the connection URL → `TURSO_DATABASE_URL`
3. Get an auth token → `TURSO_AUTH_TOKEN`

### 3. Push the schema to Turso

```bash
npm run db:push
```

This creates all tables defined in `src/db/schema.ts`.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What works in Phase 1

✅ Sign in with Google
✅ Create a group
✅ Get a shareable invite link
✅ Join a group via invite link
✅ See the heatmap and top suggestions (with **mock** data)
✅ Click cells to see who's free/busy

## What's mocked

❌ Calendar sync — busy blocks are generated client-side as random work hours + evening conflicts.
   Wire this to the real Google Calendar API in Phase 3 (see below).

## Roadmap

### Phase 2 — Polish & multi-tenant (next)
- [ ] Empty states & loading skeletons
- [ ] Group settings (rename, delete, leave)
- [ ] Member list with sync status

### Phase 3 — Real Google Calendar sync
- [ ] Server route that fetches `/freeBusy` from Google Calendar API using the stored OAuth tokens (in the `account` table)
- [ ] Refresh access tokens via `refresh_token` when expired
- [ ] Cron job (or on-demand "Refresh" button) to re-sync
- [ ] Replace `generateMockBusyBlocks` in `app/g/[slug]/page.tsx` with a real DB query against `busyBlocks`

### Phase 4 — Other providers
- [ ] Microsoft Graph (Outlook)
- [ ] `.ics` file upload / URL subscription (covers Apple iCloud)

### Phase 5 — Nice-to-haves
- [ ] Email notification when a great slot opens
- [ ] "Lock" a chosen time and send calendar invites back
- [ ] Mobile-optimized heatmap
- [ ] Timezone handling across members

## File map

```
src/
├── app/
│   ├── page.tsx                  Landing
│   ├── dashboard/page.tsx        List of user's groups
│   ├── groups/new/page.tsx       Create group form
│   ├── g/[slug]/page.tsx         Group view (heatmap)
│   ├── join/[code]/page.tsx     Invite landing
│   └── api/auth/[...nextauth]/   Auth.js handler
├── components/
│   ├── Nav.tsx                   Top nav with sign-in
│   ├── Heatmap.tsx              The overlap visualization
│   └── InviteBox.tsx             Copy-link banner
├── db/
│   ├── schema.ts                Drizzle schema (users, groups, busyBlocks)
│   └── index.ts                  DB client
└── lib/
    ├── auth.ts                   Auth.js v5 config
    ├── overlap.ts                Time-range overlap algorithm
    └── slug.ts                   Invite slug generator
```

## Key design decisions

1. **No event details stored.** The `busy_block` table holds only `(userId, startTs, endTs)`. Even if compromised, the data leak is minimal.
2. **Overlap is computed at query time** in `lib/overlap.ts`. For groups of 5–15 and a horizon of 4–8 weeks, this is plenty fast.
3. **Slots are 30 minutes** in `lib/overlap.ts` (SLOT_MS). The heatmap renders them in 2-hour cells by taking the minimum free count per cell — a cell is only as free as its most-conflicted half hour.
4. **Auth.js stores OAuth tokens** in the `account` table. In Phase 3, the sync worker reads `account.access_token` (refreshing via `refresh_token` when needed) to call the Google Calendar API.

# wirsindalt.wtf

A single-purpose date poll for one class reunion. No SaaS, no multi-tenancy, no investors.

It's basically Doodle but we own it and it doesn't look like it was designed in 2009.

## What it does

1. Admin picks a bunch of candidate dates
2. People vote for the ones they can make
3. Admin declares the winner
4. People RSVP

That's it. No accounts for guests, no emails, no dark patterns.

## Stack

- **Next.js 15** App Router + TypeScript + Tailwind
- **Turso** (libSQL) + **Drizzle ORM**
- **Auth.js v5** with Google OAuth — admin-only, one email in `.env`

## Setup

### 1. Install

```bash
pnpm install
```

### 2. Environment variables

```bash
cp .env.example .env
```

| Variable | Where to get it |
|---|---|
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client (Web), redirect URI: `http://localhost:3000/api/auth/callback/google` |
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | Turso dashboard → your database → Connect |
| `ADMIN_EMAIL` | Your Google account email — only this address gets the admin dashboard |

### 3. Push schema

```bash
pnpm db:push
```

### 4. Run

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000) — the secret admin login is in the footer.

## Seeding dates

```bash
node scripts/seed-dates.mjs
```

Batch-inserts all Fridays and Saturdays in a date range (plus German holidays with labels). Edit the file to adjust the range before running.

## File map

```
src/
├── app/
│   ├── page.tsx               Public voting/results page
│   ├── dashboard/page.tsx     Admin dashboard (date mgmt, results, RSVPs)
│   └── api/
│       ├── event/             GET event + date options + vote counts
│       ├── vote/              POST a vote
│       └── rsvp/              POST an RSVP
├── components/
│   ├── Footer.tsx             Secret login button (logged out) / admin link (logged in)
│   ├── Nav.tsx                Exists, unused, vibes only
│   └── Toast.tsx              Little success notification
├── db/
│   ├── schema.ts              Drizzle schema
│   └── index.ts               Turso client
└── lib/
    └── auth.ts                Auth.js config
```

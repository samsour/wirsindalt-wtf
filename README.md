# ABI '16 – 10 Jahre Reunion App

SvelteKit + Turso (libsql) app for coordinating the 10-year Abitur reunion.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy `.env.example` to `.env` and fill in your Turso credentials:
```bash
cp .env.example .env
```

Get your credentials from [Turso dashboard](https://turso.tech) or the CLI:
```bash
turso db show your-db-name
turso db tokens create your-db-name
```

`.env`:
```
TURSO_URL=libsql://your-db-name-yourname.turso.io
TURSO_AUTH_TOKEN=eyJ...
```

### 3. Initialize the database
Start the dev server, then open in browser:
```
http://localhost:5173/api/init
```
This creates all tables. Only needs to run once.

### 4. Run
```bash
npm run dev
```

## Deploy (e.g. Vercel or Netlify)
```bash
npm run build
```
Set `TURSO_URL` and `TURSO_AUTH_TOKEN` as environment variables in your hosting dashboard.

For Vercel, install the adapter:
```bash
npm install @sveltejs/adapter-vercel
```
Then update `svelte.config.js` to use `adapter-vercel`.

## Features
- **Phase 1 – Terminwahl**: Vote on Fri/Sat weekends Jun–Aug 2026
- **Phase 2 – Anmeldung**: RSVP with guest count and dietary notes  
- **Phase 3 – Planung**: Contributions, idea upvoting, location suggestions
- **Gate**: Abi motto as login ("immer blau, trotzdem schlau")
- Persists login in `localStorage`

## Motto
The gate checks for `immer blau, trotzdem schlau` (case-insensitive, punctuation-tolerant).
Change it in `src/lib/dates.ts`.

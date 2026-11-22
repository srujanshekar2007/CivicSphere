# CivicSync

CivicSync connects citizen issue reports with the teams responsible for resolving them. Citizens can submit and track reports, explore mapped issues, receive public alerts, and review city performance. Authorities manage reports, service levels, hotspots, and alerts through a role-scoped operations portal.

## Stack

- React, Vite, Tailwind CSS, MapLibre GL, and Chart.js
- Node.js and Express
- PostgreSQL with PostGIS
- Cookie-based sessions with role-based access and admin two-factor authentication
- Cloudinary image storage (with local development fallback)

## Run locally

Prerequisites: Node.js, PostgreSQL with PostGIS, and a database for CivicSync.

1. Install dependencies and create the backend environment file:

   ```sh
   npm --prefix frontend ci
   npm --prefix backend ci
   test -f backend/.env || cp backend/.env.example backend/.env
   ```

2. Edit `backend/.env` without overwriting other settings. Set `DATABASE_URL` to the connection string from your new Supabase project's **Connect** panel. Keep it backend-only and private. CivicSync continues using its own JWT and TOTP authentication secrets. Follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for connection, TLS, PostGIS, and migration setup.

3. After inspecting the new project's database and explicitly approving schema changes, apply migrations:

   ```sh
   npm --prefix backend run migrate
   ```

4. Start the API and Vite in separate terminals:

   ```sh
   npm --prefix backend run dev
   ```

   ```sh
   npm --prefix frontend run dev
   ```

   Open the URL printed by Vite (usually `http://localhost:5173`). Vite forwards `/api` and `/uploads` requests to Express on port 5000.

For a production build, run `npm run build` from the project root. The root `npm start` script applies pending migrations before serving the API and built frontend, so use it only after approving the target database and migration run.

## Verification

```sh
npm --prefix frontend run build
npm --prefix frontend run lint
```

The backend package does not currently define an automated test suite. API and database workflows require a configured PostGIS database and a running backend.

## Supabase PostgreSQL setup

CivicSync uses Express, `pg`, the existing custom authentication, and its nine PostgreSQL migrations. Follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md) to connect a new independent Supabase project. The frontend continues to use Express; do not put database credentials or Supabase secret keys in Vite environment variables.

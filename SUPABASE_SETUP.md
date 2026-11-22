# Run CivicSync with Supabase PostgreSQL

CivicSync uses Supabase as a PostgreSQL host. The existing Express backend continues to use `pg`, the custom SQL migration runner, and CivicSync's own JWT/cookie authentication. The browser communicates only with Express. This setup does not use Supabase Auth, the Supabase client SDK, Storage, or Realtime.

Create a separate Supabase project owned by you. Do not use the existing `SIH-prototype` or `AiPoweredCampus` projects. This guide does not copy data from Neon or any backup.

## 1. Get the PostgreSQL connection details

In the new project's Supabase Dashboard, click **Connect** and copy the PostgreSQL connection string. Use the host, port, username, database, and password from the dashboard exactly as shown; do not construct the pooler hostname yourself.

- For the persistent Express backend, use a **Direct connection** when your network supports its IP version. If your network is IPv4-only, use the **Session pooler** connection instead.
- For migrations, use a **Direct connection** where reachable. The custom migration runner holds a session-level advisory lock on one connection, so a **Session pooler** is also suitable. Do not use the **Transaction pooler** for migrations.
- If using separate runtime and migration URLs, they must point to the same new Supabase project and database. Keep both values in `backend/.env` only.

Supabase documents the connection methods, network requirements, and migration guidance in [Connect to your database](https://supabase.com/docs/guides/database/connecting-to-postgres).

## 2. Configure the backend environment

Do not overwrite an existing `backend/.env`. If it does not exist, copy the template once:

```sh
test -f backend/.env || cp backend/.env.example backend/.env
```

Set these backend-only values in `backend/.env`:

- `DATABASE_URL`: the new Supabase direct or **session-mode** PostgreSQL connection string for the running API.
- `DATABASE_MIGRATION_URL`: optional direct or session-mode connection string for migrations. If blank, the runner uses `DATABASE_URL`.
- `DATABASE_SSL=verify-full`: enable TLS with certificate and hostname verification.
- `DATABASE_SSL_CA`: optional path to the Supabase root CA certificate if the Node.js runtime does not trust the server certificate through its system CA store. Supabase documents downloading the certificate under Database settings in its [SSL configuration guide](https://supabase.com/docs/guides/database/connecting-to-postgres#ssl).
- `DATABASE_POOL_MAX=5`: maximum connections in the backend's persistent `pg.Pool`.
- `JWT_ACCESS_SECRET` and `TOTP_ENCRYPTION_KEY`: keep CivicSync's existing custom authentication. Do not replace them with Supabase Auth keys.
- `CLIENT_ORIGIN=http://localhost:5173` and `TRUST_PROXY_HOPS=1` for local development.
- `STORAGE_PROVIDER=local` for local development, or configure Cloudinary in the backend for hosted uploads.

The database password, database URLs, and any future Supabase secret keys must never be placed in `frontend/.env`, `VITE_*` variables, source code, screenshots, or Git. This project does not currently need a Supabase publishable key or service-role key: it does not call the Supabase Data API. Do not add them to the frontend.

The root `.gitignore` excludes `.env` files while allowing `.env.example`. Keep `backend/.env` untracked.

## 3. PostGIS and search path

Supabase recommends placing PostGIS objects in the `extensions` schema. In the new project Dashboard, open **Database → Extensions**, enable `postgis`, and choose `extensions` as its schema. See [Supabase PostGIS setup](https://supabase.com/docs/guides/database/extensions/postgis).

Migration `001` now ensures the `extensions` schema exists and requests PostGIS there when it is first created. `CREATE EXTENSION IF NOT EXISTS` will not move an extension that is already installed elsewhere. The backend and migration runner set `search_path` to `public,extensions`: CivicSync tables and functions remain in `public`, while its existing unqualified `geography`, `geometry`, and `ST_*` references can resolve PostGIS from `extensions` or `public`. No spatial query identifiers were rewritten and no existing objects are moved.

Before migrating, inspect the new project's extension state. If PostGIS is already installed in a different schema than `public` or `extensions`, stop and resolve that deliberately; do not drop or relocate the extension to force the migration through.

## 4. Data API, RLS, and application authorization

The current application uses CivicSync's custom Express authentication and authorization. Its SQL connection does not receive Supabase Auth user claims, so `auth.uid()` policies cannot stand in for the existing Express role checks. Keep browser access routed through Express. Before exposing Supabase's Data API, verify that its `anon` and `authenticated` roles cannot read or modify CivicSync tables; disable the Data API for these tables or configure appropriate grants, RLS, and policies. Do not assume enabling RLS alone removes table grants. Keep the PostgreSQL connection string private to the backend.

This phase does not add Supabase Storage, Realtime, or Auth integrations. Existing Cloudinary/local image handling and API-polled alerts remain in place.

## 5. Inspect and apply migrations only after approval

Phase 4 must first connect read-only to the new project's database and inspect schemas, extensions, existing objects, grants, RLS, and migration history. Do not assume a Supabase project contains no objects. The nine migrations mostly create objects without `IF NOT EXISTS`; if the target contains conflicting objects or an inconsistent migration history, stop and review instead of dropping or resetting anything.

After the inspection and explicit approval to change the new project, run:

```sh
npm --prefix backend run db:check
npm --prefix backend run migrate
```

`db:check` performs a read-only connection check. `migrate` acquires a session advisory lock, creates `public.schema_migrations` if needed, applies unrecorded files `001` through `009` in order, and records each successful migration in a transaction. Migration `006` inserts the 15 reference categories with conflict protection. It does not import user or issue records. Do not run it before the target inspection and approval. The root `npm start` command also invokes the migrator automatically.

## 6. Run locally

After configuring `backend/.env`, install dependencies if needed and start the backend and frontend in separate terminals:

```sh
npm --prefix backend run dev
```

```sh
npm --prefix frontend run dev
```

Open the Vite URL printed in the frontend terminal. Vite forwards same-origin `/api` and `/uploads` requests to Express on port 5000; the frontend receives no database credentials.

## Current verification status

Phase 2 only prepares code and documentation. No Supabase project has been contacted, no SQL has been executed, and no migrations or application tests have been run against Supabase. Supabase connection, PostGIS placement, RLS/grants, and application flows must be verified in later phases before declaring the migration complete.

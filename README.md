# TaskTrack

Small private Hono app for capturing ideas in Postgres.

## Setup

```bash
npm install
docker compose up -d
npm run db:migrate
npm run dev
```

Optional environment variables:

- `DATABASE_URL` defaults to `postgres://tasktrack:tasktrack@localhost:5432/tasktrack`
- `APP_URL` defaults to `http://localhost:3000`
- `PORT` defaults to `3000`
- `ALLOWLISTED_EMAIL` defaults to `michaelgreen06@gmail.com`
- `AUTH_SECRET` should be set to a long random string outside local dev

## Scripts

- `npm run dev` starts the Hono server with watch mode.
- `npm run start` starts the Hono server.
- `npm run db:migrate` runs Kysely migrations.
- `npm run check` runs typecheck and lint.

Magic links are printed to the server console for now.

## Local Postgres

The repo includes `docker-compose.yml` for local Postgres.

`TablePlus` can connect after the container is running with:

- Host: `127.0.0.1`
- Port: `5432`
- Database: `tasktrack`
- User: `tasktrack`
- Password: `tasktrack`

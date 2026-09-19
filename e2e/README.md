* Run via `npm run test:e2e` from the repository root.

Requirements:
- PostgreSQL reachable (local or `docker compose up postgres`)
- A configured `server/.env` (copy `server/.env.example`)
- Migrations applied: `npm run prisma:migrate --prefix server`
- Seeded if desired: `npm run prisma:seed --prefix server`

The Playwright config auto-starts both dev servers (server:3001, client:5173).
# PQFL Backend

REST API for the PQFL Data Analyse project. Built with Express, Mongoose and Zod.
The goal of this package is to own all business logic and database access that
used to live inside the Next.js frontend.

## Requirements

- Node.js 20+
- MongoDB 6+ (local or remote)

## First-time setup

```bash
cd back-end
npm install
cp .env.example .env
# edit .env with real values
```

## Running

```bash
npm run dev     # hot reload via nodemon
npm start       # production-style start
```

Once the server is up:

- Health: `GET http://localhost:3333/api/v1/health`
- Swagger UI: `http://localhost:3333/docs`

## Available scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start with nodemon (auto-reload). |
| `npm start` | Start a single Node process. |
| `npm test` | Run tests with the Node test runner. |
| `npm run seed` | Seed the database from `src/seed/index.js`. |
| `npm run db:migrate:create` | Scaffold a new migration file. |
| `npm run db:migrate:up` | Apply pending migrations. |
| `npm run db:migrate:down` | Roll back the last migration. |

## Layout

```
back-end/
  docs/                  project-level docs (non API)
  Deploy/                deploy descriptors (docker, CI, etc.)
  migrations/            migrate-mongo migration files
  src/
    app.js               Express app composition
    config/              env, database, constants
    controllers/         HTTP -> service calls
    docs/                Swagger (config, routes, schemas, utils)
    middlewares/         cross-cutting concerns
    models/              Mongoose models (repository layer uses these)
    repositories/        data access (only place that touches models)
    routes/              route wiring (/api/v1/*)
    schemas/             Zod request/response contracts
    seed/                seed scripts
    services/            business rules
    test/                unit/integration tests
    utils/               shared helpers
  server.js              process entrypoint
```

## Architectural guardrails

- Routes only map endpoints and their middleware chain.
- Controllers only translate HTTP <-> service calls.
- Services own the business rules.
- Repositories are the only layer that talks to Mongoose.
- Schemas (`src/schemas`) define the contracts for requests and responses.
- Middlewares handle cross-cutting concerns (errors, security, trace id, auth later).

## API scope for this iteration

- `GET /api/v1/health`
- `GET /api/v1/producers`
- `GET /api/v1/producers/:id`

## Response envelope strategy

- **Single resource** (e.g. `GET /producers/:id`): return the resource object
  directly. No envelope.
- **Collections** (e.g. `GET /producers`): return `{ items, pagination }`.
  `pagination` always includes `page`, `limit` and `total`.
- **Errors** (any status `>= 400`): return the flat payload documented in
  Step-2: `{ error, message, details?, requestId? }`.

I deliberately skip a generic `{ data, meta }` envelope for single resources —
it only adds indirection for frontend consumers. If a response ever needs
meta-like information (e.g. cache status, freshness timestamps) it is added as
sibling fields on the resource rather than nested under `data`.

## Database migrations

The backend uses [`migrate-mongo`](https://www.npmjs.com/package/migrate-mongo)
with the config at [migrate-mongo-config.js](migrate-mongo-config.js).

```bash
npm run db:migrate:up       # apply pending migrations
npm run db:migrate:down     # roll back the last migration
npm run db:migrate:create <name>  # scaffold a new migration
```

Migrations live in [migrations/](migrations/) and are committed with
timestamped names. Never edit an already-applied migration — add a new one.

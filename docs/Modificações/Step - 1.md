# Step - 1: Architecture Direction and Scope

In this phase, I define how I will split the backend from the current frontend without breaking anything that already works.

## What I am doing in this step

- I will build the entire backend inside `back-end/`.
- I will not modify the current frontend project.
- I will keep both projects in parallel until the backend is stable.
- I will use: JavaScript, Express, Nodemon, swagger-jsdoc, swagger-ui-express, Zod, Mongoose, and MongoDB.

## Architecture I want to start with

I will use this base structure:

```txt
back-end/
  docs/
  Deploy/
  migrations/
  src/
    config/
    controllers/
    docs/
      config-doc/
      routes-doc/
      schemas-doc/
      utils-doc/
    middlewares/
    models/
    repositories/
    routes/
    schemas/
    seed/
    services/
    test/
    utils/
    app.js
  server.js
```

## Changes in the architecture

- I will version routes from day one (`/api/v1`).
- I will keep route files thin and move business logic to services.
- I will centralize input validation with Zod schemas and validation middleware.
- I will centralize error handling and avoid try/catch repetition in every controller.
- I will separate Swagger docs from route files exactly as planned.

## Practical guardrails I will follow

- Routes only map endpoints and middleware chain.
- Controllers map HTTP requests to service calls.
- Services hold business rules.
- Repositories are the only place that touches Mongoose models.
- Schemas define contracts for request and response.
- Middlewares handle cross-cutting concerns (errors, security, trace id, auth later).

## Minimal API scope for first iteration

I will keep phase 1 small:

- `GET /api/v1/health`
- `GET /api/v1/producers`
- `GET /api/v1/producers/:id`

---

Install all required libraries and config.

## 1) Initialize backend package

From workspace root:

```powershell
cd back-end
npm init -y
```

Then I set `"type": "module"` in `package.json` so I can use ESM imports.

## 2) Install Libraries

```powershell
npm install express swagger-jsdoc swagger-ui-express zod
npm install -D nodemon
npm install cors helmet morgan
npm install pino pino-http    <---logs json
npm install mongoose
npm install -D migrate-mongo
```

If I do not want migration scripts right now, I can skip `migrate-mongo` and add it later.

## 3) Configure package scripts

```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "db:migrate:create": "migrate-mongo create",
    "db:migrate:up": "migrate-mongo up",
    "db:migrate:down": "migrate-mongo down",
    "seed": "node src/seed/index.js",
    "test": "node --test"
  }
}
```

## 4) Add root config files

- `.env.example`
- `.gitignore`
- `nodemon.json`
- `README.md`

`nodemon.json` example:

```json
{
  "watch": ["server.js", "src"],
  "ext": "js,json",
  "ignore": ["docs/*"],
  "exec": "node server.js"
}
```
---

I wire the application skeleton (`src/app.js` and `server.js`) so I can start building features on a stable base.

## 1) Create `src/app.js`

I will keep this file focused on app composition:

- Express app init.
- Core middlewares (`helmet`, `cors`, `express.json`, request logger).
- API prefix mounting (`/api/v1`).
- Swagger route mounting (`/docs`).
- Not-found handler.
- Global error handler.

I will not call `app.listen` in this file.

## 2) Create `server.js`

I will keep this file focused on process lifecycle:

- Load env values.
- Validate env before startup.
- Start server with configured port.
- Graceful shutdown (`SIGINT`, `SIGTERM`) closing HTTP server.
- Log startup summary.

## 3) Add a simple health route

I will create a lightweight route early:

- `GET /api/v1/health`

Expected response example:

```json
{
  "status": "ok",
  "service": "pqfl-backend",
  "timestamp": "2026-04-23T00:00:00.000Z"
}
```

## 4) Keep startup dependency-safe

Before server starts:

- Env config must pass Zod validation.
- MongoDB connection should be validated at startup through a dedicated config module.

This avoids silent boot with invalid runtime settings.

## 5) Recommended middleware order

1. Request id middleware
2. Security middleware (`helmet`)
3. CORS middleware
4. Body parser (`express.json`)
5. Logger middleware
6. Routes
7. Not-found middleware
8. Global error middleware

---

I make runtime configuration explicit and safe.

## 1) Create config modules in `src/config`

- `env.js` for env parsing/validation.
- `database.js` for Mongoose connection and connection helpers.
- `constants.js` for app constants (api prefix, service name).

## 2) Validate env with Zod before startup

I will parse `process.env` with a Zod schema. Example fields:

- `NODE_ENV` (`development | test | production`)
- `PORT` (string to number transform)
- `API_PREFIX` (default `/api/v1`)
- `MONGODB_URI` (url)
- `MONGODB_DB_NAME` (string, optional if defined in URI)
- `CORS_ORIGIN` (string)

If validation fails, I will fail fast and print readable issues.

## 3) Use `.env.example` as source of truth

I will keep `.env.example` complete and updated every time I add a new env var.

That avoids hidden env drift across machines.

## 4) Configure Mongoose connection behavior

I will centralize Mongo connection rules in `src/config/database.js`:

- Single connection bootstrap before handling requests.
- Fast failure with clear logs if Mongo is unreachable.
- Reasonable pool settings (`maxPoolSize`, `minPoolSize`).
- Server selection timeout to avoid hanging startup.

This keeps connection behavior predictable in local, staging, and production.

## 5) Security defaults in config
- CORS allowlist from env.
- Payload size limit for JSON parser.
- Trust proxy only when needed in production.
---

I organize API documentation in `src/docs` so route files stay clean.

## 1) Keep docs outside route comments

I want route files focused on route wiring, so I will place Swagger definitions in:

- `src/docs/config-doc`
- `src/docs/routes-doc`
- `src/docs/schemas-doc`
- `src/docs/utils-doc`

## 2) Suggested responsibilities per docs folder

- `config-doc`: OpenAPI base config and swagger-jsdoc options.
- `routes-doc`: path definitions for each route group.
- `schemas-doc`: reusable request/response schemas.
- `utils-doc`: helpers to avoid duplicated examples/components.

## 3) Swagger setup flow

I will:

1. Build OpenAPI object with title, version, servers, tags, components.
2. Generate docs using `swagger-jsdoc`.
3. Expose UI with `swagger-ui-express` at `/docs`.

## 4) Keep docs synced with runtime contracts

To reduce drift, I will:

- Reuse field names from Zod schemas.
- Keep example payloads realistic.
- Update docs in same PR as route changes.

## 5) Minimum docs quality gate
- Request schema documented.
- Success response documented.
- Error response documented (`400`, `404`, `500` as relevant).
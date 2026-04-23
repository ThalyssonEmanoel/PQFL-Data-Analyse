# Step - 5: On-Demand Coletum API V2 Sync (High-Volume Ready)

In this phase, I will implement the Coletum integration flow so data is fetched only when requested, then persisted to MongoDB with a high-volume strategy.

## 1) Objective of this step

I need the backend to:

- Call Coletum API V2 using GET only when explicitly requested.
- Persist returned data into MongoDB.
- Handle large payload volume safely (memory, retries, batching, idempotency).
- Keep existing read endpoints stable while refresh happens.

Target endpoint:

https://coletum.com/api/webservice/v2/forms/26738/answers?page=1&page_size=100&Token=33b3fvw4tbacwwwsws4s84sc4gocg8k

## 2) Non-negotiable behavior rules

- No automatic fetch at server startup.
- No background polling by default.
- No cron dependency in this step.
- External GET is triggered only by a dedicated API refresh request.
- Token must never be logged.

## 3) API contract for manual refresh

I will expose:

- `POST /api/v1/producers/refresh`

This endpoint will trigger the external Coletum GET flow internally.

### Suggested request body

```json
{
	"pageStart": 1,
	"maxPages": 500,
	"pageSize": 100,
	"dryRun": false,
	"force": false
}
```

### Suggested response shape

```json
{
	"ok": true,
	"status": "completed",
	"summary": {
		"pagesFetched": 128,
		"recordsReceived": 12784,
		"inserted": 420,
		"updated": 12364,
		"skipped": 0,
		"failed": 0,
		"durationMs": 189522
	},
	"meta": {
		"syncId": "2026-04-23T15:51:10.220Z#req_abc123",
		"startedAt": "2026-04-23T15:51:10.220Z",
		"finishedAt": "2026-04-23T15:54:19.742Z"
	}
}
```

## 4) File-level architecture I will use

I will keep the same layer boundaries:

- `src/routes/producer.routes.js`
	- Add refresh route.
- `src/controllers/producer.controller.js`
	- Add `refresh` handler.
- `src/schemas/producer-refresh.schema.js`
	- Validate refresh input options.
- `src/services/coletum.service.js`
	- Build URL, call external GET, parse response, retry logic.
- `src/services/producer-refresh.service.js`
	- Orchestrate pagination, mapping, batching, and persistence.
- `src/repositories/producer.repository.js`
	- Add bulk upsert methods.
- `src/repositories/sync.repository.js`
	- Persist sync lock/checkpoint/run metadata.
- `src/docs/routes-doc/producer.routes-doc.js`
	- Document refresh endpoint and responses.

## 5) Coletum API request strategy

### 5.1 URL strategy

For now, I can keep a full URL in env (quick integration), but the maintainable setup is:

- `COLETUM_BASE_URL`
- `COLETUM_FORM_ID`
- `COLETUM_TOKEN`
- `COLETUM_DEFAULT_PAGE_SIZE`

Then build the request URL dynamically with query params:

- `page`
- `page_size`
- `Token`

### 5.2 Pagination loop

I will fetch page by page:

1. Start at `pageStart`.
2. Request page with `page_size` (default 100).
3. Validate payload shape.
4. Map records and write to MongoDB in batches.
5. Move to next page.
6. Stop when one of these is true:
	 - Empty data page.
	 - Returned item count < `page_size`.
	 - Reached `maxPages`.
	 - Canceled due to lock or fatal errors.

### 5.3 Retry policy

- Retry only transient failures (network timeout, 5xx, 429).
- Use exponential backoff + jitter.
- Keep hard retry cap (for example: 3 attempts).
- Persist partial progress if the run fails mid-way.

## 6) High-volume handling rules

Because the dataset is large, I will avoid memory-heavy behavior:

- Never keep all pages in memory.
- Process one page at a time.
- Convert page records to normalized payloads and flush immediately.
- Use MongoDB `bulkWrite` with chunked operations (for example 200-1000 ops per chunk).
- Keep `ordered: false` in bulk mode when appropriate to maximize throughput.

## 7) Data model and persistence approach

I will store and upsert by a stable business key.

### 7.1 Dedup key priority

I will define key fallback in this order:

1. Official answer id from Coletum (if available).
2. Stable producer key + reference period.
3. Deterministic hash from normalized raw payload.

### 7.2 Upsert policy

- Upsert only changed fields.
- Keep `rawPayload` to support reprocessing.
- Track source metadata (`lastSyncAt`, `source`, `sourcePage`).
- Keep write operations idempotent.

### 7.3 Required indexes

I will ensure indexes exist for:

- Dedup unique key.
- Producer id.
- Reference period.
- Last sync timestamp (optional for operational filtering).

## 8) Concurrency and consistency controls

I will prevent double refresh runs:

- Create a lock document before starting sync.
- If a lock is active and not expired, reject new refresh request with 409.
- Release lock on success/failure/finally.

I will also persist sync checkpoints:

- `syncId`
- current page
- counters
- status
- error snapshot if failed

This allows resume and auditability.

## 9) Validation and mapping

I will validate external payload shape with Zod before persistence.

Mapping flow:

1. Validate raw record schema.
2. Normalize Coletum answer fields to internal model.
3. Compute or refresh derived fields needed by producer queries.
4. Prepare bulk upsert operations.

If a record is invalid, I will:

- Register it in failure counters.
- Log with sanitized context.
- Continue processing other records.

## 10) Observability requirements

I will include structured logs for each sync:

- `syncId`
- requested options
- page progress
- retries
- batch write duration
- final counters

I will never log full token or sensitive query params.

## 11) Swagger documentation updates

I will document in Swagger:

- `POST /api/v1/producers/refresh`
- Request schema (`RefreshOptions`)
- Response schema (`RefreshSummary`)
- Error responses (`400`, `409`, `502`, `500`)

## 12) Operational safeguards

I will add safeguards to avoid API abuse and accidental overload:

- Max page size cap (hard max = 100).
- Max pages cap per request.
- Optional cooldown window between refresh runs.
- Optional feature flag to disable refresh endpoint in emergency.

## 13) Definition of done for Step - 5

- Manual endpoint exists and triggers Coletum GET only on demand.
- Sync works page-by-page with bounded memory.
- MongoDB writes are idempotent via bulk upsert.
- Concurrency lock avoids overlapping refresh jobs.
- Swagger includes full refresh contract.
- Logs and counters make sync observable and debuggable.


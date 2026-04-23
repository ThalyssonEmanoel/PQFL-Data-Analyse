export const SERVICE_NAME = "pqfl-backend";

export const DEFAULT_API_PREFIX = "/api/v1";

export const DEFAULT_JSON_BODY_LIMIT = "1mb";

export const DB_DEFAULTS = Object.freeze({
  maxPoolSize: 10,
  minPoolSize: 1,
  serverSelectionTimeoutMS: 5_000,
});

export const COLETUM_DEFAULTS = Object.freeze({
  baseUrl: "https://coletum.com/api/webservice/v2",
  defaultPageSize: 100,
  maxPageSize: 100,
  requestTimeoutMs: 30_000,
  retry: Object.freeze({
    maxAttempts: 3,
    baseDelayMs: 500,
    maxDelayMs: 8_000,
  }),
});

export const REFRESH_DEFAULTS = Object.freeze({
  lockKey: "producers",
  lockTtlMs: 15 * 60 * 1000,
  maxPagesCap: 10_000,
  defaultMaxPages: 500,
  bulkChunkSize: 500,
});

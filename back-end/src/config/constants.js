export const SERVICE_NAME = "pqfl-backend";

export const DEFAULT_API_PREFIX = "/api/v1";

export const DEFAULT_JSON_BODY_LIMIT = "1mb";

export const DB_DEFAULTS = Object.freeze({
  maxPoolSize: 10,
  minPoolSize: 1,
  serverSelectionTimeoutMS: 5_000,
});

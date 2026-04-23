import { COLETUM_DEFAULTS, REFRESH_DEFAULTS } from "../../config/constants.js";

export const RefreshOptions = {
  type: "object",
  additionalProperties: false,
  properties: {
    pageStart: {
      type: "integer",
      minimum: 1,
      default: 1,
      description: "First Coletum page to fetch. Use to resume a previous run.",
    },
    maxPages: {
      type: "integer",
      minimum: 1,
      maximum: REFRESH_DEFAULTS.maxPagesCap,
      default: REFRESH_DEFAULTS.defaultMaxPages,
      description: "Hard upper bound on pages for this run.",
    },
    pageSize: {
      type: "integer",
      minimum: 1,
      maximum: COLETUM_DEFAULTS.maxPageSize,
      default: COLETUM_DEFAULTS.defaultPageSize,
      description: "Records per Coletum page. Capped at 100.",
    },
    dryRun: {
      type: "boolean",
      default: false,
      description:
        "When true, fetch and validate without writing to MongoDB. Useful for smoke tests.",
    },
    force: {
      type: "boolean",
      default: false,
      description:
        "Reserved for future use. Currently not honored — overlapping runs are always rejected.",
    },
  },
};

export const RefreshCounters = {
  type: "object",
  required: [
    "pagesFetched",
    "recordsReceived",
    "inserted",
    "updated",
    "skipped",
    "failed",
    "durationMs",
  ],
  properties: {
    pagesFetched: { type: "integer", minimum: 0 },
    recordsReceived: { type: "integer", minimum: 0 },
    inserted: { type: "integer", minimum: 0 },
    updated: { type: "integer", minimum: 0 },
    skipped: { type: "integer", minimum: 0 },
    failed: { type: "integer", minimum: 0 },
    durationMs: { type: "integer", minimum: 0 },
  },
};

export const RefreshMeta = {
  type: "object",
  required: ["syncId", "startedAt", "finishedAt"],
  properties: {
    syncId: { type: "string", example: "2026-04-23T15:51:10.220Z#req_abc123" },
    startedAt: { type: "string", format: "date-time" },
    finishedAt: { type: "string", format: "date-time" },
  },
};

export const RefreshSummary = {
  type: "object",
  required: ["ok", "status", "summary", "meta"],
  properties: {
    ok: { type: "boolean" },
    status: { type: "string", enum: ["completed", "failed", "canceled", "locked"] },
    summary: { $ref: "#/components/schemas/RefreshCounters" },
    meta: { $ref: "#/components/schemas/RefreshMeta" },
  },
};

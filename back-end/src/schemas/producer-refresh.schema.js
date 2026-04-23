import { z } from "zod";
import { COLETUM_DEFAULTS, REFRESH_DEFAULTS } from "../config/constants.js";

export const refreshOptionsSchema = z
  .object({
    pageStart: z.number().int().positive().default(1),
    maxPages: z
      .number()
      .int()
      .positive()
      .max(REFRESH_DEFAULTS.maxPagesCap)
      .default(REFRESH_DEFAULTS.defaultMaxPages),
    pageSize: z
      .number()
      .int()
      .positive()
      .max(COLETUM_DEFAULTS.maxPageSize)
      .default(COLETUM_DEFAULTS.defaultPageSize),
    dryRun: z.boolean().default(false),
    force: z.boolean().default(false),
  })
  .strict();

export const refreshSummarySchema = z.object({
  ok: z.boolean(),
  status: z.enum(["completed", "failed", "canceled", "locked"]),
  summary: z.object({
    pagesFetched: z.number().int().nonnegative(),
    recordsReceived: z.number().int().nonnegative(),
    inserted: z.number().int().nonnegative(),
    updated: z.number().int().nonnegative(),
    skipped: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    durationMs: z.number().int().nonnegative(),
  }),
  meta: z.object({
    syncId: z.string(),
    startedAt: z.string().datetime(),
    finishedAt: z.string().datetime(),
  }),
});

// Loose schema for one Coletum record — structure varies per form.
// We only require that each record is an object; deeper shape is accepted
// by the mapper layer.
export const coletumRecordSchema = z.record(z.any());

export const coletumPageSchema = z
  .object({
    data: z.any().optional(),
    answer: z.any().optional(),
    errors: z
      .array(z.object({ message: z.string() }).passthrough())
      .optional(),
  })
  .passthrough();

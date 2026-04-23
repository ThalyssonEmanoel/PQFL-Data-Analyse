import crypto from "node:crypto";
import os from "node:os";
import { env } from "../config/env.js";
import { REFRESH_DEFAULTS, COLETUM_DEFAULTS } from "../config/constants.js";
import { logger } from "../utils/logger.js";
import { conflict, forbidden, HttpError } from "../utils/httpError.js";
import { coletumService } from "./coletum.service.js";
import { normalizeBatch } from "./producer-mapping.service.js";
import { producerRepository } from "../repositories/producer.repository.js";
import { syncRepository } from "../repositories/sync.repository.js";
import { SYNC_STATUSES } from "../models/sync.model.js";

function newSyncId() {
  const ts = new Date().toISOString();
  const suffix = crypto.randomUUID().split("-")[0];
  return `${ts}#req_${suffix}`;
}

function buildEmptyCounters() {
  return {
    pagesFetched: 0,
    recordsReceived: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
  };
}

function chunk(items, size) {
  if (!Array.isArray(items) || size <= 0) return [];
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function persistDocuments(documents, { dryRun, bulkChunkSize }) {
  if (dryRun || documents.length === 0) {
    return { inserted: 0, updated: 0 };
  }

  let inserted = 0;
  let updated = 0;
  for (const batch of chunk(documents, bulkChunkSize)) {
    const result = await producerRepository.bulkUpsert(batch);
    inserted += result.upserted ?? 0;
    updated += result.modified ?? 0;
  }
  return { inserted, updated };
}

async function runOnce({ syncId, options }) {
  const counters = buildEmptyCounters();
  const bulkChunkSize = env.REFRESH_BULK_CHUNK_SIZE;

  let page = options.pageStart;
  let keepGoing = true;

  while (keepGoing && counters.pagesFetched < options.maxPages) {
    logger.info(
      { syncId, page, pageSize: options.pageSize },
      "coletum sync fetching page",
    );

    const { records, pageSize } = await coletumService.fetchPage({
      page,
      pageSize: options.pageSize,
    });

    counters.pagesFetched += 1;
    counters.recordsReceived += records.length;

    const { documents, invalid } = normalizeBatch(records, { page, syncId });
    counters.skipped += invalid.length;
    for (const entry of invalid) {
      logger.warn({ syncId, page, index: entry.index, reason: entry.message }, "invalid coletum record skipped");
    }

    try {
      const { inserted, updated } = await persistDocuments(documents, {
        dryRun: options.dryRun,
        bulkChunkSize,
      });
      counters.inserted += inserted;
      counters.updated += updated;
    } catch (err) {
      counters.failed += documents.length;
      logger.error(
        { err, syncId, page, batchSize: documents.length },
        "coletum sync batch write failed",
      );
      throw Object.assign(err, { page });
    }

    await syncRepository.updateCheckpoint({
      syncId,
      currentPage: page,
      counters,
    });

    if (records.length === 0 || records.length < pageSize) {
      keepGoing = false;
    } else {
      page += 1;
    }
  }

  return counters;
}

export const producerRefreshService = {
  async refresh(rawOptions = {}) {
    if (!env.REFRESH_ENABLED) {
      throw forbidden("Producer refresh is disabled (REFRESH_ENABLED=false).");
    }

    const options = {
      pageStart: rawOptions.pageStart ?? 1,
      maxPages: Math.min(
        rawOptions.maxPages ?? REFRESH_DEFAULTS.defaultMaxPages,
        env.REFRESH_MAX_PAGES_CAP,
      ),
      pageSize: Math.min(
        rawOptions.pageSize ?? env.COLETUM_DEFAULT_PAGE_SIZE,
        COLETUM_DEFAULTS.maxPageSize,
      ),
      dryRun: Boolean(rawOptions.dryRun),
      force: Boolean(rawOptions.force),
    };

    const syncId = newSyncId();
    const startedAt = new Date();
    const heldBy = `${os.hostname()}#${process.pid}`;

    logger.info(
      { syncId, options: { ...options }, heldBy },
      "producer refresh starting",
    );

    const lockResult = await syncRepository.acquireLock({
      lockKey: REFRESH_DEFAULTS.lockKey,
      syncId,
      ttlMs: env.REFRESH_LOCK_TTL_MS,
      heldBy,
    });

    if (!lockResult.acquired) {
      logger.warn(
        { syncId, existingSyncId: lockResult.lock?.syncId },
        "producer refresh rejected — lock already held",
      );
      throw conflict("Another producer refresh is already running.", {
        heldBy: lockResult.lock?.heldBy ?? null,
        acquiredAt: lockResult.lock?.startedAt ?? null,
        expiresAt: lockResult.lock?.expiresAt ?? null,
        ownerSyncId: lockResult.lock?.syncId ?? null,
      });
    }

    await syncRepository.startRun({ syncId, options });

    let counters = buildEmptyCounters();
    let finalStatus = SYNC_STATUSES.COMPLETED;
    let runError = null;

    try {
      counters = await runOnce({ syncId, options });
    } catch (err) {
      finalStatus = SYNC_STATUSES.FAILED;
      runError = err;
      logger.error({ err, syncId }, "producer refresh failed");
    } finally {
      await syncRepository.finishRun({
        syncId,
        status: finalStatus,
        error: runError,
      });
      await syncRepository.releaseLock({
        lockKey: REFRESH_DEFAULTS.lockKey,
        syncId,
      });
    }

    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();

    logger.info(
      { syncId, durationMs, counters, status: finalStatus },
      "producer refresh finished",
    );

    if (finalStatus === SYNC_STATUSES.FAILED) {
      const err = runError instanceof HttpError
        ? runError
        : new HttpError(502, runError?.message || "Producer refresh failed");
      err.details = {
        syncId,
        counters,
        page: runError?.page ?? null,
        durationMs,
      };
      throw err;
    }

    return {
      ok: true,
      status: "completed",
      summary: { ...counters, durationMs },
      meta: {
        syncId,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
      },
    };
  },
};

import { SyncModel, SYNC_KINDS, SYNC_STATUSES } from "../models/sync.model.js";

const DUPLICATE_KEY_CODE = 11000;

function isDuplicateKeyError(err) {
  return err && (err.code === DUPLICATE_KEY_CODE || err.codeName === "DuplicateKey");
}

export const syncRepository = {
  async acquireLock({ lockKey, syncId, ttlMs, heldBy }) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs);

    try {
      const doc = await SyncModel.create({
        kind: SYNC_KINDS.LOCK,
        lockKey,
        syncId,
        heldBy: heldBy ?? null,
        startedAt: now,
        expiresAt,
      });
      return { acquired: true, lock: doc.toJSON() };
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err;

      const existing = await SyncModel.findOne({
        kind: SYNC_KINDS.LOCK,
        lockKey,
      }).lean();
      return { acquired: false, lock: existing ?? null };
    }
  },

  async releaseLock({ lockKey, syncId }) {
    const result = await SyncModel.deleteOne({
      kind: SYNC_KINDS.LOCK,
      lockKey,
      syncId,
    });
    return result.deletedCount > 0;
  },

  async getActiveLock(lockKey) {
    return SyncModel.findOne({ kind: SYNC_KINDS.LOCK, lockKey }).lean();
  },

  async startRun({ syncId, options }) {
    return SyncModel.create({
      kind: SYNC_KINDS.RUN,
      syncId,
      status: SYNC_STATUSES.RUNNING,
      options,
      startedAt: new Date(),
      counters: {},
      currentPage: 0,
    });
  },

  async updateCheckpoint({ syncId, currentPage, counters }) {
    const update = {};
    if (typeof currentPage === "number") update.currentPage = currentPage;
    if (counters && typeof counters === "object") {
      for (const [key, value] of Object.entries(counters)) {
        update[`counters.${key}`] = value;
      }
    }
    if (Object.keys(update).length === 0) return null;

    return SyncModel.findOneAndUpdate(
      { kind: SYNC_KINDS.RUN, syncId },
      { $set: update },
      { new: true },
    ).lean();
  },

  async incrementCounters({ syncId, increments }) {
    if (!increments || typeof increments !== "object") return null;
    const inc = {};
    for (const [key, value] of Object.entries(increments)) {
      if (typeof value === "number" && value !== 0) {
        inc[`counters.${key}`] = value;
      }
    }
    if (Object.keys(inc).length === 0) return null;

    return SyncModel.findOneAndUpdate(
      { kind: SYNC_KINDS.RUN, syncId },
      { $inc: inc },
      { new: true },
    ).lean();
  },

  async finishRun({ syncId, status, error }) {
    return SyncModel.findOneAndUpdate(
      { kind: SYNC_KINDS.RUN, syncId },
      {
        $set: {
          status,
          finishedAt: new Date(),
          error: error
            ? {
                name: error.name ?? null,
                message: error.message ?? String(error),
                page: error.page ?? null,
                at: new Date(),
              }
            : null,
        },
      },
      { new: true },
    ).lean();
  },

  async findRun(syncId) {
    return SyncModel.findOne({ kind: SYNC_KINDS.RUN, syncId }).lean();
  },
};

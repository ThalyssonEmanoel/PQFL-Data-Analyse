import mongoose from "mongoose";

const { Schema } = mongoose;

export const SYNC_KINDS = Object.freeze({
  LOCK: "lock",
  RUN: "run",
});

export const SYNC_STATUSES = Object.freeze({
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELED: "canceled",
});

const syncCountersSchema = new Schema(
  {
    pagesFetched: { type: Number, default: 0 },
    recordsReceived: { type: Number, default: 0 },
    inserted: { type: Number, default: 0 },
    updated: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
  },
  { _id: false },
);

const syncErrorSchema = new Schema(
  {
    name: { type: String, default: null },
    message: { type: String, default: null },
    page: { type: Number, default: null },
    at: { type: Date, default: null },
  },
  { _id: false },
);

const syncSchema = new Schema(
  {
    kind: {
      type: String,
      enum: Object.values(SYNC_KINDS),
      required: true,
      index: true,
    },
    // For locks: a stable lock key (e.g. "producers").
    // For runs: null.
    lockKey: { type: String, default: null, trim: true },
    syncId: { type: String, required: true, index: true },

    status: {
      type: String,
      enum: Object.values(SYNC_STATUSES),
      default: null,
    },

    options: { type: Schema.Types.Mixed, default: {} },
    counters: { type: syncCountersSchema, default: () => ({}) },
    currentPage: { type: Number, default: 0 },
    error: { type: syncErrorSchema, default: null },

    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
    heldBy: { type: String, default: null, trim: true },
    expiresAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: "producer_syncs",
  },
);

// A single active lock per lockKey: only "lock" docs enforce the constraint.
syncSchema.index(
  { kind: 1, lockKey: 1 },
  {
    unique: true,
    partialFilterExpression: { kind: "lock", lockKey: { $type: "string" } },
    name: "uniq_lock_per_key",
  },
);
// TTL so crashed processes do not hold a lock forever.
syncSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: { kind: "lock" },
    name: "ttl_lock_expiresAt",
  },
);
// Fast lookups on runs by syncId.
syncSchema.index(
  { syncId: 1 },
  {
    unique: true,
    partialFilterExpression: { kind: "run" },
    name: "uniq_run_syncId",
  },
);
syncSchema.index({ kind: 1, startedAt: -1 });

syncSchema.set("toJSON", {
  virtuals: false,
  versionKey: false,
  transform(_doc, ret) {
    delete ret._id;
    return ret;
  },
});

export const SyncModel =
  mongoose.models.Sync || mongoose.model("Sync", syncSchema);

import mongoose from "mongoose";

const { Schema } = mongoose;

const SyncStateSchema = new Schema(
  {
    formId: { type: String, required: true, unique: true, index: true },
    lastSyncedAt: { type: Date, default: null },
    lastFullSyncAt: { type: Date, default: null },
    totalRecords: { type: Number, default: 0 },
    lastRunRequests: { type: Number, default: 0 },
    lastRunAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "sync_state" }
);

const SyncState = mongoose.models.SyncState || mongoose.model("SyncState", SyncStateSchema);

export default SyncState;

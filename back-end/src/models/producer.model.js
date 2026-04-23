import mongoose from "mongoose";
import {
  bpaCategoryKeys,
  producerGroupValues,
} from "../schemas/producer.schema.js";

const { Schema } = mongoose;

const bpaCategoryScoreSchema = new Schema(
  {
    key: { type: String, enum: bpaCategoryKeys, required: true },
    label: { type: String, required: true },
    weight: { type: Number, required: true },
    rawScore: { type: Number, required: true },
    weightedScore: { type: Number, required: true },
    questionCount: { type: Number, required: true, default: 0 },
    matchedFields: { type: [String], default: [] },
  },
  { _id: false },
);

const factorDiagnosticSchema = new Schema(
  {
    key: { type: String, enum: bpaCategoryKeys, required: true },
    label: { type: String, required: true },
    conformity: { type: Number, required: true },
    gap: { type: Number, required: true },
    checkedFields: { type: [String], default: [] },
    failedFields: { type: [String], default: [] },
    failedFieldLabels: { type: [String], default: [] },
  },
  { _id: false },
);

const producerActionsSchema = new Schema(
  {
    inPAE: { type: Boolean, required: true, default: false },
    paeReasons: { type: [String], default: [] },
    paeActions: { type: [String], default: [] },
    pbpaCategories: { type: [String], enum: bpaCategoryKeys, default: [] },
    pbpaActions: { type: [String], default: [] },
    factorDiagnostics: { type: [factorDiagnosticSchema], default: [] },
  },
  { _id: false },
);

const producerSchema = new Schema(
  {
    producerId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    producerName: { type: String, required: true, trim: true },
    totalScore: { type: Number, required: true, default: 0 },
    group: { type: String, enum: producerGroupValues, required: true },
    categoryScores: {
      type: Map,
      of: bpaCategoryScoreSchema,
      default: () => new Map(),
    },
    actions: { type: producerActionsSchema, required: true },
    metrics: {
      cpp: { type: Number, default: null },
      hasResidue: { type: Boolean, required: true, default: false },
    },
    rawPayload: { type: Schema.Types.Mixed, default: {} },

    // Sync provenance (Step-5).
    source: { type: String, default: null, trim: true },
    sourcePage: { type: Number, default: null },
    sourceAnswerId: { type: String, default: null, trim: true },
    dedupKey: { type: String, default: null, trim: true },
    lastSyncAt: { type: Date, default: null },
    scoringStatus: {
      type: String,
      enum: ["pending", "scored", "stale"],
      default: "pending",
    },
  },
  {
    timestamps: true,
    collection: "producers",
  },
);

producerSchema.index({ group: 1, totalScore: -1 });
producerSchema.index({ totalScore: -1 });
producerSchema.index({ updatedAt: -1 });
producerSchema.index({ producerName: "text" });
producerSchema.index({ lastSyncAt: -1 });
producerSchema.index(
  { dedupKey: 1 },
  { unique: true, partialFilterExpression: { dedupKey: { $type: "string" } } },
);

producerSchema.set("toJSON", {
  virtuals: false,
  versionKey: false,
  transform(_doc, ret) {
    delete ret._id;
    return ret;
  },
});

export const ProducerModel =
  mongoose.models.Producer || mongoose.model("Producer", producerSchema);

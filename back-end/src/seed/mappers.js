import { bpaCategoryKeys, producerGroupValues } from "../schemas/producer.schema.js";

const DEFAULT_ACTIONS = Object.freeze({
  inPAE: false,
  paeReasons: [],
  paeActions: [],
  pbpaCategories: [],
  pbpaActions: [],
  factorDiagnostics: [],
});

const DEFAULT_METRICS = Object.freeze({ cpp: null, hasResidue: false });

function ensureCategoryScores(source) {
  if (!source || typeof source !== "object") return {};
  const entries = source instanceof Map ? [...source.entries()] : Object.entries(source);
  return Object.fromEntries(
    entries.filter(([key]) => bpaCategoryKeys.includes(key)),
  );
}

function ensureGroup(group) {
  if (producerGroupValues.includes(group)) return group;
  return "G3";
}

export function toProducerDocument(raw, { keepRawPayload = true } = {}) {
  if (!raw || typeof raw !== "object") {
    throw new Error("toProducerDocument: raw payload must be an object");
  }

  const producerId = String(raw.producerId ?? raw.id ?? "").trim();
  if (!producerId) {
    throw new Error("toProducerDocument: producerId is required");
  }

  return {
    producerId,
    producerName: String(raw.producerName ?? raw.name ?? producerId).trim(),
    totalScore: Number.isFinite(raw.totalScore) ? Number(raw.totalScore) : 0,
    group: ensureGroup(raw.group),
    categoryScores: ensureCategoryScores(raw.categoryScores),
    actions: { ...DEFAULT_ACTIONS, ...(raw.actions || {}) },
    metrics: { ...DEFAULT_METRICS, ...(raw.metrics || {}) },
    rawPayload: keepRawPayload ? raw : {},
  };
}

export function toProducerDocuments(rawList, options) {
  if (!Array.isArray(rawList)) return [];
  return rawList.map((raw) => toProducerDocument(raw, options));
}

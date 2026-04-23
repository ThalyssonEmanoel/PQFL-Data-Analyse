import {
  bpaCategoryKeys,
  producerGroupValues,
} from "../../schemas/producer.schema.js";

export const ProducerCategoryScore = {
  type: "object",
  required: [
    "key",
    "label",
    "weight",
    "rawScore",
    "weightedScore",
    "questionCount",
    "matchedFields",
  ],
  properties: {
    key: { type: "string", enum: bpaCategoryKeys },
    label: { type: "string" },
    weight: { type: "number" },
    rawScore: { type: "number" },
    weightedScore: { type: "number" },
    questionCount: { type: "integer", minimum: 0 },
    matchedFields: { type: "array", items: { type: "string" } },
  },
};

export const FactorDiagnostic = {
  type: "object",
  required: [
    "key",
    "label",
    "conformity",
    "gap",
    "checkedFields",
    "failedFields",
    "failedFieldLabels",
  ],
  properties: {
    key: { type: "string", enum: bpaCategoryKeys },
    label: { type: "string" },
    conformity: { type: "number" },
    gap: { type: "number" },
    checkedFields: { type: "array", items: { type: "string" } },
    failedFields: { type: "array", items: { type: "string" } },
    failedFieldLabels: { type: "array", items: { type: "string" } },
  },
};

export const ProducerActions = {
  type: "object",
  required: [
    "inPAE",
    "paeReasons",
    "paeActions",
    "pbpaCategories",
    "pbpaActions",
    "factorDiagnostics",
  ],
  properties: {
    inPAE: { type: "boolean" },
    paeReasons: { type: "array", items: { type: "string" } },
    paeActions: { type: "array", items: { type: "string" } },
    pbpaCategories: {
      type: "array",
      items: { type: "string", enum: bpaCategoryKeys },
    },
    pbpaActions: { type: "array", items: { type: "string" } },
    factorDiagnostics: {
      type: "array",
      items: { $ref: "#/components/schemas/FactorDiagnostic" },
    },
  },
};

export const Producer = {
  type: "object",
  required: [
    "producerId",
    "producerName",
    "totalScore",
    "group",
    "categoryScores",
    "actions",
    "metrics",
  ],
  properties: {
    producerId: { type: "string" },
    producerName: { type: "string" },
    totalScore: { type: "number" },
    group: { type: "string", enum: producerGroupValues },
    categoryScores: {
      type: "object",
      additionalProperties: { $ref: "#/components/schemas/ProducerCategoryScore" },
    },
    actions: { $ref: "#/components/schemas/ProducerActions" },
    metrics: {
      type: "object",
      required: ["cpp", "hasResidue"],
      properties: {
        cpp: { type: "number", nullable: true },
        hasResidue: { type: "boolean" },
      },
    },
    updatedAt: { type: "string", format: "date-time", nullable: true },
  },
};

export const ProducerList = {
  type: "object",
  required: ["items", "pagination"],
  properties: {
    items: {
      type: "array",
      items: { $ref: "#/components/schemas/Producer" },
    },
    pagination: {
      type: "object",
      required: ["page", "limit", "total"],
      properties: {
        page: { type: "integer", minimum: 1 },
        limit: { type: "integer", minimum: 1 },
        total: { type: "integer", minimum: 0 },
      },
    },
  },
};

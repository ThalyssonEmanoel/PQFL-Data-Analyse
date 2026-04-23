import { z } from "zod";
import { paginationQuerySchema, idParamSchema } from "./common.schema.js";

export const bpaCategoryKeys = [
  "gestaoPropriedade",
  "manejoSanitario",
  "manejoOrdenhaPosOrdenha",
  "refrigeracaoEstocagemLeite",
  "manejoAlimentarArmazenamento",
  "qualidadeAgua",
  "usoRacionalQuimicos",
  "manejoResiduos",
  "manutencaoPreventiva",
  "capacitacaoControlePragas",
];

export const producerGroupValues = ["G1", "G2", "G3"];

export const bpaCategoryKeyEnum = z.enum(bpaCategoryKeys);
export const producerGroupEnum = z.enum(producerGroupValues);

const bpaCategoryScoreSchema = z.object({
  key: bpaCategoryKeyEnum,
  label: z.string(),
  weight: z.number(),
  rawScore: z.number(),
  weightedScore: z.number(),
  questionCount: z.number().int().nonnegative(),
  matchedFields: z.array(z.string()),
});

const factorDiagnosticSchema = z.object({
  key: bpaCategoryKeyEnum,
  label: z.string(),
  conformity: z.number(),
  gap: z.number(),
  checkedFields: z.array(z.string()),
  failedFields: z.array(z.string()),
  failedFieldLabels: z.array(z.string()),
});

const producerActionsSchema = z.object({
  inPAE: z.boolean(),
  paeReasons: z.array(z.string()),
  paeActions: z.array(z.string()),
  pbpaCategories: z.array(bpaCategoryKeyEnum),
  pbpaActions: z.array(z.string()),
  factorDiagnostics: z.array(factorDiagnosticSchema),
});

export const producerResponseSchema = z.object({
  producerId: z.string(),
  producerName: z.string(),
  totalScore: z.number(),
  group: producerGroupEnum,
  categoryScores: z.record(bpaCategoryKeyEnum, bpaCategoryScoreSchema),
  actions: producerActionsSchema,
  metrics: z.object({
    cpp: z.number().nullable(),
    hasResidue: z.boolean(),
  }),
  updatedAt: z.string().datetime().nullable(),
});

export const producerListResponseSchema = z.object({
  items: z.array(producerResponseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
  }),
});

export const listProducersQuerySchema = paginationQuerySchema.extend({
  group: producerGroupEnum.optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

export const producerIdParamsSchema = idParamSchema;

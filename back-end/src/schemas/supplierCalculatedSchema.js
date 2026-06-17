import { z } from "zod";

const optionalTrimmedString = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  },
  z.string().min(1)
).optional();

const optionalObjectId = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  },
  z.string().regex(/^[0-9a-fA-F]{24}$/)
).optional();

export const listCalculatedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(500).default(50),
  _id: optionalObjectId,
  nome: optionalTrimmedString,
});

const requiredTrimmedString = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : value),
  z.string().min(1)
);

export const producerPeriodsQuerySchema = z.object({
  producerId: requiredTrimmedString,
});

export default { listCalculatedQuerySchema, producerPeriodsQuerySchema };

import { z } from "zod";

export const idParamSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, "id is required")
    .max(128, "id too long"),
});

export const paginationQuerySchema = z.object({
  page: z
    .string()
    .trim()
    .regex(/^\d+$/, "page must be a positive integer")
    .transform((value) => Number.parseInt(value, 10))
    .default("1"),
  limit: z
    .string()
    .trim()
    .regex(/^\d+$/, "limit must be a positive integer")
    .transform((value) => Number.parseInt(value, 10))
    .refine((value) => value > 0 && value <= 200, "limit must be between 1 and 200")
    .default("50"),
});

export const validationIssueSchema = z.object({
  path: z.string(),
  message: z.string(),
});

export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.any().optional(),
  requestId: z.string().optional(),
});

export const validationErrorResponseSchema = errorResponseSchema.extend({
  error: z.literal("ValidationError"),
  details: z.array(validationIssueSchema),
});

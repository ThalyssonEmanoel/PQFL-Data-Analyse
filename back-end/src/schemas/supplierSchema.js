import { z } from "zod";

const coordinatesSchema = z
  .object({
    type: z.string().optional(),
    coordinates: z.array(z.number()).optional(),
    properties: z.record(z.string(), z.any()).nullable().optional(),
  })
  .passthrough()
  .nullable()
  .optional();

export const answerMetaDataSchema = z.object({
  created_at: z.string(),
  updated_at: z.string().nullable().optional(),
  created_by_user_id: z.number().int().nullable().optional(),
  created_by_user_name: z.string().nullable().optional(),
  updated_by_user_id: z.number().int().nullable().optional(),
  updated_by_user_name: z.string().nullable().optional(),
  created_at_source: z.string().nullable().optional(),
  updated_at_source: z.string().nullable().optional(),
  total_size: z.number().int().optional(),
  created_at_coordinates: coordinatesSchema,
  updated_at_coordinates: coordinatesSchema,
});

export const coletumAnswerSchema = z.object({
  id: z.string(),
  answer: z.record(z.string(), z.any()),
  meta_data: answerMetaDataSchema,
});

export const paginationSchema = z.object({
  page: z.number().int().min(1),
  page_size: z.number().int().min(1).max(500),
  total_items: z.number().int().min(0),
  total_pages: z.number().int().min(0),
  has_next: z.boolean(),
});

export const coletumAnswerListSchema = z.object({
  data: z.array(coletumAnswerSchema),
  pagination: paginationSchema,
});

export const listSuppliersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(500).default(50),
});

export default {
  coletumAnswerSchema,
  coletumAnswerListSchema,
  listSuppliersQuerySchema,
};

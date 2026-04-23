import { z } from "zod";

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.string(),
  timestamp: z.string().datetime(),
  uptimeSeconds: z.number(),
  database: z.object({
    connected: z.boolean(),
  }),
});

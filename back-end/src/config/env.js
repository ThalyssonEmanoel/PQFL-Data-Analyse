import { z } from "zod";
import { DEFAULT_API_PREFIX, DEFAULT_JSON_BODY_LIMIT } from "./constants.js";

const stringToInt = z
  .string()
  .trim()
  .regex(/^\d+$/, "must be a positive integer")
  .transform((value) => Number.parseInt(value, 10));

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: stringToInt.default("3333"),
  API_PREFIX: z.string().trim().min(1).default(DEFAULT_API_PREFIX),

  MONGODB_URI: z.string().url({ message: "MONGODB_URI must be a valid URL" }),
  MONGODB_DB_NAME: z.string().trim().min(1).optional(),

  CORS_ORIGIN: z
    .string()
    .trim()
    .default("*")
    .transform((value) =>
      value === "*"
        ? "*"
        : value
            .split(",")
            .map((origin) => origin.trim())
            .filter(Boolean),
    ),

  JSON_BODY_LIMIT: z.string().trim().min(1).default(DEFAULT_JSON_BODY_LIMIT),

  COLETUM_FULL_URL: z.string().trim().url().optional().or(z.literal("").transform(() => undefined)),
  COLETUM_REQUEST_BUDGET: stringToInt.default("100"),
});

function formatIssues(issues) {
  return issues
    .map((issue) => ` - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}

export function loadEnv(source = process.env) {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const message =
      "Invalid environment configuration:\n" + formatIssues(result.error.issues);
    const error = new Error(message);
    error.name = "EnvValidationError";
    throw error;
  }

  return Object.freeze(result.data);
}

export const env = loadEnv();

import { z } from "zod";
import {
  COLETUM_DEFAULTS,
  DEFAULT_API_PREFIX,
  DEFAULT_JSON_BODY_LIMIT,
  REFRESH_DEFAULTS,
} from "./constants.js";

const stringToInt = z
  .string()
  .trim()
  .regex(/^\d+$/, "must be a positive integer")
  .transform((value) => Number.parseInt(value, 10));

const optionalString = z
  .string()
  .trim()
  .optional()
  .or(z.literal("").transform(() => undefined));

const optionalUrl = z
  .string()
  .trim()
  .url()
  .optional()
  .or(z.literal("").transform(() => undefined));

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

  // --- Coletum API V2 ---
  COLETUM_BASE_URL: z
    .string()
    .trim()
    .url()
    .default(COLETUM_DEFAULTS.baseUrl),
  COLETUM_FORM_ID: optionalString,
  COLETUM_TOKEN: optionalString,
  COLETUM_DEFAULT_PAGE_SIZE: stringToInt
    .default(String(COLETUM_DEFAULTS.defaultPageSize))
    .refine(
      (value) => value > 0 && value <= COLETUM_DEFAULTS.maxPageSize,
      `COLETUM_DEFAULT_PAGE_SIZE must be between 1 and ${COLETUM_DEFAULTS.maxPageSize}`,
    ),
  // Legacy override: a pre-built URL with Token embedded.
  COLETUM_FULL_URL: optionalUrl,
  COLETUM_REQUEST_BUDGET: stringToInt.default("100"),

  // --- Refresh guardrails ---
  REFRESH_ENABLED: z
    .string()
    .trim()
    .default("true")
    .transform((value) => value.toLowerCase() !== "false"),
  REFRESH_LOCK_TTL_MS: stringToInt.default(String(REFRESH_DEFAULTS.lockTtlMs)),
  REFRESH_MAX_PAGES_CAP: stringToInt.default(String(REFRESH_DEFAULTS.maxPagesCap)),
  REFRESH_BULK_CHUNK_SIZE: stringToInt.default(String(REFRESH_DEFAULTS.bulkChunkSize)),
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

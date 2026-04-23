import { env } from "../config/env.js";
import { COLETUM_DEFAULTS } from "../config/constants.js";
import { logger } from "../utils/logger.js";
import { withRetry, isTransientHttpError } from "../utils/retry.js";
import { redactUrl } from "../utils/redact.js";
import { HttpError, internal } from "../utils/httpError.js";
import { coletumPageSchema } from "../schemas/producer-refresh.schema.js";

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asRecordArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => isRecord(item));
}

function mergeAnswerWithMetadata(answer, metaData) {
  const merged = { ...answer };
  if (!metaData) return merged;
  if (metaData.userId !== undefined) merged.__metaUserId = metaData.userId;
  if (metaData.userName !== undefined) merged.__metaUserName = metaData.userName;
  if (metaData.friendlyId !== undefined) merged.__metaFriendlyId = metaData.friendlyId;
  if (metaData.createdAt !== undefined) merged.__metaCreatedAt = metaData.createdAt;
  return merged;
}

// Coletum V2 returns answers in a few historical shapes — mirror the behavior
// the legacy frontend used (see ../../../src/lib/pqfl/graphql.ts).
export function extractRecords(payload) {
  if (!isRecord(payload)) return [];
  const dataNode = isRecord(payload.data) ? payload.data : payload;
  const answerNode = dataNode.answer;

  if (Array.isArray(answerNode)) {
    return asRecordArray(answerNode)
      .map((entry) => {
        const answer = isRecord(entry.answer) ? entry.answer : null;
        const metaData = isRecord(entry.metaData) ? entry.metaData : null;
        return answer ? mergeAnswerWithMetadata(answer, metaData ?? undefined) : null;
      })
      .filter((entry) => entry !== null);
  }

  const answerObject = isRecord(answerNode) ? answerNode : null;
  if (!answerObject) return [];

  const answersArray = asRecordArray(answerObject.answer);
  if (answersArray.length) {
    const metadataArray = asRecordArray(answerObject.metaData);
    return answersArray.map((answer, index) =>
      mergeAnswerWithMetadata(answer, metadataArray[index] ?? metadataArray[0]),
    );
  }

  const singleAnswer = isRecord(answerObject.answer) ? answerObject.answer : null;
  if (singleAnswer) {
    const singleMeta = isRecord(answerObject.metaData) ? answerObject.metaData : null;
    return [mergeAnswerWithMetadata(singleAnswer, singleMeta ?? undefined)];
  }

  return [];
}

function buildPagedUrl({ page, pageSize }) {
  // When COLETUM_FULL_URL is set we preserve it for parity with the legacy
  // frontend config and override only the pagination knobs.
  const sourceUrl = env.COLETUM_FULL_URL
    ? env.COLETUM_FULL_URL
    : buildStructuredUrl();

  const url = new URL(sourceUrl);
  url.searchParams.set("page", String(page));
  url.searchParams.set("page_size", String(pageSize));
  if (env.COLETUM_TOKEN && !url.searchParams.has("Token")) {
    url.searchParams.set("Token", env.COLETUM_TOKEN);
  }
  return url.toString();
}

function buildStructuredUrl() {
  if (!env.COLETUM_FORM_ID) {
    throw internal(
      "COLETUM_FORM_ID is not configured. Set COLETUM_FORM_ID or COLETUM_FULL_URL before triggering a refresh.",
    );
  }
  if (!env.COLETUM_TOKEN) {
    throw internal(
      "COLETUM_TOKEN is not configured. Set COLETUM_TOKEN or embed it in COLETUM_FULL_URL.",
    );
  }
  return `${env.COLETUM_BASE_URL.replace(/\/$/, "")}/forms/${encodeURIComponent(
    env.COLETUM_FORM_ID,
  )}/answers`;
}

async function requestPage({ page, pageSize, timeoutMs, signal }) {
  const url = buildPagedUrl({ page, pageSize });
  const redacted = redactUrl(url);

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    signal: signal ?? AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const httpError = new HttpError(
      response.status >= 500 ? 502 : response.status,
      `Coletum GET ${redacted} responded with ${response.status}`,
    );
    httpError.status = response.status;
    httpError.upstream = true;
    throw httpError;
  }

  let json;
  try {
    json = await response.json();
  } catch (err) {
    throw new HttpError(502, `Coletum response was not valid JSON: ${err.message}`);
  }

  const parsed = coletumPageSchema.safeParse(json);
  if (!parsed.success) {
    throw new HttpError(502, "Coletum response shape not recognised");
  }

  if (Array.isArray(parsed.data.errors) && parsed.data.errors.length > 0) {
    const message = parsed.data.errors.map((e) => e.message).join("; ");
    throw new HttpError(502, `Coletum reported errors: ${message}`);
  }

  return parsed.data;
}

export const coletumService = {
  /**
   * Fetch a single Coletum page, retrying transient errors with exponential
   * backoff + jitter. Returns the normalized array of records for this page.
   */
  async fetchPage({ page, pageSize, timeoutMs, onRetry } = {}) {
    const effectivePageSize = Math.min(
      Math.max(pageSize || env.COLETUM_DEFAULT_PAGE_SIZE, 1),
      COLETUM_DEFAULTS.maxPageSize,
    );

    const payload = await withRetry(
      () =>
        requestPage({
          page,
          pageSize: effectivePageSize,
          timeoutMs: timeoutMs ?? COLETUM_DEFAULTS.requestTimeoutMs,
        }),
      {
        maxAttempts: COLETUM_DEFAULTS.retry.maxAttempts,
        baseDelayMs: COLETUM_DEFAULTS.retry.baseDelayMs,
        maxDelayMs: COLETUM_DEFAULTS.retry.maxDelayMs,
        shouldRetry: isTransientHttpError,
        onRetry: ({ error, attempt, delay }) => {
          logger.warn(
            {
              page,
              attempt,
              delay,
              status: error?.status,
              name: error?.name,
            },
            "coletum fetch retrying",
          );
          if (typeof onRetry === "function") onRetry({ error, attempt, delay });
        },
      },
    );

    return {
      pageSize: effectivePageSize,
      records: extractRecords(payload),
      raw: payload,
    };
  },
};

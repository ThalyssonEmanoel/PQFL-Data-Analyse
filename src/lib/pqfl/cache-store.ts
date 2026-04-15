import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { extractProducerAnswers, fetchColetumAnswers } from "@/lib/pqfl/graphql";
import { SAMPLE_PRODUCERS_RAW } from "@/lib/pqfl/mock-data";
import type {
  ProducerCacheMeta,
  ProducerDataSourceKind,
  ProducerDataSourceResult,
  ProducerRefreshResult,
} from "@/lib/pqfl/domain/types";

interface ProducerCacheFile {
  version: number;
  source: ProducerDataSourceKind;
  updatedAt: string | null;
  remoteRequestCount: number;
  requestBudget: number;
  lastRemoteAttemptAt: string | null;
  lastRemoteSuccessAt: string | null;
  producers: Record<string, unknown>[];
}

const CACHE_VERSION = 1;
const DEFAULT_REQUEST_BUDGET = 100;

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function parseRequestBudget(): number {
  const rawBudget = process.env.COLETUM_REQUEST_BUDGET;
  if (!rawBudget) {
    return DEFAULT_REQUEST_BUDGET;
  }

  const parsed = Number(rawBudget);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_REQUEST_BUDGET;
  }

  return Math.floor(parsed);
}

function getCacheFilePath(): string {
  return path.join(process.cwd(), "cache", "answers_cache.json");
}

function nowIso(): string {
  return new Date().toISOString();
}

function isProducerArray(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every((item) => asRecord(item) !== null);
}

function createDefaultCache(): ProducerCacheFile {
  return {
    version: CACHE_VERSION,
    source: "mock",
    updatedAt: null,
    remoteRequestCount: 0,
    requestBudget: parseRequestBudget(),
    lastRemoteAttemptAt: null,
    lastRemoteSuccessAt: null,
    producers: SAMPLE_PRODUCERS_RAW,
  };
}

function normalizeCacheFile(rawValue: unknown): ProducerCacheFile | null {
  const parsed = asRecord(rawValue);
  if (!parsed) {
    return null;
  }

  const requestBudget = parseRequestBudget();

  if (isProducerArray(parsed.producers)) {
    return {
      version: CACHE_VERSION,
      source: parsed.source === "coletum" ? "coletum" : "mock",
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
      remoteRequestCount:
        typeof parsed.remoteRequestCount === "number" && parsed.remoteRequestCount >= 0
          ? Math.floor(parsed.remoteRequestCount)
          : 0,
      requestBudget,
      lastRemoteAttemptAt:
        typeof parsed.lastRemoteAttemptAt === "string" ? parsed.lastRemoteAttemptAt : null,
      lastRemoteSuccessAt:
        typeof parsed.lastRemoteSuccessAt === "string" ? parsed.lastRemoteSuccessAt : null,
      producers: parsed.producers,
    };
  }

  // Compatibilidade com cache legado do projeto Python: { fetched_at, data: ... }
  const extracted = extractProducerAnswers(parsed.data ?? parsed);
  if (extracted.length) {
    return {
      version: CACHE_VERSION,
      source: "coletum",
      updatedAt: typeof parsed.fetched_at === "string" ? parsed.fetched_at : null,
      remoteRequestCount: 0,
      requestBudget,
      lastRemoteAttemptAt: null,
      lastRemoteSuccessAt: typeof parsed.fetched_at === "string" ? parsed.fetched_at : null,
      producers: extracted,
    };
  }

  return null;
}

async function writeCacheFile(cache: ProducerCacheFile): Promise<void> {
  const cacheFilePath = getCacheFilePath();
  await mkdir(path.dirname(cacheFilePath), { recursive: true });
  await writeFile(cacheFilePath, JSON.stringify(cache, null, 2), "utf-8");
}

async function readCacheFile(): Promise<ProducerCacheFile | null> {
  try {
    const cacheFilePath = getCacheFilePath();
    const content = await readFile(cacheFilePath, "utf-8");
    return normalizeCacheFile(JSON.parse(content));
  } catch {
    return null;
  }
}

function buildMeta(cache: ProducerCacheFile): ProducerCacheMeta {
  const endpointConfigured = Boolean((process.env.COLETUM_FULL_URL ?? "").trim());
  const remainingRequests = Math.max(cache.requestBudget - cache.remoteRequestCount, 0);

  return {
    source: cache.source,
    updatedAt: cache.updatedAt,
    endpointConfigured,
    remoteRequestCount: cache.remoteRequestCount,
    requestBudget: cache.requestBudget,
    remainingRequests,
    lastRemoteAttemptAt: cache.lastRemoteAttemptAt,
    lastRemoteSuccessAt: cache.lastRemoteSuccessAt,
  };
}

export async function loadProducerCache(): Promise<ProducerDataSourceResult> {
  let cache = await readCacheFile();

  if (!cache) {
    cache = createDefaultCache();
    await writeCacheFile(cache);
  }

  const payloads = cache.producers.length ? cache.producers : SAMPLE_PRODUCERS_RAW;
  return {
    payloads,
    meta: buildMeta(cache),
  };
}

export async function refreshProducerCache(): Promise<ProducerRefreshResult> {
  let cache = (await readCacheFile()) ?? createDefaultCache();
  cache.requestBudget = parseRequestBudget();

  const endpointConfigured = Boolean((process.env.COLETUM_FULL_URL ?? "").trim());
  if (!endpointConfigured) {
    await writeCacheFile(cache);
    return {
      ok: false,
      status: "missing-endpoint",
      message: "COLETUM_FULL_URL não configurada. A atualização remota foi ignorada.",
      payloadCount: cache.producers.length,
      meta: buildMeta(cache),
    };
  }

  if (cache.remoteRequestCount >= cache.requestBudget) {
    await writeCacheFile(cache);
    return {
      ok: false,
      status: "blocked-budget",
      message: "Limite local de requisições atingido. Revise o budget antes de atualizar.",
      payloadCount: cache.producers.length,
      meta: buildMeta(cache),
    };
  }

  const attemptAt = nowIso();
  const nextRequestCount = cache.remoteRequestCount + 1;

  try {
    const payloads = await fetchColetumAnswers();

    cache = {
      ...cache,
      source: payloads.length ? "coletum" : "mock",
      updatedAt: attemptAt,
      remoteRequestCount: nextRequestCount,
      lastRemoteAttemptAt: attemptAt,
      lastRemoteSuccessAt: attemptAt,
      producers: payloads.length
        ? payloads
        : cache.producers.length
          ? cache.producers
          : SAMPLE_PRODUCERS_RAW,
    };

    await writeCacheFile(cache);

    return {
      ok: true,
      status: "updated",
      message: "Produtores atualizados com sucesso a partir do Coletum.",
      payloadCount: cache.producers.length,
      meta: buildMeta(cache),
    };
  } catch (error) {
    cache = {
      ...cache,
      remoteRequestCount: nextRequestCount,
      lastRemoteAttemptAt: attemptAt,
    };

    await writeCacheFile(cache);

    const message =
      error instanceof Error
        ? `Falha ao atualizar do Coletum: ${error.message}`
        : "Falha inesperada ao atualizar do Coletum.";

    return {
      ok: false,
      status: "remote-error",
      message,
      payloadCount: cache.producers.length,
      meta: buildMeta(cache),
    };
  }
}

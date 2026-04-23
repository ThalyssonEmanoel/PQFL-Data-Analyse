import crypto from "node:crypto";

const ID_FIELD_HINTS = ["friendlyid", "codigo", "cpf", "produtorid", "producerid", "id"];
const NAME_FIELD_HINTS = [
  "nome350925",
  "nomeprodutor",
  "nomedoprodutor",
  "produtor",
  "fornecedor",
  "name",
  "nome",
];

const COMBINING_DIACRITICS = /[̀-ͯ]/g;

function normalizeToken(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .replace(/[^a-z0-9]/g, "");
}

function pickFirstStringByHint(raw, hints) {
  const entries = Object.entries(raw);
  for (const hint of hints) {
    const exact = raw[hint];
    if (typeof exact === "string" && exact.trim().length > 0) return exact.trim();
    const match = entries.find(([key, value]) => {
      if (typeof value !== "string" || value.trim().length === 0) return false;
      return normalizeToken(key).includes(normalizeToken(hint));
    });
    if (match) return match[1].trim();
  }
  return null;
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

function hashPayload(raw) {
  return crypto.createHash("sha256").update(stableStringify(raw)).digest("hex");
}

function resolveAnswerId(raw) {
  const candidates = [
    raw?.id,
    raw?.answer_id,
    raw?.answerId,
    raw?.__metaFriendlyId,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return String(candidate);
    }
  }
  return null;
}

function resolveProducerId(raw) {
  const fromHint = pickFirstStringByHint(raw, ID_FIELD_HINTS);
  if (fromHint) return fromHint;
  const answerId = resolveAnswerId(raw);
  if (answerId) return `answer:${answerId}`;
  return `payload:${hashPayload(raw).slice(0, 16)}`;
}

function resolveProducerName(raw, fallbackId) {
  const fromHint = pickFirstStringByHint(raw, NAME_FIELD_HINTS);
  return fromHint ?? fallbackId;
}

/**
 * Convert one Coletum raw record into an upsertable producer document.
 *
 * NOTE: Scoring fields (totalScore, group, categoryScores, actions, metrics)
 * are set to conservative defaults so the document is valid. A follow-up job
 * must port the full scoring pipeline from `../../../src/lib/pqfl/scoring.ts`
 * and rescore documents based on `rawPayload` — see PENDING.md.
 */
export function normalizeColetumRecord(raw, { page, source = "coletum" } = {}) {
  if (!raw || typeof raw !== "object") {
    throw new Error("normalizeColetumRecord: raw must be an object");
  }

  const answerId = resolveAnswerId(raw);
  const producerId = resolveProducerId(raw);
  const dedupKey = answerId
    ? `coletum:answer:${answerId}`
    : `coletum:hash:${hashPayload(raw)}`;

  return {
    producerId,
    producerName: resolveProducerName(raw, producerId),
    totalScore: 0,
    group: "G3",
    categoryScores: {},
    actions: {
      inPAE: false,
      paeReasons: [],
      paeActions: [],
      pbpaCategories: [],
      pbpaActions: [],
      factorDiagnostics: [],
    },
    metrics: { cpp: null, hasResidue: false },
    rawPayload: raw,
    source,
    sourcePage: typeof page === "number" ? page : null,
    sourceAnswerId: answerId,
    dedupKey,
    lastSyncAt: new Date(),
    scoringStatus: "pending",
  };
}

export function normalizeBatch(rawList, context) {
  if (!Array.isArray(rawList)) return { documents: [], invalid: [] };
  const documents = [];
  const invalid = [];
  for (const [index, raw] of rawList.entries()) {
    try {
      documents.push(normalizeColetumRecord(raw, context));
    } catch (err) {
      invalid.push({ index, message: err.message });
    }
  }
  return { documents, invalid };
}

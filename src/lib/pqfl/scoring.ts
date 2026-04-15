import {
  BPA_CATEGORIES,
  DEFAULT_CATEGORY_FIELD_HINTS,
  DEFAULT_CPP_FIELD_HINTS,
  DEFAULT_ID_FIELD_HINTS,
  DEFAULT_NAME_FIELD_HINTS,
  DEFAULT_RESIDUE_FIELD_HINTS,
  OFFICIAL_FACTOR_FIELDS,
  PAE_ACTIONS,
  PBPA_ACTIONS_BY_CATEGORY,
} from "@/lib/pqfl/domain/constants";
import type {
  BPACategoryKey,
  BPACategoryScore,
  FactorDiagnostic,
  ProducerGroup,
  ProducerScoreResult,
  ScoringOptions,
} from "@/lib/pqfl/domain/types";

const POSITIVE_ANSWERS = new Set([
  "sim",
  "yes",
  "true",
  "conforme",
  "adequado",
  "ok",
  "atende",
]);

const PARTIAL_ANSWERS = new Set([
  "parcial",
  "parcialmente",
  "emparte",
  "medio",
  "moderado",
]);

const NEGATIVE_ANSWERS = new Set([
  "nao",
  "no",
  "false",
  "naoconforme",
  "inadequado",
  "naoatende",
]);

const RESIDUE_POSITIVE_ANSWERS = new Set([
  "sim",
  "positivo",
  "presente",
  "detectado",
  "contaminado",
  "reprovado",
]);

const RESIDUE_NEGATIVE_ANSWERS = new Set([
  "nao",
  "negativo",
  "ausente",
  "naodetectado",
  "conforme",
  "inexistente",
]);

const COMMON_IDENTITY_WORDS_RE = /(id|codigo|cpf|friendly|user)/i;
const PRODUCER_NAME_WORDS_RE = /(nome|nomeprodutor|produtor|fornecedor)/i;
const PROPERTY_WORDS_RE = /(nomedapropriedade|propriedade|fazenda|sitio|chacara)/i;
const PRIMARY_PRODUCER_NAME_FIELDS = ["nome350925"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function stripQuestionIdSuffix(fieldName: string): string {
  return fieldName.replace(/\d+$/g, "");
}

function flattenPayload(
  payload: unknown,
  parentKey = "",
  acc: Record<string, unknown> = {},
): Record<string, unknown> {
  if (Array.isArray(payload)) {
    payload.forEach((value, index) => {
      const nextKey = parentKey ? `${parentKey}.${index}` : `${index}`;
      flattenPayload(value, nextKey, acc);
    });
    return acc;
  }

  if (!isRecord(payload)) {
    if (parentKey) {
      acc[parentKey] = payload;
    }
    return acc;
  }

  for (const [key, value] of Object.entries(payload)) {
    const nextKey = parentKey ? `${parentKey}.${key}` : key;
    if (isRecord(value) || Array.isArray(value)) {
      flattenPayload(value, nextKey, acc);
    } else {
      acc[nextKey] = value;
    }
  }

  return acc;
}

function toNumericValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().replace(",", ".");
    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function normalizeAnswerToScore(value: unknown): number | null {
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  const numericValue = toNumericValue(value);
  if (numericValue !== null) {
    if (numericValue >= 0 && numericValue <= 1) {
      return numericValue;
    }

    if (numericValue >= 0 && numericValue <= 100) {
      return clamp(numericValue / 100, 0, 1);
    }

    return null;
  }

  if (typeof value === "string") {
    const token = normalizeToken(value);
    if (POSITIVE_ANSWERS.has(token)) {
      return 1;
    }

    if (PARTIAL_ANSWERS.has(token)) {
      return 0.5;
    }

    if (NEGATIVE_ANSWERS.has(token)) {
      return 0;
    }
  }

  return null;
}

function normalizeBooleanAnswer(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  const numericValue = toNumericValue(value);
  if (numericValue !== null) {
    return numericValue > 0;
  }

  if (typeof value === "string") {
    const token = normalizeToken(value);
    if (POSITIVE_ANSWERS.has(token)) {
      return true;
    }

    if (NEGATIVE_ANSWERS.has(token)) {
      return false;
    }
  }

  return false;
}

function getLeafFieldName(fieldPath: string): string {
  const segments = fieldPath.split(".");
  return segments[segments.length - 1] ?? fieldPath;
}

function normalizeFieldName(fieldPath: string): string {
  return normalizeToken(stripQuestionIdSuffix(getLeafFieldName(fieldPath)));
}

type NormalizedFieldEntry = { originalKey: string; value: unknown };
type NormalizedFieldIndex = Map<string, NormalizedFieldEntry[]>;

function buildNormalizedFieldIndex(flatPayload: Record<string, unknown>): NormalizedFieldIndex {
  const index: NormalizedFieldIndex = new Map();
  for (const [key, value] of Object.entries(flatPayload)) {
    const normalizedKey = normalizeFieldName(key);
    const entry: NormalizedFieldEntry = { originalKey: key, value };
    const existing = index.get(normalizedKey);
    if (existing) {
      existing.push(entry);
    } else {
      index.set(normalizedKey, [entry]);
    }
  }
  return index;
}

function findFieldByCandidate(
  flatPayload: Record<string, unknown>,
  normalizedIndex: NormalizedFieldIndex,
  candidate: string,
): { fieldName: string; value: unknown } | null {
  if (candidate in flatPayload) {
    return { fieldName: candidate, value: flatPayload[candidate] };
  }

  const normalizedCandidate = normalizeToken(stripQuestionIdSuffix(candidate));
  if (!normalizedCandidate) {
    return null;
  }

  const entries = normalizedIndex.get(normalizedCandidate);
  if (!entries) {
    return null;
  }

  const leafMatch = entries.find((e) => getLeafFieldName(e.originalKey) === candidate);
  if (leafMatch) {
    return { fieldName: leafMatch.originalKey, value: leafMatch.value };
  }

  return { fieldName: entries[0].originalKey, value: entries[0].value };
}

function findFieldByCandidates(
  flatPayload: Record<string, unknown>,
  normalizedIndex: NormalizedFieldIndex,
  candidates: string[],
): { fieldName: string; value: unknown } | null {
  for (const candidate of candidates) {
    const match = findFieldByCandidate(flatPayload, normalizedIndex, candidate);
    if (match) {
      return match;
    }
  }

  return null;
}

function buildFactorDiagnostics(
  flatPayload: Record<string, unknown>,
  normalizedIndex: NormalizedFieldIndex,
): FactorDiagnostic[] {
  const diagnostics: FactorDiagnostic[] = [];

  for (const category of BPA_CATEGORIES) {
    const fields = OFFICIAL_FACTOR_FIELDS[category.key] ?? [];
    const checkedFields: string[] = [];
    const failedFields: string[] = [];
    const failedFieldLabels: string[] = [];
    let conformingItems = 0;

    for (const fieldDef of fields) {
      const matchedField = findFieldByCandidates(flatPayload, normalizedIndex, fieldDef.keys);
      const fieldName = matchedField?.fieldName ?? fieldDef.keys[0] ?? fieldDef.label;
      checkedFields.push(fieldName);

      const isConforming = normalizeBooleanAnswer(matchedField?.value);
      if (isConforming) {
        conformingItems += 1;
      } else {
        failedFields.push(fieldName);
        failedFieldLabels.push(fieldDef.label);
      }
    }

    const conformity = fields.length ? conformingItems / fields.length : 0;
    diagnostics.push({
      key: category.key,
      label: category.label,
      conformity: round(conformity, 4),
      gap: round(1 - conformity, 4),
      checkedFields,
      failedFields,
      failedFieldLabels,
    });
  }

  diagnostics.sort((a, b) => a.conformity - b.conformity);
  return diagnostics;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function mapPayloadKeyToCategory(
  normalizedFieldName: string,
  categoryFieldHints: Record<BPACategoryKey, string[]>,
): BPACategoryKey | null {
  let selectedCategory: BPACategoryKey | null = null;
  let bestHintLength = 0;

  for (const category of BPA_CATEGORIES) {
    const hints = categoryFieldHints[category.key] ?? [];

    for (const hint of hints) {
      const normalizedHint = normalizeToken(hint);
      if (!normalizedHint) {
        continue;
      }

      if (normalizedFieldName.includes(normalizedHint) && normalizedHint.length > bestHintLength) {
        selectedCategory = category.key;
        bestHintLength = normalizedHint.length;
      }
    }
  }

  return selectedCategory;
}

function isMatchingHint(fieldName: string, hints: string[]): boolean {
  const normalizedFieldName = normalizeToken(stripQuestionIdSuffix(fieldName));
  return hints.some((hint) => normalizedFieldName.includes(normalizeToken(hint)));
}

function hasAlphaNumeric(value: string): boolean {
  return /[a-z0-9]/i.test(value);
}

function getTextValue(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function scoreIdentityField(
  fieldName: string,
  value: unknown,
  hints: string[],
  identityType: "id" | "name",
): number {
  const leafFieldName = getLeafFieldName(fieldName);
  const rawNormalizedField = normalizeToken(leafFieldName);
  const normalizedField = normalizeFieldName(fieldName);
  const textValue = getTextValue(value);
  if (!textValue) {
    return Number.NEGATIVE_INFINITY;
  }

  const normalizedValue = normalizeToken(textValue);
  if (!normalizedValue || !hasAlphaNumeric(normalizedValue)) {
    return Number.NEGATIVE_INFINITY;
  }

  let bestHintScore = 0;
  for (const hint of hints) {
    const rawNormalizedHint = normalizeToken(hint);
    const normalizedHint = normalizeToken(stripQuestionIdSuffix(hint));
    if (!normalizedHint) {
      continue;
    }

    if (rawNormalizedHint && rawNormalizedField === rawNormalizedHint) {
      bestHintScore = Math.max(bestHintScore, normalizedHint.length + 260);
      continue;
    }

    if (normalizedField === normalizedHint) {
      bestHintScore = Math.max(bestHintScore, normalizedHint.length + 140);
      continue;
    }

    if (normalizedField.includes(normalizedHint)) {
      bestHintScore = Math.max(bestHintScore, normalizedHint.length + 50);
    }
  }

  if (!bestHintScore) {
    return Number.NEGATIVE_INFINITY;
  }

  const answerLikeTokens = new Set([
    ...POSITIVE_ANSWERS,
    ...NEGATIVE_ANSWERS,
    ...PARTIAL_ANSWERS,
    ...RESIDUE_POSITIVE_ANSWERS,
    ...RESIDUE_NEGATIVE_ANSWERS,
  ]);
  if (answerLikeTokens.has(normalizedValue)) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = bestHintScore;

  if (identityType === "id") {
    if (COMMON_IDENTITY_WORDS_RE.test(fieldName)) {
      score += 30;
    }
    if (/^[a-z0-9._-]{2,40}$/i.test(textValue)) {
      score += 35;
    }
    if (/^\d{6,14}$/.test(textValue.replace(/\D/g, ""))) {
      score += 15;
    }
    if (textValue.length > 60) {
      score -= 40;
    }
  } else {
    if (PRODUCER_NAME_WORDS_RE.test(normalizedField)) {
      score += 30;
    }
    if (/^nome\d*$/.test(normalizedField)) {
      score += 90;
    }
    if (PROPERTY_WORDS_RE.test(normalizedField)) {
      score -= 65;
    }
    if (/\b(sim|nao|parcial|true|false)\b/i.test(textValue)) {
      score -= 70;
    }
    if (/[a-zA-Z]/.test(textValue)) {
      score += 30;
    }
    if (textValue.length >= 3 && textValue.length <= 120) {
      score += 20;
    }
  }

  return score;
}

function getBestIdentityValueByHint(
  flatPayload: Record<string, unknown>,
  hints: string[],
  identityType: "id" | "name",
): unknown {
  let bestValue: unknown = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const [fieldName, value] of Object.entries(flatPayload)) {
    const score = scoreIdentityField(fieldName, value, hints, identityType);
    if (score > bestScore) {
      bestScore = score;
      bestValue = value;
    }
  }

  return Number.isFinite(bestScore) ? bestValue : null;
}

function buildFallbackProducerId(rawPayload: Record<string, unknown>): string {
  const seed = JSON.stringify(rawPayload);
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    const charCode = seed.charCodeAt(index);
    hash = (hash << 5) - hash + charCode;
    hash |= 0;
  }

  return `sem-id-${Math.abs(hash).toString(36).slice(0, 8) || "00000000"}`;
}

function normalizeProducerId(value: unknown): string | null {
  const text = getTextValue(value);
  if (!text) {
    return null;
  }

  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact || compact.length > 80) {
    return null;
  }

  const normalized = normalizeToken(compact);
  if (!normalized || POSITIVE_ANSWERS.has(normalized) || NEGATIVE_ANSWERS.has(normalized)) {
    return null;
  }

  return compact;
}

function normalizeProducerName(value: unknown): string | null {
  const text = getTextValue(value);
  if (!text) {
    return null;
  }

  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact || compact.length > 160) {
    return null;
  }

  const normalized = normalizeToken(compact);
  if (!normalized || POSITIVE_ANSWERS.has(normalized) || NEGATIVE_ANSWERS.has(normalized)) {
    return null;
  }

  return compact;
}

function getPrimaryProducerNameValue(
  flatPayload: Record<string, unknown>,
  normalizedIndex: NormalizedFieldIndex,
): unknown {
  const primaryMatch = findFieldByCandidates(
    flatPayload,
    normalizedIndex,
    PRIMARY_PRODUCER_NAME_FIELDS,
  );

  return primaryMatch?.value ?? null;
}

function getHighestNumericValueByHint(
  normalizedIndex: NormalizedFieldIndex,
  hints: string[],
): number | null {
  const normalizedHints = hints.map((hint) => normalizeToken(hint));
  const values: number[] = [];

  for (const [normalizedKey, entries] of normalizedIndex) {
    if (!normalizedHints.some((hint) => normalizedKey.includes(hint))) {
      continue;
    }

    for (const { value } of entries) {
      const numericValue = toNumericValue(value);
      if (numericValue !== null) {
        values.push(numericValue);
      }
    }
  }

  if (!values.length) {
    return null;
  }

  return Math.max(...values);
}

function hasResiduePresence(
  normalizedIndex: NormalizedFieldIndex,
  residueHints: string[],
): boolean {
  const normalizedHints = residueHints.map((hint) => normalizeToken(hint));

  for (const [normalizedKey, entries] of normalizedIndex) {
    if (!normalizedHints.some((hint) => normalizedKey.includes(hint))) {
      continue;
    }

    for (const { value } of entries) {
      if (typeof value === "boolean") {
        if (value) {
          return true;
        }
        continue;
      }

      const numericValue = toNumericValue(value);
      if (numericValue !== null) {
        if (numericValue > 0) {
          return true;
        }
        continue;
      }

      if (typeof value === "string") {
        const token = normalizeToken(value);
        if (RESIDUE_POSITIVE_ANSWERS.has(token)) {
          return true;
        }
        if (RESIDUE_NEGATIVE_ANSWERS.has(token)) {
          continue;
        }
      }
    }
  }

  return false;
}

function buildCategoryHintMap(
  customHints?: Partial<Record<BPACategoryKey, string[]>>,
): Record<BPACategoryKey, string[]> {
  const hintMap = {} as Record<BPACategoryKey, string[]>;

  for (const category of BPA_CATEGORIES) {
    hintMap[category.key] = [
      ...(DEFAULT_CATEGORY_FIELD_HINTS[category.key] ?? []),
      ...(customHints?.[category.key] ?? []),
    ];
  }

  return hintMap;
}

function classifyProducer(totalScore: number): ProducerGroup {
  if (totalScore >= 80) {
    return "G1";
  }

  if (totalScore >= 50) {
    return "G2";
  }

  return "G3";
}

export function mapAndScoreProducer(
  rawPayload: Record<string, unknown>,
  customOptions: Partial<ScoringOptions> = {},
): ProducerScoreResult {
  const options: ScoringOptions = {
    lowScoreThreshold: customOptions.lowScoreThreshold ?? 0.5,
    categoryFieldHints: customOptions.categoryFieldHints ?? {},
    cppFieldHints: customOptions.cppFieldHints ?? DEFAULT_CPP_FIELD_HINTS,
    residueFieldHints: customOptions.residueFieldHints ?? DEFAULT_RESIDUE_FIELD_HINTS,
    idFieldHints: customOptions.idFieldHints ?? DEFAULT_ID_FIELD_HINTS,
    nameFieldHints: customOptions.nameFieldHints ?? DEFAULT_NAME_FIELD_HINTS,
  };

  const categoryHintMap = buildCategoryHintMap(options.categoryFieldHints);
  const flatPayload = flattenPayload(rawPayload);
  const normalizedIndex = buildNormalizedFieldIndex(flatPayload);
  const factorDiagnostics = buildFactorDiagnostics(flatPayload, normalizedIndex);

  const scoreBuckets: Record<BPACategoryKey, number[]> = {} as Record<BPACategoryKey, number[]>;
  const fieldBuckets: Record<BPACategoryKey, string[]> = {} as Record<BPACategoryKey, string[]>;
  const unmappedScoredFields: string[] = [];

  for (const category of BPA_CATEGORIES) {
    scoreBuckets[category.key] = [];
    fieldBuckets[category.key] = [];
  }

  for (const [fieldName, value] of Object.entries(flatPayload)) {
    const answerScore = normalizeAnswerToScore(value);
    if (answerScore === null) {
      continue;
    }

    const normalizedFieldName = normalizeToken(stripQuestionIdSuffix(fieldName));
    const categoryKey = mapPayloadKeyToCategory(normalizedFieldName, categoryHintMap);

    if (!categoryKey) {
      unmappedScoredFields.push(fieldName);
      continue;
    }

    scoreBuckets[categoryKey].push(answerScore);
    fieldBuckets[categoryKey].push(fieldName);
  }

  const categoryScores = {} as Record<BPACategoryKey, BPACategoryScore>;
  let totalScore = 0;

  for (const category of BPA_CATEGORIES) {
    const officialDiagnostic = factorDiagnostics.find((item) => item.key === category.key);
    const fallbackValues = scoreBuckets[category.key];
    const fallbackRawScore = fallbackValues.length
      ? fallbackValues.reduce((sum, current) => sum + current, 0) / fallbackValues.length
      : 0;

    const hasOfficialFields = Boolean(officialDiagnostic?.checkedFields.length);
    const rawScore = hasOfficialFields ? officialDiagnostic?.conformity ?? 0 : fallbackRawScore;
    const questionCount = hasOfficialFields
      ? officialDiagnostic?.checkedFields.length ?? 0
      : fallbackValues.length;
    const matchedFields = hasOfficialFields
      ? officialDiagnostic?.checkedFields ?? []
      : fieldBuckets[category.key];

    const weightedScore = rawScore * category.weight;

    totalScore += weightedScore;

    categoryScores[category.key] = {
      key: category.key,
      label: category.label,
      weight: category.weight,
      rawScore: round(rawScore, 4),
      weightedScore: round(weightedScore, 2),
      questionCount,
      matchedFields,
    };
  }

  const finalScore = round(totalScore, 2);
  const group = classifyProducer(finalScore);

  const producerIdValue = getBestIdentityValueByHint(flatPayload, options.idFieldHints, "id");
  const producerNameValue =
    getPrimaryProducerNameValue(flatPayload, normalizedIndex) ??
    getBestIdentityValueByHint(flatPayload, options.nameFieldHints, "name");

  const normalizedProducerId = normalizeProducerId(producerIdValue);
  const normalizedProducerName = normalizeProducerName(producerNameValue);

  const producerId =
    normalizedProducerId ??
    (normalizedProducerName
      ? `prod-${normalizeToken(normalizedProducerName).slice(0, 24)}`
      : buildFallbackProducerId(rawPayload));
  const producerName = normalizedProducerName ?? `Produtor ${producerId}`;

  const cpp = getHighestNumericValueByHint(normalizedIndex, options.cppFieldHints);
  const hasResidue = hasResiduePresence(normalizedIndex, options.residueFieldHints);

  const paeReasons: string[] = [];
  if (cpp !== null && cpp > 300000) {
    paeReasons.push(`PAE Grupo 1: CPP acima do limite (300.000): ${cpp.toLocaleString("pt-BR")}`);
  }
  if (hasResidue) {
    paeReasons.push("PAE Grupo 2: Presença de resíduos ou substâncias estranhas detectada");
  }

  let pbpaCategories = factorDiagnostics
    .filter(
      (diagnostic) =>
        diagnostic.checkedFields.length > 0 && diagnostic.conformity <= options.lowScoreThreshold,
    )
    .map((diagnostic) => diagnostic.key);

  if (!pbpaCategories.length) {
    pbpaCategories = BPA_CATEGORIES.filter((category) => {
      const score = categoryScores[category.key];
      return score.questionCount > 0 && score.rawScore <= options.lowScoreThreshold;
    }).map((category) => category.key);
  }

  const pbpaActions = uniqueStrings(
    pbpaCategories.flatMap((categoryKey) => PBPA_ACTIONS_BY_CATEGORY[categoryKey] ?? []),
  );

  const paeActions = uniqueStrings([
    ...(cpp !== null && cpp > 300000 ? PAE_ACTIONS.cpp : []),
    ...(hasResidue ? PAE_ACTIONS.residuos : []),
  ]);

  return {
    producerId,
    producerName,
    totalScore: finalScore,
    group,
    categoryScores,
    actions: {
      inPAE: paeReasons.length > 0,
      paeReasons,
      pbpaCategories,
      pbpaActions,
      paeActions,
      factorDiagnostics,
    },
    metrics: {
      cpp,
      hasResidue,
    },
    unmappedScoredFields,
    rawPayload,
  };
}

export function mapAndScoreProducers(
  rawPayloads: Record<string, unknown>[],
  customOptions: Partial<ScoringOptions> = {},
): ProducerScoreResult[] {
  return rawPayloads.map((payload) => mapAndScoreProducer(payload, customOptions));
}

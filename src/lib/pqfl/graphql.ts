import "server-only";

interface ColetumAnswerEnvelope {
  data?: Record<string, unknown>;
  errors?: Array<{ message: string }>;
}

export interface FetchColetumOptions {
  fullUrl?: string;
  timeoutMs?: number;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => item !== null);
}

function sanitizeFullUrl(input: string): string {
  const trimmed = input.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function mergeAnswerWithMetadata(
  answer: Record<string, unknown>,
  metaData?: Record<string, unknown>,
): Record<string, unknown> {
  const merged = { ...answer };

  if (!metaData) {
    return merged;
  }

  if (metaData.userId !== undefined) {
    merged.__metaUserId = metaData.userId;
  }
  if (metaData.userName !== undefined) {
    merged.__metaUserName = metaData.userName;
  }
  if (metaData.friendlyId !== undefined) {
    merged.__metaFriendlyId = metaData.friendlyId;
  }
  if (metaData.createdAt !== undefined) {
    merged.__metaCreatedAt = metaData.createdAt;
  }

  return merged;
}

export function extractProducerAnswers(payload: unknown): Record<string, unknown>[] {
  const root = asRecord(payload);
  if (!root) {
    return [];
  }

  const dataNode = asRecord(root.data) ?? root;
  const answerNode = dataNode.answer;

  // Formato 1: data.answer = [{ answer: {...}, metaData: {...} }, ...]
  if (Array.isArray(answerNode)) {
    return asRecordArray(answerNode)
      .map((entry) => {
        const answer = asRecord(entry.answer);
        const metaData = asRecord(entry.metaData);
        return answer ? mergeAnswerWithMetadata(answer, metaData ?? undefined) : null;
      })
      .filter((entry): entry is Record<string, unknown> => entry !== null);
  }

  const answerObject = asRecord(answerNode);
  if (!answerObject) {
    return [];
  }

  // Formato 2: data.answer = { answer: [...], metaData: [...] }
  const answersArray = asRecordArray(answerObject.answer);
  if (answersArray.length) {
    const metadataArray = asRecordArray(answerObject.metaData);
    return answersArray.map((answer, index) =>
      mergeAnswerWithMetadata(answer, metadataArray[index] ?? metadataArray[0]),
    );
  }

  // Formato 3: data.answer = { answer: {...}, metaData: {...} }
  const singleAnswer = asRecord(answerObject.answer);
  if (singleAnswer) {
    const singleMeta = asRecord(answerObject.metaData);
    return [mergeAnswerWithMetadata(singleAnswer, singleMeta ?? undefined)];
  }

  return [];
}

export async function fetchColetumAnswers(
  options: FetchColetumOptions = {},
): Promise<Record<string, unknown>[]> {
  const fullUrl = sanitizeFullUrl(options.fullUrl ?? process.env.COLETUM_FULL_URL ?? "");

  if (!fullUrl) {
    throw new Error("Defina COLETUM_FULL_URL no .env.local com a URL completa do endpoint.");
  }

  const response = await fetch(fullUrl, {
    method: "GET",
    cache: "no-store",
    signal: AbortSignal.timeout(options.timeoutMs ?? 30_000),
  });

  if (!response.ok) {
    throw new Error(`Falha HTTP ${response.status} ao consultar Coletum`);
  }

  const payload = (await response.json()) as ColetumAnswerEnvelope;

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  return extractProducerAnswers(payload);
}

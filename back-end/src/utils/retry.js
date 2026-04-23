function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeDelay({ attempt, baseDelayMs, maxDelayMs }) {
  const exponential = baseDelayMs * 2 ** (attempt - 1);
  const capped = Math.min(exponential, maxDelayMs);
  const jitter = Math.random() * capped * 0.3;
  return Math.round(capped + jitter);
}

export async function withRetry(
  operation,
  {
    maxAttempts = 3,
    baseDelayMs = 500,
    maxDelayMs = 8_000,
    shouldRetry = () => true,
    onRetry,
  } = {},
) {
  let attempt = 0;
  let lastError;

  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      return await operation(attempt);
    } catch (err) {
      lastError = err;
      const canRetry = attempt < maxAttempts && shouldRetry(err, attempt);
      if (!canRetry) break;

      const delay = computeDelay({ attempt, baseDelayMs, maxDelayMs });
      if (typeof onRetry === "function") {
        onRetry({ error: err, attempt, delay });
      }
      await sleep(delay);
    }
  }

  throw lastError;
}

export function isTransientHttpError(err) {
  if (!err) return false;
  if (err.name === "AbortError") return true;
  if (err.code === "ECONNRESET" || err.code === "ETIMEDOUT") return true;
  if (typeof err.status === "number") {
    return err.status === 429 || err.status >= 500;
  }
  return false;
}

const SENSITIVE_QUERY_KEYS = new Set([
  "token",
  "access_token",
  "apikey",
  "api_key",
  "authorization",
  "secret",
]);

export function redactUrl(input) {
  if (typeof input !== "string" || input.length === 0) return input;
  try {
    const url = new URL(input);
    for (const key of [...url.searchParams.keys()]) {
      if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
        url.searchParams.set(key, "[REDACTED]");
      }
    }
    return url.toString();
  } catch {
    return input.replace(/([?&](?:token|Token|apikey|api_key|access_token)=)[^&]+/gi, "$1[REDACTED]");
  }
}

export function redactObject(value, { sensitiveKeys = SENSITIVE_QUERY_KEYS } = {}) {
  if (!value || typeof value !== "object") return value;
  const clone = Array.isArray(value) ? [...value] : { ...value };
  for (const key of Object.keys(clone)) {
    if (sensitiveKeys.has(key.toLowerCase())) {
      clone[key] = "[REDACTED]";
    } else if (typeof clone[key] === "object" && clone[key] !== null) {
      clone[key] = redactObject(clone[key], { sensitiveKeys });
    }
  }
  return clone;
}

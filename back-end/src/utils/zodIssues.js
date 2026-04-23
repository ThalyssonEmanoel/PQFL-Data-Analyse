const VALID_SECTIONS = new Set(["params", "query", "body", "headers"]);

function buildPath(section, issuePath) {
  const segments = Array.isArray(issuePath) ? issuePath : [];
  const tail = segments
    .map((segment) => String(segment))
    .filter((segment) => segment.length > 0)
    .join(".");

  if (section && VALID_SECTIONS.has(section)) {
    return tail ? `${section}.${tail}` : section;
  }
  return tail;
}

export function formatZodIssues(issues, section) {
  if (!Array.isArray(issues)) return [];
  return issues.map((issue) => ({
    path: buildPath(section, issue.path),
    message: issue.message,
  }));
}

export function formatZodError(error, section) {
  return formatZodIssues(error?.issues, section);
}

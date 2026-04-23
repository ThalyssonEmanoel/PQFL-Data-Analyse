import { ValidationError } from "../utils/httpError.js";
import { formatZodIssues } from "../utils/zodIssues.js";

const SECTIONS = ["params", "query", "body"];

export function validate(schemas = {}) {
  return (req, _res, next) => {
    const details = [];
    const parsed = {};

    for (const section of SECTIONS) {
      const schema = schemas[section];
      if (!schema) continue;

      const result = schema.safeParse(req[section]);
      if (result.success) {
        parsed[section] = result.data;
      } else {
        details.push(...formatZodIssues(result.error.issues, section));
      }
    }

    if (details.length > 0) {
      return next(new ValidationError(details));
    }

    for (const section of SECTIONS) {
      if (section in parsed) {
        req[section] = parsed[section];
      }
    }

    next();
  };
}

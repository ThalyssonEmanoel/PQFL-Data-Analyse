import { notFound as notFoundError } from "../utils/httpError.js";

export function notFound(req, _res, next) {
  next(notFoundError(`Route ${req.method} ${req.originalUrl} not found`));
}

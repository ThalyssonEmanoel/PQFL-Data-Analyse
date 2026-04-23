export class HttpError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    if (details !== undefined) this.details = details;
  }
}

export class ValidationError extends HttpError {
  constructor(details, message = "Invalid request data") {
    super(400, message, details);
    this.name = "ValidationError";
  }
}

export const badRequest = (message, details) => new HttpError(400, message, details);
export const unauthorized = (message = "Unauthorized") => new HttpError(401, message);
export const forbidden = (message = "Forbidden") => new HttpError(403, message);
export const notFound = (message = "Not Found") => new HttpError(404, message);
export const conflict = (message, details) => new HttpError(409, message, details);
export const unprocessable = (message, details) => new HttpError(422, message, details);
export const internal = (message = "Internal Server Error") => new HttpError(500, message);

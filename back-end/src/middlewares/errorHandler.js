import { ZodError } from "zod";
import mongoose from "mongoose";
import { HttpError, ValidationError } from "../utils/httpError.js";
import { formatZodIssues } from "../utils/zodIssues.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

function buildBody({ name, message, details }) {
  const body = { error: name, message };
  if (details !== undefined) body.details = details;
  return body;
}

function normalize(err) {
  if (err instanceof ValidationError) {
    return {
      statusCode: 400,
      body: buildBody({
        name: "ValidationError",
        message: err.message,
        details: err.details,
      }),
    };
  }

  if (err instanceof HttpError) {
    return {
      statusCode: err.statusCode,
      body: buildBody({
        name: err.name || "HttpError",
        message: err.message,
        details: err.details,
      }),
    };
  }

  if (err instanceof ZodError) {
    return {
      statusCode: 400,
      body: buildBody({
        name: "ValidationError",
        message: "Invalid request data",
        details: formatZodIssues(err.issues),
      }),
    };
  }

  if (err instanceof mongoose.Error.CastError) {
    return {
      statusCode: 400,
      body: buildBody({
        name: "CastError",
        message: `Invalid value for field "${err.path}"`,
      }),
    };
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return {
      statusCode: 422,
      body: buildBody({
        name: "DatabaseValidationError",
        message: "Database validation failed",
        details: Object.values(err.errors).map((item) => ({
          path: item.path,
          message: item.message,
        })),
      }),
    };
  }

  return {
    statusCode: 500,
    body: buildBody({
      name: "InternalServerError",
      message: "Internal Server Error",
    }),
  };
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const { statusCode, body } = normalize(err);

  if (statusCode >= 500) {
    logger.error({ err, requestId: req.id }, "request failed");
  } else {
    logger.warn(
      { err: { message: err.message, name: err.name }, requestId: req.id },
      "request rejected",
    );
  }

  if (env.NODE_ENV !== "production" && statusCode >= 500) {
    body.stack = err.stack;
  }

  if (req.id) body.requestId = req.id;

  res.status(statusCode).json(body);
}

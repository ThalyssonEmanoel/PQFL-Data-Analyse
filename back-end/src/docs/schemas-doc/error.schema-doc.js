export const ApiError = {
  type: "object",
  required: ["error", "message"],
  properties: {
    error: { type: "string", example: "HttpError" },
    message: { type: "string" },
    details: {},
    requestId: { type: "string" },
  },
};

export const ValidationIssue = {
  type: "object",
  required: ["path", "message"],
  properties: {
    path: { type: "string", example: "params.id" },
    message: { type: "string", example: "Expected number" },
  },
};

export const ValidationErrorResponse = {
  type: "object",
  required: ["error", "message", "details"],
  properties: {
    error: { type: "string", enum: ["ValidationError"] },
    message: { type: "string", example: "Invalid request data" },
    details: {
      type: "array",
      items: { $ref: "#/components/schemas/ValidationIssue" },
    },
    requestId: { type: "string" },
  },
};

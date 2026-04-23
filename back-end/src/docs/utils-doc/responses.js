const apiErrorRef = { $ref: "#/components/schemas/ApiError" };
const validationErrorRef = { $ref: "#/components/schemas/ValidationErrorResponse" };

function buildResponse(description, schemaRef) {
  return {
    description,
    content: {
      "application/json": { schema: schemaRef },
    },
  };
}

export function errorResponse(description, schemaRef = apiErrorRef) {
  return buildResponse(description, schemaRef);
}

export function jsonResponse(description, schemaRef) {
  return buildResponse(description, { $ref: schemaRef });
}

export const commonErrorResponses = {
  400: buildResponse("Invalid request data", validationErrorRef),
  403: buildResponse("Operation disabled or not permitted", apiErrorRef),
  404: buildResponse("Resource not found", apiErrorRef),
  409: buildResponse("Conflict with existing resource or in-flight operation", apiErrorRef),
  422: buildResponse("Unprocessable entity", apiErrorRef),
  500: buildResponse("Unexpected server error", apiErrorRef),
  502: buildResponse("Upstream service error (e.g. Coletum)", apiErrorRef),
};

import { commonErrorResponses, jsonResponse } from "../utils-doc/responses.js";

export const healthPaths = {
  "/health": {
    get: {
      tags: ["Health"],
      summary: "Liveness and readiness probe",
      description:
        "Returns a stable payload that describes whether the service is up and whether the database connection is currently established.",
      responses: {
        200: jsonResponse("Service is healthy", "#/components/schemas/HealthStatus"),
        500: commonErrorResponses[500],
      },
    },
  },
};

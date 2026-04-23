import { env } from "../../config/env.js";
import { SERVICE_NAME } from "../../config/constants.js";

export const openApiBase = {
  openapi: "3.0.3",
  info: {
    title: "PQFL Backend API",
    version: "0.1.0",
    description:
      "HTTP API that exposes PQFL producers and scoring data. This specification is hand-maintained in `src/docs` to keep route files clean.",
    contact: {
      name: "PQFL Backend",
    },
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}${env.API_PREFIX}`,
      description: "Local development",
    },
  ],
  tags: [
    { name: "Health", description: "Service health probes" },
    { name: "Producers", description: "Producer scoring data" },
  ],
  externalDocs: {
    description: `${SERVICE_NAME} repository`,
    url: "https://example.invalid/pqfl-backend",
  },
};

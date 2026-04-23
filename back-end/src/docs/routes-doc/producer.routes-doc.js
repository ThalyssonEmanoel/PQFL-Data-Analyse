import { producerGroupValues } from "../../schemas/producer.schema.js";
import { commonErrorResponses, jsonResponse } from "../utils-doc/responses.js";

export const producerPaths = {
  "/producers": {
    get: {
      tags: ["Producers"],
      summary: "List producers",
      description: "Returns a paginated list of producers with their scoring.",
      parameters: [
        {
          in: "query",
          name: "page",
          schema: { type: "integer", minimum: 1, default: 1 },
        },
        {
          in: "query",
          name: "limit",
          schema: { type: "integer", minimum: 1, maximum: 200, default: 50 },
        },
        {
          in: "query",
          name: "group",
          schema: { type: "string", enum: producerGroupValues },
        },
        {
          in: "query",
          name: "search",
          description: "Fuzzy match on producerName or producerId",
          schema: { type: "string" },
        },
      ],
      responses: {
        200: jsonResponse("Paginated list of producers", "#/components/schemas/ProducerList"),
        400: commonErrorResponses[400],
        500: commonErrorResponses[500],
      },
    },
  },
  "/producers/{id}": {
    get: {
      tags: ["Producers"],
      summary: "Get a single producer",
      description: "Returns the full scoring payload for the given producer id.",
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: jsonResponse("Producer found", "#/components/schemas/Producer"),
        400: commonErrorResponses[400],
        404: commonErrorResponses[404],
        500: commonErrorResponses[500],
      },
    },
  },
};

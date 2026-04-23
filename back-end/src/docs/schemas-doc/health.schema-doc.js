export const HealthStatus = {
  type: "object",
  required: ["status", "service", "timestamp", "uptimeSeconds", "database"],
  properties: {
    status: { type: "string", enum: ["ok"] },
    service: { type: "string" },
    timestamp: { type: "string", format: "date-time" },
    uptimeSeconds: { type: "number" },
    database: {
      type: "object",
      required: ["connected"],
      properties: {
        connected: { type: "boolean" },
      },
    },
  },
};

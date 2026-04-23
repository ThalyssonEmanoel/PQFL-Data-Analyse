import { isDatabaseConnected } from "../config/database.js";
import { SERVICE_NAME } from "../config/constants.js";

export const healthService = {
  async getHealth() {
    return {
      status: "ok",
      service: SERVICE_NAME,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      database: {
        connected: isDatabaseConnected(),
      },
    };
  },
};

import { healthService } from "../services/health.service.js";

export const healthController = {
  async get(_req, res) {
    const health = await healthService.getHealth();
    res.json(health);
  },
};

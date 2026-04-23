import { producerService } from "../services/producer.service.js";
import { producerRefreshService } from "../services/producer-refresh.service.js";

export const producerController = {
  async list(req, res) {
    const { page, limit, group, search } = req.query;
    const result = await producerService.listProducers({ page, limit, group, search });
    res.json(result);
  },

  async getById(req, res) {
    const { id } = req.params;
    const producer = await producerService.getProducerById(id);
    res.json(producer);
  },

  async refresh(req, res) {
    const result = await producerRefreshService.refresh(req.body ?? {});
    res.status(200).json(result);
  },
};

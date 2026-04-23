import { producerRepository } from "../repositories/producer.repository.js";
import { notFound } from "../utils/httpError.js";

function toCategoryScoresObject(source) {
  if (!source) return {};
  if (source instanceof Map) return Object.fromEntries(source.entries());
  return source;
}

function toResponse(doc) {
  if (!doc) return null;
  return {
    producerId: doc.producerId,
    producerName: doc.producerName,
    totalScore: doc.totalScore,
    group: doc.group,
    categoryScores: toCategoryScoresObject(doc.categoryScores),
    actions: doc.actions,
    metrics: doc.metrics,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  };
}

export const producerService = {
  async listProducers({ page, limit, group, search } = {}) {
    const { items, total } = await producerRepository.findPaginated({
      page,
      limit,
      group,
      search,
    });

    return {
      items: items.map(toResponse),
      pagination: { page, limit, total },
    };
  },

  async getProducerById(producerId) {
    const doc = await producerRepository.findByProducerId(producerId);
    if (!doc) throw notFound(`Producer "${producerId}" not found`);
    return toResponse(doc);
  },
};

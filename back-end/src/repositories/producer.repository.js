import { ProducerModel } from "../models/producer.model.js";

function buildListFilter({ group, search } = {}) {
  const filter = {};
  if (group) filter.group = group;
  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ producerName: regex }, { producerId: regex }];
  }
  return filter;
}

export const producerRepository = {
  async findPaginated({ page, limit, group, search } = {}) {
    const filter = buildListFilter({ group, search });
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      ProducerModel.find(filter).sort({ producerName: 1 }).skip(skip).limit(limit).lean(),
      ProducerModel.countDocuments(filter),
    ]);

    return { items, total };
  },

  async findByProducerId(producerId) {
    return ProducerModel.findOne({ producerId }).lean();
  },

  async upsertByProducerId(producerId, data) {
    return ProducerModel.findOneAndUpdate(
      { producerId },
      { $set: data },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
  },

  async bulkUpsert(documents) {
    if (!Array.isArray(documents) || documents.length === 0) {
      return { upserted: 0, modified: 0, matched: 0 };
    }

    const operations = documents.map((doc) => ({
      updateOne: {
        filter: { producerId: doc.producerId },
        update: { $set: doc },
        upsert: true,
      },
    }));

    const result = await ProducerModel.bulkWrite(operations, { ordered: false });
    return {
      upserted: result.upsertedCount ?? 0,
      modified: result.modifiedCount ?? 0,
      matched: result.matchedCount ?? 0,
    };
  },

  async countAll() {
    return ProducerModel.estimatedDocumentCount();
  },
};

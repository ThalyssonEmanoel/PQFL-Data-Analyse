import Supplier from "../models/Supplier.js";
import SyncState from "../models/SyncState.js";
import ColetumService from "./ColetumService.js";
import coletumConfig from "../config/coletum.js";

const toIsoOrNull = (value) => (value ? new Date(value).toISOString() : null);

const buildSupplierDoc = (entry, formId) => ({
  coletumId: entry.id,
  formId,
  answer: entry.answer,
  meta_data: {
    ...entry.meta_data,
    created_at: entry.meta_data.created_at ? new Date(entry.meta_data.created_at) : null,
    updated_at: entry.meta_data.updated_at ? new Date(entry.meta_data.updated_at) : null,
  },
});

class SuppliersService {
  constructor({ coletumService } = {}) {
    this.coletum = coletumService ?? new ColetumService();
    this.formId = coletumConfig.formId;
  }

  async getSyncState() {
    let state = await SyncState.findOne({ formId: this.formId });
    if (!state) state = await SyncState.create({ formId: this.formId });
    return state;
  }

  async upsertAnswer(entry) {
    const doc = buildSupplierDoc(entry, this.formId);
    await Supplier.updateOne(
      { coletumId: entry.id },
      { $set: doc },
      { upsert: true }
    );
    return doc;
  }

  async pullAll() {
    this.coletum.resetRequestCount();
    const state = await this.getSyncState();

    let imported = 0;
    let maxUpdatedAt = state.lastSyncedAt ? new Date(state.lastSyncedAt) : null;

    for await (const entry of this.coletum.iterateAnswers()) {
      await this.upsertAnswer(entry);
      imported += 1;
      const updated = entry.meta_data.updated_at || entry.meta_data.created_at;
      const updatedDate = updated ? new Date(updated) : null;
      if (updatedDate && (!maxUpdatedAt || updatedDate > maxUpdatedAt)) {
        maxUpdatedAt = updatedDate;
      }
    }

    const total = await Supplier.countDocuments({ formId: this.formId });
    state.lastSyncedAt = maxUpdatedAt ?? state.lastSyncedAt;
    state.lastFullSyncAt = new Date();
    state.totalRecords = total;
    state.lastRunRequests = this.coletum.requestCount;
    state.lastRunAt = new Date();
    await state.save();

    return {
      imported,
      totalInDatabase: total,
      requestsUsed: this.coletum.requestCount,
      lastSyncedAt: toIsoOrNull(state.lastSyncedAt),
    };
  }

  async pullPartial() {
    this.coletum.resetRequestCount();
    const state = await this.getSyncState();
    const totalInDatabase = await Supplier.countDocuments({ formId: this.formId });

    if (totalInDatabase === 0 || !state.lastSyncedAt) {
      return this.pullAll();
    }

    const updatedAfter = new Date(state.lastSyncedAt).toISOString();
    let imported = 0;
    let maxUpdatedAt = new Date(state.lastSyncedAt);

    for await (const entry of this.coletum.iterateAnswers({ updatedAfter })) {
      await this.upsertAnswer(entry);
      imported += 1;
      const updated = entry.meta_data.updated_at || entry.meta_data.created_at;
      const updatedDate = updated ? new Date(updated) : null;
      if (updatedDate && updatedDate > maxUpdatedAt) maxUpdatedAt = updatedDate;
    }

    const total = await Supplier.countDocuments({ formId: this.formId });
    state.lastSyncedAt = maxUpdatedAt;
    state.totalRecords = total;
    state.lastRunRequests = this.coletum.requestCount;
    state.lastRunAt = new Date();
    await state.save();

    return {
      imported,
      totalInDatabase: total,
      requestsUsed: this.coletum.requestCount,
      lastSyncedAt: toIsoOrNull(state.lastSyncedAt),
      strategy: "delta",
      updatedAfter,
    };
  }

  async listAllFromDatabase() {
    const items = await Supplier.find({ formId: this.formId }).lean();
    return { total: items.length, data: items };
  }

  async listPaginated({ page = 1, pageSize = 50 } = {}) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      Supplier.find({ formId: this.formId })
        .sort({ "meta_data.updated_at": -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Supplier.countDocuments({ formId: this.formId }),
    ]);
    return {
      data: items,
      pagination: {
        page,
        page_size: pageSize,
        total_items: total,
        total_pages: Math.max(1, Math.ceil(total / pageSize)),
        has_next: skip + items.length < total,
      },
    };
  }
}

export default SuppliersService;

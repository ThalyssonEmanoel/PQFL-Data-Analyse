import ColetumService from "./ColetumService.js";
import coletumConfig from "../config/coletum.js";
import SupplierRepository from "../repositories/SupplierRepository.js";
import SyncStateRepository from "../repositories/SyncStateRepository.js";

// Converte datas para ISO ou null quando ausentes.
const toIsoOrNull = (value) => (value ? new Date(value).toISOString() : null);

// Monta o documento persistido no Mongo a partir da resposta do Coletum.
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

// Orquestra sincronizacao com Coletum e leitura/gravação no banco.
class SuppliersService {
  // Permite injetar um ColetumService para testes ou configuracoes alternativas.
  constructor({ coletumService } = {}) {
    this.coletum = coletumService ?? new ColetumService();
    this.formId = coletumConfig.formId;
  }

  // Recupera (ou cria) o estado de sincronizacao do formulario.
  async getSyncState() {
    return SyncStateRepository.getOrCreateByFormId(this.formId);
  }

  // Atualiza ou cria o fornecedor pelo ID do Coletum.
  async upsertAnswer(entry) {
    const doc = buildSupplierDoc(entry, this.formId);
    await SupplierRepository.upsertByColetumId(entry.id, doc);
    return doc;
  }

  // Sincroniza todas as respostas do Coletum e atualiza o estado completo.
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

    const total = await SupplierRepository.countByFormId(this.formId);
    const newLastSyncedAt = maxUpdatedAt ?? state.lastSyncedAt;
    await SyncStateRepository.updateByFormId(this.formId, {
      lastSyncedAt: newLastSyncedAt,
      lastFullSyncAt: new Date(),
      totalRecords: total,
      lastRunRequests: this.coletum.requestCount,
      lastRunAt: new Date(),
    });

    return {
      imported,
      totalInDatabase: total,
      requestsUsed: this.coletum.requestCount,
      lastSyncedAt: toIsoOrNull(newLastSyncedAt),
    };
  }

  // Sincroniza apenas respostas alteradas desde o ultimo sync.
  async pullPartial() {
    this.coletum.resetRequestCount();
    const state = await this.getSyncState();
    const totalInDatabase = await SupplierRepository.countByFormId(this.formId);

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

    const total = await SupplierRepository.countByFormId(this.formId);
    await SyncStateRepository.updateByFormId(this.formId, {
      lastSyncedAt: maxUpdatedAt,
      totalRecords: total,
      lastRunRequests: this.coletum.requestCount,
      lastRunAt: new Date(),
    });

    return {
      imported,
      totalInDatabase: total,
      requestsUsed: this.coletum.requestCount,
      lastSyncedAt: toIsoOrNull(maxUpdatedAt),
      strategy: "delta",
      updatedAfter,
    };
  }

  // Lista todos os fornecedores armazenados no banco.
  async listAllFromDatabase() {
    const items = await SupplierRepository.findAllByFormId(this.formId);
    return { total: items.length, data: items };
  }

  // Retorna fornecedores paginados com metadados de navegacao.
  async listPaginated({ page = 1, pageSize = 50 } = {}) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      SupplierRepository.findPaginatedByFormId(this.formId, { skip, limit: pageSize }),
      SupplierRepository.countByFormId(this.formId),
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

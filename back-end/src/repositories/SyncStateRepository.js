import SyncState from "../models/SyncState.js";

// Operacoes de persistencia para o estado de sincronizacao.
class SyncStateRepository {
  // Recupera o estado do formulario ou cria caso nao exista.
  static async getOrCreateByFormId(formId) {
    const state = await SyncState.findOne({ formId }).lean();
    if (state) return state;
    const created = await SyncState.create({ formId });
    return created.toObject();
  }

  // Atualiza campos do estado de sincronizacao.
  static async updateByFormId(formId, update) {
    return SyncState.updateOne({ formId }, { $set: update });
  }
}

export default SyncStateRepository;

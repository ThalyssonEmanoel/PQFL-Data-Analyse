import Supplier from "../models/Supplier.js";

// Operacoes de persistencia para fornecedores.
class SupplierRepository {
  // Atualiza ou cria o documento pelo ID do Coletum.
  static async upsertByColetumId(coletumId, doc) {
    return Supplier.updateOne({ coletumId }, { $set: doc }, { upsert: true });
  }

  // Lista todos os fornecedores de um formulario.
  static async findAllByFormId(formId) {
    return Supplier.find({ formId }).lean();
  }

  // Conta fornecedores por formulario, opcionalmente filtrando.
  static async countByFormId(formId, filters = {}) {
    return Supplier.countDocuments({ formId, ...filters });
  }

  // Busca fornecedores paginados e ordenados por ultima atualizacao.
  static async findPaginatedByFormId(formId, { skip = 0, limit = 50, filters = {} } = {}) {
    return Supplier.find({ formId, ...filters })
      .sort({ "meta_data.updated_at": -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }
}

export default SupplierRepository;

import SupplierCalculated from "../models/SupplierCalculated.js";

// Operacoes de persistencia para fornecedores calculados (suppliers-calculated).
class SupplierCalculatedRepository {
  // Upsert por _id (mesmo _id do fornecedor em "suppliers").
  static async upsertBySupplierId(supplierId, doc) {
    const update = { ...doc };
    delete update._id;
    return SupplierCalculated.updateOne(
      { _id: supplierId },
      { $set: update, $setOnInsert: { _id: supplierId } },
      { upsert: true }
    );
  }

  // Conta documentos com filtros opcionais.
  static async countByFormId(formId, filters = {}) {
    return SupplierCalculated.countDocuments({ formId, ...filters });
  }

  // Lista documentos paginados, ordenados por totalScore desc.
  static async findPaginatedByFormId(formId, { skip = 0, limit = 50, filters = {} } = {}) {
    return SupplierCalculated.find({ formId, ...filters })
      .sort({ totalScore: -1, producerName: 1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }
}

export default SupplierCalculatedRepository;

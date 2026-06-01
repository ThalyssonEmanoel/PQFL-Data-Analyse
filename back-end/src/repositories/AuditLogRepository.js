import AuditLog from "../models/AuditLog.js";

// Persistencia da trilha de auditoria (eventos sensiveis — secao 10.2).
class AuditLogRepository {
  static async create(entry) {
    return AuditLog.create(entry);
  }

  // Listagem paginada (admin) — ordem cronologica decrescente.
  static async findPaginated({ skip = 0, limit = 50, filters = {} } = {}) {
    return AuditLog.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
  }

  static async count(filters = {}) {
    return AuditLog.countDocuments(filters);
  }
}

export default AuditLogRepository;

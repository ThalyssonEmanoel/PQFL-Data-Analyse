import AuditLogRepository from "../repositories/AuditLogRepository.js";
import logger from "../config/logger.js";
import { maskEmail } from "../utils/cryptoTokens.js";

// Grava eventos sensiveis na trilha de auditoria. Nunca lanca: uma falha de
// auditoria nao pode derrubar o fluxo principal (apenas registra no log).
class AuditService {
  static async record({ action, actorId = null, targetId = null, subject = null, metadata = {}, req = null }) {
    try {
      await AuditLogRepository.create({
        action,
        actorId,
        targetId,
        subject: subject && subject.includes("@") ? maskEmail(subject) : subject,
        metadata,
        ip: req?.ip ?? null,
        userAgent: req?.headers?.["user-agent"] ?? null,
        requestId: req?.id ?? null,
      });
    } catch (err) {
      logger.error({ err: err.message, action }, "Falha ao gravar AuditLog");
    }
  }
}

export default AuditService;

import mongoose from "mongoose";

const { Schema } = mongoose;

// Eventos sensiveis para auditoria (secao 10.2). Retencao minima recomendada: 1 ano.
// Nao aplicamos TTL automatico aqui para nao apagar trilha de auditoria sem decisao de ops.
export const AUDIT_ACTIONS = [
  "user.register",
  "user.role_changed",
  "login.success",
  "login.failed",
  "login.locked",
  "logout",
  "email.confirmed",
  "email.resend",
  "password.forgot",
  "password.reset",
  "sync.triggered",
  "calculate.triggered",
];

const AuditLogSchema = new Schema(
  {
    action: { type: String, required: true, enum: AUDIT_ACTIONS, index: true },
    // Quem executou (admin/usuario) — null para eventos anonimos/sistema.
    actorId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    // Alvo do evento (ex.: usuario criado/alterado).
    targetId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    // E-mail mascarado ou identificador legivel, quando nao houver actor/target id.
    subject: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    requestId: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "audit_logs" }
);

AuditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);

export default AuditLog;

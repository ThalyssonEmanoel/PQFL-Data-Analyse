import mongoose from "mongoose";

const { Schema } = mongoose;

// Papeis suportados. Enum (nunca flag booleana) para permitir novas roles sem migracao.
export const ROLES = ["admin", "member"];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [EMAIL_REGEX, "E-mail invalido"],
    },
    // Nulo ate o usuario definir a senha no primeiro acesso (fluxo de reset).
    passwordHash: { type: String, default: null },
    role: { type: String, enum: ROLES, default: "member", index: true },

    emailVerified: { type: Boolean, default: false },
    // Tokens guardados SEMPRE como hash (SHA-256). O valor em texto vai por e-mail.
    emailVerificationTokenHash: { type: String, default: null, index: true },
    emailVerificationExpiresAt: { type: Date, default: null },
    passwordResetTokenHash: { type: String, default: null, index: true },
    passwordResetExpiresAt: { type: Date, default: null },

    // Mitigacao de brute-force.
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },

    // Auditoria: qual admin cadastrou este usuario.
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },

    lastLoginAt: { type: Date, default: null },
    lastLoginIp: { type: String, default: null },
    passwordChangedAt: { type: Date, default: null },

    // Integracao futura com Google (secao 5). Sem default: ausente quando nao usado.
    googleId: { type: String },
  },
  { timestamps: true, collection: "users" }
);

// Unique apenas sobre valores string (partial index). Evita o conflito classico de
// multiplos `googleId: null` que o `sparse` NAO resolve quando o campo e setado como null.
UserSchema.index(
  { googleId: 1 },
  { unique: true, partialFilterExpression: { googleId: { $type: "string" } } }
);

// Nunca expor hashes/segredos ao serializar o documento.
UserSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.emailVerificationTokenHash;
    delete ret.passwordResetTokenHash;
    delete ret.__v;
    return ret;
  },
});

// Conveniencia: conta bloqueada por tentativas de login.
UserSchema.methods.isLocked = function isLocked() {
  return Boolean(this.lockedUntil && this.lockedUntil.getTime() > Date.now());
};

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;

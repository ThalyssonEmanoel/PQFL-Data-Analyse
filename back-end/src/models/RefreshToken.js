import mongoose from "mongoose";

const { Schema } = mongoose;

// Um documento por refresh token emitido. Suporta rotacao e revogacao por familia
// (secao 3.4 do roteiro): ao reusar um token ja substituido, revoga-se a familia inteira.
const RefreshTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // Todos os tokens descendentes de um mesmo login compartilham o familyId.
    familyId: { type: String, required: true, index: true },
    // jti do JWT — identificador unico do token.
    jti: { type: String, required: true, unique: true, index: true },
    // SHA-256 do refresh token cru (defesa em profundidade — nunca guardamos o token em claro).
    tokenHash: { type: String, required: true, index: true },

    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    // jti do token que substituiu este (preenchido na rotacao).
    replacedByJti: { type: String, default: null },

    userAgent: { type: String, default: null },
    ip: { type: String, default: null },
    clientType: { type: String, enum: ["web", "mobile"], default: "web" },
  },
  { timestamps: true, collection: "refresh_tokens" }
);

// TTL: remove automaticamente o documento quando expira (mantem a colecao enxuta).
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken =
  mongoose.models.RefreshToken || mongoose.model("RefreshToken", RefreshTokenSchema);

export default RefreshToken;

import RefreshToken from "../models/RefreshToken.js";

// Operacoes de persistencia para refresh tokens (rotacao e revogacao por familia).
class RefreshTokenRepository {
  static async create(doc) {
    return RefreshToken.create(doc);
  }

  static async findByJti(jti) {
    if (!jti) return null;
    return RefreshToken.findOne({ jti });
  }

  // Marca um token como revogado e aponta para o token que o substituiu (rotacao).
  static async revokeByJti(jti, replacedByJti = null) {
    return RefreshToken.updateOne(
      { jti, revokedAt: null },
      { $set: { revokedAt: new Date(), replacedByJti } }
    );
  }

  // Revoga TODA a familia — usado quando se detecta reuso de token (possivel roubo).
  static async revokeFamily(familyId) {
    return RefreshToken.updateMany(
      { familyId, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
  }

  // Revoga todos os tokens de um usuario (ex.: apos reset de senha — logout global).
  static async revokeAllForUser(userId) {
    return RefreshToken.updateMany(
      { userId, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
  }
}

export default RefreshTokenRepository;

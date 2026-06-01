import jwt from "jsonwebtoken";
import jwtConfig, { parseDuration } from "../config/jwt.js";
import { getRedis } from "../config/redis.js";
import { newJti, sha256 } from "../utils/cryptoTokens.js";
import RefreshTokenRepository from "../repositories/RefreshTokenRepository.js";

const REFRESH_WEB_FALLBACK = 7 * 86_400_000; // 7d
const REFRESH_MOBILE_FALLBACK = 30 * 86_400_000; // 30d

// Emissao/validacao de JWTs (RS256), persistencia/rotacao de refresh tokens e
// denylist de accessTokens (revogacao imediata, apenas quando ha Redis — secao 3 e 8.3).
class TokenService {
  // AccessToken: stateless, curto, vai em todas as requisicoes. Payload minimo.
  static signAccessToken(user) {
    const jti = newJti();
    const token = jwt.sign(
      { role: user.role, emailVerified: user.emailVerified, type: "access" },
      jwtConfig.privateKey,
      {
        algorithm: jwtConfig.algorithm,
        expiresIn: jwtConfig.accessTtl,
        subject: String(user._id),
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
        jwtid: jti,
      }
    );
    return { token, jti };
  }

  // RefreshToken: longo, vai apenas para /auth/refresh. TTL difere por tipo de cliente.
  static signRefreshToken(user, { familyId, clientType = "web" }) {
    const jti = newJti();
    const ttl = clientType === "mobile" ? jwtConfig.refreshTtlMobile : jwtConfig.refreshTtlWeb;
    const token = jwt.sign(
      { role: user.role, type: "refresh", family: familyId },
      jwtConfig.privateKey,
      {
        algorithm: jwtConfig.algorithm,
        expiresIn: ttl,
        subject: String(user._id),
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
        jwtid: jti,
      }
    );
    const fallback = clientType === "mobile" ? REFRESH_MOBILE_FALLBACK : REFRESH_WEB_FALLBACK;
    const expiresAt = new Date(Date.now() + parseDuration(ttl, fallback));
    return { token, jti, expiresAt, familyId, clientType };
  }

  // Verifica assinatura/claims. Lanca erro com .code para o errorHandler mapear em 401.
  static verify(token, expectedType) {
    let payload;
    try {
      payload = jwt.verify(token, jwtConfig.publicKey, {
        algorithms: [jwtConfig.algorithm],
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      });
    } catch (err) {
      const error = new Error("Token invalido ou expirado");
      error.code = "TOKEN_INVALID";
      error.cause = err;
      throw error;
    }
    if (expectedType && payload.type !== expectedType) {
      const error = new Error("Tipo de token incorreto");
      error.code = "TOKEN_INVALID";
      throw error;
    }
    return payload;
  }

  // Persiste o refresh token (hash) para suportar rotacao/revogacao por familia.
  static async persistRefreshToken({ token, jti, userId, familyId, expiresAt, clientType, ip, userAgent }) {
    return RefreshTokenRepository.create({
      userId,
      jti,
      tokenHash: sha256(token),
      familyId,
      expiresAt,
      clientType,
      ip,
      userAgent,
    });
  }

  // --- Denylist de accessTokens (so funciona com Redis; sem ele, confia-se no TTL curto) ---
  static async denylistAccessJti(jti, remainingMs) {
    const redis = getRedis();
    if (!redis || !jti) return false;
    const ttlSec = Math.max(1, Math.ceil(remainingMs / 1000));
    await redis.set(`denylist:${jti}`, "1", "EX", ttlSec);
    return true;
  }

  static async isAccessJtiDenied(jti) {
    const redis = getRedis();
    if (!redis || !jti) return false;
    return Boolean(await redis.get(`denylist:${jti}`));
  }
}

export default TokenService;

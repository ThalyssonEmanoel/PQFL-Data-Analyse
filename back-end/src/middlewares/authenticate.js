import TokenService from "../services/TokenService.js";
import AppError from "../utils/AppError.js";
import HttpStatusCodes from "../utils/HttpStatusCodes.js";

// Valida o accessToken (Authorization: Bearer ...) e popula req.user.
// Consulta a denylist (revogacao imediata) quando o Redis esta ativo.
const authenticate = async (req, _res, next) => {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new AppError("Token de acesso ausente", HttpStatusCodes.UNAUTHORIZED.code, "NO_ACCESS_TOKEN");
    }

    const payload = TokenService.verify(token, "access");

    if (await TokenService.isAccessJtiDenied(payload.jti)) {
      throw new AppError("Token revogado", HttpStatusCodes.UNAUTHORIZED.code, "TOKEN_REVOKED");
    }

    req.user = {
      id: payload.sub,
      sub: payload.sub,
      role: payload.role,
      emailVerified: payload.emailVerified,
      jti: payload.jti,
      exp: payload.exp,
    };

    next();
  } catch (err) {
    next(err);
  }
};

export default authenticate;

import AppError from "../utils/AppError.js";
import HttpStatusCodes from "../utils/HttpStatusCodes.js";

// authorize(...roles) — exige que req.user.role esteja entre os roles permitidos.
// Deve ser usado SEMPRE depois de `authenticate`.
const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(new AppError("Nao autenticado", HttpStatusCodes.UNAUTHORIZED.code, "NOT_AUTHENTICATED"));
  }
  if (roles.length > 0 && !roles.includes(req.user.role)) {
    return next(
      new AppError("Permissao insuficiente para executar a operacao", HttpStatusCodes.FORBIDDEN.code, "FORBIDDEN")
    );
  }
  next();
};

export default authorize;

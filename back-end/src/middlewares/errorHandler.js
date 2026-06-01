import { ZodError } from "zod";
import AppError from "../utils/AppError.js";
import HttpStatusCodes from "../utils/HttpStatusCodes.js";
import logger from "../config/logger.js";

const isProd = () => process.env.NODE_ENV === "production";

// 404 para rotas nao registradas (registrar ANTES do errorHandler).
export const notFound = (req, res) => {
  res.status(HttpStatusCodes.NOT_FOUND.code).json({ message: "Rota nao encontrada", requestId: req.id });
};

// Handler de erros central. Normaliza Zod, AppError, JWT, Mongoose e upstream (axios)
// num payload consistente. Nunca vaza stack/segredos em producao.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  let status = HttpStatusCodes.INTERNAL_SERVER_ERROR.code;
  const body = { message: HttpStatusCodes.INTERNAL_SERVER_ERROR.message, requestId: req.id };

  if (err instanceof ZodError || err?.issues) {
    status = HttpStatusCodes.BAD_REQUEST.code;
    body.message = "Parametros invalidos";
    body.details = err.issues;
  } else if (err instanceof AppError) {
    status = err.statusCode || HttpStatusCodes.INTERNAL_SERVER_ERROR.code;
    body.message = err.message;
    if (err.code) body.code = err.code;
    if (err.details) body.details = err.details;
  } else if (
    err?.code === "TOKEN_INVALID" ||
    ["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(err?.name)
  ) {
    status = HttpStatusCodes.UNAUTHORIZED.code;
    body.message = "Token invalido ou expirado";
    body.code = "TOKEN_INVALID";
  } else if (err?.code === 11000) {
    status = HttpStatusCodes.CONFLICT.code;
    body.message = "Registro duplicado";
    body.details = err.keyValue;
  } else if (err?.name === "ValidationError") {
    status = HttpStatusCodes.BAD_REQUEST.code;
    body.message = "Dados invalidos";
    body.details = Object.values(err.errors || {}).map((e) => e.message);
  } else if (err?.response) {
    // Erro de servico externo (axios) — ex.: Coletum.
    status = err.response.status || 502;
    body.message = `Erro ao consultar servico externo: ${err.response.data?.message || err.message}`;
  } else if (err?.statusCode) {
    status = err.statusCode;
    body.message = err.message || body.message;
  }

  const logPayload = {
    err: err?.message,
    code: body.code,
    status,
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
  };
  if (status >= 500) logger.error(logPayload, "Erro nao tratado");
  else logger.warn(logPayload, "Erro de requisicao");

  // Em producao, nao expor detalhes internos de erros 5xx.
  if (status >= 500 && isProd()) body.message = HttpStatusCodes.INTERNAL_SERVER_ERROR.message;

  res.status(status).json(body);
};

export default errorHandler;

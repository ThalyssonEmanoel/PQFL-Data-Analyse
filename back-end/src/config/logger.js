import pino from "pino";

// Logger estruturado (pino). Substitui console.log no codigo de producao.
// Nivel controlado por LOG_LEVEL (default: "info" em prod, "debug" em dev).
const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug");

const logger = pino({
  level,
  // Mascara campos sensiveis em qualquer log (ver secao 10.1 do roteiro).
  redact: {
    paths: [
      "password",
      "newPassword",
      "passwordHash",
      "token",
      "accessToken",
      "refreshToken",
      "authorization",
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
    ],
    censor: "***",
  },
  base: { service: "pqfl-api" },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;

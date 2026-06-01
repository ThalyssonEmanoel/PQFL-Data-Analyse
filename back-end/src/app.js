import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import pinoHttp from "pino-http";
import mongoose from "mongoose";

import logger from "./config/logger.js";
import { isRedisEnabled, getRedis } from "./config/redis.js";
import requestId from "./middlewares/requestId.js";
import errorHandler, { notFound } from "./middlewares/errorHandler.js";
import routes from "./routes/index.js";

const app = express();

// Atras de proxy/LB (NGINX/ELB): req.ip e o protocolo corretos — necessario para
// rate-limit por IP e cookies Secure. "1" = confia no primeiro proxy (secao 7.2).
app.set("trust proxy", 1);

// Headers de seguranca (Helmet). CSP ajustado para permitir o Swagger UI em /docs.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'", "https:"],
        "img-src": ["'self'", "data:", "https:"],
      },
    },
  })
);

// CORS: restrito a origens conhecidas em producao; permissivo em dev.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONT_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: process.env.NODE_ENV === "production" ? allowedOrigins : true,
    credentials: true,
  })
);

// Correlation id + log estruturado por requisicao (secao 10.1).
app.use(requestId);
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.id,
    customLogLevel: (_req, res, err) => {
      if (res.statusCode === 501) return "warn"; // stub intencional (ex.: Google)
      if (err || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
  })
);

// Compressao gzip — bom para respostas grandes do dashboard (secao 8.7).
app.use(compression());

// Parsers de corpo e cookies (cookie-parser necessario para o refreshToken no web).
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Health check (sem autenticacao) — usado por LB/orquestrador (secao 8.6).
app.get("/health", async (_req, res) => {
  const db = mongoose.connection.readyState === 1 ? "up" : "down";
  let redis = "disabled";
  if (isRedisEnabled()) {
    try {
      await getRedis().ping();
      redis = "up";
    } catch {
      redis = "down";
    }
  }
  const healthy = db === "up" && redis !== "down";
  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    db,
    redis,
    uptime: process.uptime(),
  });
});

// Swagger + roteadores da aplicacao.
routes(app);

// 404 e tratamento central de erros (sempre por ultimo).
app.use(notFound);
app.use(errorHandler);

export default app;

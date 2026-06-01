import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { getRedis } from "../config/redis.js";
import HttpStatusCodes from "../utils/HttpStatusCodes.js";

// Store distribuido (Redis) quando disponivel; senao MemoryStore (default), que
// funciona em instancia unica. Em multi-instancia, REDIS_URL e essencial (secao 8.3).
const buildStore = (prefix) => {
  const redis = getRedis();
  if (!redis) return undefined; // MemoryStore padrao
  return new RedisStore({ sendCommand: (...args) => redis.call(...args), prefix });
};

const tooMany = { message: HttpStatusCodes.TOO_MANY_REQUESTS.message };

// Chave por e-mail (login/forgot/resend); cai para o IP normalizado quando ausente.
// Inclui req.path para que limiters compartilhados (forgot x resend) mantenham budgets separados.
const emailKey = (req) => {
  const email = req.body?.email;
  const base = email ? `email:${String(email).toLowerCase().trim()}` : ipKeyGenerator(req.ip);
  return `${req.path}:${base}`;
};

// Chave pelo usuario autenticado (ex.: cota de cadastro por admin).
const userKey = (req) => (req.user?.id ? `user:${req.user.id}` : ipKeyGenerator(req.ip));

const makeLimiter = ({ windowMs, limit, prefix, keyGenerator }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    store: buildStore(prefix),
    keyGenerator,
    message: tooMany,
  });

// 4.2 — login: 5 tentativas por IP / 15 min  +  10 por e-mail / 1h.
export const loginIpLimiter = makeLimiter({ windowMs: 15 * 60_000, limit: 5, prefix: "rl:login:ip:" });
export const loginEmailLimiter = makeLimiter({ windowMs: 60 * 60_000, limit: 10, prefix: "rl:login:email:", keyGenerator: emailKey });

// 4.3 — refresh: 60 req/min (refresh legitimo e frequente).
export const refreshLimiter = makeLimiter({ windowMs: 60_000, limit: 60, prefix: "rl:refresh:" });

// 4.5 / 4.6 — reenvio de confirmacao e forgotPassword: 1/min e 5/dia por e-mail.
export const emailPerMinuteLimiter = makeLimiter({ windowMs: 60_000, limit: 1, prefix: "rl:email:min:", keyGenerator: emailKey });
export const emailPerDayLimiter = makeLimiter({ windowMs: 24 * 60 * 60_000, limit: 5, prefix: "rl:email:day:", keyGenerator: emailKey });

// 4.1 — register: 20 cadastros/hora por admin.
export const registerLimiter = makeLimiter({ windowMs: 60 * 60_000, limit: 20, prefix: "rl:register:", keyGenerator: userKey });

export default { loginIpLimiter, loginEmailLimiter, refreshLimiter, emailPerMinuteLimiter, emailPerDayLimiter, registerLimiter };

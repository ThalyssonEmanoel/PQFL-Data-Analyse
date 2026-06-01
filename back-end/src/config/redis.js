import Redis from "ioredis";
import logger from "./logger.js";

// Redis e OPCIONAL. Sem REDIS_URL, getRedis() retorna null e as features que
// dependem dele degradam graciosamente (rate-limit em memoria, denylist/cache off,
// jobs executados inline). Ver secao 8.3 do roteiro.
const url = process.env.REDIS_URL?.trim();

let client = null;

export const isRedisEnabled = () => Boolean(url);

// Retorna a instancia compartilhada do Redis (ou null se desabilitado).
export const getRedis = () => {
  if (!url) return null;
  if (client) return client;

  // maxRetriesPerRequest: null e exigido pelo BullMQ e inofensivo para os demais usos.
  client = new Redis(url, { maxRetriesPerRequest: null });
  client.on("error", (err) => logger.error({ err: err.message }, "Erro na conexao com o Redis"));
  client.on("connect", () => logger.info("Redis conectado"));
  return client;
};

// Cria uma conexao dedicada (BullMQ recomenda conexoes separadas por Queue/Worker).
export const createRedisConnection = () => {
  if (!url) return null;
  return new Redis(url, { maxRetriesPerRequest: null });
};

export const closeRedis = async () => {
  if (!client) return;
  try {
    await client.quit();
  } catch {
    /* ignore */
  }
  client = null;
};

export default getRedis;

import "dotenv/config";
import { Worker } from "bullmq";
import { createRedisConnection, isRedisEnabled } from "../src/config/redis.js";
import { getProcessor, getRegisteredQueueNames } from "../src/services/JobQueue.js";
import logger from "../src/config/logger.js";
// Importar os services registra seus processors na JobQueue.
import "../src/services/MailService.js";

// Worker de filas BullMQ (secao 8.5). Roda em processo/container separado da API.
// Sem Redis nao ha o que processar (os jobs rodam inline na propria API).
if (!isRedisEnabled()) {
  logger.error("REDIS_URL nao configurado. O worker so faz sentido com Redis (BullMQ). Encerrando.");
  process.exit(1);
}

const workers = [];

for (const queueName of getRegisteredQueueNames()) {
  const handler = getProcessor(queueName);
  const worker = new Worker(
    queueName,
    async (job) => handler({ name: job.name, data: job.data }),
    { connection: createRedisConnection() }
  );
  worker.on("completed", (job) => logger.info({ queue: queueName, jobId: job.id }, "Job concluido"));
  worker.on("failed", (job, err) =>
    logger.error({ queue: queueName, jobId: job?.id, err: err?.message }, "Job falhou")
  );
  workers.push(worker);
  logger.info(`Worker ativo para a fila "${queueName}"`);
}

const shutdown = async () => {
  logger.warn("Encerrando workers...");
  await Promise.all(workers.map((w) => w.close().catch(() => {})));
  process.exit(0);
};
["SIGTERM", "SIGINT"].forEach((s) => process.on(s, shutdown));

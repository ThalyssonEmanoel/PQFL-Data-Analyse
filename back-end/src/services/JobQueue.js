import { Queue } from "bullmq";
import { createRedisConnection, isRedisEnabled } from "../config/redis.js";
import logger from "../config/logger.js";

// Abstracao de fila de jobs (secao 8.5).
//  - Com REDIS_URL: usa BullMQ; o job e processado por um worker separado (scripts/worker.js).
//  - Sem REDIS_URL: executa o processor inline em background (nao bloqueia a resposta HTTP).
// Os processors sao registrados pelos services (ex.: MailService) e reutilizados pelo worker.

const processors = new Map(); // queueName -> async ({ name, data }) => {}
const queues = new Map(); // queueName -> BullMQ Queue

export const registerProcessor = (queueName, handler) => {
  processors.set(queueName, handler);
};

export const getProcessor = (queueName) => processors.get(queueName);
export const getRegisteredQueueNames = () => [...processors.keys()];

const getQueue = (queueName) => {
  if (queues.has(queueName)) return queues.get(queueName);
  const queue = new Queue(queueName, { connection: createRedisConnection() });
  queues.set(queueName, queue);
  return queue;
};

const DEFAULT_JOB_OPTS = {
  attempts: 3,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: 1000,
  removeOnFail: 5000,
};

// Enfileira (ou executa inline) um job. Retorna { id, mode }.
export const enqueue = async (queueName, jobName, data, opts = {}) => {
  if (isRedisEnabled()) {
    const job = await getQueue(queueName).add(jobName, data, { ...DEFAULT_JOB_OPTS, ...opts });
    return { id: job.id, mode: "queued" };
  }

  const handler = processors.get(queueName);
  if (!handler) {
    throw new Error(`Nenhum processor registrado para a fila "${queueName}"`);
  }

  // Fire-and-forget: nao aguardamos para nao bloquear o request (ex.: envio de e-mail).
  Promise.resolve()
    .then(() => handler({ name: jobName, data }))
    .catch((err) =>
      logger.error({ err: err.message, queueName, jobName }, "Falha ao processar job inline")
    );

  return { id: null, mode: "inline" };
};

export const closeQueues = async () => {
  await Promise.all([...queues.values()].map((q) => q.close().catch(() => {})));
  queues.clear();
};

export default { enqueue, registerProcessor, getProcessor, getRegisteredQueueNames, closeQueues };

import "dotenv/config";
import mongoose from "mongoose";
import app from "./src/app.js";
import connectDatabase from "./src/config/database.js";
import logger from "./src/config/logger.js";
import { closeRedis } from "./src/config/redis.js";
import { closeQueues } from "./src/services/JobQueue.js";

const port = process.env.PORT || 8080;
let server;

const start = async () => {
  try {
    await connectDatabase();
    server = app.listen(port, () => {
      logger.info(`API rodando em http://localhost:${port}`);
      logger.info(`Swagger UI em http://localhost:${port}/docs`);
    });
  } catch (error) {
    logger.error({ err: error.message }, "Falha ao iniciar o servidor");
    process.exit(1);
  }
};

// Graceful shutdown (secao 8.2): para de aceitar conexoes, drena as em curso e
// fecha Mongo/Redis/filas. Sem isso, deploys derrubam requisicoes em andamento.
let shuttingDown = false;
const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.warn(`Recebido ${signal}. Iniciando graceful shutdown...`);

  const force = setTimeout(() => {
    logger.error("Timeout (25s) no shutdown. Forcando saida.");
    process.exit(1);
  }, 25_000);
  force.unref();

  try {
    if (server) await new Promise((resolve) => server.close(resolve));
    await closeQueues();
    await mongoose.connection.close(false);
    await closeRedis();
    clearTimeout(force);
    logger.info("Shutdown concluido.");
    process.exit(0);
  } catch (err) {
    logger.error({ err: err.message }, "Erro durante o shutdown");
    process.exit(1);
  }
};

["SIGTERM", "SIGINT"].forEach((sig) => process.on(sig, () => shutdown(sig)));

process.on("unhandledRejection", (reason) =>
  logger.error({ reason: String(reason) }, "unhandledRejection nao tratada")
);
process.on("uncaughtException", (err) => {
  logger.error({ err: err.message }, "uncaughtException — encerrando");
  process.exit(1);
});

start();

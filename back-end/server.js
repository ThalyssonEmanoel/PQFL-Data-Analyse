import "dotenv/config";
import { createApp } from "./src/app.js";
import { env } from "./src/config/env.js";
import { connectToDatabase, disconnectFromDatabase } from "./src/config/database.js";
import { logger } from "./src/utils/logger.js";

async function bootstrap() {
  try {
    await connectToDatabase();
  } catch (error) {
    logger.fatal({ err: error }, "failed to connect to mongo at startup");
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(
      {
        port: env.PORT,
        apiPrefix: env.API_PREFIX,
        docs: "/docs",
        env: env.NODE_ENV,
        url: `http://localhost:${env.PORT}/docs`,
      },
      "http server listening",
    );
  });

  const shutdown = async (signal) => {
    logger.info({ signal }, "graceful shutdown initiated");

    const forceExitTimer = setTimeout(() => {
      logger.warn("forcing process exit after timeout");
      process.exit(1);
    }, 10_000);
    forceExitTimer.unref();

    server.close(async (closeErr) => {
      if (closeErr) {
        logger.error({ err: closeErr }, "error while closing http server");
      }
      try {
        await disconnectFromDatabase();
      } catch (err) {
        logger.error({ err }, "error while disconnecting from mongo");
      }
      logger.info("graceful shutdown complete");
      process.exit(closeErr ? 1 : 0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  process.on("unhandledRejection", (reason) => {
    logger.error({ err: reason }, "unhandled promise rejection");
  });
  process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "uncaught exception — exiting");
    process.exit(1);
  });
}

bootstrap();

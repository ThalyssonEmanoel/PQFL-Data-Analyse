import mongoose from "mongoose";
import { env } from "./env.js";
import { DB_DEFAULTS } from "./constants.js";
import { logger } from "../utils/logger.js";

mongoose.set("strictQuery", true);

let connectionPromise = null;

function buildConnectOptions() {
  const options = {
    maxPoolSize: DB_DEFAULTS.maxPoolSize,
    minPoolSize: DB_DEFAULTS.minPoolSize,
    serverSelectionTimeoutMS: DB_DEFAULTS.serverSelectionTimeoutMS,
  };

  if (env.MONGODB_DB_NAME) {
    options.dbName = env.MONGODB_DB_NAME;
  }

  return options;
}

export async function connectToDatabase() {
  if (connectionPromise) return connectionPromise;

  const options = buildConnectOptions();

  connectionPromise = mongoose
    .connect(env.MONGODB_URI, options)
    .then((instance) => {
      logger.info(
        { dbName: instance.connection?.name, host: instance.connection?.host },
        "mongo connection established",
      );
      return instance.connection;
    })
    .catch((error) => {
      connectionPromise = null;
      logger.error({ err: error }, "mongo connection failed");
      throw error;
    });

  mongoose.connection.on("disconnected", () => {
    logger.warn("mongo connection disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    logger.info("mongo connection reconnected");
  });

  return connectionPromise;
}

export async function disconnectFromDatabase() {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
  connectionPromise = null;
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

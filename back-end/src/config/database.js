import mongoose from "mongoose";
import logger from "./logger.js";

const resolveMongoUri = () => {
  const env = process.env.NODE_ENV || "development";
  if (env === "production") {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI é obrigatório em produção");
    }
    return process.env.MONGODB_URI;
  }
  return process.env.MONGODB_URI_TEST || process.env.MONGODB_URI;
};

export const connectDatabase = async () => {
  const uri = resolveMongoUri();
  if (!uri) {
    throw new Error("Nenhuma URI do MongoDB configurada (MONGODB_URI_TEST/MONGODB_URI)");
  }

  mongoose.set("strictQuery", true);

  // Opcoes de producao (secao 8.4): pool e read preference ajustaveis por env.
  const options = { serverSelectionTimeoutMS: 10_000 };
  if (process.env.MONGO_MAX_POOL_SIZE) options.maxPoolSize = Number(process.env.MONGO_MAX_POOL_SIZE);
  if (process.env.MONGO_READ_PREFERENCE) options.readPreference = process.env.MONGO_READ_PREFERENCE;

  await mongoose.connect(uri, options);

  logger.info(`MongoDB conectado em: ${uri.replace(/\/\/[^@]+@/, "//***@")}`);
  return mongoose.connection;
};

export default connectDatabase;

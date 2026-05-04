import mongoose from "mongoose";

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
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });

  console.log(`MongoDB conectado em: ${uri.replace(/\/\/[^@]+@/, "//***@")}`);
  return mongoose.connection;
};

export default connectDatabase;

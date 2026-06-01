import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDatabase from "../src/config/database.js";
import User from "../src/models/User.js";
import logger from "../src/config/logger.js";

// Seed: cria APENAS 1 admin + 3 members (nenhum supplier ou outra coisa).
// Credenciais vem do .env (SEED_ADMIN_EMAIL/PASSWORD, SEED_MEMBER_*). Idempotente.
const BCRYPT_ROUNDS = 12;

const upsertUser = async ({ email, password, role, createdByUserId = null }) => {
  const normalized = String(email).toLowerCase().trim();
  const existing = await User.findOne({ email: normalized });
  if (existing) {
    logger.info(`(skip) ${role} ja existe: ${normalized}`);
    return existing;
  }
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({
    email: normalized,
    passwordHash,
    role,
    emailVerified: true, // seed cria contas prontas para uso
    createdByUserId,
  });
  logger.info(`(criado) ${role}: ${normalized}`);
  return user;
};

const run = async () => {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error("SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD sao obrigatorios no .env");
  }

  const memberPassword = process.env.SEED_MEMBER_PASSWORD || adminPassword;
  const memberEmails = (
    process.env.SEED_MEMBER_EMAILS || "member1@pqfl.local,member2@pqfl.local,member3@pqfl.local"
  )
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  await connectDatabase();

  const admin = await upsertUser({ email: adminEmail, password: adminPassword, role: "admin" });

  for (const email of memberEmails) {
    await upsertUser({ email, password: memberPassword, role: "member", createdByUserId: admin._id });
  }

  logger.info("Seed concluido.");
  await mongoose.connection.close();
  process.exit(0);
};

run().catch(async (err) => {
  logger.error({ err: err.message }, "Falha no seed");
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});

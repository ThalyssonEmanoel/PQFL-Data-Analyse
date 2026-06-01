import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Carrega uma chave PEM: prioridade para o valor inline (env), senao le do arquivo.
const loadKey = (inlineVar, pathVar, label) => {
  const inline = process.env[inlineVar];
  if (inline && inline.trim()) {
    // Permite \n escapado quando a chave vem de um secret manager numa unica linha.
    return inline.includes("\\n") ? inline.replace(/\\n/g, "\n") : inline;
  }
  const path = process.env[pathVar];
  if (!path) {
    throw new Error(
      `Chave JWT ausente: defina ${inlineVar} (PEM inline) ou ${pathVar} (caminho do arquivo) para a chave ${label}. ` +
        "Gere um par com: npm run keys:generate"
    );
  }
  try {
    return readFileSync(resolve(process.cwd(), path), "utf8");
  } catch (error) {
    throw new Error(`Falha ao ler a chave ${label} em "${path}": ${error.message}`);
  }
};

// Converte duracoes do tipo "15m", "7d", "30s", "12h" em milissegundos.
export const parseDuration = (value, fallbackMs) => {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return fallbackMs;
  const match = value.trim().match(/^(\d+)\s*(ms|s|m|h|d)?$/i);
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  const unit = (match[2] || "ms").toLowerCase();
  const multipliers = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return amount * multipliers[unit];
};

export const jwtConfig = {
  algorithm: "RS256",
  privateKey: loadKey("JWT_PRIVATE_KEY", "JWT_PRIVATE_KEY_PATH", "privada"),
  publicKey: loadKey("JWT_PUBLIC_KEY", "JWT_PUBLIC_KEY_PATH", "publica"),
  issuer: process.env.JWT_ISSUER || "pqfl-api",
  audience: process.env.JWT_AUDIENCE || "pqfl-clients",
  accessTtl: process.env.ACCESS_TOKEN_TTL || "15m",
  refreshTtlWeb: process.env.REFRESH_TOKEN_TTL_WEB || "7d",
  refreshTtlMobile: process.env.REFRESH_TOKEN_TTL_MOBILE || "30d",
};

export default jwtConfig;

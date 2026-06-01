import { generateKeyPairSync } from "node:crypto";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Gera um par de chaves RSA (RS256) para assinatura/validacao de JWTs.
// Uso: node scripts/generate-keys.js [--force]
// As chaves NUNCA devem ser commitadas — ver .gitignore (*.pem e /keys).

const __dirname = dirname(fileURLToPath(import.meta.url));
const keysDir = resolve(__dirname, "..", "keys");
const privatePath = resolve(keysDir, "jwt_private.pem");
const publicPath = resolve(keysDir, "jwt_public.pem");

const force = process.argv.includes("--force");

if (!force && existsSync(privatePath) && existsSync(publicPath)) {
  console.log("Chaves ja existem em ./keys. Use --force para sobrescrever.");
  process.exit(0);
}

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

mkdirSync(keysDir, { recursive: true });
writeFileSync(privatePath, privateKey, { mode: 0o600 });
writeFileSync(publicPath, publicKey, { mode: 0o644 });

console.log("Par de chaves RS256 gerado:");
console.log(`  Privada: ${privatePath}`);
console.log(`  Publica: ${publicPath}`);
console.log("\nConfigure no .env:");
console.log("  JWT_PRIVATE_KEY_PATH=./keys/jwt_private.pem");
console.log("  JWT_PUBLIC_KEY_PATH=./keys/jwt_public.pem");

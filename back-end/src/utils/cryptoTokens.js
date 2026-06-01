import { randomBytes, createHash, randomUUID } from "node:crypto";

// Gera um token aleatorio em hex (default 32 bytes = 256 bits de entropia).
// Usado para confirmacao de e-mail, reset de senha e senha temporaria.
export const generateRandomToken = (bytes = 32) => randomBytes(bytes).toString("hex");

// Hash SHA-256 (hex). Tokens de e-mail/reset sao guardados SEMPRE como hash.
export const sha256 = (value) => createHash("sha256").update(String(value)).digest("hex");

// Identificador unico para o claim `jti` do JWT.
export const newJti = () => randomUUID();

// Mascara e-mail para logs/auditoria: "thalysson@gmail.com" -> "th***@gmail.com".
export const maskEmail = (email) => {
  if (typeof email !== "string" || !email.includes("@")) return "***";
  const [local, domain] = email.split("@");
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
};

export default { generateRandomToken, sha256, newJti, maskEmail };

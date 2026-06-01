import { z } from "zod";
import { ROLES } from "../models/User.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Normaliza (trim + lowercase) antes de validar o formato.
const email = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
  z.string().regex(EMAIL_REGEX, "E-mail invalido")
);

export const registerSchema = z.object({
  email,
  role: z.enum(ROLES),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Senha obrigatoria"),
});

// refreshToken pode vir do cookie (web) ou do body (mobile).
export const refreshSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export const confirmEmailQuerySchema = z.object({
  token: z.string().min(1, "Token obrigatorio"),
});

export const emailOnlySchema = z.object({ email });

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token obrigatorio"),
  newPassword: z.string().min(10, "A senha deve ter no minimo 10 caracteres"),
});

export default {
  registerSchema,
  loginSchema,
  refreshSchema,
  confirmEmailQuerySchema,
  emailOnlySchema,
  resetPasswordSchema,
};

import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import UserRepository from "../repositories/UserRepository.js";
import RefreshTokenRepository from "../repositories/RefreshTokenRepository.js";
import TokenService from "./TokenService.js";
import MailService from "./MailService.js";
import AuditService from "./AuditService.js";
import AppError from "../utils/AppError.js";
import HttpStatusCodes from "../utils/HttpStatusCodes.js";
import { generateRandomToken, sha256 } from "../utils/cryptoTokens.js";

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000; // 30min

// Hash fixo usado para igualar o tempo de resposta quando o usuario nao existe
// (mitiga enumeracao de contas via timing no login).
const DUMMY_HASH = bcrypt.hashSync("timing-attack-mitigation-dummy", BCRYPT_ROUNDS);

// Pequena blocklist de senhas obvias (NIST SP 800-63B recomenda bloquear comuns).
const COMMON_PASSWORDS = new Set([
  "password", "12345678", "123456789", "1234567890", "senha123456",
  "qwertyuiop", "0987654321", "iloveyou12", "admin123456",
]);

const safeUser = (user) => ({
  id: String(user._id),
  email: user.email,
  role: user.role,
  emailVerified: user.emailVerified,
});

// Orquestra cadastro, login, rotacao de tokens e ciclo de e-mail.
class AuthService {
  static async hashPassword(plain) {
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
  }

  static assertPasswordPolicy(password) {
    if (typeof password !== "string" || password.length < 10) {
      throw new AppError("A senha deve ter no minimo 10 caracteres", HttpStatusCodes.BAD_REQUEST.code, "WEAK_PASSWORD");
    }
    if (COMMON_PASSWORDS.has(password.toLowerCase())) {
      throw new AppError("Senha muito comum. Escolha outra.", HttpStatusCodes.BAD_REQUEST.code, "WEAK_PASSWORD");
    }
  }

  // 4.1 — Cadastro restrito a admin. Cria usuario sem senha e envia link de primeiro acesso.
  static async register({ email, role, actorId, req }) {
    if (await UserRepository.existsByEmail(email)) {
      throw new AppError("E-mail ja cadastrado", HttpStatusCodes.CONFLICT.code, "EMAIL_TAKEN");
    }

    // Token de primeiro acesso = mecanismo de reset reutilizado (nunca enviamos senha em claro).
    const token = generateRandomToken();
    const user = await UserRepository.create({
      email,
      role,
      passwordHash: null,
      emailVerified: false,
      passwordResetTokenHash: sha256(token),
      passwordResetExpiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      createdByUserId: actorId ?? null,
    });

    await MailService.sendFirstAccessEmail({ to: user.email, token });
    await AuditService.record({
      action: "user.register",
      actorId,
      targetId: user._id,
      subject: user.email,
      metadata: { role },
      req,
    });

    return safeUser(user);
  }

  // 4.2 — Login. Trata bloqueio, verificacao de e-mail e emite o par de tokens.
  static async login({ email, password, clientType = "web", ip, userAgent, req }) {
    const user = await UserRepository.findByEmail(email);

    // Sem usuario ou sem senha definida: compare dummy (timing) e resposta generica.
    if (!user || !user.passwordHash) {
      await bcrypt.compare(password, DUMMY_HASH);
      await AuditService.record({ action: "login.failed", subject: email, metadata: { reason: "unknown_user" }, req });
      throw new AppError("Credenciais invalidas", HttpStatusCodes.UNAUTHORIZED.code, "INVALID_CREDENTIALS");
    }

    if (user.isLocked()) {
      await AuditService.record({ action: "login.locked", targetId: user._id, subject: email, req });
      throw new AppError("Conta temporariamente bloqueada. Tente novamente mais tarde.", 423, "ACCOUNT_LOCKED");
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const update = { failedLoginAttempts: attempts };
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        update.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
        update.failedLoginAttempts = 0;
      }
      await UserRepository.updateById(user._id, { $set: update });
      await AuditService.record({ action: "login.failed", targetId: user._id, subject: email, metadata: { attempts }, req });
      throw new AppError("Credenciais invalidas", HttpStatusCodes.UNAUTHORIZED.code, "INVALID_CREDENTIALS");
    }

    if (!user.emailVerified) {
      throw new AppError(
        "E-mail nao confirmado. Verifique sua caixa de entrada.",
        HttpStatusCodes.FORBIDDEN.code,
        "EMAIL_NOT_VERIFIED"
      );
    }

    const tokens = await AuthService.issueTokenPair(user, { clientType, ip, userAgent, familyId: randomUUID() });

    await UserRepository.updateById(user._id, {
      $set: { lastLoginAt: new Date(), lastLoginIp: ip ?? null, failedLoginAttempts: 0, lockedUntil: null },
    });
    await AuditService.record({ action: "login.success", targetId: user._id, subject: email, metadata: { clientType }, req });

    return { user: safeUser(user), ...tokens };
  }

  // Emite access + refresh e persiste o refresh (hash) para rotacao.
  static async issueTokenPair(user, { clientType, ip, userAgent, familyId }) {
    const access = TokenService.signAccessToken(user);
    const refresh = TokenService.signRefreshToken(user, { familyId, clientType });
    await TokenService.persistRefreshToken({
      token: refresh.token,
      jti: refresh.jti,
      userId: user._id,
      familyId,
      expiresAt: refresh.expiresAt,
      clientType,
      ip,
      userAgent,
    });
    return {
      accessToken: access.token,
      refreshToken: refresh.token,
      refreshExpiresAt: refresh.expiresAt,
      clientType,
    };
  }

  // 4.3 — Rotacao de refresh token com deteccao de reuso (revoga a familia).
  static async refresh({ refreshToken, clientType = "web", ip, userAgent, req }) {
    if (!refreshToken) {
      throw new AppError("Refresh token ausente", HttpStatusCodes.UNAUTHORIZED.code, "NO_REFRESH_TOKEN");
    }
    const payload = TokenService.verify(refreshToken, "refresh");
    const stored = await RefreshTokenRepository.findByJti(payload.jti);

    if (!stored) {
      throw new AppError("Refresh token desconhecido", HttpStatusCodes.UNAUTHORIZED.code, "REFRESH_UNKNOWN");
    }

    // Reuso de token ja revogado/substituido => possivel roubo: revoga a familia inteira.
    if (stored.revokedAt || stored.replacedByJti) {
      await RefreshTokenRepository.revokeFamily(stored.familyId);
      await AuditService.record({
        action: "login.failed",
        targetId: stored.userId,
        metadata: { reason: "refresh_reuse_detected", familyId: stored.familyId },
        req,
      });
      throw new AppError("Refresh token reutilizado. Sessao revogada.", HttpStatusCodes.UNAUTHORIZED.code, "REFRESH_REUSE");
    }

    if (stored.tokenHash !== sha256(refreshToken)) {
      throw new AppError("Refresh token invalido", HttpStatusCodes.UNAUTHORIZED.code, "REFRESH_INVALID");
    }

    const user = await UserRepository.findById(stored.userId);
    if (!user) {
      throw new AppError("Usuario nao encontrado", HttpStatusCodes.UNAUTHORIZED.code, "USER_NOT_FOUND");
    }

    // Emite novo par na MESMA familia e marca o token atual como substituido.
    const tokens = await AuthService.issueTokenPair(user, {
      clientType: clientType || stored.clientType,
      ip,
      userAgent,
      familyId: stored.familyId,
    });
    const newPayload = TokenService.verify(tokens.refreshToken, "refresh");
    await RefreshTokenRepository.revokeByJti(stored.jti, newPayload.jti);

    return { user: safeUser(user), ...tokens };
  }

  // 4.8 — Logout: revoga o refresh atual e (se houver Redis) denylista o access atual.
  static async logout({ refreshToken, accessPayload, req }) {
    if (refreshToken) {
      try {
        const payload = TokenService.verify(refreshToken, "refresh");
        await RefreshTokenRepository.revokeByJti(payload.jti);
      } catch {
        /* token ja invalido/expirado — logout e idempotente */
      }
    }
    if (accessPayload?.jti && accessPayload?.exp) {
      const remainingMs = accessPayload.exp * 1000 - Date.now();
      if (remainingMs > 0) await TokenService.denylistAccessJti(accessPayload.jti, remainingMs);
    }
    await AuditService.record({ action: "logout", actorId: accessPayload?.sub ?? null, req });
    return { success: true };
  }

  // 4.4 — Confirmacao de e-mail.
  static async confirmEmail({ token }) {
    if (!token) throw new AppError("Token ausente", HttpStatusCodes.BAD_REQUEST.code, "NO_TOKEN");
    const user = await UserRepository.findByEmailVerificationTokenHash(sha256(token));
    if (!user || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt.getTime() < Date.now()) {
      throw new AppError("Token de confirmacao invalido ou expirado", HttpStatusCodes.BAD_REQUEST.code, "TOKEN_INVALID");
    }
    await UserRepository.updateById(user._id, {
      $set: { emailVerified: true },
      $unset: { emailVerificationTokenHash: 1, emailVerificationExpiresAt: 1 },
    });
    await AuditService.record({ action: "email.confirmed", targetId: user._id, subject: user.email });
    return { success: true, email: user.email };
  }

  // 4.5 — Reenvio de confirmacao. Resposta sempre generica (nao revela existencia).
  static async resendConfirmationEmail({ email, req }) {
    const user = await UserRepository.findByEmail(email);
    if (user && !user.emailVerified) {
      const token = generateRandomToken();
      await UserRepository.updateById(user._id, {
        $set: {
          emailVerificationTokenHash: sha256(token),
          emailVerificationExpiresAt: new Date(Date.now() + EMAIL_VERIFY_TTL_MS),
        },
      });
      await MailService.sendConfirmationEmail({ to: user.email, token });
      await AuditService.record({ action: "email.resend", targetId: user._id, subject: email, req });
    }
    return { success: true };
  }

  // 4.6 — Esqueci a senha. Resposta sempre generica.
  static async forgotPassword({ email, req }) {
    const user = await UserRepository.findByEmail(email);
    if (user) {
      const token = generateRandomToken();
      await UserRepository.updateById(user._id, {
        $set: {
          passwordResetTokenHash: sha256(token),
          passwordResetExpiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
        },
      });
      await MailService.sendPasswordResetEmail({ to: user.email, token });
      await AuditService.record({ action: "password.forgot", targetId: user._id, subject: email, req });
    }
    return { success: true };
  }

  // 4.7 — Reset de senha (tambem usado no primeiro acesso). Revoga todas as sessoes.
  static async resetPassword({ token, newPassword, req }) {
    AuthService.assertPasswordPolicy(newPassword);
    if (!token) throw new AppError("Token ausente", HttpStatusCodes.BAD_REQUEST.code, "NO_TOKEN");

    const user = await UserRepository.findByPasswordResetTokenHash(sha256(token));
    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() < Date.now()) {
      throw new AppError("Token de redefinicao invalido ou expirado", HttpStatusCodes.BAD_REQUEST.code, "TOKEN_INVALID");
    }

    const wasFirstAccess = !user.passwordHash;
    const passwordHash = await AuthService.hashPassword(newPassword);

    await UserRepository.updateById(user._id, {
      $set: {
        passwordHash,
        passwordChangedAt: new Date(),
        // Clicar no link prova controle do e-mail: confirma no primeiro acesso.
        emailVerified: wasFirstAccess ? true : user.emailVerified,
      },
      $unset: { passwordResetTokenHash: 1, passwordResetExpiresAt: 1 },
    });

    // Logout global: invalida refresh tokens de todos os dispositivos.
    await RefreshTokenRepository.revokeAllForUser(user._id);
    await MailService.sendPasswordChangedNotice({ to: user.email });
    await AuditService.record({ action: "password.reset", targetId: user._id, subject: user.email, metadata: { firstAccess: wasFirstAccess }, req });

    return { success: true };
  }
}

export default AuthService;

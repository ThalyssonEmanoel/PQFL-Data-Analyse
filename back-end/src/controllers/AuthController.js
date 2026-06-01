import AuthService from "../services/AuthService.js";
import TokenService from "../services/TokenService.js";
import HttpStatusCodes from "../utils/HttpStatusCodes.js";
import { isGoogleEnabled } from "../config/oauth.js";
import {
  registerSchema,
  loginSchema,
  confirmEmailQuerySchema,
  emailOnlySchema,
  resetPasswordSchema,
} from "../schemas/authSchemas.js";

const REFRESH_COOKIE = "refreshToken";

// web (default) usa cookie httpOnly; mobile recebe o refresh no corpo.
const clientTypeOf = (req) =>
  String(req.headers["x-client-type"] || "").toLowerCase() === "mobile" ? "mobile" : "web";

const refreshCookieOptions = (expires) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/auth",
  expires,
});

// Monta a resposta de login/refresh conforme o tipo de cliente.
const sendTokens = (req, res, status, { user, accessToken, refreshToken, refreshExpiresAt, clientType }) => {
  if (clientType === "mobile") {
    return res.status(status).json({ user, accessToken, refreshToken, refreshExpiresAt });
  }
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions(refreshExpiresAt));
  return res.status(status).json({ user, accessToken });
};

// Handlers HTTP de autenticacao.
class AuthController {
  // POST /auth/register — apenas admin (protegido por authenticate + authorize no router).
  static async register(req, res, next) {
    try {
      const body = registerSchema.parse(req.body);
      const user = await AuthService.register({ ...body, actorId: req.user.id, req });
      return res.status(HttpStatusCodes.CREATED.code).json(user);
    } catch (err) {
      next(err);
    }
  }

  // POST /auth/login
  static async login(req, res, next) {
    try {
      const body = loginSchema.parse(req.body);
      const clientType = clientTypeOf(req);
      const result = await AuthService.login({
        ...body,
        clientType,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        req,
      });
      return sendTokens(req, res, HttpStatusCodes.OK.code, result);
    } catch (err) {
      next(err);
    }
  }

  // POST /auth/refresh
  static async refresh(req, res, next) {
    try {
      const clientType = clientTypeOf(req);
      const refreshToken = req.body?.refreshToken || req.cookies?.[REFRESH_COOKIE];
      const result = await AuthService.refresh({
        refreshToken,
        clientType,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        req,
      });
      return sendTokens(req, res, HttpStatusCodes.OK.code, result);
    } catch (err) {
      next(err);
    }
  }

  // POST /auth/logout — funciona mesmo com accessToken expirado (revoga o refresh).
  static async logout(req, res, next) {
    try {
      const refreshToken = req.body?.refreshToken || req.cookies?.[REFRESH_COOKIE];
      let accessPayload = null;
      const bearer = (req.headers.authorization || "").split(" ")[1];
      if (bearer) {
        try {
          accessPayload = TokenService.verify(bearer, "access");
        } catch {
          /* ignora: logout idempotente */
        }
      }
      await AuthService.logout({ refreshToken, accessPayload, req });
      res.clearCookie(REFRESH_COOKIE, { path: "/auth" });
      return res.status(HttpStatusCodes.OK.code).json({ message: "Logout efetuado" });
    } catch (err) {
      next(err);
    }
  }

  // GET /auth/confirmEmail?token=... — redireciona para o front (sucesso/erro).
  static async confirmEmail(req, res) {
    const front = (process.env.FRONT_URL || "http://localhost:5173").replace(/\/$/, "");
    try {
      const { token } = confirmEmailQuerySchema.parse(req.query);
      await AuthService.confirmEmail({ token });
      return res.redirect(`${front}/email-confirmed?status=success`);
    } catch {
      return res.redirect(`${front}/email-confirmed?status=error`);
    }
  }

  // POST /auth/resendConfirmationEmail — resposta sempre generica.
  static async resendConfirmationEmail(req, res, next) {
    try {
      const { email } = emailOnlySchema.parse(req.body);
      await AuthService.resendConfirmationEmail({ email, req });
      return res
        .status(HttpStatusCodes.OK.code)
        .json({ message: "Se a conta existir e nao estiver confirmada, um e-mail foi enviado." });
    } catch (err) {
      next(err);
    }
  }

  // POST /auth/forgotPassword — resposta sempre generica.
  static async forgotPassword(req, res, next) {
    try {
      const { email } = emailOnlySchema.parse(req.body);
      await AuthService.forgotPassword({ email, req });
      return res
        .status(HttpStatusCodes.OK.code)
        .json({ message: "Se a conta existir, um e-mail com instrucoes foi enviado." });
    } catch (err) {
      next(err);
    }
  }

  // POST /auth/resetPassword
  static async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = resetPasswordSchema.parse(req.body);
      await AuthService.resetPassword({ token, newPassword, req });
      return res.status(HttpStatusCodes.OK.code).json({ message: "Senha redefinida com sucesso." });
    } catch (err) {
      next(err);
    }
  }

  // --- Google OAuth (RESERVADO — secao 5). Retorna 501 ate ser ativado. ---
  static googleRedirect(_req, res) {
    return res.status(501).json({
      message: "Login com Google ainda nao implementado",
      enabled: isGoogleEnabled(),
    });
  }

  static googleCallback(_req, res) {
    return res.status(501).json({
      message: "Callback do Google ainda nao implementado",
      enabled: isGoogleEnabled(),
    });
  }
}

export default AuthController;

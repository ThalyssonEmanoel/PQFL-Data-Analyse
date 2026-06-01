import { Router } from "express";
import AuthController from "../controllers/AuthController.js";
import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";
import {
  loginIpLimiter,
  loginEmailLimiter,
  refreshLimiter,
  emailPerMinuteLimiter,
  emailPerDayLimiter,
  registerLimiter,
} from "../middlewares/rateLimiter.js";

const router = Router();

// 4.1 — Cadastro restrito a admin (authenticate + authorize('admin') + cota por admin).
router.post("/auth/register", authenticate, authorize("admin"), registerLimiter, AuthController.register);

// 4.2 / 4.3 / 4.8 — login, refresh e logout.
router.post("/auth/login", loginIpLimiter, loginEmailLimiter, AuthController.login);
router.post("/auth/refresh", refreshLimiter, AuthController.refresh);
router.post("/auth/logout", AuthController.logout);

// 4.4 a 4.7 — ciclo de e-mail (confirmacao e reset).
router.get("/auth/confirmEmail", AuthController.confirmEmail);
router.post("/auth/resendConfirmationEmail", emailPerMinuteLimiter, emailPerDayLimiter, AuthController.resendConfirmationEmail);
router.post("/auth/forgotPassword", emailPerMinuteLimiter, emailPerDayLimiter, AuthController.forgotPassword);
router.post("/auth/resetPassword", AuthController.resetPassword);

// 5 — Google OAuth (RESERVADO; retorna 501 ate ativar).
router.get("/auth/google", AuthController.googleRedirect);
router.get("/auth/google/callback", AuthController.googleCallback);

export default router;

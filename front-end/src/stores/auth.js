import { defineStore } from "pinia";
import authService from "@/services/authService.js";
import {
  setAccessToken,
  registerRefreshHandler,
  registerAuthFailureHandler,
  extractApiError,
} from "@/services/http.js";

// Store de autenticacao.
//
// Estrategia de sessao:
//  - O accessToken (curta duracao) fica em memoria + localStorage para sobreviver
//    a um F5. O refreshToken NUNCA fica no JS: ele vive no cookie httpOnly (back-end).
//  - Ao iniciar a app, tentamos um /auth/refresh silencioso: se o cookie ainda for
//    valido, recuperamos a sessao mesmo sem accessToken valido em memoria.

const LS_TOKEN = "pqfl.accessToken";
const LS_USER = "pqfl.user";

function loadUser() {
  try {
    const raw = localStorage.getItem(LS_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: loadUser(),
    accessToken: localStorage.getItem(LS_TOKEN) || null,
    initializing: true,
    loading: false,
  }),

  getters: {
    isAuthenticated: (s) => Boolean(s.accessToken && s.user),
    isAdmin: (s) => s.user?.role === "admin",
    role: (s) => s.user?.role || null,
    userInitials: (s) => {
      const email = s.user?.email || "";
      return email.slice(0, 2).toUpperCase() || "PQ";
    },
  },

  actions: {
    // Persiste/limpa a sessao em memoria, localStorage e no cliente HTTP.
    setSession({ user, accessToken }) {
      this.user = user ?? this.user;
      this.accessToken = accessToken ?? null;
      setAccessToken(this.accessToken);
      if (this.accessToken) localStorage.setItem(LS_TOKEN, this.accessToken);
      else localStorage.removeItem(LS_TOKEN);
      if (this.user) localStorage.setItem(LS_USER, JSON.stringify(this.user));
    },

    clearSession() {
      this.user = null;
      this.accessToken = null;
      setAccessToken(null);
      localStorage.removeItem(LS_TOKEN);
      localStorage.removeItem(LS_USER);
    },

    async login({ email, password }) {
      this.loading = true;
      try {
        const data = await authService.login({ email, password });
        this.setSession({ user: data.user, accessToken: data.accessToken });
        return data.user;
      } catch (err) {
        throw extractApiError(err);
      } finally {
        this.loading = false;
      }
    },

    // Usado pelo interceptor do http.js. Retorna o novo accessToken (ou null).
    async refresh() {
      try {
        const data = await authService.refresh();
        this.setSession({ user: data.user, accessToken: data.accessToken });
        return data.accessToken;
      } catch {
        this.clearSession();
        return null;
      }
    },

    async logout() {
      try {
        await authService.logout();
      } catch {
        /* logout e idempotente — ignora erros de rede/token */
      } finally {
        this.clearSession();
      }
    },

    // Chamado uma vez no bootstrap da app (main.js).
    async initialize() {
      // Conecta os handlers de refresh/logout ao cliente HTTP.
      registerRefreshHandler(() => this.refresh());
      registerAuthFailureHandler(() => this.clearSession());

      setAccessToken(this.accessToken);

      // Tenta recuperar a sessao via cookie httpOnly (refresh silencioso).
      try {
        const data = await authService.refresh();
        this.setSession({ user: data.user, accessToken: data.accessToken });
      } catch {
        // Sem cookie valido: se havia token velho em memoria, descarta.
        if (this.accessToken && !this.user) this.clearSession();
      } finally {
        this.initializing = false;
      }
    },
  },
});

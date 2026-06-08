import axios from "axios";

// ============================================================
// Cliente HTTP central (axios) para a API do PQFL.
//
// - baseURL vem de VITE_API_BASE_URL (em dev = "/api", proxy do Vite).
// - withCredentials: true => envia/recebe o cookie httpOnly de refresh
//   (o back-end define o refreshToken como cookie no path /auth).
// - Interceptor de request anexa o accessToken (Bearer).
// - Interceptor de response tenta UM refresh automatico no 401 e refaz a
//   requisicao original. Em caso de falha, dispara o handler de logout.
//
// Para evitar dependencia circular com a store Pinia, o token e os handlers
// de refresh/logout sao registrados de fora (pela store de auth).
// ============================================================

const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

let accessToken = null;
export const setAccessToken = (token) => {
  accessToken = token || null;
};
export const getAccessToken = () => accessToken;

// Handlers injetados pela store de auth.
let refreshHandler = null; // async () => string|null  (novo accessToken)
let authFailureHandler = null; // () => void            (forca logout/redirect)
export const registerRefreshHandler = (fn) => {
  refreshHandler = fn;
};
export const registerAuthFailureHandler = (fn) => {
  authFailureHandler = fn;
};

const http = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// Request: anexa o Bearer token quando existir.
http.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Garante apenas um refresh em andamento, mesmo com varias requisicoes em 401.
let refreshing = null;

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    if (!response || !config) return Promise.reject(error);

    const isAuthRoute = (config.url || "").includes("/auth/");

    if (response.status === 401 && !config.__isRetry && !isAuthRoute && refreshHandler) {
      try {
        if (!refreshing) {
          refreshing = refreshHandler().finally(() => {
            refreshing = null;
          });
        }
        const newToken = await refreshing;
        if (newToken) {
          config.__isRetry = true;
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${newToken}`;
          return http(config);
        }
      } catch {
        /* falha no refresh — cai no fluxo de logout abaixo */
      }
      if (authFailureHandler) authFailureHandler();
    }

    return Promise.reject(error);
  }
);

// Extrai uma mensagem amigavel do payload de erro do back-end
// ({ message, code, details, requestId }).
export function extractApiError(error) {
  const data = error?.response?.data;
  if (data?.message) {
    return { message: data.message, code: data.code, details: data.details, status: error.response.status };
  }
  if (error?.code === "ECONNABORTED") {
    return { message: "Tempo de resposta esgotado. Tente novamente.", code: "TIMEOUT" };
  }
  if (error?.message === "Network Error") {
    return { message: "Não foi possível conectar à API. Verifique se o back-end está no ar.", code: "NETWORK" };
  }
  return { message: error?.message || "Erro inesperado.", code: "UNKNOWN" };
}

export default http;

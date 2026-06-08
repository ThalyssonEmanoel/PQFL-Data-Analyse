import http from "./http.js";

// Camada de acesso aos endpoints de autenticacao do back-end (rotas /auth/*).
// O back-end devolve, no login/refresh:
//   web    => { user, accessToken }            (refresh vai no cookie httpOnly)
//   mobile => { user, accessToken, refreshToken, refreshExpiresAt }
// Aqui usamos sempre o fluxo "web" (cookie), por ser um dashboard de navegador.

const authService = {
  // POST /auth/login
  async login({ email, password }) {
    const { data } = await http.post("/auth/login", { email, password });
    return data; // { user, accessToken }
  },

  // POST /auth/refresh — usa o cookie httpOnly (withCredentials).
  async refresh() {
    const { data } = await http.post("/auth/refresh", {});
    return data; // { user, accessToken }
  },

  // POST /auth/logout — revoga o refresh atual e limpa o cookie.
  async logout() {
    const { data } = await http.post("/auth/logout", {});
    return data;
  },

  // POST /auth/register — restrito a admin (Authorization obrigatorio).
  async register({ email, role }) {
    const { data } = await http.post("/auth/register", { email, role });
    return data; // safeUser
  },

  // POST /auth/forgotPassword
  async forgotPassword({ email }) {
    const { data } = await http.post("/auth/forgotPassword", { email });
    return data;
  },

  // POST /auth/resetPassword — usado tambem no primeiro acesso.
  async resetPassword({ token, newPassword }) {
    const { data } = await http.post("/auth/resetPassword", { token, newPassword });
    return data;
  },

  // POST /auth/resendConfirmationEmail
  async resendConfirmationEmail({ email }) {
    const { data } = await http.post("/auth/resendConfirmationEmail", { email });
    return data;
  },
};

export default authService;

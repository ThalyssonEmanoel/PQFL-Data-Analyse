const tag = "Auth";

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const jsonBody = (schemaName, required = true) => ({
  required,
  content: { "application/json": { schema: ref(schemaName) } },
});
const jsonResponse = (description, schemaName) => ({
  description,
  content: { "application/json": { schema: ref(schemaName) } },
});
const errorResponse = (description) => ({
  description,
  content: { "application/json": { schema: ref("ErrorResponse") } },
});

// Header opcional para diferenciar entrega de tokens (web=cookie, mobile=corpo).
const clientTypeHeader = {
  name: "X-Client-Type",
  in: "header",
  required: false,
  description: "web (default) entrega o refreshToken em cookie httpOnly; mobile entrega no corpo.",
  schema: { type: "string", enum: ["web", "mobile"], default: "web" },
};

const AuthPath = {
  "/auth/register": {
    post: {
      tags: [tag],
      summary: "Cadastrar usuario (apenas admin)",
      description:
        "Cria um usuario sem senha e envia um e-mail de **primeiro acesso** (mecanismo de reset reutilizado). " +
        "O proprio usuario define a senha pelo link. Nunca retorna senha nem token. " +
        "Rate limit: 20 cadastros/hora por admin.",
      security: [{ bearerAuth: [] }],
      requestBody: jsonBody("RegisterRequest"),
      responses: {
        201: jsonResponse("Usuario criado.", "AuthUser"),
        400: errorResponse("Body invalido."),
        401: errorResponse("Nao autenticado."),
        403: errorResponse("Sem permissao (nao e admin)."),
        409: errorResponse("E-mail ja cadastrado."),
        429: errorResponse("Cota de cadastros excedida."),
      },
    },
  },
  "/auth/login": {
    post: {
      tags: [tag],
      summary: "Login (publico)",
      description:
        "Valida credenciais e emite accessToken (15 min) + refreshToken. " +
        "Bloqueia a conta por 15 min apos 5 falhas. Exige e-mail confirmado. " +
        "Rate limit: 5/IP em 15 min e 10/e-mail em 1h.",
      security: [],
      parameters: [clientTypeHeader],
      requestBody: jsonBody("LoginRequest"),
      responses: {
        200: {
          description: "Autenticado. Web retorna apenas accessToken (refresh em cookie); mobile retorna ambos.",
          content: {
            "application/json": {
              schema: { oneOf: [ref("LoginResponseWeb"), ref("LoginResponseMobile")] },
            },
          },
          headers: {
            "Set-Cookie": {
              description: "refreshToken (httpOnly, Secure, SameSite=Strict) — apenas web.",
              schema: { type: "string" },
            },
          },
        },
        400: errorResponse("Body invalido."),
        401: errorResponse("Credenciais invalidas."),
        403: errorResponse("E-mail nao confirmado."),
        423: errorResponse("Conta temporariamente bloqueada."),
        429: errorResponse("Tentativas excessivas."),
      },
    },
  },
  "/auth/refresh": {
    post: {
      tags: [tag],
      summary: "Renovar tokens (rotacao)",
      description:
        "Emite um novo par de tokens e invalida o refresh anterior (rotacao). " +
        "Se um refresh ja utilizado for reapresentado, **toda a familia e revogada** (roubo detectado). " +
        "Web envia o refresh via cookie; mobile via corpo.",
      security: [],
      parameters: [clientTypeHeader],
      requestBody: jsonBody("RefreshRequest", false),
      responses: {
        200: {
          description: "Novo par de tokens.",
          content: {
            "application/json": {
              schema: { oneOf: [ref("LoginResponseWeb"), ref("LoginResponseMobile")] },
            },
          },
        },
        401: errorResponse("Refresh ausente, desconhecido, reutilizado ou expirado."),
        429: errorResponse("Requisicoes excessivas."),
      },
    },
  },
  "/auth/logout": {
    post: {
      tags: [tag],
      summary: "Logout (revoga refresh atual)",
      description:
        "Revoga o refreshToken atual no servidor e limpa o cookie. " +
        "Se um accessToken valido for enviado e houver Redis, ele entra na denylist (revogacao imediata). " +
        "Idempotente: funciona mesmo com accessToken expirado.",
      security: [],
      parameters: [clientTypeHeader],
      requestBody: jsonBody("RefreshRequest", false),
      responses: {
        200: jsonResponse("Logout efetuado.", "MessageResponse"),
      },
    },
  },
  "/auth/confirmEmail": {
    get: {
      tags: [tag],
      summary: "Confirmar e-mail (link do e-mail)",
      description:
        "Endpoint clicado a partir do e-mail. Marca o e-mail como verificado e redireciona para " +
        "`FRONT_URL/email-confirmed?status=success|error`.",
      security: [],
      parameters: [
        {
          name: "token",
          in: "query",
          required: true,
          schema: { type: "string" },
          description: "Token de confirmacao recebido por e-mail (texto puro).",
        },
      ],
      responses: {
        302: { description: "Redireciona para o front-end (sucesso ou erro)." },
      },
    },
  },
  "/auth/resendConfirmationEmail": {
    post: {
      tags: [tag],
      summary: "Reenviar e-mail de confirmacao",
      description:
        "Sempre responde 200 (nao revela se a conta existe). Reenvia o link apenas se a conta existir e nao estiver confirmada. " +
        "Rate limit: 1/min e 5/dia por e-mail.",
      security: [],
      requestBody: jsonBody("EmailRequest"),
      responses: {
        200: jsonResponse("Resposta generica.", "MessageResponse"),
        400: errorResponse("Body invalido."),
        429: errorResponse("Requisicoes excessivas."),
      },
    },
  },
  "/auth/forgotPassword": {
    post: {
      tags: [tag],
      summary: "Solicitar redefinicao de senha",
      description:
        "Sempre responde 200 (mensagem generica). Se a conta existir, envia um link valido por 30 min. " +
        "Rate limit: 1/min e 5/dia por e-mail.",
      security: [],
      requestBody: jsonBody("EmailRequest"),
      responses: {
        200: jsonResponse("Resposta generica.", "MessageResponse"),
        400: errorResponse("Body invalido."),
        429: errorResponse("Requisicoes excessivas."),
      },
    },
  },
  "/auth/resetPassword": {
    post: {
      tags: [tag],
      summary: "Redefinir senha (com token)",
      description:
        "Define a nova senha a partir do token (tambem usado no primeiro acesso). " +
        "Revoga todos os refresh tokens do usuario (logout global) e envia aviso por e-mail. " +
        "Politica: minimo 10 caracteres, bloqueio de senhas comuns.",
      security: [],
      requestBody: jsonBody("ResetPasswordRequest"),
      responses: {
        200: jsonResponse("Senha redefinida.", "MessageResponse"),
        400: errorResponse("Token invalido/expirado ou senha fraca."),
      },
    },
  },
  "/auth/google": {
    get: {
      tags: [tag],
      summary: "Login com Google (RESERVADO)",
      description: "Reservado para o futuro (OAuth 2.0 + PKCE). Retorna 501 ate ser ativado.",
      security: [],
      responses: { 501: jsonResponse("Nao implementado.", "MessageResponse") },
    },
  },
  "/auth/google/callback": {
    get: {
      tags: [tag],
      summary: "Callback do Google (RESERVADO)",
      description: "Reservado para o futuro. Retorna 501 ate ser ativado.",
      security: [],
      responses: { 501: jsonResponse("Nao implementado.", "MessageResponse") },
    },
  },
};

export default AuthPath;

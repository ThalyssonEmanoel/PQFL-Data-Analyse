// Componentes (schemas) de autenticacao para o Swagger.
const AuthSchema = {
  AuthUser: {
    type: "object",
    properties: {
      id: { type: "string", example: "6655f0a1c2d3e4f5a6b7c8d9" },
      email: { type: "string", format: "email", example: "thalysson@gmail.com" },
      role: { type: "string", enum: ["admin", "member"], example: "admin" },
      emailVerified: { type: "boolean", example: true },
    },
  },
  RegisterRequest: {
    type: "object",
    required: ["email", "role"],
    properties: {
      email: { type: "string", format: "email", example: "novo.membro@pqfl.local" },
      role: { type: "string", enum: ["admin", "member"], example: "member" },
    },
  },
  LoginRequest: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email", example: "thalysson@gmail.com" },
      password: { type: "string", format: "password", example: "Senha@123" },
    },
  },
  // Web: accessToken no corpo, refreshToken em cookie httpOnly.
  LoginResponseWeb: {
    type: "object",
    properties: {
      user: { $ref: "#/components/schemas/AuthUser" },
      accessToken: { type: "string", example: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." },
    },
  },
  // Mobile: ambos no corpo (X-Client-Type: mobile).
  LoginResponseMobile: {
    type: "object",
    properties: {
      user: { $ref: "#/components/schemas/AuthUser" },
      accessToken: { type: "string", example: "eyJhbGciOiJSUzI1NiI..." },
      refreshToken: { type: "string", example: "eyJhbGciOiJSUzI1NiI..." },
      refreshExpiresAt: { type: "string", format: "date-time" },
    },
  },
  RefreshRequest: {
    type: "object",
    description: "Apenas para mobile. No web o refreshToken vem do cookie httpOnly.",
    properties: {
      refreshToken: { type: "string", example: "eyJhbGciOiJSUzI1NiI..." },
    },
  },
  EmailRequest: {
    type: "object",
    required: ["email"],
    properties: {
      email: { type: "string", format: "email", example: "membro@pqfl.local" },
    },
  },
  ResetPasswordRequest: {
    type: "object",
    required: ["token", "newPassword"],
    properties: {
      token: { type: "string", description: "Token recebido por e-mail (texto puro).", example: "a1b2c3d4..." },
      newPassword: { type: "string", format: "password", minLength: 10, example: "minhaSenhaForte123" },
    },
  },
  MessageResponse: {
    type: "object",
    properties: { message: { type: "string", example: "Operacao concluida." } },
  },
  ErrorResponse: {
    type: "object",
    properties: {
      message: { type: "string", example: "Credenciais invalidas" },
      code: { type: "string", example: "INVALID_CREDENTIALS", nullable: true },
      details: { type: "object", nullable: true },
      requestId: { type: "string", example: "0f9c2b1a-..." },
    },
  },
};

export default AuthSchema;

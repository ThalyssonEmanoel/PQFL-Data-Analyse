// Configuracao de OAuth do Google. RESERVADO para o futuro (secao 5 do roteiro).
// As rotas /auth/google* existem mas retornam 501 enquanto isGoogleEnabled() for false.
export const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  redirectUri: process.env.GOOGLE_REDIRECT_URI || "",
  scope: ["openid", "email", "profile"],
  authEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
};

// So consideramos o login Google "ativo" quando as credenciais estao presentes.
export const isGoogleEnabled = () =>
  Boolean(googleConfig.clientId && googleConfig.clientSecret && googleConfig.redirectUri);

export default googleConfig;

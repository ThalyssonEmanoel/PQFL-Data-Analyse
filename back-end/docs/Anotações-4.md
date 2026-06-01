# Roteiro de Boas Práticas — Autenticação, Permissões, Escalonamento e Deploy

> Documento de planejamento. Nada aqui foi implementado ainda — este é o guia que deve ser seguido na construção das camadas de autenticação, autorização, escalonamento e deploy do back-end PQFL.
>
> Stack atual detectada: Node.js + Express 5, MongoDB (Mongoose), Zod para validação, Swagger para documentação. As recomendações abaixo respeitam esse stack.

---

## Sumário

1. [Análise do estado atual](#1-análise-do-estado-atual)
2. [Modelo de permissões: Fornecedor x Administrador](#2-modelo-de-permissões-fornecedor-x-administrador)
3. [Estratégia de tokens: AccessToken + RefreshToken](#3-estratégia-de-tokens-accesstoken--refreshtoken)
4. [Rotas de autenticação — análise detalhada](#4-rotas-de-autenticação--análise-detalhada)
5. [Autenticação social — Google (preparação para o futuro)](#5-autenticação-social--google-preparação-para-o-futuro)
6. [Estrutura de pastas sugerida](#6-estrutura-de-pastas-sugerida)
7. [Boas práticas de segurança](#7-boas-práticas-de-segurança)
8. [Escalonamento (horizontal e vertical)](#8-escalonamento-horizontal-e-vertical)
9. [Configurações de deploy](#9-configurações-de-deploy)
10. [Observabilidade, logs e auditoria](#10-observabilidade-logs-e-auditoria)
11. [Considerações específicas para o cliente Mobile (futuro)](#11-considerações-específicas-para-o-cliente-mobile-futuro)
12. [Checklist de implementação](#12-checklist-de-implementação)

---

## 1. Análise do estado atual

Pontos observados no código atual que impactam o roteiro:

- **`src/app.js`**: usa `cors()` sem restrições — em produção isso precisa ser restrito a domínios conhecidos.
- **`src/routes/index.js`**: as rotas são montadas sem middleware de autenticação. Há um `// import AuthMiddleware` comentado em `SuppliersRoute.js` indicando que já existe a intenção de proteger essas rotas.
- **`src/config/database.js`**: já distingue `production` x `development` via `NODE_ENV` — bom alicerce; precisará receber também os segredos JWT, configurações de e-mail e OAuth.
- **`server.js`**: não há tratamento de `SIGTERM`/`SIGINT` (graceful shutdown), nem `trust proxy`, nem `helmet`. Itens importantes para deploy atrás de load balancer.
- **Não há modelo `User`** — precisa ser criado antes de qualquer rota de autenticação.
- **Não há controle de rate-limiting** — fundamental nas rotas `/login`, `/forgotPassword` e `/resendConfirmationEmail`.

---

## 2. Modelo de permissões: Fornecedor x Administrador

### 2.1 Definição dos papéis (roles)

| Role            | Descrição                                                                                          | Pode criar usuários? | Pode puxar dados do coletum? |
| --------------- | -------------------------------------------------------------------------------------------------- | -------------------- | -------------------------------------- |
| `admin`         | Gestor do sistema (PQFL/cooperativa). Acesso total, incluindo sincronização e gestão de usuários.  | Sim                  | Sim                                    |
| `member`      | Membro que possui os fornecedores de leite.**Apenas** vê os dados e tem acesso as rotas que conectam com o banco em si, ele não tem acesso as rotas que puxam os dados do coletum.                | Não                  | Não de forma manual, apenas com CRON-JOB  |

> Recomendação: armazenar `role` como `enum` no schema do usuário e **nunca** como flag booleana (`isAdmin`). Enum permite incluir futuras roles (ex.: `auditor`, `tecnico_campo`) sem migração de schema.

### 2.2 Modelo `User` sugerido (Mongoose)

Campos mínimos:

- `email` (único, indexado, validado)
- `passwordHash` (bcrypt/argon2 — nunca salvar texto puro)
- `role` (`enum: ['admin', 'member']`, default `'member'`)
- `emailVerified` (boolean, default `false`)
- `emailVerificationTokenHash` + `emailVerificationExpiresAt`
- `passwordResetTokenHash` + `passwordResetExpiresAt`
- `refreshTokenFamily` (ver seção 3.4 — rotação)
- `failedLoginAttempts`, `lockedUntil` (para mitigar brute-force)
- `createdByUserId` (auditoria: quem cadastrou o usuário — sempre um admin)
- `lastLoginAt`, `lastLoginIp`
- `googleId` (nullable, único e esparso — para futura integração)
- Primeiro admin: thalysson@gmail.com colocar no env essa variável para ser usada no seed.js, o seed será apenas para criação de um usuário admin e 3 members, o seed.js não criará suppliers ou qualquer outra coisa. A senha do admin também deverá estar no .env senha `Senha@123`.

> **Importante**: o token de confirmação de e-mail e o de reset de senha devem ser armazenados **sempre como hash** (SHA-256 já basta, não precisa bcrypt). O valor em texto vai por e-mail. Isso impede que um vazamento do banco gere tokens válidos.

### 2.3 Middleware de autorização

Implementar dois middlewares separados:

1. **`authenticate`** — valida o `accessToken` no header `Authorization: Bearer ...`, popula `req.user` (`{ id, role, emailVerified }`).
2. **`authorize(...roles)`** — checa se `req.user.role` está nos roles permitidos para a rota.

Exemplos de aplicação:

- `POST /register` → `authenticate` + `authorize('admin')`
- `POST /members/pull-all` → `authenticate` + `authorize('admin')`
- `GET /members-calculated/:id` → `authenticate` + verificação fina: admin vê qualquer; member só vê o próprio `memberId`.

> **Regra de ouro**: a checagem por **propriedade do recurso** member só pode acessar as rotas que se comuniquem com o banco e não com o coletum.

### 2.4 Cadastro restrito a administradores

A rota `POST /register` **não é pública**. O fluxo correto:

1. Admin autenticado chama `POST /register` informando `email`, `role`.
2. Sistema gera senha temporária aleatória **OU** gera um token de "primeiro acesso" e envia por e-mail.
3. O novo usuário define a senha pela primeira vez via fluxo de "reset de senha" reutilizado, e só então o cadastro fica ativo.

Essa abordagem evita enviar senhas em texto claro por e-mail.

---

## 3. Estratégia de tokens: AccessToken + RefreshToken

### 3.1 Por que dois tokens

- **AccessToken**: curto (5–15 min), enviado em **todas** as requisições autenticadas. Se vazar, expira rápido.
- **RefreshToken**: longo (7–30 dias), enviado **apenas** para o endpoint `/refresh`. Permite manter o usuário logado sem precisar refazer login.

Essa separação é essencial para o app mobile, onde o usuário espera continuar logado por semanas.

### 3.2 Tempos recomendados

| Token         | Web (cookies)       | Mobile (storage seguro) |
| ------------- | ------------------- | ----------------------- |
| AccessToken   | 15 minutos          | 15 minutos              |
| RefreshToken  | 7 dias              | 30 dias                 |

Os tempos devem vir de variáveis de ambiente (`ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL`) para ajuste sem deploy.

### 3.3 Como armazenar no cliente

- **Web (front-end React/Vue)**:
  - AccessToken: em memória (variável de estado). **Nunca** em `localStorage` — vulnerável a XSS.
  - RefreshToken: em **cookie `httpOnly`, `Secure`, `SameSite=Strict`** (ou `Lax` se houver fluxo cross-site).
- **Mobile (futuro)**:
  - AccessToken: memória.
  - RefreshToken: **Keychain** (iOS) / **EncryptedSharedPreferences** ou **Keystore** (Android). Nunca em `AsyncStorage` puro.

### 3.4 Rotação e revogação de refresh tokens (refresh token rotation)

Padrão moderno (recomendado fortemente):

1. A cada `/refresh`, o servidor **emite um novo refreshToken** e **invalida o anterior**.
2. Cada refreshToken pertence a uma **família** (`refreshTokenFamily`) — quando um token antigo já usado é apresentado novamente, **toda a família é revogada** (sinal de roubo/replay).
3. Persistir uma tabela/coleção `RefreshTokens` com: `userId`, `familyId`, `tokenHash`, `expiresAt`, `revokedAt`, `replacedBy`, `userAgent`, `ip`.
4. No logout, invalidar o refreshToken atual no servidor (server-side logout real).

> **Importante**: o accessToken é **stateless** (não revogável até expirar). Mantenha o TTL curto para minimizar o impacto disso. Para revogação imediata, use uma lista negra com Redis (ver seção 8.3).

### 3.5 Conteúdo do payload JWT

Mantenha o payload **mínimo**:

```
{
  "sub": "<userId>",
  "role": "admin | supplier",
  "emailVerified": true,
  "type": "access" | "refresh",
  "iat": ...,
  "exp": ...,
  "jti": "<uuid>"   // identificador único para revogação
}
```

Use algoritmo **`RS256`** (par de chaves RSA) em vez de `HS256`. Vantagens:

- A chave privada fica **só no serviço de auth**.
- Serviços que apenas **validam** o token recebem a chave pública — útil quando o sistema crescer para microsserviços ou quando o mobile precisar fazer prefetch.

---

## 4. Rotas de autenticação — análise detalhada

Convenção: todas sob o prefixo `/auth` para isolar o módulo (ex.: `/auth/login`).

### 4.1 `POST /auth/register` — *Apenas administradores*

- **Auth**: `authenticate` + `authorize('admin')`.
- **Body** (validar com Zod):
  - `email` (string, formato email)
  - `role` (`'admin' | 'member'`)

- **Fluxo**:
  1. Verifica se `email` já existe → 409.
  2. Cria usuário com `emailVerified: false` e sem senha definida.
  3. Gera token de "primeiro acesso" (mesmo mecanismo de reset de senha) e envia por e-mail.
  4. Registra em log de auditoria: `adminId X criou userId Y`.
- **Resposta**: 201 com `{ id, email, role }` — **nunca** retornar senha ou token.
- **Rate limit**: 20 cadastros / hora por admin (proteção contra automações maliciosas se uma conta admin for comprometida).

### 4.2 `POST /auth/login`

- **Auth**: pública.
- **Body**: `email`, `password`.
- **Fluxo**:
  1. Buscar usuário por e-mail (sem revelar se existe — sempre responder de forma genérica em caso de falha).
  2. Verificar `lockedUntil` — se bloqueado, 423 Locked.
  3. Comparar senha com `bcrypt.compare` (custo ≥ 12) ou `argon2`.
  4. Se senha errada: incrementar `failedLoginAttempts`. Após 5 falhas → bloquear por 15 min.
  5. Se `emailVerified === false` → 403 com instrução para confirmar.
  6. Emitir `accessToken` + `refreshToken`. Persistir o refresh hashed na coleção `RefreshTokens`.
  7. Atualizar `lastLoginAt`, `lastLoginIp`, zerar `failedLoginAttempts`.
- **Resposta**:
  - Web: `accessToken` no body, `refreshToken` em cookie `httpOnly`.
  - Mobile: ambos no body (cliente armazena de forma segura).
  - Diferenciar por header `X-Client-Type: web | mobile`, ou ter rotas separadas (`/login` x `/login/mobile`).
- **Rate limit**: 5 tentativas por IP em 15 min, 10 tentativas por e-mail em 1h.

### 4.3 `POST /auth/refresh`

- **Auth**: pública (o próprio refreshToken é a credencial).
- **Fluxo**:
  1. Receber `refreshToken` (cookie no web; body no mobile).
  2. Validar assinatura JWT, `type === "refresh"`, não expirado.
  3. Buscar registro na coleção `RefreshTokens` pelo `jti`/hash.
  4. Se token já foi `revoked` ou `replacedBy` está preenchido → **revogar a família inteira** (roubo detectado) e retornar 401.
  5. Marcar o refresh atual como `revoked` com `replacedBy = novoJti`.
  6. Emitir **novo accessToken + novo refreshToken** (mesma família).
- **Rate limit**: 60 req/min por usuário (refresh legítimo é frequente, mas não absurdo).

### 4.4 `GET /auth/confirmEmail`

- **Auth**: pública.
- **Query**: `token`.
- **Fluxo**:
  1. Hash do token recebido → buscar usuário por `emailVerificationTokenHash`.
  2. Verificar `emailVerificationExpiresAt`.
  3. Marcar `emailVerified = true`, limpar campos de token.
  4. Redirecionar para `FRONT_URL/email-confirmed` (ou retornar JSON, dependendo do canal).
- **Por que GET**: o link no e-mail é clicado, e o cliente é o browser. Mas o endpoint **não deve mutar nada sensível além do flag de verificação** — para limitar risco de CSRF/link prefetch, considere transformar em GET que abre uma página front-end, e a página chama um `POST /confirmEmail` para efetivar.

### 4.5 `POST /auth/resendConfirmationEmail`

- **Auth**: pública (mas idealmente exige email + senha para evitar abuso anônimo).
- **Body**: `email`.
- **Fluxo**:
  1. Sempre responder 200 (não revelar existência da conta).
  2. Se usuário existe e `emailVerified === false`, gerar novo token e enviar e-mail.
- **Rate limit**: **1 reenvio a cada 60 segundos por e-mail**, máximo 5 por dia.

### 4.6 `POST /auth/forgotPassword`

- **Auth**: pública.
- **Body**: `email`.
- **Fluxo**:
  1. Sempre responder 200 com mensagem genérica.
  2. Se usuário existe, gerar token (32 bytes random), salvar **hash** + `passwordResetExpiresAt = now + 30min`, enviar link.
- **Rate limit**: igual ao resend (1/min, 5/dia por e-mail).

### 4.7 `POST /auth/resetPassword`

- **Auth**: pública (o token é a credencial).
- **Body**: `token`, `newPassword`.
- **Fluxo**:
  1. Validar política de senha (mínimo 10 caracteres, recomendação seguir NIST: complexidade não obriga, mas usar blocklist de senhas comuns).
  2. Hash do token recebido → buscar usuário.
  3. Verificar `passwordResetExpiresAt`.
  4. Atualizar `passwordHash`, limpar token, **revogar todos os refreshTokens** do usuário (logout em todos os dispositivos).
  5. Notificar por e-mail: "Sua senha foi alterada. Não foi você? Clique aqui."

### 4.8 `POST /auth/logout` (sugerido — não estava na lista, mas é necessário)

- Invalida o refreshToken atual no servidor.
- Limpa o cookie (web).
- Adiciona o `jti` do accessToken corrente a uma denylist Redis com TTL = tempo restante (opcional, se quiser revogação imediata).

---

## 5. Autenticação social — Google (preparação para o futuro)

### 5.1 Estratégia recomendada

Use **OAuth 2.0 Authorization Code Flow + PKCE** — funciona igualmente bem para web e mobile.

### 5.2 Endpoints

- **`GET /auth/google`** — redireciona para `accounts.google.com/o/oauth2/v2/auth` com `client_id`, `redirect_uri`, `scope=openid email profile`, `state` (CSRF), `code_challenge` (PKCE).
- **`GET /auth/google/callback`** — recebe `code`, troca por `id_token` + `access_token` Google, valida o `id_token`, faz o **link** ou **cria** o usuário local:
  - Se `googleId` já existe → login.
  - Se `email` existe mas sem `googleId` → vincular (após confirmação adicional, para não permitir takeover por e-mail).
  - Se nada existe → **rejeitar**: o cadastro continua sendo apenas via admin (regra de negócio do PQFL). O Google serve para login, **não** para auto-registro.

### 5.3 Considerações para mobile

- App mobile **não** deve incorporar `client_secret`. Use PKCE com `client_id` público.
- Fluxo típico no mobile: app abre o Google in-app browser (Chrome Custom Tabs/ASWebAuthenticationSession), recebe o `code`, manda para o back-end, back-end faz a troca e retorna `accessToken` + `refreshToken` próprios da aplicação.

### 5.4 Preparação agora (sem implementar)

- Adicionar campo `googleId` (nullable, único e esparso) ao schema do `User`.
- Adicionar variáveis de ambiente `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (opcionais, só usadas quando ativar).
- Reservar as rotas no router (`/auth/google`, `/auth/google/callback`) com handler que retorna 501 Not Implemented por enquanto.

---

## 6. Estrutura de pastas sugerida

Mantendo o padrão atual (controllers/services/repositories/schemas), adicionar:

```
src/
├── config/
│   ├── database.js
│   ├── coletum.js
│   ├── jwt.js              ← novo (chaves, TTLs)
│   ├── mailer.js           ← novo (transporter SMTP/SES)
│   └── oauth.js            ← novo (Google config)
├── middlewares/
│   ├── authenticate.js     ← novo
│   ├── authorize.js        ← novo
│   ├── rateLimiter.js      ← novo
│   ├── errorHandler.js     ← novo (centralizar)
│   └── requestId.js        ← novo (correlation id)
├── models/
│   ├── User.js             ← novo
│   ├── RefreshToken.js     ← novo
│   ├── AuditLog.js         ← novo (opcional, recomendado)
│   ├── Supplier.js
│   └── ...
├── controllers/AuthController.js   ← novo
├── services/AuthService.js         ← novo
├── services/TokenService.js        ← novo
├── services/MailService.js         ← novo
├── repositories/UserRepository.js  ← novo
├── repositories/RefreshTokenRepository.js  ← novo
├── routes/AuthRoute.js             ← novo
└── schemas/authSchemas.js          ← novo (Zod)
```

---

## 7. Boas práticas de segurança

### 7.1 Pacotes a adicionar

- **`bcrypt`** (ou `argon2` — mais moderno) — hash de senha.
- **`jsonwebtoken`** — emitir/validar JWTs.
- **`helmet`** — headers HTTP de segurança.
- **`express-rate-limit`** + **`rate-limit-redis`** — rate limiting com store Redis (essencial em ambiente multi-instância).
- **`cookie-parser`** — para refreshToken em cookie httpOnly.
- **`express-validator`** ou continuar com **Zod** (já presente) — validação.
- **`nodemailer`** (com provider SES/Mailgun/SendGrid em produção).
- **`pino`** ou **`winston`** — logger estruturado.

### 7.2 Headers e CORS

- `helmet()` com config padrão.
- CORS restrito a `process.env.FRONT_URL` (lista de domínios separados por vírgula).
- `app.set('trust proxy', 1)` quando atrás de NGINX/ELB — sem isso, o `req.ip` fica errado e o rate-limit por IP não funciona.

### 7.3 Validação

- Toda entrada **sempre** validada com Zod **antes** de chegar ao service.
- Nunca confiar em `req.body` direto no Mongoose (`new Model(req.body)` é um anti-padrão — permite mass assignment).

### 7.4 Senhas

- Hash com bcrypt cost ≥ 12 (ou argon2id com parâmetros padrão).
- Mínimo 10 caracteres, sem exigências artificiais de complexidade (NIST SP 800-63B).
- Bloquear senhas vazadas conhecidas (lista local ou API de Have I Been Pwned via k-anonymity).

### 7.5 Segredos

- **Jamais** commitar `.env`. Garantir `.env` no `.gitignore`.
- Em produção, usar gerenciador de segredos do provedor (AWS Secrets Manager, GCP Secret Manager, HCP Vault, ou variáveis injetadas pelo orquestrador).
- Chaves JWT (RS256): par de chaves armazenado em segredo, rotação a cada 90 dias com período de sobreposição (chave antiga continua válida para tokens emitidos antes da rotação).

### 7.6 HTTPS

- TLS obrigatório em produção. O Express **não termina TLS** — use NGINX, Caddy, Cloudflare ou o LB da núvem.
- `Strict-Transport-Security` via Helmet.
- Cookies sempre com `Secure: true`.

---

## 8. Escalonamento (horizontal e vertical)

### 8.1 Tornar a aplicação stateless

- **Nenhum estado em memória** (sessões, contadores de rate limit, cache de tokens). Tudo no Redis ou DB.
- `app.listen` continua simples, mas o processo deve poder ser morto e recriado a qualquer momento.

### 8.2 Graceful shutdown

Em `server.js`, adicionar handlers de `SIGTERM` e `SIGINT`:

1. Parar de aceitar novas conexões (`server.close()`).
2. Fechar conexão Mongoose (`mongoose.connection.close()`).
3. Aguardar requisições em curso com timeout máximo (ex.: 25s) e então `process.exit(0)`.

Sem isso, deploys derrubam requisições em andamento.

### 8.3 Redis como camada de suporte

Necessário para:

- **Rate limiting** distribuído (com `rate-limit-redis`).
- **Denylist de JWTs** revogados (chave: `jti`, TTL = tempo restante).
- **Cache de respostas pesadas** (ex.: agregações de dashboard) — bom complemento aos calculados já persistidos.
- **Filas** (BullMQ) para sincronizações pesadas e envios de e-mail (ver 8.5).

### 8.4 Mongo em produção

- Usar **réplica set** com `readPreference: secondaryPreferred` para queries de relatório.
- Conexão com `maxPoolSize` ajustado (default 100 pode ser muito ou pouco — medir).
- Índices revisados: além dos já presentes em `Supplier`, vai precisar de índices em `User.email` (único), `RefreshToken.tokenHash`, `RefreshToken.userId`.
- `MONGODB_URI` em produção **deve** apontar para o cluster gerenciado (Atlas, DocumentDB), não a uma instância única.

### 8.5 Jobs assíncronos

Hoje a sincronização com Coletum é disparada por HTTP e tem cota de 4 requisições por execução (`coletum.js`). Em escala, isso vira gargalo. Sugestão:

- Mover sincronização para uma **fila** (BullMQ + Redis) com workers separados.
- Endpoint `POST /suppliers/pull-all` só **enfileira o job** e retorna 202 com `jobId`.
- Job de envio de e-mail também em fila — `forgotPassword` não pode bloquear a resposta esperando o SMTP.

### 8.6 Horizontal scaling

- Empacotar em container Docker (uma imagem para a API, uma para o worker de filas).
- Rodar atrás de load balancer com **N réplicas** (N ≥ 2 para alta disponibilidade).
- Health check em `GET /health` (sem auth) retornando `{ status: 'ok', db: 'up', redis: 'up' }`.

### 8.7 Vertical scaling

Antes de subir CPU/RAM:

- Habilitar `compression()` (gzip) para respostas grandes do dashboard.
- Habilitar `lean()` nas queries Mongoose que não precisam de hidratação completa.
- Revisar agregações: paginar e indexar.

---

## 9. Configurações de deploy

### 9.1 Variáveis de ambiente esperadas

Documentar um `.env.example` com:

```
NODE_ENV=production
PORT=8080

# Mongo
MONGODB_URI=mongodb+srv://...

# Redis
REDIS_URL=redis://...

# JWT (RS256)
JWT_PRIVATE_KEY_PATH=/run/secrets/jwt_private.pem
JWT_PUBLIC_KEY_PATH=/run/secrets/jwt_public.pem
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_WEB=7d
REFRESH_TOKEN_TTL_MOBILE=30d

# E-mail
MAIL_PROVIDER=ses           # ses|smtp|mailgun
MAIL_FROM="PQFL <no-reply@pqfl.example.com>"
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...

# Front
FRONT_URL=https://dashboard.pqfl.example.com
ALLOWED_ORIGINS=https://dashboard.pqfl.example.com,https://app.pqfl.example.com

# Google OAuth (futuro)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# Coletum
COLETUM_BASE_URL=...
COLETUM_TOKEN=...
COLETUM_MAX_REQUESTS_PER_RUN=4
```

### 9.2 Dockerfile (sugestão de princípios)

- Imagem base: `node:lts-alpine`.
- Multi-stage build: stage de instalação de deps + stage final só com `node_modules` de produção.
- `USER node` (não rodar como root).
- `HEALTHCHECK` apontando para `/health`.
- `CMD ["node", "server.js"]` (nunca `npm start` — adiciona uma camada de processo desnecessária).

### 9.3 Pipeline CI/CD

Etapas mínimas:

1. **Lint** (ESLint).
2. **Test** (a ser criado — atualmente o `test` script só retorna erro).
3. **Audit** (`npm audit --audit-level=high`).
4. **Build** da imagem Docker com tag = SHA do commit.
5. **Push** para registry.
6. **Deploy** em staging automático; produção com aprovação manual.
7. **Smoke test** pós-deploy (curl em `/health` e em uma rota crítica).

### 9.4 Migrações de schema

Embora Mongoose seja schema-less em runtime, mudanças que exigem backfill (ex.: adicionar `emailVerified: false` a usuários existentes) precisam de scripts versionados em `scripts/migrations/`. Considerar `migrate-mongo` ou similar.

### 9.5 Configuração por ambiente

Três ambientes:

- `development` — local, Mongo local ou Atlas dev.
- `staging` — espelho de produção, dados sintéticos.
- `production`.

Cada um com seu `.env` separado (gerenciado fora do repo).

---

## 10. Observabilidade, logs e auditoria

### 10.1 Logs estruturados

- Substituir `console.log` por logger estruturado (pino).
- Cada requisição recebe um `requestId` (UUID) propagado por middleware e incluído em todos os logs daquela requisição.
- **Nunca logar**: senhas, tokens, e-mails completos em produção (mascarar: `t***@gmail.com`).

### 10.2 Auditoria

Coleção `AuditLog` com eventos sensíveis:

- Cadastro de usuário (`who`, `target`, `role`).
- Reset de senha.
- Login bem-sucedido / falho.
- Sincronização disparada.
- Mudança de role.

Retenção mínima: 1 ano.

### 10.3 Métricas

- Prometheus + Grafana, ou o stack do provedor de núvem.
- Métricas mínimas: latência por rota, taxa de erro, requisições por segundo, conexões ativas no Mongo, fila de jobs.

### 10.4 Alertas

- 5xx > 1% em 5 min.
- p95 de latência > 1s.
- Falhas de conexão Mongo/Redis.
- Falhas consecutivas no envio de e-mail.

---

## 11. Considerações específicas para o cliente Mobile (futuro)

- **Versionamento da API**: prefixar com `/v1`. Mobile não atualiza imediatamente — vai ser necessário manter `/v1` rodando por meses depois de lançar `/v2`.
- **Header `X-Client-Type`** e **`X-Client-Version`** em todas as requisições. Permite forçar atualização (`426 Upgrade Required`) quando uma versão for descontinuada.
- **Refresh token mais longo no mobile** (já documentado em 3.2).
- **Push notifications**: quando entrar no roadmap, salvar `deviceTokens` por usuário (FCM/APNs).
- **Biometria local** (TouchID/FaceID) protege o **refresh token guardado no Keychain**, não substitui o login no servidor.
- **Certificate pinning** no app para evitar MITM em redes hostis.

---

## 12. Checklist de implementação

### Fase 1 — Fundação de Auth (bloqueante)

- [x] Criar modelo `User` e `RefreshToken`. *(+ `AuditLog`)*
- [x] Configurar par de chaves RS256. *(`npm run keys:generate` → `keys/`, lidas em `config/jwt.js`)*
- [x] Implementar `AuthService` + `TokenService`.
- [x] Implementar middlewares `authenticate` e `authorize`.
- [x] Implementar rotas `/auth/login`, `/auth/refresh`, `/auth/logout`.
- [x] Implementar `errorHandler` centralizado.
- [x] Proteger rotas existentes (`/suppliers/*`, `/suppliers-calculated/*`).

### Fase 2 — Ciclo de e-mail

- [x] Configurar `MailService` (em dev: transport **console**/jsonTransport; em prod: SMTP via `SMTP_*`).
- [x] Implementar `/auth/register` (admin only). *(envia link de primeiro acesso)*
- [x] Implementar `/auth/confirmEmail` e `/auth/resendConfirmationEmail`.
- [x] Implementar `/auth/forgotPassword` e `/auth/resetPassword`.

### Fase 3 — Hardening

- [x] Adicionar `helmet`, `cors` restrito, `trust proxy`.
- [x] Rate limiting por IP e por e-mail com store Redis. *(store Redis quando `REDIS_URL` existe; senao MemoryStore)*
- [x] Auditoria (`AuditLog`).
- [x] Logger estruturado + requestId. *(pino + pino-http)*
- [x] Graceful shutdown.

### Fase 4 — Deploy

- [ ] Dockerfile + docker-compose para dev. *(adiado — deploy)*
- [x] `/health` endpoint. *(retorna status de Mongo e Redis)*
- [ ] Pipeline CI/CD. *(adiado — deploy)*
- [ ] Migrações com `migrate-mongo`. *(adiado — deploy)*
- [x] Documentar `.env.example`.

### Fase 5 — Preparação Mobile + Google

- [x] Adicionar `googleId` ao `User`. *(unique parcial sobre string; `config/oauth.js` reservado)*
- [x] Reservar rotas `/auth/google/*` (501 inicialmente).
- [ ] Versionamento `/v1`. *(adiado — evitar quebrar rotas atuais sem versao; decisao a alinhar)*
- [x] Diferenciar TTL de refreshToken por `X-Client-Type`. *(web 7d / mobile 30d)*

### Fase 6 — Escalonamento

- [ ] Migrar sincronização Coletum para fila BullMQ. *(infra de fila `JobQueue` + BullMQ pronta e usada para **e-mail**; a sync do Coletum segue síncrona para não quebrar o contrato atual — migração pendente)*
- [ ] Workers separados em containers próprios. *(processo `scripts/worker.js` pronto; containerização é deploy)*
- [ ] Cache Redis de respostas pesadas. *(cliente Redis + denylist prontos; cache de agregações pendente)*
- [ ] Métricas Prometheus + dashboard Grafana. *(tópico 10 — fora do escopo "até o tópico 8")*

---

## Status de implementação (2026-05-27)

Implementados os **tópicos 1 a 8** (deploy — tópico 9 — adiado conforme solicitado). Resumo:

**Concluído:** Fases 1, 2 e 3 inteiras; `/health` e `.env.example` (Fase 4); `googleId`, rotas `/auth/google/*` (501) e TTL por `X-Client-Type` (Fase 5); infraestrutura de fila (`JobQueue`/BullMQ) + `scripts/worker.js`, usados para envio de e-mail (parte da Fase 6).

**Decisões e desvios (deliberados):**

- **`bcryptjs`** (JS puro) no lugar de `bcrypt` nativo — evita compilação no Windows; API equivalente, custo 12.
- **Redis é opcional**: sem `REDIS_URL`, rate-limit usa MemoryStore, a denylist de JWT fica inativa e os jobs rodam **inline** (e-mail não bloqueia a resposta). Com `REDIS_URL`, ativa store distribuído + denylist + filas BullMQ.
- **MailService em modo `console`** em dev (jsonTransport): e-mails são logados (com o link/token) em vez de enviados. Em prod, configurar `SMTP_*`.
- **Rotas existentes protegidas**: `/suppliers/*` e `/suppliers-calculated/*` agora exigem `accessToken`. Rotas que falam com o Coletum e a de cálculo são **admin**; as de leitura do banco são admin **ou** member. *(O front-end precisará enviar o token.)*
- **Chaves RS256** geradas em `keys/` (gitignored). Gere com `npm run keys:generate`.
- **Seed** (`npm run seed`): cria 1 admin + 3 members (credenciais no `.env`), nada além disso.

**Pendências (não bloqueantes / fora do escopo até o tópico 8):**

- Versionamento global `/v1` (Fase 5) — adiado para não quebrar rotas atuais; alinhar antes.
- Migrar a sincronização do Coletum para fila BullMQ e cache Redis de agregações (Fase 6).
- Deploy: Dockerfile, CI/CD, `migrate-mongo` (Fase 4) e métricas Prometheus/Grafana (tópico 10).

> **Próximo passo recomendado**: rodar `npm run keys:generate` e `npm run seed`, subir com `npm run dev` e validar o fluxo no Swagger (`/docs`). Em seguida, adaptar o front-end para enviar o `accessToken` e tratar o refresh.

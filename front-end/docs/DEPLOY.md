# Deploy no Render + Domínio `.com.br`

Guia completo para publicar o **PQFL** em produção na plataforma [Render](https://render.com):
a **API/back-end** (Node + Express) e o **front-end** (Vue/Vite), e depois apontar um
**domínio `.com.br`** para a aplicação.

O repositório é um **monorepo** com duas pastas — `back-end/` e `front-end/` — e o Render lida
bem com isso através da opção **Root Directory** de cada serviço.

```
Repositório (GitHub)
├── back-end/    →  Render Web Service  (Node)     → https://api.seudominio.com.br
└── front-end/   →  Render Static Site  (Vue/Vite) → https://app.seudominio.com.br
```

---

## Sumário

1. [Pré-requisitos](#1-pré-requisitos)
2. [Banco de dados (MongoDB Atlas)](#2-banco-de-dados-mongodb-atlas)
3. [Chaves JWT (RS256)](#3-chaves-jwt-rs256)
4. [Deploy do back-end (Web Service)](#4-deploy-do-back-end-web-service)
5. [Deploy do front-end (Static Site)](#5-deploy-do-front-end-static-site)
6. [CORS e cookies — ponto de atenção](#6-cors-e-cookies--ponto-de-atenção)
7. [Blueprint `render.yaml` (opcional)](#7-blueprint-renderyaml-opcional)
8. [Domínio `.com.br`](#8-domínio-combr)
9. [Checklist final e troubleshooting](#9-checklist-final-e-troubleshooting)

---

## 1. Pré-requisitos

- Código enviado para um repositório no **GitHub** (ou GitLab/Bitbucket).
- Conta gratuita no **Render** ([render.com](https://render.com)) conectada ao GitHub.
- Conta gratuita no **MongoDB Atlas** (banco em nuvem).
- **Node 18+** instalado localmente (para gerar as chaves JWT).
- *(Para o domínio)* CPF ou CNPJ válido — exigência do **registro.br**.

> 💡 O plano gratuito do Render "dorme" após ~15 min de inatividade e demora alguns segundos para
> "acordar" na primeira requisição. Para produção real, use um plano pago (sem cold start).

---

## 2. Banco de dados (MongoDB Atlas)

O back-end exige `MONGODB_URI` em produção (`back-end/src/config/database.js`).

1. Crie um cluster gratuito (**M0**) em [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. **Database Access** → crie um usuário/senha (anote — vão para a connection string).
3. **Network Access** → **Add IP Address** → `0.0.0.0/0` (permite o Render acessar).
   *(Mais restrito: cadastre os IPs de saída do Render, mostrados em Settings do serviço.)*
4. **Connect → Drivers** → copie a **connection string**, no formato:
   ```
   mongodb+srv://USUARIO:SENHA@cluster0.xxxxx.mongodb.net/pqfl?retryWrites=true&w=majority
   ```
   *(Inclua o nome do banco, ex.: `/pqfl`, antes do `?`.)*

Guarde essa string para a variável `MONGODB_URI`.

---

## 3. Chaves JWT (RS256)

A API assina os tokens com um par de chaves RSA. As chaves **não são versionadas**, então em
produção elas são injetadas via variáveis de ambiente (o `back-end/src/config/jwt.js` aceita o
**PEM inline** em `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY`, com prioridade sobre o caminho de arquivo).

Gere o par localmente:

```bash
cd back-end
npm install
npm run keys:generate     # cria back-end/keys/jwt_private.pem e jwt_public.pem
```

Abra os dois arquivos `.pem` — você vai **colar o conteúdo completo** (incluindo as linhas
`-----BEGIN ...-----` e `-----END ...-----`) nas variáveis `JWT_PRIVATE_KEY` e `JWT_PUBLIC_KEY`
no Render (o campo de valor do Render aceita texto com várias linhas).

---

## 4. Deploy do back-end (Web Service)

No painel do Render: **New + → Web Service** e selecione o repositório.

**Configurações básicas**

| Campo | Valor |
| --- | --- |
| **Name** | `pqfl-api` |
| **Root Directory** | `back-end` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Health Check Path** | `/health` |
| **Instance Type** | Free (ou superior) |

> O servidor lê a porta de `process.env.PORT` (o Render injeta `PORT` automaticamente) — não fixe a porta.

**Environment Variables** (aba *Environment*):

| Variável | Valor / observação |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | a connection string do Atlas (passo 2) |
| `JWT_PRIVATE_KEY` | conteúdo do `jwt_private.pem` (PEM completo) |
| `JWT_PUBLIC_KEY` | conteúdo do `jwt_public.pem` (PEM completo) |
| `JWT_ISSUER` | `pqfl-api` |
| `JWT_AUDIENCE` | `pqfl-clients` |
| `ACCESS_TOKEN_TTL` | `15m` |
| `REFRESH_TOKEN_TTL_WEB` | `7d` |
| `FRONT_URL` | URL do front (ex.: `https://app.seudominio.com.br`) — usada no redirect de confirmação de e-mail |
| `ALLOWED_ORIGINS` | origem(ns) do front separadas por vírgula (ex.: `https://app.seudominio.com.br`) |
| `COLETUM_BASE_URL` / `COLETUM_FORM_ID` / `COLETUM_TOKEN` | credenciais do Coletum (sincronização) |
| `MAIL_PROVIDER` | `console` (sem e-mail real) ou `smtp` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM` | se `MAIL_PROVIDER=smtp` |
| `REDIS_URL` | **opcional** — sem ela, o rate-limit usa memória e os jobs rodam inline |

Clique em **Create Web Service**. Ao final, a API fica em algo como
`https://pqfl-api.onrender.com` — confirme acessando `…/health` (deve retornar `status: ok`) e
`…/docs` (Swagger).

### 4.1. Criar o primeiro usuário (seed)

O cadastro é restrito a administradores, então o **primeiro** admin é criado pelo script de seed.
No serviço da API, abra **Shell** (menu do serviço no Render) e rode:

```bash
npm run seed
```

Defina antes as variáveis `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` (e, se quiser, os membros)
no *Environment* — o seed cria 1 admin e alguns membros. Depois é só logar no front-end com essas
credenciais.

### 4.2. (Opcional) Redis e worker

Se quiser rate-limit distribuído, denylist de tokens e filas BullMQ:
- Crie um **Key Value (Redis)** no Render e copie a *Internal URL* para `REDIS_URL`.
- *(Opcional)* crie um **Background Worker** apontando para `back-end` com Start Command
  `npm run worker` para processar as filas fora do processo web.

---

## 5. Deploy do front-end (Static Site)

No painel do Render: **New + → Static Site** e selecione o **mesmo repositório**.

**Configurações básicas**

| Campo | Valor |
| --- | --- |
| **Name** | `pqfl-front` |
| **Root Directory** | `front-end` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

**Environment Variables**

| Variável | Valor |
| --- | --- |
| `VITE_API_BASE_URL` | URL pública da API (ex.: `https://api.seudominio.com.br`) |

> ⚠️ Variáveis `VITE_*` são lidas **no build**. Se alterar `VITE_API_BASE_URL` depois, faça um
> **Clear build cache & deploy** para o novo valor entrar no bundle.

**Regra de reescrita para SPA (obrigatória)** — sem ela, recarregar uma rota como
`/produtores/123` retorna 404. Em **Settings → Redirects/Rewrites**, adicione:

| Source | Destination | Action |
| --- | --- | --- |
| `/*` | `/index.html` | **Rewrite** |

Clique em **Create Static Site**. O front fica em algo como `https://pqfl-front.onrender.com`.

---

## 6. CORS e cookies — ponto de atenção

O login devolve o `accessToken` no corpo, mas o **refreshToken** vai em um **cookie httpOnly**
com `SameSite=Strict` e `Secure` (em produção). Para o cookie ser enviado nas chamadas de
`/auth/refresh`, o navegador precisa considerar front-end e API como **"mesmo site"**
(*same-site* = mesmo domínio registrável).

✅ **Solução recomendada (produção):** coloque os dois sob o **mesmo domínio**:
- Front: `https://app.seudominio.com.br`
- API:  `https://api.seudominio.com.br`

Como ambos compartilham `seudominio.com.br`, o cookie funciona e basta o CORS liberar a origem do
front (`ALLOWED_ORIGINS=https://app.seudominio.com.br`). O back-end já usa `credentials: true` e o
Axios do front já envia `withCredentials: true`.

⚠️ **Testando antes do domínio (subdomínios `*.onrender.com`):** o login funciona, mas a renovação
por cookie entre dois subdomínios diferentes do `onrender.com` pode ser bloqueada pela política
*SameSite*. Isso some assim que você usa o domínio próprio (passo 8). Enquanto isso, o `accessToken`
em `localStorage` mantém a sessão por ~15 min mesmo sem o refresh por cookie.

---

## 7. Blueprint `render.yaml` (opcional)

Em vez de criar os serviços na mão, você pode versionar um **Blueprint** na raiz do repositório.
Há um arquivo [`../render.yaml`](../render.yaml) pronto. Com ele, use **New + → Blueprint** e o
Render cria os dois serviços de uma vez (você só preenche os segredos marcados como `sync: false`).

```yaml
services:
  - type: web
    name: pqfl-api
    runtime: node
    rootDir: back-end
    plan: free
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
      - key: JWT_PRIVATE_KEY
        sync: false
      - key: JWT_PUBLIC_KEY
        sync: false
      - key: ALLOWED_ORIGINS
        sync: false
      - key: FRONT_URL
        sync: false

  - type: web
    name: pqfl-front
    runtime: static
    rootDir: front-end
    buildCommand: npm install && npm run build
    staticPublishPath: dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    envVars:
      - key: VITE_API_BASE_URL
        sync: false
```

---

## 8. Domínio `.com.br`

### 8.1. Registrar o domínio

1. Acesse **[registro.br](https://registro.br)** (registrador oficial dos domínios `.br`).
2. Pesquise o domínio desejado (ex.: `seudominio.com.br`) e confira a disponibilidade.
3. Faça login/cadastro com **CPF** (pessoa física) ou **CNPJ** (empresa) — obrigatório para `.br`.
4. Conclua o pagamento (anuidade; a partir de ~R$ 40/ano). O domínio fica ativo em minutos/horas.

> Você também pode registrar por revendedores (GoDaddy, Hostgator, etc.), mas o `registro.br` é o
> mais direto e barato para `.com.br`.

### 8.2. Adicionar os domínios no Render

Para **cada** serviço, em **Settings → Custom Domains → Add Custom Domain**:

- No serviço **`pqfl-front`** → adicione `app.seudominio.com.br` (e, se quiser, `www.seudominio.com.br`).
- No serviço **`pqfl-api`** → adicione `api.seudominio.com.br`.

O Render mostrará, para cada domínio, o **registro DNS** a criar — normalmente um **CNAME**
apontando para o host do serviço (ex.: `pqfl-front.onrender.com`).

### 8.3. Configurar o DNS no registro.br

No painel do registro.br, abra **DNS → Editar Zona** do seu domínio e crie os registros indicados
pelo Render:

| Tipo | Nome (host) | Valor (aponta para) |
| --- | --- | --- |
| `CNAME` | `app` | `pqfl-front.onrender.com` |
| `CNAME` | `api` | `pqfl-api.onrender.com` |
| `CNAME` | `www` | `pqfl-front.onrender.com` *(opcional)* |

Para o **domínio raiz** (`seudominio.com.br`, sem subdomínio) não é possível usar CNAME (regra do
DNS). Use uma das opções:
- criar um registro **A** apontando para o **IP que o Render informa** para domínio apex; **ou**
- usar o redirecionamento do registro.br para `https://app.seudominio.com.br`; **ou**
- simplesmente adotar `app.` como endereço principal e divulgar esse.

> O DNS pode levar de alguns minutos até ~24h para propagar. O Render valida o domínio
> automaticamente e **emite o certificado SSL (HTTPS) gratuito** via Let's Encrypt assim que o DNS
> apontar corretamente — não é preciso configurar certificado manualmente.

### 8.4. Atualizar as variáveis para o domínio final

Depois que os domínios estiverem ativos (cadeado HTTPS verde):

- **`pqfl-api`** (Environment): `FRONT_URL=https://app.seudominio.com.br` e
  `ALLOWED_ORIGINS=https://app.seudominio.com.br` → **Save** (reinicia a API).
- **`pqfl-front`** (Environment): `VITE_API_BASE_URL=https://api.seudominio.com.br` →
  **Clear build cache & deploy** (para o novo valor entrar no bundle).

Pronto: a aplicação responde em `https://app.seudominio.com.br` consumindo
`https://api.seudominio.com.br`, com cookies e CORS funcionando.

---

## 9. Checklist final e troubleshooting

**Checklist**

- [ ] `…/health` da API retorna `status: ok` e `db: up`.
- [ ] `…/docs` (Swagger) abre na API.
- [ ] Seed executado → consigo logar com o admin no front.
- [ ] Regra de **rewrite** `/* → /index.html` ativa no front (recarregar rota interna não dá 404).
- [ ] `VITE_API_BASE_URL` aponta para a API e o front foi **rebuildado** após defini-la.
- [ ] `ALLOWED_ORIGINS`/`FRONT_URL` batem **exatamente** com a URL do front (com `https://`, sem barra final).
- [ ] HTTPS (cadeado) ativo nos dois domínios.

**Problemas comuns**

| Sintoma | Causa provável | Correção |
| --- | --- | --- |
| `CORS error` no console | origem do front fora de `ALLOWED_ORIGINS` | ajuste `ALLOWED_ORIGINS` (exato, com `https://`) e salve |
| Login ok, mas cai após F5 / refresh falha | cookie *SameSite* entre subdomínios `onrender.com` | use o domínio próprio (seção 8) — front e API sob `seudominio.com.br` |
| Chamadas vão para `/api/...` em produção | `VITE_API_BASE_URL` não aplicada no build | redefina a variável e faça **Clear build cache & deploy** |
| `404` ao recarregar `/produtores/123` | falta a regra de rewrite SPA | adicione `/* → /index.html` (Rewrite) |
| API sobe e cai | `MONGODB_URI` inválida ou IP não liberado no Atlas | revise a string e o Network Access (`0.0.0.0/0`) |
| `Chave JWT ausente` nos logs | `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY` vazias ou truncadas | cole o PEM completo (com as linhas BEGIN/END) |
| Primeira requisição lenta | cold start do plano Free | normal; use plano pago para evitar |

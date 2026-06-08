# PQFL Dashboard — Front-end (Vue 3)

Interface web do **PQFL (Plano de Qualificação de Fornecedores de Leite)**. Esta aplicação
consome a API do back-end (pasta `../back-end`) e apresenta, de forma visual, os fornecedores
de leite já **pontuados e classificados**: distribuição por grupo (G1/G2/G3), médias de
conformidade por categoria BPA, e os planos de ação **PAE** e **PBPA**.

> Este documento explica **o que** foi construído e **como** foi construído, descrevendo os
> arquivos **na ordem em que foram criados**. O passo a passo de publicação (back-end + front-end
> no Render e domínio `.com.br`) está em [`DEPLOY.md`](./DEPLOY.md).

---

## 1. Visão geral

O front-end foi feito em **Vue 3 (Composition API + `<script setup>`)** com **Vite**, **Vue Router**,
**Pinia** e **Axios**. Não há framework de UI pesado: o design é próprio (CSS com variáveis) e os
gráficos (rosca, barras e medidor) são desenhados em **SVG/CSS puro**, sem dependências extras —
o que torna o bundle leve e o deploy mais simples.

**Stack final**

| Camada | Tecnologia | Por quê |
| --- | --- | --- |
| Build | Vite 6 | Dev server rápido + build otimizado |
| UI | Vue 3 (`<script setup>`) | Reatividade simples e componentes SFC |
| Rotas | Vue Router 4 | SPA com guards de autenticação/role |
| Estado | Pinia 2 | Store de sessão (auth) reativa |
| HTTP | Axios | Interceptors para token e refresh automático |
| Gráficos | SVG/CSS próprios | Zero dependências, controle total |

### Como o front-end conversa com o back-end

A API foi analisada a partir de `back-end/src/routes/*` e dos serviços de negócio. Os endpoints
consumidos por esta interface são:

| Método | Rota | Acesso | Uso no front-end |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | público | Login → `{ user, accessToken }` (refresh no cookie httpOnly) |
| `POST` | `/auth/refresh` | cookie | Renovação silenciosa do `accessToken` |
| `POST` | `/auth/logout` | — | Encerrar sessão |
| `POST` | `/auth/forgotPassword` | público | Recuperação de senha |
| `POST` | `/auth/resetPassword` | público | Reset / primeiro acesso |
| `POST` | `/auth/register` | **admin** | Cadastro de usuário (tela de Administração) |
| `GET` | `/suppliers-calculated` | admin/member | **Fonte principal**: produtores pontuados (paginado, filtros `_id`/`nome`) |
| `POST` | `/suppliers-calculated/calculate` | **admin** | Recalcular todas as pontuações |
| `POST` | `/suppliers/pull-all` | **admin** | Sincronização completa com o Coletum |
| `POST` | `/suppliers/pull-partial` | **admin** | Sincronização incremental (delta) |

### Regras de negócio espelhadas na interface

As regras do back-end (`back-end/src/services/Categorize/*`) foram replicadas no front-end apenas
para **rótulos, ordem, cores e limites** (o cálculo continua sendo feito 100% no servidor):

- **10 categorias BPA** com pesos que somam 100 (manejo sanitário e ordenha valem 20 cada, etc.).
- **Classificação por grupo** a partir da pontuação total (0–100):
  - **G1** ≥ 80 (Excelência) · **G2** 50–79 (Em evolução) · **G3** < 50 (Atenção).
- **PAE (Plano de Ação Emergencial)**: disparado quando **CPP > 300.000** ou há **presença de resíduos**.
- **PBPA (Plano de Boas Práticas)**: categorias com conformidade ≤ 0,5.

Esse espelho fica isolado em um único arquivo (`src/constants/bpa.js`) para manter a consistência
com o domínio caso o back-end evolua.

---

## 2. Arquitetura de pastas

```
front-end/
├── index.html                  # HTML raiz (monta #app)
├── package.json                # Dependências e scripts (dev/build/preview)
├── vite.config.js              # Vite + alias "@" + proxy /api -> back-end (dev)
├── .env.example / .env.development
├── public/
│   └── favicon.svg
└── src/
    ├── main.js                 # Bootstrap (Pinia, Router, init da auth)
    ├── App.vue                 # Decide layout (blank x sidebar) + transições
    ├── assets/styles/main.css  # Design system (variáveis CSS, utilitários)
    ├── constants/bpa.js        # Espelho do domínio (categorias, grupos, cores)
    ├── services/               # Camada de acesso à API
    │   ├── http.js             #   Axios + interceptors + refresh
    │   ├── authService.js      #   Endpoints /auth/*
    │   └── suppliersService.js #   Endpoints de fornecedores
    ├── stores/auth.js          # Pinia: sessão, login, refresh, logout
    ├── composables/useToast.js # Barramento de notificações
    ├── router/index.js         # Rotas + guards (auth/admin/guest)
    ├── utils/                  # format.js, aggregations.js
    ├── components/
    │   ├── ui/                 # BaseButton, BaseCard, BaseSpinner, GroupBadge, ToastHost, EmptyState
    │   ├── charts/             # DonutChart, BarChart, ScoreGauge (SVG)
    │   ├── layout/             # AppSidebar, AppHeader, AppLayout
    │   └── dashboard/          # SummaryCard, PaeAlertPanel
    └── views/                  # Telas (uma por rota)
```

---

## 3. O que foi feito, na ordem em que os arquivos foram criados

A construção seguiu a estratégia **de baixo para cima**: primeiro a base do projeto, depois a
camada de dados (serviços/estado), em seguida os componentes reutilizáveis e, por fim, as telas.

### Fase 1 — Esqueleto do projeto

1. **`package.json`** — define o projeto Vite/Vue e os scripts `dev`, `build` e `preview`, além das
   dependências (`vue`, `vue-router`, `pinia`, `axios`).
2. **`vite.config.js`** — registra o plugin Vue, o alias `@ → src` e um **proxy de desenvolvimento**:
   tudo que começa com `/api` é encaminhado ao back-end (`http://localhost:8080`). Isso evita CORS
   em dev e mantém o cookie httpOnly de refresh no mesmo "site".
3. **`index.html`** — documento raiz com `<div id="app">` e o `<script type="module">` do `main.js`.
4. **`.gitignore`** — ignora `node_modules`, `dist` e arquivos `.env`.
5. **`.env.example`** e **6. `.env.development`** — documentam/definem `VITE_API_BASE_URL`
   (em dev = `/api`) e `VITE_DEV_API_PROXY` (alvo do proxy).
7. **`public/favicon.svg`** — ícone da aba (tema "leite").

### Fase 2 — Domínio e design system

8. **`src/constants/bpa.js`** — **espelho da regra de negócio**: as 10 categorias BPA com pesos,
   os grupos G1/G2/G3 (rótulo, descrição, cor) e o limite de CPP. Centraliza tudo que precisa ficar
   coerente com o back-end.
9. **`src/assets/styles/main.css`** — o **design system**: variáveis de cor/raio/sombra, reset,
   utilitários de layout (grid, flex), estilos de tabela, inputs, *pills* e animações.

### Fase 3 — Camada de dados (serviços e estado)

10. **`src/services/http.js`** — instância central do **Axios**. Faz:
    - `baseURL` a partir de `VITE_API_BASE_URL`;
    - `withCredentials: true` (envia/recebe o cookie httpOnly de refresh);
    - **interceptor de request** que anexa `Authorization: Bearer <token>`;
    - **interceptor de response** que, em `401`, tenta **um** refresh automático e refaz a
      requisição original (com proteção contra refresh concorrente);
    - `extractApiError()` para transformar o payload de erro do back-end em mensagem amigável.
    Para evitar dependência circular com a store, o token e os handlers de refresh/logout são
    **injetados de fora**.
11. **`src/services/authService.js`** — funções finas sobre os endpoints `/auth/*`
    (login, refresh, logout, register, forgot/reset password).
12. **`src/services/suppliersService.js`** — endpoints de fornecedores. Destaque para
    `listAllCalculated()`, que pagina automaticamente (`page_size=500`) e concatena todas as
    páginas — usado pelas agregações do dashboard.
13. **`src/composables/useToast.js`** — pequeno barramento reativo de notificações (sucesso/erro/info).
14. **`src/stores/auth.js`** — store **Pinia** de sessão. Guarda `user` + `accessToken`
    (em memória e `localStorage`); o refresh fica **somente** no cookie httpOnly. No `initialize()`
    registra os handlers no `http.js` e tenta um **refresh silencioso** (recupera a sessão após F5).

### Fase 4 — Navegação e bootstrap

15. **`src/router/index.js`** — define as rotas (lazy-loaded) e um **guard global** que aplica
    `requiresAuth`, `requiresAdmin` e `guestOnly`, redirecionando conforme o estado da store.
16. **`src/main.js`** — cria a app, instala Pinia, **inicializa a auth antes de montar** (para os
    guards já terem o estado correto) e então instala o Router e monta em `#app`.
17. **`src/App.vue`** — componente raiz: hospeda o `ToastHost`, escolhe entre **layout em branco**
    (login, reset, 404) e **layout com sidebar** (área autenticada) e aplica transições de rota.

### Fase 5 — Componentes reutilizáveis (UI e gráficos)

18–23. **`src/components/ui/`** — `BaseButton` (variantes + loading), `BaseCard` (cartão com
   cabeçalho/ações), `BaseSpinner`, `GroupBadge` (selo colorido do grupo), `ToastHost`
   (renderiza os toasts) e `EmptyState` (estado vazio).

24–26. **`src/components/charts/`** — gráficos **em SVG**, sem libs:
   - `DonutChart` — rosca proporcional (distribuição por grupo);
   - `BarChart` — barras horizontais (médias por categoria);
   - `ScoreGauge` — medidor circular 0–100 colorido pelo grupo.

### Fase 6 — Utilidades e layout

27. **`src/utils/format.js`** — formatação pt-BR (números, pontuação, percentuais, datas).
28. **`src/utils/aggregations.js`** — `buildDashboardStats()` (totais, contagem por grupo, média
    geral, médias por categoria) e `extractPaeList()` (produtores em PAE com seus motivos).
29–31. **`src/components/layout/`** — `AppSidebar` (navegação; “Administração” só para admin),
   `AppHeader` (título da rota + menu do usuário com logout) e `AppLayout` (compõe sidebar + header
   + conteúdo, com sidebar responsiva no mobile).

### Fase 7 — Componentes do dashboard

32. **`src/components/dashboard/SummaryCard.vue`** — cartão de KPI (ícone, valor, legenda).
33. **`src/components/dashboard/PaeAlertPanel.vue`** — lista de produtores em PAE, clicável.

### Fase 8 — Telas (views)

34. **`LoginView.vue`** — login em tela dividida (marca + formulário), com tratamento de erro.
35. **`ForgotPasswordView.vue`** — solicitação de link de recuperação.
36. **`ResetPasswordView.vue`** — define nova senha (também serve ao **primeiro acesso**, via `?token=`).
37. **`EmailConfirmedView.vue`** — destino do redirect de `GET /auth/confirmEmail` (sucesso/erro).
38. **`DashboardView.vue`** — **tela principal**: busca todos os calculados, monta KPIs, a rosca de
    distribuição, as médias por categoria e o painel de PAE. Admin vê o botão *Recalcular*.
39. **`ProducersView.vue`** — lista de produtores com **busca instantânea**, filtro por grupo,
    “somente em PAE”, ordenação por pontuação e paginação (no cliente).
40. **`ProducerDetailView.vue`** — perfil completo de um produtor: medidor de pontuação, métricas
    (CPP/resíduos), conformidade por categoria, detalhamento dos pontos, blocos de **PAE** e **PBPA**
    e o **diagnóstico de fatores** (itens oficiais que falharam).
41. **`AdminView.vue`** — ações de administrador: recalcular, sincronizar (completa/incremental) e
    cadastrar usuário, com histórico das operações da sessão.
42. **`NotFoundView.vue`** — página 404.

### Fase 9 — Documentação

43. **`README.md`** (este arquivo) e **44. `DEPLOY.md`** (publicação no Render + domínio `.com.br`).

---

## 4. Fluxo de autenticação (resumo)

1. **Login** → `POST /auth/login`. O back-end responde `{ user, accessToken }` e grava o
   **refreshToken** em cookie **httpOnly** (path `/auth`). O `accessToken` vai para a store + `localStorage`.
2. Toda requisição leva `Authorization: Bearer <accessToken>` (interceptor de request).
3. Em **401**, o interceptor chama `POST /auth/refresh` (usa o cookie), obtém um novo `accessToken` e
   **refaz** a chamada original. Se o refresh falhar, a sessão é limpa e o usuário volta ao login.
4. Ao abrir a app (F5), `auth.initialize()` tenta um **refresh silencioso** para restaurar a sessão.
5. **Papéis**: rotas e botões sensíveis (recalcular, sincronizar, cadastrar) só aparecem/são
   acessíveis para `admin` (guard `requiresAdmin`).

---

## 5. Como rodar localmente

> Pré-requisitos: **Node 18+** e o **back-end rodando** em `http://localhost:8080`
> (veja `../back-end/README` e rode `npm run dev` lá).

```bash
# dentro de front-end/
npm install
npm run dev
```

A aplicação sobe em `http://localhost:5173`. Em desenvolvimento, o front chama `/api/...` e o
**proxy do Vite** encaminha para o back-end — então não é preciso configurar CORS para testar.

### Variáveis de ambiente

| Variável | Dev | Produção |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` (proxy do Vite) | URL pública da API, ex.: `https://api.seudominio.com.br` |
| `VITE_DEV_API_PROXY` | `http://localhost:8080` | — (usada só em dev) |

### Build de produção

```bash
npm run build      # gera dist/
npm run preview    # serve o dist/ localmente para conferência
```

O comando `npm run build` foi validado: **136 módulos transformados, build concluído sem erros.**

---

## 6. Próximos passos

- Publicar back-end e front-end no Render e apontar um domínio `.com.br` — passo a passo em
  [`DEPLOY.md`](./DEPLOY.md).

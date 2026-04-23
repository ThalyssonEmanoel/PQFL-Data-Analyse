# PENDING — itens adiados da Etapa 1

Este arquivo lista cada item da Etapa 1 que não pôde ser executado
diretamente porque depende da máquina do desenvolvedor ou de um recurso
externo (rede, MongoDB etc.). Tudo abaixo já está conectado no código —
só precisa ser executado uma vez.

## 1) Instalar dependências

O `package.json` foi escrito com o conjunto exato de bibliotecas da Etapa 1,
mais duas pequenas adições que a Etapa 1 exige implicitamente:

- `dotenv` — para carregar o `.env` no início do processo (o server.js usa).
- `pino-pretty` — formatador legível em tempo de desenvolvimento para o logger pino.

Execute a partir da pasta `back-end/`:

```bash
cd back-end
npm install
```

Isso vai preencher `node_modules/` e criar `package-lock.json`.

> Observação: `morgan` está listado no plano da Etapa 1, mas acabamos usando
> `pino-http` como logger de requisições (logs JSON, como a Etapa 1 pede na
> linha 88). `morgan` ainda está declarado no `package.json`, então continua
> disponível caso queiramos um log de acesso legível em desenvolvimento.

## 2) Provisionar MongoDB

O backend espera uma instância do MongoDB acessível. Duas opções:

- **Local**: instale o MongoDB Community ou rode via Docker —
  `docker run -d --name pqfl-mongo -p 27017:27017 mongo:6`
- **Remoto**: use Atlas ou qualquer provedor gerenciado e cole a URI no `.env`.

Copie `.env.example` para `.env` e preencha `MONGODB_URI` / `MONGODB_DB_NAME`.

Com o `.env` pronto e o Mongo no ar:

```bash
npm run dev
```

Você deve ver `mongo connection established` e `http server listening`
nos logs.

## 3) Migração de dados do cache legado do frontend

O frontend atual (`../src/lib/pqfl`) mantém payloads de produtores em um cache
local (`cache-store.ts`, `period-dataset.ts`, `refreshProducerPayloads`).
Nada disso foi migrado para cá — a Etapa 1 delimita explicitamente o backend
à arquitetura e aos três endpoints de leitura.

O que ainda precisa acontecer (território da Etapa 2, mas documentado aqui
para não se perder):

- Portar a lógica de busca + orçamento do Coletum para `src/services/coletum.service.js`.
- Portar o pipeline de pontuação (`scoring.ts`) para `src/services/scoring.service.js`.
- Escrever uma migração pontual (`migrations/<ts>-initial-import.js`) que leia
  o que o cache legado produziu e faça upsert via
  `producerRepository.upsertByProducerId`.
- Expor `POST /api/v1/producers/refresh` espelhando o que
  `src/app/api/produtores/atualizar/route.ts` faz hoje no app Next.js.

Nenhum desses endpoints faz parte da Etapa 1, então eles não foram
implementados ainda de forma intencional.

## 4) Dados de seed

`src/seed/index.js` está ligado ao `npm run seed`, mas o array `seedProducers`
está vazio. Preencha quando soubermos se queremos fixtures sintéticos ou um
dump de produtores reais do Coletum.

## 5) Migrações (`migrate-mongo`)

`migrate-mongo` está instalado como dependência de desenvolvimento e os três
scripts (`db:migrate:create|up|down`) estão no `package.json`. Porém:

- `migrate-mongo` exige um `migrate-mongo-config.js` na raiz do backend
  para conhecer a string de conexão e a pasta `migrations/`.
- Nós intencionalmente ainda não criamos esse arquivo porque a Etapa 1 lista
  migrações como opcionais ("Se eu não quiser scripts de migração agora,
  posso pular `migrate-mongo` e adicionar depois"). Crie este arquivo na
  primeira vez em que uma migração for realmente necessária.

Modelo para colocar em `back-end/migrate-mongo-config.js` quando estiver pronto:

```js
import "dotenv/config";

export default {
  mongodb: {
    url: process.env.MONGODB_URI,
    databaseName: process.env.MONGODB_DB_NAME,
    options: { useNewUrlParser: true, useUnifiedTopology: true },
  },
  migrationsDir: "migrations",
  changelogCollectionName: "changelog",
  migrationFileExtension: ".js",
};
```

## 6) Checklist de smoke test (com Mongo no ar)

1. `npm install`
2. `cp .env.example .env` e editar.
3. `npm run dev`
4. `curl http://localhost:3333/api/v1/health` → `{ "status": "ok", ... }`
5. `curl http://localhost:3333/api/v1/producers` → lista paginada (vazia
   até rodar seed/import).
6. Abrir `http://localhost:3333/docs` → Swagger UI renderiza com os dois
   grupos tagueados (Health, Producers).

## 7) O que NÃO foi alterado

- O frontend Next.js (`../src`, `../next.config.ts` etc.) permanece inalterado,
  como exigido pela Etapa 1.
- Nenhum pacote foi instalado, nenhum arquivo foi modificado fora de `back-end/`.

---

# PENDING — itens adiados da Etapa 5 (Sync Coletum sob demanda)

A Etapa 5 foi implementada inteiramente em código — rota, controller, services
(`coletum.service.js`, `producer-refresh.service.js`,
`producer-mapping.service.js`), repositório de sync, schemas de validação e
docs Swagger. Resta apenas configuração e execução em máquina real.

## 1) Configurar variáveis de ambiente do Coletum

Novas chaves adicionadas a `.env.example` (copie para `.env` e preencha):

- `COLETUM_BASE_URL` — default `https://coletum.com/api/webservice/v2`.
- `COLETUM_FORM_ID` — id do formulário (substitui o `26738` hardcoded no URL
  legado). Obrigatório se `COLETUM_FULL_URL` não estiver setado.
- `COLETUM_TOKEN` — token de API. **Nunca commite este valor.** O token é
  redigido em todos os logs via `src/utils/redact.js`, mas precisa estar no
  `.env`.
- `COLETUM_DEFAULT_PAGE_SIZE` — default 100, hard cap 100.
- `COLETUM_FULL_URL` — override opcional (URL pré-montada usada pelo
  frontend legado). Se presente, a service só anexa `page`/`page_size`.
- `REFRESH_ENABLED` — setar `false` para desligar a rota em emergência.
- `REFRESH_LOCK_TTL_MS` / `REFRESH_MAX_PAGES_CAP` / `REFRESH_BULK_CHUNK_SIZE`
  — guardrails operacionais. Defaults seguros já estão no
  `src/config/constants.js`.

## 2) Aplicar a nova migração

Com o Mongo no ar e `.env` preenchido:

```bash
npm run db:migrate:up
```

Deve aplicar `20260423140000-sync-metadata-and-locks`, que cria:

- `producers.lastSyncAt` e `producers.uniq_dedupKey` (único parcial).
- `producer_syncs.uniq_lock_per_key` (único parcial — garante 1 lock por
  chave).
- `producer_syncs.ttl_lock_expiresAt` (TTL — solta lock de processo crashado).
- `producer_syncs.uniq_run_syncId` (único parcial — 1 doc por run).
- `producer_syncs.kind_startedAt` — consultas operacionais.

## 3) Smoke test da rota de refresh

```bash
# dry-run (não grava, só valida)
curl -X POST http://localhost:3333/api/v1/producers/refresh \
     -H 'Content-Type: application/json' \
     -d '{"dryRun": true, "maxPages": 1}'

# execução real com 5 páginas
curl -X POST http://localhost:3333/api/v1/producers/refresh \
     -H 'Content-Type: application/json' \
     -d '{"maxPages": 5}'
```

Esperado: resposta `202` com `{ ok: true, status: "completed", summary, meta }`.
Rodar duas vezes em paralelo deve devolver `409` com detalhes do lock ativo.

## 4) Pipeline de pontuação ainda em aberto

O mapper atual (`src/services/producer-mapping.service.js`) grava campos
mínimos para passar na validação do Mongoose (`totalScore: 0`, `group: "G3"`,
`actions` zeradas, `metrics` neutras) e preserva o `rawPayload` bruto. Isso é
**intencional**: portar as 806 linhas de
`../src/lib/pqfl/scoring.ts` para `src/services/scoring.service.js` é trabalho
independente da Etapa 5.

Quando o scoring for portado:

1. Criar `src/services/scoring.service.js` espelhando a API do
   `scoring.ts` (`scoreProducer(raw, options)`).
2. No mapper, chamar `scoreProducer` antes do retorno e substituir os
   defaults — ou criar um job pós-sync que lê `producers` com
   `scoringStatus: "pending"` e atualiza em batch.
3. Setar `scoringStatus: "scored"` no upsert do job.

## 5) Observabilidade e auditoria

- Os logs já incluem `syncId`, página, attempt de retry e contadores. Nenhum
  log imprime o token — `src/utils/redact.js` normaliza URLs antes de logar.
- Histórico de runs fica em `db.producer_syncs` (`kind: "run"`). Útil para
  debugging/auditoria. Não há rota pública expondo isso — adicionar em uma
  etapa de "admin endpoints" se/quando necessário.

## 6) Cooldown / rate-limiting

Step-5 cita "Optional cooldown window between refresh runs" como salvaguarda
opcional. **Não** foi implementado — só temos o lock para exclusão mútua. Se
virar problema operacional, dá para adicionar verificando o último run
finalizado em `producer_syncs` e comparando com um `REFRESH_MIN_INTERVAL_MS`
novo.

## 7) O que NÃO foi alterado na Etapa 5

- Nenhum fetch automático no startup — `server.js` continua só conectando no
  Mongo e subindo o HTTP.
- Nenhum polling em background, nenhuma dependência de cron.
- O frontend Next.js permanece intocado.

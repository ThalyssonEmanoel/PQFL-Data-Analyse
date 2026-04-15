# PQFL Dashboard

Arquitetura inicial de um dashboard web para o Plano de Qualificação de Fornecedores de Leite.

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- Recharts para visualizações
- Fetch nativo para leitura da API HTTP v2 do Coletum
- Cache persistente local para reduzir consumo de requisições

## Regras de negócio implementadas

- Pontuação máxima: 100 pontos
- Pesos BPA oficiais (10 categorias):
	- Gestão da propriedade: 10%
	- Manejo sanitário: 20%
	- Manejo de ordenha e pós-ordenha: 20%
	- Refrigeração e estocagem do leite: 15%
	- Manejo alimentar e armazenamento de alimentos: 10%
	- Qualidade da água: 8%
	- Uso racional e estocagem de produtos químicos: 6%
	- Manejo de resíduos: 5%
	- Manutenção preventiva: 3%
	- Capacitação e controle de pragas: 3%
- Classificação:
	- G1: pontuação >= 80
	- G2: pontuação entre 50 e 79.99
	- G3: pontuação < 50

- Gatilhos de ação:
	- PAE: CPP > 300.000 ou presença de resíduos
	- PBPA: categorias com nota baixa/zero (threshold configurável)

## Cache e limite de requisições

- O dashboard não dispara requisições remotas automaticamente ao abrir a tela.
- Os dados são lidos primeiro do cache local `cache/answers_cache.json`.
- A atualização remota acontece apenas quando o usuário clica em `Atualizar produtores`.
- O sistema controla um budget local de chamadas (`COLETUM_REQUEST_BUDGET`, padrão 100).
- Quando o budget local é atingido, novas atualizações remotas são bloqueadas até ajuste do budget.

## Estrutura inicial

```text
src/
	app/
		layout.tsx
		page.tsx
		produtores/[id]/page.tsx
		api/produtores/atualizar/route.ts
		globals.css
	components/
		dashboard/
			summary-card.tsx
			group-donut-chart.tsx
			bottlenecks-bar-chart.tsx
			refresh-producers-button.tsx
		produtor/
			print-button.tsx
	lib/
		pqfl/
			cache-store.ts
			data-source.ts
			domain/
				types.ts
				constants.ts
			scoring.ts
			graphql.ts
			mock-data.ts
			index.ts
```

## Função de mapeamento e cálculo (principal)

Arquivo: `src/lib/pqfl/scoring.ts`

Função:

- `mapAndScoreProducer(rawPayload, customOptions?)`

Comportamento:

1. Achata o payload retornado pelo Coletum (inclusive objetos aninhados).
2. Remove sufixos numéricos das chaves (ex.: `pos_dipping842440` -> `pos_dipping`).
3. Mapeia cada pergunta para 1 das 10 categorias BPA por meio de hints configuráveis.
4. Normaliza resposta para escala 0..1 (`sim/não/parcial`, booleano, numérico 0..100).
5. Aplica pesos oficiais e retorna pontuação final em escala 0..100.
6. Classifica em G1/G2/G3 e gera gatilhos PAE/PBPA.

## Impressão A4 (requisito crítico)

`src/app/globals.css` inclui `@media print` com:

- `@page { size: A4 portrait; margin: 10mm; }`
- ocultação de elementos com `.no-print`
- regras `break-inside: avoid` e `page-break-inside: avoid` para tabelas/gráficos
- layout do diagnóstico individual ajustado com classe `.a4-report`

## Configuração do Coletum

1. Crie `.env.local` a partir de `.env.example`
2. Preencha `COLETUM_FULL_URL` com a URL completa do endpoint (page, page_size e Token)
3. (Opcional) Ajuste `COLETUM_REQUEST_BUDGET`

## Executar localmente

```bash
npm install
npm run dev
```

Abra:

- Dashboard: `http://localhost:3000`
- Diagnóstico individual: `http://localhost:3000/produtores/P001`

## Validação

```bash
npm run lint
npm run build
```


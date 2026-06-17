# Alterações — atendimento ao `Pedent.md`

Documento descrevendo os arquivos **mexidos** e **criados** para resolver cada pendência
listada em [`Pedent.md`](./Pedent.md).

---

## 1. Comparação por período na tela de um produtor

> _"Na parte de Produtores [...] está faltando a parte de comparar os dados dos produtores do
> último período registrado e selecionar outros períodos existentes (obs: só deverá existir
> essa opção se o back-end souber lidar com esse detalhe)."_

O back-end já possuía a infraestrutura de períodos (`period-dataset.js`), mas ela **não estava
ligada a nenhum endpoint**. Foi criado um endpoint que reconstrói o histórico de períodos de um
produtor a partir dos envios brutos e o front-end passou a oferecer a comparação **apenas quando
o back-end retorna 2+ períodos comparáveis** (`supported = true`), respeitando a observação do
documento.

### Back-end (criado/mexido)
- **`back-end/src/services/CategorizeService.js`** _(mexido)_ — novo método
  `getProducerPeriodHistory(producerId)`, que monta o dataset de períodos via
  `buildProducerPeriodDataset` e devolve os snapshots pontuados por período + flag `supported`.
- **`back-end/src/controllers/SuppliersCalculatedController.js`** _(mexido)_ — novo handler
  `producerPeriods` para o endpoint.
- **`back-end/src/routes/SuppliersCalculatedRoute.js`** _(mexido)_ — nova rota
  `GET /suppliers-calculated/periods?producerId=...` (declarada antes da rota genérica).
- **`back-end/src/schemas/supplierCalculatedSchema.js`** _(mexido)_ — `producerPeriodsQuerySchema`
  (validação do `producerId` obrigatório).
- **`back-end/src/docs/routes/SuppliersCalculatedRoute.js`** _(mexido)_ — documentação Swagger do
  novo endpoint.
- **`back-end/src/docs/config/schemas/suppliersCalculatedSchema.js`** _(mexido)_ — schemas Swagger
  `ProducerPeriodHistory` e `ProducerPeriodSnapshot`.
- **`back-end/src/services/Categorize/period-dataset.js`** _(reaproveitado)_ — passou a ser de fato
  utilizado (antes era código morto).

### Front-end (criado/mexido)
- **`front-end/src/components/produtor/PeriodComparisonPanel.vue`** _(criado)_ — painel que fixa o
  período mais recente e permite selecionar um período anterior, exibindo variação de pontuação,
  classificação (G1/G2/G3), CPP e a variação por categoria BPA.
- **`front-end/src/services/suppliersService.js`** _(mexido)_ — método `getProducerPeriods(producerId)`.
- **`front-end/src/views/ProducerDetailView.vue`** _(mexido)_ — carrega o histórico de períodos em
  segundo plano e renderiza o card de comparação **somente** quando `supported = true`.

---

## 2. Dados aparecem ao entrar na tela principal (sem precisar clicar em "Atualizar")

> _"Quando adentra a tela principal, os dados só aparecem quando aperta no botão 'atualizar', os
> dados deverão aparecer já quando o usuário adentrar na tela."_

- **`front-end/src/views/DashboardView.vue`** _(mexido)_ — adicionado `onMounted(load)` (o import de
  `onMounted` já existia, mas não estava sendo usado). A "Visão Geral" agora carrega automaticamente.
  _(A tela de Produtores já fazia `onMounted(load)`.)_

---

## 3. Gráfico de pizza (donut) da "Visão Geral" — fatias pequenas (ex.: G1 ~1%) visíveis

> _"O gráfico em pizza da tela 'visão geral' não mostra as 3 informações [...] Não é possível
> visualizar o G1 com claridade, pois ele está tão pequeno que só o G2 e G3 aparecem."_

- **`front-end/src/components/charts/DonutChart.vue`** _(mexido)_ — fatias com valor maior que zero
  passam a ter uma **fração mínima de arco** (`MIN_VISIBLE_FRACTION = 5%`), renormalizada para o anel
  fechar em 100%. Assim o G1 fica visível. As porcentagens da legenda continuam usando os valores
  **reais** (não são distorcidas). Também trocado `stroke-linecap` de `round` para `butt`, evitando
  que as pontas arredondadas de uma fatia cubram a fatia vizinha.

---

## 4. Barras com valores muito pequenos mais visíveis

> _"Tentar deixar as barras que têm valores muito pequenos mais visíveis."_

- **`front-end/src/components/charts/BarChart.vue`** _(mexido)_ — barras com valor maior que zero
  recebem uma **largura mínima visível** (`MIN_VISIBLE_PCT = 3%`), de modo que valores pequenos não
  desapareçam. O texto ao lado continua exibindo o valor real.

---

## Resumo dos arquivos

### Criados
- `front-end/src/components/produtor/PeriodComparisonPanel.vue`
- `front-end/docs/Alter.md` (este documento)

### Mexidos
**Front-end**
- `front-end/src/views/DashboardView.vue`
- `front-end/src/views/ProducerDetailView.vue`
- `front-end/src/services/suppliersService.js`
- `front-end/src/components/charts/DonutChart.vue`
- `front-end/src/components/charts/BarChart.vue`

**Back-end**
- `back-end/src/services/CategorizeService.js`
- `back-end/src/controllers/SuppliersCalculatedController.js`
- `back-end/src/routes/SuppliersCalculatedRoute.js`
- `back-end/src/schemas/supplierCalculatedSchema.js`
- `back-end/src/docs/routes/SuppliersCalculatedRoute.js`
- `back-end/src/docs/config/schemas/suppliersCalculatedSchema.js`

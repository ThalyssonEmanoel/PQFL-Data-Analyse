# Pedências 
- Faça o que for pedido abaixo primeiro e depois disso, no front-end, na tela principal existe o modal "Distribuição por grupo" aonde existe o gráfico e ao lado desse gráfico uma legenda de o que cada coluna do gráfico significa, quero que o usuário consiga clicar nessa informações no gráfico e que abaixo dele apeeça uma lista de "Todas ações padrões por categoria", ou seja, quero que mostre todas as ações que existem em cada grupo, g1,g2 e g3, isso é apenas para que o usuário consiga ver todos as atividades podem exister para cada usuário, pois ao entrar nos usuário em específicos, eles terão ações específicas para eles naquele grupo, pois ele tem cenários e cenários específicos e n necessariamente eles terão que fazer tudo aquilo que está presente na descrição do grupo...
- Em produtores, após escolher um produtor em consigo ver o "Detalhamento da pontuação"  aonde é possível ver as categorias, a pontuação marcada e a que é possível ser alcançada e por fim a quantidade de itens dentro dessa categoria, até ai perfeito, porém preciso saber quais campos constituem essas categorias. Com isso, quero implementrar a opção de poder clicar em uma das categorias e nisso expandir um modal, ou abrir uma extensão que mostre todos os campos dentro dessa categoria e quais desses campos que estão nos conformes... 

---

## Status: concluído

- [x] Back-end realinhado às 14 categorias oficiais (ver `back-end/docs/Anotações-5.md`).
- [x] Front-end `src/constants/bpa.js` atualizado para as 14 categorias + catálogo de ações padrão (`PBPA_ACTIONS_BY_CATEGORY`, `PAE_ACTIONS`, `G1_EXTRA_ACTIONS`) e helper `buildGroupActionCatalog`.
- [x] No card "Distribuição por grupo" (`DashboardView.vue`), o gráfico (donut) e os itens da legenda passaram a ser **clicáveis**.
- [x] Ao clicar em um grupo (G1/G2/G3), aparece **abaixo** a lista "Todas as ações padrões por categoria" daquele grupo (agrupada por categoria, + bloco PAE e ações preventivas de G1 quando aplicável).
- [x] Nota explicativa: a lista é a visão geral; cada produtor recebe apenas o subconjunto correspondente aos seus cenários específicos.
- [x] `npm run build` (Vite) sem erros.

### Item 2 — campos por categoria no "Detalhamento da pontuação"

- [x] Back-end: cada categoria em `actions.factorDiagnostics` agora traz `fields[]` (`questionId`, `label`, `imprescindivel`, `found`, `conforming`) — `scoring.js`, `SupplierCalculated.js`, Swagger.
- [x] Novo componente reutilizável `src/components/ui/BaseModal.vue` (Teleport, ESC, backdrop, trava o scroll do fundo).
- [x] Em `ProducerDetailView.vue`, as linhas da tabela "Detalhamento da pontuação" ficaram **clicáveis**; ao clicar abre um modal listando todos os campos da categoria e marcando **Conforme / Não conforme**, com selo "Imprescindível" e aviso de campo "Não encontrado no Coletum".
- [x] Fallback: dados calculados antes da atualização (sem `fields`) mostram aviso para recalcular.
- [x] `npm run build` (Vite) sem erros.

> Observação: como o cálculo armazenado precisa ser refeito para refletir as 14 categorias e o novo `fields[]`, rode `POST /suppliers-calculated/calculate` (admin) para que produtores já existentes exibam o detalhamento completo.


- [] Colocar numeração das categorias nos produtores individualmente;
- [] Tirar a tag imprescindível;
- [] Colocar opção de baixar os gráficos em pdf;
- [] Manter o histórico de log de atualização; 
- [] Tirar a coluna "peso";
- [] Criar endpoint com opção de exportar PDF do formulário;
- [] Colocar o mapa na tela principal com a localização de cada produtor representados com pontinhos.

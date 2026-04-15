# Feature 4

## Escalonamento Parte 2: Arquitetura de Cache e SSR

### Deslocamento do Processamento (Shift-Left)
- Modificar o arquivo `src/lib/pqfl/cache-store.ts`.
- Na função `refreshProducerCache`, após obter o array de payloads do Coletum (`fetchColetumAnswers`), invocar a função `mapAndScoreProducers` passando os dados crus.
- Modificar a estrutura do arquivo `answers_cache.json` para que ele salve os dados **já processados e pontuados** (o objeto `ProducerScoreResult`), em vez de salvar apenas o payload bruto.

### Otimização do Frontend (SSR)
- Ajustar os retornos da função `loadProducerCache` (e por consequência `getProducerPayloads` em `data-source.ts`) para entregarem a lista já pontuada.
- Limpar o arquivo `src/app/page.tsx`: remover a chamada ou a dependência de processamentos pesados (como a re-execução do scoring via `buildProducerPeriodDataset`) no carregamento da página. O Dashboard deve apenas receber os dados do JSON cacheados, filtrar, e renderizar os componentes na tela.
# Feature 1

## Correção do Nome do Produtor

### Correção da Expressão Regular (Heurística)
- Preciso alterar a variável `producerNameWords` dentro do arquivo `src/lib/pqfl/scoring.ts` (especificamente na função `scoreIdentityField`);
- Preciso remover os termos `metausername` e `username` da string de RegEx para evitar bonificação indevida dos metadados injetados pelo Coletum;
- Tenho que arranjar um jeito de conseguir os nomes de uma forma melhor, atualmenete o nome dos produtores/fornecedores
é nome350925. 

## Escalonamento Parte - 1
### Elevação de Expressões Regulares (RegEx)
- No arquivo `src/lib/pqfl/scoring.ts`, identificar todas as RegEx que estão sendo instanciadas repetidamente dentro de loops ou funções como `scoreIdentityField` (ex: `commonIdentityWords`, `producerNameWords`, `propertyWords`).
- Mover essas declarações de RegEx para o escopo global (topo do arquivo ou fora das funções principais) para que sejam compiladas apenas uma vez na subida do servidor.

### Criação de Índice (Dicionário O(1)) no Payload
- Na função `mapAndScoreProducer`, logo após criar o `flatPayload` usando `flattenPayload`, criar um `Map` (Hash Map) em TypeScript.
- Iterar sobre o `flatPayload` uma única vez.
- Para cada chave, aplicar a função `normalizeFieldName` e salvar o resultado no `Map` no formato: `chaveNormalizada => { chaveOriginal, valor }`.

### Refatoração das Funções de Busca Linear
- Refatorar a função `findFieldByCandidate` para que ela pare de usar `Object.entries(flatPayload)` (loop linear N). Ela deve passar a consultar diretamente o `Map` criado no passo anterior usando `Map.get(candidatoNormalizado)`.
- Refatorar funções similares (como `hasResiduePresence` e `getHighestNumericValueByHint`) para aproveitar o `Map` pré-calculado, evitando a execução da função `normalizeToken()` milhares de vezes por requisição.
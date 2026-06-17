Descrição detalhada dos cálculos e classificações do PQFL

1) Onde as regras estão implementadas
- As regras de pontuação, classificação e planos de ação estão em src/services/Categorize/scoring.js e src/services/Categorize/constants.js.
- A agregação por período e catálogo de ações por grupo estão em src/services/Categorize/period-dataset.js.
- Tudo o que for pedido nesse arquivo os dados os cálculos feitos deverão ser salvo no banco "suppliers-calculated".
- Schema mínimo de "suppliers-calculated": _id do fornecedor (referência ao _id do documento em suppliers), classificação do grupo, planos de ações definidos para aquele fornecedor.
- O filtro por nome no GET deve usar o mesmo campo do payload original: answer._nome350925.
- Deverá ter dois novos endpoints: um POST que pega TODOS OS FORNECEDORES presentes no Mongo, faz o cálculo e salva em "suppliers-calculated"; e um GET que busca esses dados com parâmetros page, page_size, _id e nome.
- O POST deve fazer upsert incremental (atualiza ou insere por _id do fornecedor), sem apagar os registros existentes.
- Não é para apagar ou modificar os endpoints atuais; apenas implementar esses novos.
- No service importe as funções de cálculo dos arquivos dentro da pasta "Categorize", modifique-os se necessário.

2) Quais campos entram no cálculo e como são associados a categorias (campos selecionados)
2.1) Categorias BPA com peso (o peso é por categoria, não por campo)
Cada categoria tem um peso oficial (somam 100 pontos):
- Gestão da propriedade (10%)
- Manejo sanitário (20%)
- Manejo de ordenha e pós-ordenha (20%)
- Refrigeração e estocagem do leite (15%)
- Manejo alimentar e armazenamento de alimentos (10%)
- Qualidade da água (8%)
- Uso racional e estocagem de produtos químicos (6%)
- Manejo de resíduos (5%)
- Manutenção preventiva (3%)
- Capacitação e controle de pragas (3%)###Observar o documento Anotações-5.md

2.2) Campos oficiais por categoria (OFFICIAL_FACTOR_FIELDS)
Esses campos são considerados prioritários para diagnóstico e conformidade. Para cada item abaixo, o sistema procura uma das chaves indicadas (keys) no payload bruto do Coletum.

Gestão da propriedade:
- Possui energia elétrica: possuiEnergiaEletrica842360 | energia_eletrica
- Energia elétrica estável: aEnergiaEletricaEEstavelAMaiorParteDoTempo842361 | energia_estavel
- Possui acesso à internet: possuiAcessoAInternet842362 | internet
- Leite é atividade principal: oLeiteEAPrincipalAtividadeDaPropriedade842370 | leite_atividade_principal

Manejo sanitário:
- Possui calendário sanitário: possuiCalendarioSanitarioVacinacoesEndoEEctoparasitasEtc842452 | calendario_sanitario
- Realiza exames anuais: realizaExameDeBruceloseETuberculoseAnualmente842453 | exames_anuais
- Procedimento para colostro: haProcedimentoImplantadoParaOColostroDasBezerras842455 | procedimento_colostro
- Controle de mastite: existeOControleDeAnimaisDoentesEProtocoloBemDefinidoParaTratamentoDasMastitesClinicas842457 | controle_mastite
- Cultura microbiológica: eRealizadoCulturaMicrobiologicaDasVacasEmLactacaoComMastite842458 | cultura_mastite

Manejo de ordenha e pós-ordenha:
- Linha de ordenha: eAdotadaLinhaDeOrdenhaexAnimaisSaudaveisPrimeiro842430 | linha_ordenha
- Alimenta após ordenha: asVacasSaoAlimentadasAposAOrdenha842436 | alimenta_apos_ordenha
- Utiliza pré-dipping: utilizaPre_dippingAntesDaOrdenha842439 | pre_dipping
- Utiliza pós-dipping: utilizaSolucaoPos_dippingAposAOrdenha842440 | pos_dipping

Refrigeração e estocagem do leite:
- Tanque proporcional à produção: oTanquePossuiCapacidadeProporcionalAoVolumeDeProducao842416 | tanque_proporcional
- Controle de temperatura do tanque: existeAlgumControleDaTemperaturaAnotacoesDoTanqueDeExpansao842417 | controle_temperatura

Manejo alimentar e armazenamento:
- Volumoso suficiente: entravistadorPossuiVolumosoEmQuantidadeSuficienteParaORebanhoOAnoTodo842464 | volumoso_suficiente
- Armazenamento adequado de alimentos: entrevistadorOsAlimentosRacaoVolumosoESalSaoArmazenadosDeFormaAdequada842468 | armazenamento_adequado
- Análise de solo anual: realizaAnaliseDeSoloAoMenosUmaVezAoAno842469 | analise_solo
- Dieta por fase de lactação: existeAlgumaDiferenciacaoDePastejoOuDietaDeAcordoComFaseDeLactacao842471 | dieta_fase_lactacao

Qualidade da água:
- Bem-estar geral com água disponível: entrevistadorDeModoGeralAsInstalacoesDaPropriedadeGarantemOBem_estarAnimalSombraAlimentoDisponibilidadeDeAgua842486 | bem_estar_geral

Uso racional e estocagem de químicos:
- Registro de defensivos: haRegistroDeAplicacaoDeDefensivosReceituariosAgronomicos842473 | registro_defensivos
- Respeita período de carência: saoRespeitadosOPeriodoDeCarenciaDosProdutosConformeRecomendacaoTecnica842477 | carencia_respeitada

Manejo de resíduos:
- Procedimento descarte de leite inadequado: existeProcedimentosDescritosParaODescarteDoLeiteInadequadoParaConsumo842481 | descarte_leite

Manutenção preventiva:
- Ambiente de trabalho limpo: entrevistadorOAmbienteDeTrabalhoELimpoEOrganizado842482 | ambiente_limpo
- Instalações adequadas ao bem-estar: entrevistadorAsInstalacoesDaPropriedadeGarantemBem_estarAnimal842483 | instalacoes_bem_estar

Capacitação e controle de pragas:
- Treinamentos periódicos: asPessoasEnvolvidasNaAtividadeLeiteiraPassamPorTreinamentosPeriodicos842461 | treinamentos_periodicos
- Registro de treinamentos: haRegistroDeTreinamentosRealizadosSobreOManejoRacionalVisandoBem_estarAnimal842487 | registro_bem_estar

2.3) Campos por hints (DEFAULT_CATEGORY_FIELD_HINTS)
Se não existirem campos oficiais encontrados para a categoria, o sistema usa hints para mapear perguntas para categorias. Exemplos de hints:
- gestaoPropriedade: gestao, propriedade, registro, anotacao, controle, financeiro, zootecnico, assistencia, sucessao, renda
- manejoSanitario: sanitario, vacin, brucelose, tuberculose, mastite, curaumbigo, doente, tratamento, medicament, cultura, carrapato, colostro
- manejoOrdenhaPosOrdenha: ordenha, predipping, posdipping, cmt, caneca, toalha, tetos, linhaordenha, colostral
- refrigeracaoEstocagemLeite: tanque, refriger, resfri, temperatura, estocagem, acessaotanque, capacidadedotanque
- manejoAlimentarArmazenamento: aliment, volumoso, silagem, feno, racao, cocho, pastejo, insumo, estoque, aquisicao
- qualidadeAgua: agua, potavel, potabilidade, reservatorio, captacao, cloro, higienizado
- usoRacionalQuimicos: defensivo, veterinario, carencia, agronomico, farmacia, armazenamentodosdefensivos, usoquimico
- manejoResiduos: dejeto, destinacao, descarte, efluente, residuoinadequado, fertilizacao
- manutencaoPreventiva: manutencao, equipamento, ordenhadeira, veterinario, agricola, cronograma, registrodasmanutencoes
- capacitacaoControlePragas: treinamento, capacit, pragas, controledepragas, registrodetreinamentos, bemestaranimal

Esses hints são aplicados sobre o nome do campo normalizado (minúsculo, sem acentos, sem sufixo numérico).

3) Como os valores são normalizados para pontuação (normalizeAnswerToScore)
O sistema transforma respostas em uma nota 0..1 para cada campo:
- booleano: true -> 1, false -> 0
- número 0..1: usa direto
- número 0..100: divide por 100
- strings reconhecidas:
  - positivo (sim/yes/true/conforme/adequado/ok/atende) -> 1
  - parcial (parcial/parcialmente/em parte/médio/moderado) -> 0.5
  - negativo (não/no/false/naoconforme/inadequado/naoatende) -> 0
Se não for reconhecido, o campo não entra na pontuação.

4) Como o cálculo dos pesos funciona (pontuação por categoria e total)
Para cada categoria BPA:
- Se existirem campos oficiais mapeados (OFFICIAL_FACTOR_FIELDS):
  - Calcula conformidade = (itens conformes / total de itens oficiais).
  - rawScore = conformidade.
- Se não existirem campos oficiais mapeados:
  - Usa os campos capturados pelos hints da categoria.
  - rawScore = média dos scores 0..1 desses campos.

Pontuação ponderada da categoria:
- weightedScore = rawScore * peso_da_categoria

Pontuação total:
- totalScore = soma de weightedScore de todas as categorias
- Resultado final arredondado para 2 casas.

Observação: campos com resposta pontuável, mas sem categoria encontrada, ficam em unmappedScoredFields e não entram no cálculo.

5) Como é definido o grupo do produtor (G1/G2/G3)
- G1: totalScore >= 80
- G2: totalScore >= 50 e < 80
- G3: totalScore < 50

6) Gatilhos e planos de ação (PAE e PBPA)
6.1) PAE (Plano de Ações Emergenciais)
- CPP: o sistema procura o maior valor numérico em campos que contenham hints (cpp, cppultimaanalise, contagempadrao). Se cpp > 300000, entra PAE.
- Resíduos: detecta presença de resíduos por hints (presencaresiduo, residuosmedicamentosnoleite, residuoleite, resultadoresiduo, antibiotico, inibidor). Se positivo, entra PAE.

Ações PAE (PAE_ACTIONS):
- cpp:
  - Realizar visita in loco e corrigir pontos críticos ligados à qualidade do leite.
  - Registrar as ações em ficha de visita e acompanhar resultados laboratoriais.
- residuos:
  - Investigar origem do resíduo e corrigir procedimento imediatamente.
  - Reforçar controle de tratamentos e período de carência antes da entrega.

6.2) PBPA (Plano de Boas Práticas)
- Primeiro critério: categorias oficiais com conformidade <= lowScoreThreshold (padrão 0.5).
- Se nenhuma categoria entrar por esse critério, usa fallback: categorias com rawScore <= lowScoreThreshold e com questionCount > 0.
- As ações PBPA são a união (sem repetição) das listas em PBPA_ACTIONS_BY_CATEGORY.

7) Plano de ação por grupo (catálogo do dashboard)
Implementado em buildGroupActionCatalog:
- Para G3: inclui todas as categorias BPA (logo, todas as ações PBPA).
- Para G1/G2: coleta as categorias PBPA dos produtores do grupo e monta o catálogo.
- Se não houver categorias mapeadas, usa todas as categorias BPA (fallback).
- Se o grupo não for G1, ou se houver qualquer produtor em PAE no grupo, inclui ações PAE (cpp e resíduos).
- Para G1 há ações extras:
  - Manter plano preventivo com monitoramento mensal de indicadores de qualidade.
  - Consolidar evidências de boas práticas para evitar regressão de classificação.

8) Plano de ação por produtor (diagnóstico individual)
No diagnóstico individual, as ações são montadas assim:
- factorDiagnostics é calculado a partir dos campos oficiais e indica, por categoria:
  - conformidade e gap (1 - conformidade)
  - campos checados e campos com falha (failedFieldLabels)
- O plano recomendado por problemática inclui todas as categorias com gap > 0, exibindo:
  - lista de evidências (labels dos campos falhos)
  - ações recomendadas da categoria (PBPA_ACTIONS_BY_CATEGORY)
- PAE: se houver motivos (CPP alto ou resíduo), mostra as razões e as ações PAE.
- PBPA: lista as categorias com nota baixa e as ações agregadas.

9) Identificação de produtor (não interfere na pontuação)
- producerId e producerName são inferidos por hints e heurísticas (DEFAULT_ID_FIELD_HINTS, DEFAULT_NAME_FIELD_HINTS).
- Isso serve apenas para identificar e agrupar histórico, não entra no score.

10) Observações para separar back-end do front-end
- Toda a lógica de pontuação e classificação hoje está em src/lib/pqfl (front-end/SSR).
- Ao separar, mova scoring.ts, domain/constants.ts e domain/types.ts para o back-end e exponha um endpoint que retorne ProducerScoreResult.
- O front-end pode ficar apenas consumindo o resultado pronto (totalScore, group, categoryScores e actions).
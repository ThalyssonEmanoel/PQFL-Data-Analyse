# Ações por grupo, questões do webservice e pesos

Este documento resume:

1. As ações existentes por grupo de produtores (P1, P2, P3).
2. As ações por fator PQFL e por evento PAE.
3. As questões vindas do webservice (Coletum) que entram nos calculos com peso.

Fontes principais:

- services.py (ActionEngine e classificacão de grupos)
- domain_constants.py (ações, mapeamentos de questões e pesos)
- queries.py (campos da query GraphQL)

## 1) Ações existentes por grupo de produtores (P1-P3)

Origem: ActionEngine.BASE_ACTIONS

### Grupo P1

- Manter protocolos atuais e reforcar treinamentos trimestrais.
- Documentar boas praticas e compartilhar com outros produtores.

### Grupo P2

- Planejar análise de solo e ajuste fino da dieta.
- Expandir uso de registros zootecnicos para ganho genetico.

### Grupo P3

- Implementar controle leiteiro mensal e identificar gargalos.
- Priorizar assistencia tecnica para manejo sanitario.
- Adotar plano emergencial de higiene e bem-estar animal.
- Restabelecer registros financeiros basicos e metas semanais.

## 2) Outras ações existentes por grupo de fator

## 2.1) Ações por fator PQFL

Origem: PQFL_FACTOR_ACTIONS

### gestão

- Atualizar diagnostico anual da propriedade e revisar plano de ação com o produtor.
- Registrar orientações em ficha de visita e acompanhar evolucão de categoria no monitoramento anual.

### manejo_sanitario

- Regularizar calendario sanitario e exames obrigatorios com apoio tecnico de campo.
- Executar visita in loco para ajustar protocolo de mastite e manejo de animais doentes.

### manejo_ordenha

- Padronizar rotina de ordenha e pos-ordenha com foco em pre-dipping, pos-dipping e linha de ordenha.
- Reforcar orientacão pratica na propriedade e registrar evidencias na ficha de visita.

### refrigeracão

- Verificar capacidade do tanque e temperatura de estocagem para evitar não conformidade do leite.
- Corrigir falhas de refrigeracão com plano de manutenção e checklist diario de controle.

### manejo_alimentar

- Ajustar planejamento alimentar e armazenamento de insumos para reduzir risco produtivo.
- Implementar orientação técnica sobre dieta por fase de lactação e disponibilidade de volumoso.

### qualidade_agua

- Avaliar disponibilidade e qualidade de agua para animais e higienização dos processos.
- Corrigir pontos criticos de abastecimento e monitorar condicoes na visita tecnica.

### uso_quimicos

- Regularizar armazenamento, rastreabilidade e uso racional de produtos quimicos e medicamentos.
- Reforcar cumprimento de carencia e registro de aplicações para seguranca do leite.

### manejo_residuos

- Implementar rotina formal de manejo de residuos, dejetos e descarte de leite improprio.
- Registrar ação corretiva e verificar aderencia no ciclo seguinte de monitoramento.

### manutenção

- Executar manutenção preventiva e calibragem de equipamentos e utensilios da ordenha.
- Criar checklist periodico de manutenção com responsavel definido na propriedade.

### capacitação_pragas

- Promover capacitação tecnica com registro de presenca e plano de aplicação pratica.
- Incluir ações de controle integrado de pragas no roteiro de visitas de campo.

## 2.2) Ações PAE (qualidade/residuos)

Origem: PAE_ACTIONS

### cpp

- Realizar visita in loco para orientação corretiva sempre que houver não conformidade recorrente de qualidade.
- Registrar todas as ações na ficha de visita e acompanhar evolução dos resultados laboratoriais.

### residuos

- Investigar origem do residuo e orientar correção imediata dos procedimentos na propriedade.
- Reforcar conferencia de tratamentos e periodo de carencia antes da entrega do leite.


## 3) Classificação em grupos P1-P3

Origem: DataRepository._classify

Formula do score:

score = (0.45 * produção + 0.20 * capacidade + 0.25 * tech_ratio + 0.10 * pessoas) * 100

Faixas de grupo:

- P1: score >= 75
- P2: score >= 55 e < 75
- P3: score < 55

Campos da query usados no score:

| Bloco | Alias da query | Campo webservice (legacy) | Peso no score final |
|---|---|---|---|
| Produção | producao_media_diaria | producaoMediaDiaria842366 | 45% |
| Capacidade | capacidade_tanque | qualACapacidadeDoTanqueDeExpansao842415 | 20% |
| Pessoas | pessoas_envolvidas | quantasPessoasEstaoEnvolvidasNaAtividadeLeiteira842372 | 10% |
| Tecnologia (media booleana) | 29 questões binarias | ver lista em 3.4 | 25% total |

Observação tecnica:

- O bloco Tecnologia calcula media de flags binarias.
- Na estrutura interna atual, cada questão booleana aparece em chave legacy e em chave alias (58 chaves no total), mas isso mantem peso equivalente por questão unica.
- Peso equivalente por questão unica no bloco Tecnologia: 25% / 29 = 0.8621%.

## 3.2) Pesos por fator PQFL (BPA_WEIGHTS)

Origem: BPA_WEIGHTS + BPA_FIELDS_MAP

| Fator | Peso do fator | Qtde de questões | Peso equivalente por questão | Questões individual |
|---|---:|---:|---:|---|
| gestão | 10% | 4 | 2.50% | energia_eletrica, energia_estavel, internet, leite_atividade_principal |
| manejo_sanitario | 20% | 5 | 4.00% | calendario_sanitario, exames_anuais, procedimento_colostro, controle_mastite, cultura_mastite |
| manejo_ordenha | 20% | 4 | 5.00% | linha_ordenha, alimenta_apos_ordenha, pre_dipping, pos_dipping |
| refrigeracão | 15% | 2 | 7.50% | tanque_proporcional, controle_temperatura |
| manejo_alimentar | 10% | 4 | 2.50% | volumoso_suficiente, armazenamento_adequado, analise_solo, dieta_fase_lactação |
| qualidade_agua | 8% | 1 | 8.00% | bem_estar_geral |
| uso_quimicos | 6% | 2 | 3.00% | registro_defensivos, carencia_respeitada |
| manejo_residuos | 5% | 1 | 5.00% | descarte_leite |
| manutencão | 3% | 2 | 1.50% | ambiente_limpo, instalacoes_bem_estar |
| capacitacão_pragas | 3% | 2 | 1.50% | treinamentos_periodicos, registro_bem_estar |

Observação tecnica importante:

- No estado atual do codigo, BPA_WEIGHTS esta definido, mas não esta sendo aplicado diretamente em calculos de score/filtro.
- O diagnostico por fator usa conformidade media simples por fator (sem ponderação por BPA_WEIGHTS).

## 3.3) Pesos do IBP (Indice de Boas Praticas)

Origem: IBP_COMPONENT_WEIGHTS + IBP_COMPONENT_FIELDS + calculate_ibp

Formula:

IBP = media_ponderada(componentes) * 100

| Componente IBP | Peso do componente | Qtde de questões | Peso equivalente por questão | questões (alias da query) |
|---|---:|---:|---:|---|
| vacinação | 30% | 1 | 30.00% | calendario_sanitario |
| exames | 20% | 1 | 20.00% | exames_anuais |
| ordenha | 30% | 5 | 6.00% | linha_ordenha, alimenta_apos_ordenha, pre_dipping, pos_dipping, controle_mastite |
| treinamentos | 20% | 2 | 10.00% | treinamentos_periodicos, registro_bem_estar |

## 3.4) Lista das 29 questões bloco Tecnologia (classificação P1-P3)

Origem: BOOLEAN_FLAGS e mapeamento de aliases da query

1. energia_eletrica
2. energia_estavel
3. internet
4. leite_atividade_principal
5. tanque_proporcional 
6. controle_temperatura
7. linha_ordenha 
8. alimenta_apos_ordenha
9. pre_dipping 
10. pos_dipping
11. calendario_sanitario
12. exames_anuais
13. procedimento_colostro
14. controle_mastite 
15. cultura_mastite 
16. treinamentos_periodicos
17. volumoso_suficiente 
18. armazenamento_adequado
19. analise_solo 
20. dieta_fase_lactacão
21. aplicou_defensivos 
22. registro_defensivos
23. carencia_respeitada
24. descarte_leite 
25. ambiente_limpo 
26. instalacoes_bem_estar
27. bem_estar_geral 
28. registro_bem_estar
29. outros_produtores_tanque

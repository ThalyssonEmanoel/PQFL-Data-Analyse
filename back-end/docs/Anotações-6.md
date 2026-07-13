## 1. O que o sistema já tem

### PAE — Plano de Ações Emergenciais

- **Detecção de CPP acima do limite:** o sistema identifica `CPP > 300.000`
  (`scoring.js`, linha ~745) e dispara `PAE_ACTIONS.cpp`.
  Corresponde à **Ação 1 do PAE**.
- **Detecção de resíduos:** a função `hasResiduePresence` identifica presença de
  resíduos/substâncias estranhas e dispara `PAE_ACTIONS.residuos`.
  Corresponde à **Ação 2 do PAE**.

### PBPA — Plano de Ações de Boas Práticas Agropecuárias 

- **Ações corretivas por categoria BPA:** o sistema gera recomendações por
  categoria através de `PBPA_ACTIONS_BY_CATEGORY` (14 categorias de BPA).
  Isso cobre bem a **orientação técnica por item de BPA**.
- **Comparação por período:** `getProducerPeriodHistory`
  (`CategorizeService.js`, linha ~101) compara período a período e captura a
  mudança de grupo do produtor.
- **Faixas de classificação:** alinhadas ao documento
  (≥ 80 → G1 "Profissionais"; 50–79 → G2 "Potenciais"; < 50 → G3 "Resistentes").


## 2. Diferenças principais:

- O pdf possui**10 categorias** o sistema possui **14 categorias**.
- Os pesos do sistema são **derivados proporcionalmente ao número de perguntas
  S/N** de cada categoria e não seguem o pdf exatamente.
- Consequência: a **pontuação e a classificação atuais divergem da metodologia
  oficial** da Versão 4.


## 3. Resumo

- **PAE:** implementado; falta apenas explicitar a **suspensão de coleta** na
  ação de resíduos.
- **PBPA:** as ações corretivas por item de BPA existem, mas os **três
  indicadores/ações da seção 6.2** (redução de visitas, % de evolução de
  categoria e capacitações) **não estão implementados** — há apenas suporte
  parcial para a evolução de categoria.
- **Pontuação do PBPA:** os **pesos divergem** da tabela oficial da Versão 4 e
  precisam ser realinhados.

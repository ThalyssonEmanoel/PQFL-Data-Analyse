// Espelho, no front-end, das constantes de dominio do back-end
// (back-end/src/services/Categorize/constants.js e scoring.js).
// Mantem rotulos, ordem, pesos e cores consistentes com a regra de negocio do PQFL.

// 14 categorias BPA (itens I a XIV do checklist oficial do Manual PQFL / MAPA).
// Os pesos sao proporcionais ao numero de perguntas com campo S/N por categoria
// (derivados no back-end; somam ~100). A ordem segue o checklist oficial.
export const BPA_CATEGORIES = [
  { key: "gestaoPropriedade", label: "Gestão da propriedade", weight: 19.35 },
  { key: "gestaoInsumos", label: "Gestão de insumos", weight: 3.23 },
  { key: "manejoSanitario", label: "Manejo sanitário", weight: 12.9 },
  { key: "manejoAlimentarArmazenamento", label: "Manejo alimentar e armazenamento de alimentos", weight: 12.9 },
  { key: "qualidadeAgua", label: "Qualidade da água", weight: 6.45 },
  { key: "higienePessoalSaude", label: "Higiene pessoal e saúde dos trabalhadores", weight: 3.23 },
  { key: "controleIntegradoPragas", label: "Controle integrado de pragas", weight: 1.61 },
  { key: "capacitacaoTrabalhadores", label: "Capacitação dos trabalhadores", weight: 3.23 },
  { key: "manejoOrdenhaPosOrdenha", label: "Manejo de ordenha e pós-ordenha", weight: 14.52 },
  { key: "refrigeracaoEstocagemLeite", label: "Refrigeração e estocagem do leite", weight: 4.84 },
  { key: "manejoResiduosDejetos", label: "Manejo de resíduos e tratamento de dejetos e efluentes", weight: 4.84 },
  { key: "usoRacionalQuimicos", label: "Uso racional e estocagem de produtos químicos e medicamentos veterinários", weight: 6.45 },
  { key: "manutencaoPreventiva", label: "Manutenção preventiva e calibragem de equipamentos", weight: 3.23 },
  { key: "bemEstarAnimal", label: "Adoção de práticas de manejo racional e de bem-estar animal", weight: 3.23 },
];

// Classificacao por grupo (back-end: classifyProducer).
//  G1: totalScore >= 80 | G2: >= 50 | G3: < 50
export const GROUPS = {
  G1: {
    key: "G1",
    label: "G1 — Excelência",
    short: "G1",
    description: "Pontuação ≥ 80. Fornecedor consolidado nas boas práticas.",
    color: "#16a34a",
    soft: "rgba(22, 163, 74, 0.12)",
  },
  G2: {
    key: "G2",
    label: "G2 — Em evolução",
    short: "G2",
    description: "Pontuação entre 50 e 79. Em desenvolvimento, requer acompanhamento.",
    color: "#f59e0b",
    soft: "rgba(245, 158, 11, 0.14)",
  },
  G3: {
    key: "G3",
    label: "G3 — Atenção",
    short: "G3",
    description: "Pontuação < 50. Prioridade de intervenção técnica.",
    color: "#ef4444",
    soft: "rgba(239, 68, 68, 0.12)",
  },
};

export const GROUP_ORDER = ["G1", "G2", "G3"];

// Limite de CPP (Contagem Padrão em Placas) que dispara PAE Grupo 1 (back-end: scoring.js).
export const CPP_LIMIT = 300000;

// Retorna metadados do grupo com fallback seguro.
export function groupMeta(group) {
  return GROUPS[group] || {
    key: group || "—",
    label: group || "Sem grupo",
    short: group || "—",
    description: "",
    color: "#94a3b8",
    soft: "rgba(148, 163, 184, 0.12)",
  };
}

// Mapa key -> label das categorias, para lookups rapidos.
export const CATEGORY_LABELS = BPA_CATEGORIES.reduce((acc, c) => {
  acc[c.key] = c.label;
  return acc;
}, {});

// ---------------------------------------------------------------------------
// Catalogo de acoes padrao (espelho de PBPA_ACTIONS_BY_CATEGORY, PAE_ACTIONS e
// das acoes extras de G1 no back-end). Usado para exibir, no dashboard, todas as
// acoes padrao que podem existir em cada grupo (G1/G2/G3) — visao geral; cada
// produtor recebe um subconjunto especifico conforme seus cenarios reais.
// ---------------------------------------------------------------------------

export const PBPA_ACTIONS_BY_CATEGORY = {
  gestaoPropriedade: [
    "Implantar registros zootécnicos e financeiros (receitas, despesas, coberturas, nascimentos, controle leiteiro).",
    "Estabelecer assistência técnica regular e acompanhar a evolução dos indicadores da propriedade.",
  ],
  gestaoInsumos: [
    "Implantar controle de estoque e calendário de aquisição de insumos.",
    "Organizar a compra de insumos para evitar falta de produtos críticos (detergentes, CMT, peças).",
  ],
  manejoSanitario: [
    "Regularizar calendário sanitário e exames obrigatórios (brucelose, tuberculose).",
    "Ajustar protocolo de mastite, colostro e manejo de animais doentes com visita técnica.",
  ],
  manejoAlimentarArmazenamento: [
    "Ajustar planejamento alimentar, dieta por fase de lactação e disponibilidade de volumoso.",
    "Adequar armazenamento de alimentos e produtos químicos e realizar análise/correção de solo.",
  ],
  qualidadeAgua: [
    "Higienizar reservatórios e garantir potabilidade da água usada na limpeza de equipamentos.",
    "Realizar análise da qualidade da água e implantar tratamento (ex.: cloração).",
  ],
  higienePessoalSaude: [
    "Disponibilizar EPIs e garantir local adequado para higiene pessoal (água e sabão).",
    "Orientar a equipe sobre higiene pessoal e uso correto dos equipamentos de proteção.",
  ],
  controleIntegradoPragas: [
    "Implantar estratégia de controle integrado de pragas na propriedade.",
    "Monitorar focos de pragas e registrar as ações de controle realizadas.",
  ],
  capacitacaoTrabalhadores: [
    "Promover treinamentos periódicos com evidências de participação.",
    "Registrar os treinamentos realizados (fotos, listas de presença, certificados).",
  ],
  manejoOrdenhaPosOrdenha: [
    "Padronizar a rotina de ordenha, linha de ordenha e higiene de equipamentos/utensílios.",
    "Implantar testes de caneca de fundo preto e CMT e separar a ordenha de vacas em tratamento.",
  ],
  refrigeracaoEstocagemLeite: [
    "Verificar capacidade do tanque e rotina de controle de temperatura do leite.",
    "Manter a área de armazenamento do leite limpa e adequada à refrigeração.",
  ],
  manejoResiduosDejetos: [
    "Implantar manejo adequado de esterco e tratamento de efluentes da ordenha.",
    "Definir procedimentos para descarte do leite inadequado e de resíduos sólidos.",
  ],
  usoRacionalQuimicos: [
    "Regularizar uso, estocagem e rastreabilidade de agroquímicos e medicamentos veterinários.",
    "Reforçar período de carência e registro de aplicações e treinamentos.",
  ],
  manutencaoPreventiva: [
    "Executar manutenção preventiva e calibragem dos equipamentos.",
    "Criar cronograma periódico de manutenção com responsável definido e registro das execuções.",
  ],
  bemEstarAnimal: [
    "Adequar instalações e técnicas de manejo para garantir o bem-estar animal.",
    "Registrar treinamentos de manejo racional visando o bem-estar animal.",
  ],
};

// Acoes do Plano de Acao Emergencial (PAE).
export const PAE_ACTIONS = {
  cpp: [
    "Realizar visita in loco e corrigir pontos críticos ligados à qualidade do leite.",
    "Registrar as ações em ficha de visita e acompanhar resultados laboratoriais.",
  ],
  residuos: [
    "Investigar origem do resíduo e corrigir procedimento imediatamente.",
    "Reforçar controle de tratamentos e período de carência antes da entrega.",
  ],
};

// Acoes extras aplicadas ao grupo G1 (back-end: buildGroupActionCatalog).
export const G1_EXTRA_ACTIONS = [
  "Manter plano preventivo com monitoramento mensal de indicadores de qualidade.",
  "Consolidar evidências de boas práticas para evitar regressão de classificação.",
];

// Monta o catalogo de acoes padrao de um grupo, agrupado por categoria.
// Espelha back-end/src/services/Categorize/period-dataset.js (buildGroupActionCatalog):
//  - G3: todas as categorias BPA.
//  - G1/G2: categorias que aparecem nos PBPA dos produtores do grupo (uniao);
//           sem produtores carregados, cai no fallback de todas as categorias.
//  - Acoes PAE entram quando o grupo nao e G1 ou ha algum produtor em PAE no grupo.
//  - G1 recebe as acoes extras preventivas.
//
// `items` sao os fornecedores calculados ja carregados no dashboard
// (cada um com actions.pbpaCategories e actions.inPAE).
export function buildGroupActionCatalog(group, items = []) {
  const inGroup = items.filter((it) => it.group === group);

  const categorySet = new Set();
  if (group === "G3") {
    BPA_CATEGORIES.forEach((c) => categorySet.add(c.key));
  } else {
    inGroup.forEach((it) => {
      (it.actions?.pbpaCategories || []).forEach((k) => categorySet.add(k));
    });
  }
  if (categorySet.size === 0) {
    BPA_CATEGORIES.forEach((c) => categorySet.add(c.key));
  }

  const categories = BPA_CATEGORIES.filter((c) => categorySet.has(c.key)).map((c) => ({
    key: c.key,
    label: c.label,
    actions: PBPA_ACTIONS_BY_CATEGORY[c.key] || [],
  }));

  const hasPaeInGroup = inGroup.some((it) => it.actions?.inPAE);
  const includePae = group !== "G1" || hasPaeInGroup;
  const paeActions = includePae ? [...PAE_ACTIONS.cpp, ...PAE_ACTIONS.residuos] : [];

  const extraActions = group === "G1" ? [...G1_EXTRA_ACTIONS] : [];

  const totalActions =
    categories.reduce((sum, c) => sum + c.actions.length, 0) + paeActions.length + extraActions.length;

  return { categories, paeActions, extraActions, totalActions };
}

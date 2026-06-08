// Espelho, no front-end, das constantes de dominio do back-end
// (back-end/src/services/Categorize/constants.js e scoring.js).
// Mantem rotulos, ordem, pesos e cores consistentes com a regra de negocio do PQFL.

// 10 categorias BPA (Boas Praticas Agropecuarias). A soma dos pesos e 100.
export const BPA_CATEGORIES = [
  { key: "gestaoPropriedade", label: "Gestão da propriedade", weight: 10 },
  { key: "manejoSanitario", label: "Manejo sanitário", weight: 20 },
  { key: "manejoOrdenhaPosOrdenha", label: "Manejo de ordenha e pós-ordenha", weight: 20 },
  { key: "refrigeracaoEstocagemLeite", label: "Refrigeração e estocagem do leite", weight: 15 },
  { key: "manejoAlimentarArmazenamento", label: "Manejo alimentar e armazenamento", weight: 10 },
  { key: "qualidadeAgua", label: "Qualidade da água", weight: 8 },
  { key: "usoRacionalQuimicos", label: "Uso racional de produtos químicos", weight: 6 },
  { key: "manejoResiduos", label: "Manejo de resíduos", weight: 5 },
  { key: "manutencaoPreventiva", label: "Manutenção preventiva", weight: 3 },
  { key: "capacitacaoControlePragas", label: "Capacitação e controle de pragas", weight: 3 },
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

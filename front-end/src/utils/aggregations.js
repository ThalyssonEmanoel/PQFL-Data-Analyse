import { BPA_CATEGORIES, GROUP_ORDER } from "@/constants/bpa.js";

// Agrega a lista de fornecedores calculados em metricas para o dashboard.
// Espelha a estrutura produzida pelo back-end (CategorizeService/scoring.js).
export function buildDashboardStats(items = []) {
  const total = items.length;

  const groupCounts = { G1: 0, G2: 0, G3: 0 };
  let inPAE = 0;
  let scoreSum = 0;
  let residueCount = 0;

  // Acumula rawScore por categoria para tirar a media (0..1).
  const categoryAcc = {};
  for (const cat of BPA_CATEGORIES) categoryAcc[cat.key] = { sum: 0, count: 0 };

  for (const it of items) {
    if (groupCounts[it.group] !== undefined) groupCounts[it.group] += 1;
    if (it.actions?.inPAE) inPAE += 1;
    if (it.metrics?.hasResidue) residueCount += 1;
    scoreSum += Number(it.totalScore || 0);

    const scores = it.categoryScores || {};
    for (const cat of BPA_CATEGORIES) {
      const cs = scores[cat.key];
      if (cs && typeof cs.rawScore === "number") {
        categoryAcc[cat.key].sum += cs.rawScore;
        categoryAcc[cat.key].count += 1;
      }
    }
  }

  const categoryAverages = BPA_CATEGORIES.map((cat) => {
    const acc = categoryAcc[cat.key];
    const avg = acc.count ? acc.sum / acc.count : 0;
    return {
      key: cat.key,
      label: cat.label,
      weight: cat.weight,
      averageRaw: avg, // 0..1
      averagePercent: avg * 100,
    };
  });

  const groupDistribution = GROUP_ORDER.map((g) => ({
    group: g,
    count: groupCounts[g],
    percent: total ? (groupCounts[g] / total) * 100 : 0,
  }));

  return {
    total,
    groupCounts,
    groupDistribution,
    inPAE,
    paePercent: total ? (inPAE / total) * 100 : 0,
    residueCount,
    averageScore: total ? scoreSum / total : 0,
    categoryAverages,
  };
}

// Lista de produtores em PAE com seus motivos (para o painel de alertas).
export function extractPaeList(items = []) {
  return items
    .filter((it) => it.actions?.inPAE)
    .map((it) => ({
      id: it._id,
      name: it.producerName || it.producerId || "Produtor sem nome",
      group: it.group,
      totalScore: it.totalScore,
      reasons: it.actions?.paeReasons || [],
      cpp: it.metrics?.cpp ?? null,
      hasResidue: it.metrics?.hasResidue ?? false,
    }))
    .sort((a, b) => (a.totalScore || 0) - (b.totalScore || 0));
}

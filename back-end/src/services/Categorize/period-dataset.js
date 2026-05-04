import {
  BPA_CATEGORIES,
  PAE_ACTIONS,
  PBPA_ACTIONS_BY_CATEGORY,
} from "@/lib/pqfl/domain/constants";
import { mapAndScoreProducer } from "@/lib/pqfl/scoring";

const UNKNOWN_PERIOD_KEY = "sem-periodo";
const UNKNOWN_PERIOD_LABEL = "Sem período informado";

const MONTH_FIELD_HINTS = [
  "mes",
  "month",
  "competencia",
  "referencia",
  "mesavaliacao",
  "mesanalise",
];

const YEAR_FIELD_HINTS = ["ano", "year", "anoreferencia", "anoavaliacao", "competenciaano"];

const DATE_FIELD_HINTS = [
  "__metacreatedat",
  "createdat",
  "updatedat",
  "data",
  "date",
  "timestamp",
  "competencia",
  "avaliacao",
];

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeToken(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function flattenPayload(payload, parentKey = "", acc = {}) {
  if (Array.isArray(payload)) {
    payload.forEach((value, index) => {
      const nextKey = parentKey ? `${parentKey}.${index}` : `${index}`;
      flattenPayload(value, nextKey, acc);
    });
    return acc;
  }

  if (!isRecord(payload)) {
    if (parentKey) {
      acc[parentKey] = payload;
    }
    return acc;
  }

  for (const [key, value] of Object.entries(payload)) {
    const nextKey = parentKey ? `${parentKey}.${key}` : key;
    if (isRecord(value) || Array.isArray(value)) {
      flattenPayload(value, nextKey, acc);
    } else {
      acc[nextKey] = value;
    }
  }

  return acc;
}

function getLeafFieldName(fieldPath) {
  const segments = fieldPath.split(".");
  return segments[segments.length - 1] ?? fieldPath;
}

function normalizeFieldName(fieldPath) {
  return normalizeToken(getLeafFieldName(fieldPath).replace(/\d+$/g, ""));
}

function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim().replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toCompactText(value) {
  if (typeof value !== "string") {
    return null;
  }

  const compact = value.replace(/\s+/g, " ").trim();
  return compact || null;
}

function buildSnapshotDedupeKey(flatPayload, producerId, periodKey) {
  const friendlyId = toCompactText(flatPayload["__metaFriendlyId"]);
  if (friendlyId) {
    return `friendly:${friendlyId}`;
  }

  return `${producerId}::${periodKey}`;
}

function parseDateValue(value) {
  if (typeof value !== "string") {
    return null;
  }

  const raw = value.trim();
  if (!raw) {
    return null;
  }

  // MM/YYYY
  const monthYearMatch = raw.match(/^(\d{1,2})\/(\d{4})$/);
  if (monthYearMatch) {
    const month = Number(monthYearMatch[1]);
    const year = Number(monthYearMatch[2]);
    if (month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
      return new Date(year, month - 1, 1);
    }
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function buildPeriodOption(year, month) {
  const safeMonth = Math.min(Math.max(month, 1), 12);
  const key = `${String(year).padStart(4, "0")}-${String(safeMonth).padStart(2, "0")}`;
  return {
    key,
    label: `${String(safeMonth).padStart(2, "0")}/${year}`,
    year,
    month: safeMonth,
    sortOrder: year * 100 + safeMonth,
  };
}

function getUnknownPeriod() {
  return {
    key: UNKNOWN_PERIOD_KEY,
    label: UNKNOWN_PERIOD_LABEL,
    year: null,
    month: null,
    sortOrder: 0,
  };
}

function inferMonthYear(flatPayload) {
  let month = null;
  let year = null;

  for (const [fieldName, value] of Object.entries(flatPayload)) {
    const normalizedField = normalizeFieldName(fieldName);
    const numericValue = toNumber(value);
    if (numericValue === null) {
      continue;
    }

    if (month === null && MONTH_FIELD_HINTS.some((hint) => normalizedField.includes(hint))) {
      const rounded = Math.round(numericValue);
      if (rounded >= 1 && rounded <= 12) {
        month = rounded;
      }
    }

    if (year === null && YEAR_FIELD_HINTS.some((hint) => normalizedField.includes(hint))) {
      const rounded = Math.round(numericValue);
      if (rounded >= 2000 && rounded <= 2100) {
        year = rounded;
      }
    }
  }

  if (month !== null && year !== null) {
    return { month, year };
  }

  return null;
}

function inferRecordedAt(flatPayload) {
  const candidates = [];

  for (const [fieldName, value] of Object.entries(flatPayload)) {
    const normalizedField = normalizeFieldName(fieldName);
    if (!DATE_FIELD_HINTS.some((hint) => normalizedField.includes(hint))) {
      continue;
    }

    const parsedDate = parseDateValue(value);
    if (parsedDate) {
      candidates.push(parsedDate);
    }
  }

  if (!candidates.length) {
    return null;
  }

  const latest = candidates.reduce((current, candidate) =>
    candidate.getTime() > current.getTime() ? candidate : current,
  );

  return latest.toISOString();
}

function inferPeriod(flatPayload) {
  const monthYear = inferMonthYear(flatPayload);
  if (monthYear) {
    return buildPeriodOption(monthYear.year, monthYear.month);
  }

  const recordedAt = inferRecordedAt(flatPayload);
  if (recordedAt) {
    const date = new Date(recordedAt);
    return buildPeriodOption(date.getFullYear(), date.getMonth() + 1);
  }

  return getUnknownPeriod();
}

function sortByProducerName(a, b) {
  return a.producer.producerName.localeCompare(b.producer.producerName, "pt-BR", {
    sensitivity: "base",
  });
}

function scoreRecency(snapshot, fallbackIndex) {
  if (snapshot.recordedAt) {
    const timestamp = new Date(snapshot.recordedAt).getTime();
    if (Number.isFinite(timestamp)) {
      return timestamp;
    }
  }

  return fallbackIndex;
}

function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function getGroupTransitionText(before, after) {
  const rank = { G1: 3, G2: 2, G3: 1 };
  const beforeRank = rank[before];
  const afterRank = rank[after];

  if (afterRank > beforeRank) {
    return `Mudança positiva de classificação (${before} para ${after}), indicando evolução de conformidade BPA.`;
  }

  if (afterRank < beforeRank) {
    return `Mudança negativa de classificação (${before} para ${after}), exigindo reforço das ações de campo.`;
  }

  return "Classificação mantida entre períodos, com foco em consolidar melhoria contínua.";
}

function inferLikelyActions(before, after, categoryDeltas) {
  if (!before || !after) {
    return [
      "Histórico incompleto entre os períodos selecionados para inferência de ações comparativas.",
    ];
  }

  const inferred = [];

  inferred.push(getGroupTransitionText(before.group, after.group));

  if (before.metrics.cpp !== null && after.metrics.cpp !== null) {
    const cppDelta = after.metrics.cpp - before.metrics.cpp;
    if (cppDelta <= -10000) {
      inferred.push(
        "Redução relevante de CPP sugere melhoria de rotina de ordenha, higiene e controle sanitário.",
      );
    } else if (cppDelta >= 10000) {
      inferred.push(
        "Aumento de CPP indica necessidade de retomar controles de ordenha, mastite e refrigeração.",
      );
    }
  }

  if (before.metrics.hasResidue && !after.metrics.hasResidue) {
    inferred.push(
      "Evidência de eliminação de resíduos sugere ajuste de período de carência e controle de tratamentos.",
    );
  }

  if (!before.metrics.hasResidue && after.metrics.hasResidue) {
    inferred.push(
      "Nova ocorrência de resíduos indica falha em protocolo de medicamentos e deve acionar plano emergencial.",
    );
  }

  const improvedCategories = categoryDeltas
    .filter((item) => item.delta >= 0.12)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 3);

  for (const category of improvedCategories) {
    const actions = PBPA_ACTIONS_BY_CATEGORY[category.key] ?? [];
    if (actions.length) {
      inferred.push(
        `Melhora em ${category.label.toLowerCase()} sugere execução de medidas como: ${actions[0]}`,
      );
    }
  }

  const worsenedCategories = categoryDeltas
    .filter((item) => item.delta <= -0.12)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 2);

  for (const category of worsenedCategories) {
    inferred.push(
      `Queda em ${category.label.toLowerCase()} exige reforço imediato das práticas recomendadas para essa categoria.`,
    );
  }

  if (before.actions.inPAE && !after.actions.inPAE) {
    inferred.push("Saída de condição PAE sugere efetividade das ações corretivas prioritárias.");
  }

  if (!before.actions.inPAE && after.actions.inPAE) {
    inferred.push(
      "Entrada em condição PAE sugere degradação de indicadores críticos e necessidade de intervenção rápida.",
    );
  }

  if (!inferred.length) {
    inferred.push(
      "Não foram detectadas variações expressivas; manter monitoramento e plano de melhoria em execução.",
    );
  }

  return Array.from(new Set(inferred));
}

export function buildProducerPeriodDataset(rawPayloads) {
  const dedupedMap = new Map();

  rawPayloads.forEach((rawPayload, index) => {
    const producer = mapAndScoreProducer(rawPayload);
    const flatPayload = flattenPayload(rawPayload);

    const period = inferPeriod(flatPayload);
    const recordedAt = inferRecordedAt(flatPayload);

    const snapshot = {
      periodKey: period.key,
      periodLabel: period.label,
      periodSortOrder: period.sortOrder,
      recordedAt,
      producer,
    };

    const dedupeKey = buildSnapshotDedupeKey(flatPayload, producer.producerId, period.key);
    const existing = dedupedMap.get(dedupeKey);

    if (!existing) {
      dedupedMap.set(dedupeKey, { snapshot, fallbackIndex: index });
      return;
    }

    const existingRecency = scoreRecency(existing.snapshot, existing.fallbackIndex);
    const incomingRecency = scoreRecency(snapshot, index);

    if (incomingRecency >= existingRecency) {
      dedupedMap.set(dedupeKey, { snapshot, fallbackIndex: index });
    }
  });

  const allSnapshots = Array.from(dedupedMap.values()).map((entry) => entry.snapshot);

  const periodsMap = new Map();
  for (const snapshot of allSnapshots) {
    const existing = periodsMap.get(snapshot.periodKey);
    if (!existing || snapshot.periodSortOrder >= existing.sortOrder) {
      periodsMap.set(snapshot.periodKey, {
        key: snapshot.periodKey,
        label: snapshot.periodLabel,
        year: null,
        month: null,
        sortOrder: snapshot.periodSortOrder,
      });
    }
  }

  if (!periodsMap.size) {
    const fallbackPeriod = getUnknownPeriod();
    periodsMap.set(fallbackPeriod.key, fallbackPeriod);
  }

  const periods = Array.from(periodsMap.values()).sort((a, b) => {
    if (b.sortOrder !== a.sortOrder) {
      return b.sortOrder - a.sortOrder;
    }
    return b.key.localeCompare(a.key, "pt-BR", { sensitivity: "base" });
  });

  const latestPeriodKey = periods[0]?.key ?? UNKNOWN_PERIOD_KEY;

  const byPeriod = {};
  for (const snapshot of allSnapshots) {
    if (!byPeriod[snapshot.periodKey]) {
      byPeriod[snapshot.periodKey] = [];
    }
    byPeriod[snapshot.periodKey].push(snapshot);
  }

  for (const periodKey of Object.keys(byPeriod)) {
    byPeriod[periodKey].sort(sortByProducerName);
  }

  const byProducerId = {};
  for (const snapshot of allSnapshots) {
    const producerId = snapshot.producer.producerId;
    if (!byProducerId[producerId]) {
      byProducerId[producerId] = [];
    }
    byProducerId[producerId].push(snapshot);
  }

  for (const producerId of Object.keys(byProducerId)) {
    byProducerId[producerId].sort((a, b) => {
      if (a.periodSortOrder !== b.periodSortOrder) {
        return a.periodSortOrder - b.periodSortOrder;
      }
      return a.periodKey.localeCompare(b.periodKey, "pt-BR", { sensitivity: "base" });
    });
  }

  return {
    periods,
    latestPeriodKey,
    byPeriod,
    byProducerId,
    allSnapshots,
  };
}

export function buildComparisonRows(dataset, beforePeriodKey, afterPeriodKey) {
  const beforeSnapshots = dataset.byPeriod[beforePeriodKey] ?? [];
  const afterSnapshots = dataset.byPeriod[afterPeriodKey] ?? [];

  const beforeMap = new Map(beforeSnapshots.map((item) => [item.producer.producerId, item.producer]));
  const afterMap = new Map(afterSnapshots.map((item) => [item.producer.producerId, item.producer]));

  const producerIds = Array.from(new Set([...beforeMap.keys(), ...afterMap.keys()]));

  const rows = producerIds.map((producerId) => {
    const before = beforeMap.get(producerId) ?? null;
    const after = afterMap.get(producerId) ?? null;

    const producerName = after?.producerName ?? before?.producerName ?? `Produtor ${producerId}`;

    const categoryDeltas = BPA_CATEGORIES.map((category) => {
      const beforeScore = before ? before.categoryScores[category.key].rawScore : 0;
      const afterScore = after ? after.categoryScores[category.key].rawScore : 0;

      return {
        key: category.key,
        label: category.label,
        beforeScore,
        afterScore,
        delta: round(afterScore - beforeScore, 4),
      };
    });

    const totalBefore = before?.totalScore ?? 0;
    const totalAfter = after?.totalScore ?? 0;

    return {
      producerId,
      producerName,
      groupBefore: before?.group ?? null,
      groupAfter: after?.group ?? null,
      before,
      after,
      totalDelta: round(totalAfter - totalBefore, 2),
      categoryDeltas,
      inferredActions: inferLikelyActions(before, after, categoryDeltas),
    };
  });

  rows.sort((a, b) => a.producerName.localeCompare(b.producerName, "pt-BR", { sensitivity: "base" }));
  return rows;
}

export function buildGroupActionCatalog(group, producersInPeriod) {
  const groupProducers = producersInPeriod.filter((producer) => producer.group === group);
  const categorySet = new Set();

  if (group === "G3") {
    BPA_CATEGORIES.forEach((category) => categorySet.add(category.key));
  } else {
    groupProducers.forEach((producer) => {
      producer.actions.pbpaCategories.forEach((category) => categorySet.add(category));
    });
  }

  if (!categorySet.size) {
    BPA_CATEGORIES.forEach((category) => categorySet.add(category.key));
  }

  const actions = new Set();
  for (const categoryKey of categorySet) {
    (PBPA_ACTIONS_BY_CATEGORY[categoryKey] ?? []).forEach((action) => actions.add(action));
  }

  const hasPAEInGroup = groupProducers.some((producer) => producer.actions.inPAE);
  if (group !== "G1" || hasPAEInGroup) {
    PAE_ACTIONS.cpp.forEach((action) => actions.add(action));
    PAE_ACTIONS.residuos.forEach((action) => actions.add(action));
  }

  if (group === "G1") {
    actions.add("Manter plano preventivo com monitoramento mensal de indicadores de qualidade.");
    actions.add("Consolidar evidências de boas práticas para evitar regressão de classificação.");
  }

  return Array.from(actions).sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
}

export function getPeriodLabel(dataset, periodKey) {
  const period = dataset.periods.find((item) => item.key === periodKey);
  return period?.label ?? UNKNOWN_PERIOD_LABEL;
}

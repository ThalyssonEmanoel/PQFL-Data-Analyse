import { DashboardChartsPanel } from "@/components/dashboard/dashboard-charts-panel";
import { PeriodComparisonPanel } from "@/components/dashboard/period-comparison-panel";
import { ProducersDirectory } from "@/components/dashboard/producers-directory";
import { RefreshProducersButton } from "@/components/dashboard/refresh-producers-button";
import { SummaryCard } from "@/components/dashboard/summary-card";
import {
  BPA_CATEGORIES,
  buildComparisonRows,
  buildGroupActionCatalog,
  buildProducerPeriodDataset,
  getPeriodLabel,
  getProducerPayloads,
} from "@/lib/pqfl";
import type { BottleneckItem } from "@/components/dashboard/bottlenecks-bar-chart";
import type {
  GroupDetailsItem,
  GroupDistributionItem,
} from "@/components/dashboard/group-donut-chart";

function numberFromUnknown(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function getProducerDailyVolume(rawPayload: Record<string, unknown>): number {
  const hints = ["producaomediadiaria", "volumecaptado", "litrosdia", "producao"];

  for (const [fieldName, value] of Object.entries(rawPayload)) {
    const normalizedFieldName = normalizeToken(fieldName.replace(/\d+$/g, ""));
    if (!hints.some((hint) => normalizedFieldName.includes(hint))) {
      continue;
    }

    const parsed = numberFromUnknown(value);
    if (parsed > 0) {
      return parsed;
    }
  }

  return 0;
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Ainda não atualizado";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("pt-BR");
}

function resolvePeriodKey(
  candidate: string | undefined,
  validKeys: Set<string>,
  fallback: string,
): string {
  if (candidate && validKeys.has(candidate)) {
    return candidate;
  }

  return fallback;
}

function buildProducerDetailHref(producerId: string, periodKey: string, compareWith: string): string {
  const params = new URLSearchParams({
    period: periodKey,
    compareWith,
  });

  return `/produtores/${encodeURIComponent(producerId)}?${params.toString()}`;
}

interface HomePageProps {
  searchParams: Promise<{
    before?: string;
    after?: string;
    period?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const { payloads: producerPayloads, meta } = await getProducerPayloads();
  const dataset = buildProducerPeriodDataset(producerPayloads);

  const periodKeys = new Set(dataset.periods.map((period) => period.key));
  const defaultAfterPeriod = dataset.latestPeriodKey;
  const defaultBeforePeriod = dataset.periods[1]?.key ?? dataset.latestPeriodKey;
  const hasExplicitPeriodSelection = Boolean(
    resolvedSearchParams.after ?? resolvedSearchParams.period,
  );

  const afterPeriodKey = resolvePeriodKey(
    resolvedSearchParams.after ?? resolvedSearchParams.period,
    periodKeys,
    defaultAfterPeriod,
  );
  let beforePeriodKey = resolvePeriodKey(resolvedSearchParams.before, periodKeys, defaultBeforePeriod);

  if (beforePeriodKey === afterPeriodKey && dataset.periods.length > 1) {
    const fallbackBefore = dataset.periods.find((period) => period.key !== afterPeriodKey);
    beforePeriodKey = fallbackBefore?.key ?? beforePeriodKey;
  }

  const selectedSnapshots = hasExplicitPeriodSelection
    ? dataset.byPeriod[afterPeriodKey] ?? dataset.byPeriod[dataset.latestPeriodKey] ?? []
    : dataset.allSnapshots;
  const selectedProducers = selectedSnapshots.map((snapshot) => snapshot.producer);
  const selectedPeriodLabel = hasExplicitPeriodSelection
    ? getPeriodLabel(dataset, afterPeriodKey)
    : "Todos os períodos";
  const beforePeriodLabel = getPeriodLabel(dataset, beforePeriodKey);
  const periodByProducerId = new Map(
    selectedSnapshots.map((snapshot) => [
      snapshot.producer.producerId,
      { key: snapshot.periodKey, label: snapshot.periodLabel },
    ]),
  );

  const totalProducers = selectedProducers.length;
  const totalVolume = selectedProducers.reduce(
    (sum, producer) => sum + getProducerDailyVolume(producer.rawPayload),
    0,
  );
  const averageScore =
    totalProducers > 0
      ? selectedProducers.reduce((sum, producer) => sum + producer.totalScore, 0) / totalProducers
      : 0;

  const groupCount = {
    G1: selectedProducers.filter((producer) => producer.group === "G1").length,
    G2: selectedProducers.filter((producer) => producer.group === "G2").length,
    G3: selectedProducers.filter((producer) => producer.group === "G3").length,
  };

  const groupDistribution: GroupDistributionItem[] = (["G1", "G2", "G3"] as const).map((group) => ({
    group,
    value: totalProducers ? (groupCount[group] / totalProducers) * 100 : 0,
  }));

  const groupDetails: GroupDetailsItem[] = (["G1", "G2", "G3"] as const).map((group) => {
    const producersInGroup = selectedProducers
      .filter((producer) => producer.group === group)
      .sort((a, b) => a.producerName.localeCompare(b.producerName, "pt-BR", { sensitivity: "base" }));

    return {
      group,
      producers: producersInGroup.map((producer) => ({
        producerId: producer.producerId,
        producerName: producer.producerName,
        detailHref: buildProducerDetailHref(
          producer.producerId,
          periodByProducerId.get(producer.producerId)?.key ?? afterPeriodKey,
          beforePeriodKey,
        ),
      })),
      actions: buildGroupActionCatalog(group, selectedProducers),
    };
  });

  const bottlenecks: BottleneckItem[] = BPA_CATEGORIES.map((category) => {
    const rawAverage =
      totalProducers > 0
        ? selectedProducers.reduce(
            (sum, producer) => sum + producer.categoryScores[category.key].rawScore,
            0,
          ) / totalProducers
        : 0;

    return {
      category: category.label,
      score: Number((rawAverage * 100).toFixed(2)),
    };
  }).sort((a, b) => a.score - b.score);

  const comparisonRows = buildComparisonRows(dataset, beforePeriodKey, afterPeriodKey).map((row) => ({
    producerId: row.producerId,
    producerName: row.producerName,
    groupBefore: row.groupBefore,
    groupAfter: row.groupAfter,
    totalBefore: row.before?.totalScore ?? 0,
    totalAfter: row.after?.totalScore ?? 0,
    totalDelta: row.totalDelta,
    cppBefore: row.before?.metrics.cpp ?? null,
    cppAfter: row.after?.metrics.cpp ?? null,
    residueBefore: row.before?.metrics.hasResidue ?? null,
    residueAfter: row.after?.metrics.hasResidue ?? null,
    inferredActions: row.inferredActions,
    categoryDeltas: row.categoryDeltas,
    detailHref: buildProducerDetailHref(row.producerId, afterPeriodKey, beforePeriodKey),
  }));

  const producersDirectoryItems = [...selectedProducers]
    .sort((a, b) => a.producerName.localeCompare(b.producerName, "pt-BR", { sensitivity: "base" }))
    .map((producer) => {
      const period = periodByProducerId.get(producer.producerId);

      return {
        producerId: producer.producerId,
        producerName: producer.producerName,
        totalScore: producer.totalScore,
        group: producer.group,
        inPAE: producer.actions.inPAE,
        periodLabel: hasExplicitPeriodSelection
          ? selectedPeriodLabel
          : period?.label ?? selectedPeriodLabel,
        detailHref: buildProducerDetailHref(
          producer.producerId,
          period?.key ?? afterPeriodKey,
          beforePeriodKey,
        ),
      };
    });

  return (
    <main className="shell space-y-6">
      <section className="no-print rounded-2xl border border-emerald-100 bg-white/80 p-6 backdrop-blur-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">PQFL</p>
            <h1 className="mt-1 text-3xl font-bold text-emerald-900">Dashboard de Gestão de Fornecedores</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Visão consolidada da pontuação BPA, classificação G1/G2/G3 e identificação dos gargalos
              para o plano de melhoria dos produtores.
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Fonte: {meta.source === "coletum" ? "Cache do Coletum" : "Dados locais mock"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Última atualização do cache: {formatDateTime(meta.updatedAt)}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Período em exibição geral: {selectedPeriodLabel}
            </p>
          </div>

          <RefreshProducersButton meta={meta} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="Total de produtores" value={String(totalProducers)} />
        <SummaryCard
          title="Volume captado (L/dia)"
          value={totalVolume.toLocaleString("pt-BR")}
          helper={`Soma da produção média diária (${selectedPeriodLabel})`}
        />
        <SummaryCard
          title="Média de pontuação"
          value={`${averageScore.toFixed(1)} pts`}
          helper={`Escala final 0 a 100 em ${selectedPeriodLabel}`}
        />
      </section>

      <DashboardChartsPanel
        groupDistribution={groupDistribution}
        groupDetails={groupDetails}
        periodLabel={selectedPeriodLabel}
        bottlenecks={bottlenecks}
      />

      <ProducersDirectory items={producersDirectoryItems} />

      <PeriodComparisonPanel
        key={`${beforePeriodKey}-${afterPeriodKey}`}
        periods={dataset.periods.map((period) => ({ key: period.key, label: period.label }))}
        beforePeriodKey={beforePeriodKey}
        afterPeriodKey={afterPeriodKey}
        beforePeriodLabel={beforePeriodLabel}
        afterPeriodLabel={selectedPeriodLabel}
        rows={comparisonRows}
      />
    </main>
  );
}

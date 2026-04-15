import Link from "next/link";
import { ProducerMetricsCharts } from "@/components/produtor/producer-metrics-charts";
import { PrintButton } from "@/components/produtor/print-button";
import {
  BPA_CATEGORIES,
  PBPA_ACTIONS_BY_CATEGORY,
  buildComparisonRows,
  buildProducerPeriodDataset,
  getPeriodLabel,
  getProducerPayloads,
} from "@/lib/pqfl";

interface ProducerPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    period?: string;
    compareWith?: string;
  }>;
}

function resolveDashboardHref(periodKey: string, compareWith: string | null): string {
  const params = new URLSearchParams({
    period: periodKey,
    after: periodKey,
    before: compareWith ?? periodKey,
  });

  return `/?${params.toString()}`;
}

export default async function ProducerPage({ params, searchParams }: ProducerPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { payloads: producerPayloads, meta } = await getProducerPayloads();
  const dataset = buildProducerPeriodDataset(producerPayloads);

  const history = dataset.byProducerId[resolvedParams.id] ?? [];
  const validPeriodKeys = new Set(dataset.periods.map((period) => period.key));

  const selectedPeriodKey =
    resolvedSearchParams.period && validPeriodKeys.has(resolvedSearchParams.period)
      ? resolvedSearchParams.period
      : history[history.length - 1]?.periodKey ?? dataset.latestPeriodKey;

  const selectedSnapshot =
    history.find((item) => item.periodKey === selectedPeriodKey) ?? history[history.length - 1] ?? null;

  if (!selectedSnapshot) {
    return (
      <main className="shell">
        <section className="card p-6">
          <h1 className="text-xl font-bold text-slate-900">Nenhum produtor encontrado</h1>
          <p className="mt-2 text-sm text-slate-600">
            Atualize o cache de produtores no dashboard para carregar dados do Coletum.
          </p>
          <div className="mt-4">
            <Link
              href="/"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Voltar ao dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const compareWithPeriodKey =
    resolvedSearchParams.compareWith && validPeriodKeys.has(resolvedSearchParams.compareWith)
      ? resolvedSearchParams.compareWith
      : history.length > 1
        ? history[history.length - 2]?.periodKey ?? null
        : null;

  const comparisonRow = compareWithPeriodKey
    ? buildComparisonRows(dataset, compareWithPeriodKey, selectedSnapshot.periodKey).find(
        (row) => row.producerId === selectedSnapshot.producer.producerId,
      )
    : null;

  const producer = selectedSnapshot.producer;
  const selectedPeriodLabel = getPeriodLabel(dataset, selectedSnapshot.periodKey);
  const compareWithLabel = compareWithPeriodKey ? getPeriodLabel(dataset, compareWithPeriodKey) : null;

  const categoryChartsData = BPA_CATEGORIES.map((category) => {
    const score = producer.categoryScores[category.key];
    return {
      category: score.label,
      scorePercent: score.rawScore * 100,
      weightedScore: score.weightedScore,
    };
  });

  const topNonConformities = producer.actions.factorDiagnostics
    .filter((item) => item.gap > 0)
    .slice(0, 4);

  const fullActionPlan = producer.actions.factorDiagnostics
    .filter((item) => item.gap > 0)
    .map((item) => ({
      key: item.key,
      label: item.label,
      gapPercent: item.gap * 100,
      failedFieldLabels: item.failedFieldLabels,
      actions: PBPA_ACTIONS_BY_CATEGORY[item.key] ?? [],
    }));

  const dashboardHref = resolveDashboardHref(selectedSnapshot.periodKey, compareWithPeriodKey);

  const periodSwitches = [...history].sort((a, b) => b.periodSortOrder - a.periodSortOrder);

  return (
    <main className="shell space-y-4">
      <header className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Diagnóstico individual</p>
          <h1 className="text-2xl font-bold text-slate-900">{producer.producerName}</h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Período exibido: {selectedPeriodLabel}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Fonte de dados: {meta.source === "coletum" ? "Cache Coletum" : "Dados locais mock"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={dashboardHref}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Voltar ao dashboard
          </Link>
          <PrintButton />
        </div>
      </header>

      <section className="a4-report space-y-5">
        <div className="avoid-break rounded-xl border border-slate-200 p-4">
          <h2 className="section-title">Resumo do produtor(a) - {producer.producerName}</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Pontuação total</p>
              <p className="text-lg font-semibold text-slate-900">{producer.totalScore.toFixed(1)} / 100</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Classificação</p>
              <p className="text-lg font-semibold text-slate-900">{producer.group}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">CPP última análise</p>
              <p className="text-lg font-semibold text-slate-900">
                {producer.metrics.cpp !== null
                  ? producer.metrics.cpp.toLocaleString("pt-BR")
                  : "Não informado"}
              </p>
            </div>
          </div>

          {periodSwitches.length > 1 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {periodSwitches.map((snapshot) => {
                const params = new URLSearchParams({
                  period: snapshot.periodKey,
                  compareWith: compareWithPeriodKey ?? selectedSnapshot.periodKey,
                });

                return (
                  <Link
                    key={`${snapshot.periodKey}-${snapshot.producer.producerId}`}
                    href={`/produtores/${encodeURIComponent(producer.producerId)}?${params.toString()}`}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      snapshot.periodKey === selectedSnapshot.periodKey
                        ? "border-emerald-700 bg-emerald-700 text-white"
                        : "border-slate-300 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {snapshot.periodLabel}
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>

        <ProducerMetricsCharts
          producerName={producer.producerName}
          periodLabel={selectedPeriodLabel}
          categories={categoryChartsData}
        />

        {comparisonRow && compareWithLabel ? (
          <div className="avoid-break rounded-xl border border-slate-200 p-4">
            <h2 className="section-title">Comparação rápida entre períodos</h2>
            <p className="mt-1 text-sm text-slate-600">
              Diferenças de {compareWithLabel} para {selectedPeriodLabel} para este produtor.
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Grupo</p>
                <p className="text-lg font-semibold text-slate-900">
                  {(comparisonRow.groupBefore ?? "Sem dado")} para {comparisonRow.groupAfter ?? "Sem dado"}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Delta pontuação</p>
                <p
                  className={`text-lg font-semibold ${
                    comparisonRow.totalDelta >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {comparisonRow.totalDelta >= 0 ? "+" : ""}
                  {comparisonRow.totalDelta.toFixed(1)}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">CPP</p>
                <p className="text-lg font-semibold text-slate-900">
                  {comparisonRow.before?.metrics.cpp !== null
                    ? comparisonRow.before?.metrics.cpp?.toLocaleString("pt-BR")
                    : "N/D"}
                  {" "}
                  para{" "}
                  {comparisonRow.after?.metrics.cpp !== null
                    ? comparisonRow.after?.metrics.cpp?.toLocaleString("pt-BR")
                    : "N/D"}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
              <p className="text-sm font-semibold text-slate-700">Ações inferidas para justificar a mudança</p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-slate-700">
                {comparisonRow.inferredActions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        <div className="avoid-break rounded-xl border border-slate-200 p-4">
          <h2 className="section-title">Pontuação por categoria BPA</h2>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-2 py-2">Categoria</th>
                  <th className="px-2 py-2">Peso</th>
                  <th className="px-2 py-2">Nota categoria</th>
                  <th className="px-2 py-2">Pontos obtidos</th>
                  <th className="px-2 py-2">Itens considerados</th>
                </tr>
              </thead>
              <tbody>
                {BPA_CATEGORIES.map((category) => {
                  const score = producer.categoryScores[category.key];
                  return (
                    <tr key={category.key} className="border-b border-slate-100">
                      <td className="px-2 py-2 font-medium text-slate-800">{score.label}</td>
                      <td className="px-2 py-2">{score.weight}%</td>
                      <td className="px-2 py-2">{(score.rawScore * 100).toFixed(1)}%</td>
                      <td className="px-2 py-2">{score.weightedScore.toFixed(2)}</td>
                      <td className="px-2 py-2">{score.questionCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="avoid-break rounded-xl border border-slate-200 p-4">
          <h2 className="section-title">Ações corretivas sugeridas</h2>

          <div className="mt-3 space-y-3 text-sm">
            <div>
              <p className="font-semibold text-slate-700">Plano recomendado por problemática detectada</p>
              {fullActionPlan.length ? (
                <div className="mt-2 space-y-3">
                  {fullActionPlan.map((item) => (
                    <div key={item.key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="font-semibold text-slate-800">
                        {item.label} ({item.gapPercent.toFixed(0)}% de não conformidade)
                      </p>
                      {item.failedFieldLabels.length ? (
                        <p className="mt-1 text-xs text-slate-600">
                          Evidências: {item.failedFieldLabels.join(", ")}
                        </p>
                      ) : null}
                      <ul className="mt-2 list-disc pl-6 text-slate-700">
                        {item.actions.map((action) => (
                          <li key={`${item.key}-${action}`}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-slate-600">
                  Não foram detectadas problemáticas com gap positivo no período selecionado.
                </p>
              )}
            </div>

            <div>
              <p className="font-semibold text-slate-700">PAE (Plano de Ações Emergenciais)</p>
              {producer.actions.inPAE ? (
                <>
                  <ul className="mt-1 list-disc pl-6 text-slate-700">
                    {producer.actions.paeReasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                  <ul className="mt-2 list-disc pl-6 text-slate-700">
                    {producer.actions.paeActions.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="mt-1 text-slate-600">Sem gatilhos de PAE para este produtor.</p>
              )}
            </div>

            <div>
              <p className="font-semibold text-slate-700">PBPA (Plano de Boas Práticas)</p>
              {producer.actions.pbpaCategories.length || producer.actions.pbpaActions.length ? (
                <>
                  <ul className="mt-1 list-disc pl-6 text-slate-700">
                    {producer.actions.pbpaCategories.map((key) => (
                      <li key={key}>{producer.categoryScores[key].label}</li>
                    ))}
                  </ul>
                  <ul className="mt-2 list-disc pl-6 text-slate-700">
                    {producer.actions.pbpaActions.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="mt-1 text-slate-600">Sem categorias com nota baixa para PBPA.</p>
              )}
            </div>

            <div>
              <p className="font-semibold text-slate-700">Não conformidades por fator (Top 4)</p>
              {topNonConformities.length ? (
                <ul className="mt-1 list-disc pl-6 text-slate-700">
                  {topNonConformities.map((item) => (
                    <li key={item.key}>
                      {item.label}: {(item.gap * 100).toFixed(0)}% de não conformidade
                      {item.failedFieldLabels.length
                        ? ` (${item.failedFieldLabels.slice(0, 3).join(", ")})`
                        : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-slate-600">Sem não conformidades críticas por fator.</p>
              )}
            </div>
          </div>
        </div>

        <div className="avoid-break rounded-xl border border-slate-200 p-4">
          <h2 className="section-title">Respostas recebidas do checklist</h2>
          <p className="mt-1 text-xs text-slate-500">
            Tabela do payload bruto com chaves dinâmicas e sufixos numéricos.
          </p>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-2 py-2">Campo</th>
                  <th className="px-2 py-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(producer.rawPayload).map(([field, value]) => (
                  <tr key={field} className="border-b border-slate-100">
                    <td className="px-2 py-1 font-mono text-slate-700">{field}</td>
                    <td className="px-2 py-1 text-slate-700">{String(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

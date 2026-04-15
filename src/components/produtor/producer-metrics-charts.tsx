"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface ProducerMetricsCategoryItem {
  category: string;
  scorePercent: number;
  weightedScore: number;
}

interface ProducerMetricsChartsProps {
  producerName: string;
  periodLabel: string;
  categories: ProducerMetricsCategoryItem[];
}

function formatCategoryLabel(label: string): string {
  if (label.length <= 22) {
    return label;
  }

  return `${label.slice(0, 21)}...`;
}

export function ProducerMetricsCharts({
  producerName,
  periodLabel,
  categories,
}: ProducerMetricsChartsProps) {
  const lineData = categories.map((item) => ({
    categoria: formatCategoryLabel(item.category),
    nota: Number(item.scorePercent.toFixed(1)),
  }));

  const barData = categories
    .map((item) => ({
      categoria: formatCategoryLabel(item.category),
      pontos: Number(item.weightedScore.toFixed(2)),
    }))
    .sort((a, b) => b.pontos - a.pontos);

  const averageConformity = categories.length
    ? categories.reduce((sum, item) => sum + item.scorePercent, 0) / categories.length
    : 0;

  const pieData = [
    { name: "Conforme", value: Number(averageConformity.toFixed(1)) },
    { name: "Não conforme", value: Number((100 - averageConformity).toFixed(1)) },
  ];

  return (
    <section className="avoid-break rounded-xl border border-slate-200 p-4">
      <div>
        <h2 className="section-title">Gráficos de métricas do produtor</h2>
        <p className="mt-1 text-sm text-slate-600">
          Visão em linha, barra e pizza para {producerName} no período {periodLabel}.
        </p>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <p className="text-sm font-semibold text-slate-700">Evolução por categoria (linha)</p>
          <div className="mt-2 h-72 w-full">
            <ResponsiveContainer>
              <LineChart data={lineData} margin={{ top: 8, right: 12, left: 8, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="categoria"
                  angle={-22}
                  textAnchor="end"
                  interval={0}
                  height={98}
                  tick={{ fontSize: 11 }}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => `${String(value)}%`} />
                <Line type="monotone" dataKey="nota" stroke="#1f7a67" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <p className="text-sm font-semibold text-slate-700">Pontos ponderados por categoria (barra)</p>
          <div className="mt-2 h-72 w-full">
            <ResponsiveContainer>
              <BarChart data={barData} margin={{ top: 8, right: 12, left: 8, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="categoria"
                  angle={-22}
                  textAnchor="end"
                  interval={0}
                  height={98}
                  tick={{ fontSize: 11 }}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="pontos" radius={[6, 6, 0, 0]}>
                  {barData.map((item) => (
                    <Cell key={`${item.categoria}-${item.pontos}`} fill="#155143" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <article className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
        <p className="text-sm font-semibold text-slate-700">Conformidade média global (pizza)</p>
        <div className="mt-2 h-64 w-full">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={56}
                outerRadius={86}
                paddingAngle={4}
              >
                <Cell fill="#1f7a67" />
                <Cell fill="#b42318" />
              </Pie>
              <Tooltip formatter={(value) => `${String(value)}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  );
}

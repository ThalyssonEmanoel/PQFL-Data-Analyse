"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import type { ProducerGroup } from "@/lib/pqfl";

export interface ComparisonPeriodOption {
  key: string;
  label: string;
}

export interface ComparisonCategoryDelta {
  key: string;
  label: string;
  beforeScore: number;
  afterScore: number;
  delta: number;
}

export interface ComparisonRowItem {
  producerId: string;
  producerName: string;
  groupBefore: ProducerGroup | null;
  groupAfter: ProducerGroup | null;
  totalBefore: number;
  totalAfter: number;
  totalDelta: number;
  cppBefore: number | null;
  cppAfter: number | null;
  residueBefore: boolean | null;
  residueAfter: boolean | null;
  inferredActions: string[];
  categoryDeltas: ComparisonCategoryDelta[];
  detailHref: string;
}

interface PeriodComparisonPanelProps {
  periods: ComparisonPeriodOption[];
  beforePeriodKey: string;
  afterPeriodKey: string;
  beforePeriodLabel: string;
  afterPeriodLabel: string;
  rows: ComparisonRowItem[];
}

function toGroupLabel(group: ProducerGroup | null): string {
  return group ?? "Sem dado";
}

function formatDelta(value: number): string {
  const signal = value > 0 ? "+" : "";
  return `${signal}${value.toFixed(1)}`;
}

function formatCategoryLabel(label: string): string {
  if (label.length <= 20) {
    return label;
  }

  return `${label.slice(0, 19)}...`;
}

export function PeriodComparisonPanel({
  periods,
  beforePeriodKey,
  afterPeriodKey,
  beforePeriodLabel,
  afterPeriodLabel,
  rows,
}: PeriodComparisonPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [beforeSelection, setBeforeSelection] = useState(beforePeriodKey);
  const [afterSelection, setAfterSelection] = useState(afterPeriodKey);
  const [selectedProducerId, setSelectedProducerId] = useState(rows[0]?.producerId ?? "");

  const activeProducerId = rows.some((row) => row.producerId === selectedProducerId)
    ? selectedProducerId
    : rows[0]?.producerId ?? "";

  const selectedRow = useMemo(
    () => rows.find((row) => row.producerId === activeProducerId) ?? rows[0] ?? null,
    [rows, activeProducerId],
  );

  const comparisonLineData = useMemo(() => {
    if (!selectedRow) {
      return [];
    }

    return selectedRow.categoryDeltas.map((item) => ({
      categoria: formatCategoryLabel(item.label),
      antes: Number((item.beforeScore * 100).toFixed(1)),
      depois: Number((item.afterScore * 100).toFixed(1)),
    }));
  }, [selectedRow]);

  const deltaBarData = useMemo(() => {
    if (!selectedRow) {
      return [];
    }

    return [...selectedRow.categoryDeltas]
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 6)
      .map((item) => ({
        indicador: formatCategoryLabel(item.label),
        delta: Number((item.delta * 100).toFixed(1)),
      }));
  }, [selectedRow]);

  const pieData = useMemo(() => {
    if (!selectedRow || !selectedRow.categoryDeltas.length) {
      return {
        before: [
          { name: "Conforme", value: 0 },
          { name: "Não conforme", value: 0 },
        ],
        after: [
          { name: "Conforme", value: 0 },
          { name: "Não conforme", value: 0 },
        ],
      };
    }

    const beforeAverage =
      selectedRow.categoryDeltas.reduce((sum, item) => sum + item.beforeScore, 0) /
      selectedRow.categoryDeltas.length;
    const afterAverage =
      selectedRow.categoryDeltas.reduce((sum, item) => sum + item.afterScore, 0) /
      selectedRow.categoryDeltas.length;

    const beforeConformity = Number((beforeAverage * 100).toFixed(1));
    const afterConformity = Number((afterAverage * 100).toFixed(1));

    return {
      before: [
        { name: "Conforme", value: beforeConformity },
        { name: "Não conforme", value: Number((100 - beforeConformity).toFixed(1)) },
      ],
      after: [
        { name: "Conforme", value: afterConformity },
        { name: "Não conforme", value: Number((100 - afterConformity).toFixed(1)) },
      ],
    };
  }, [selectedRow]);

  function applyPeriodSelection() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("before", beforeSelection);
    params.set("after", afterSelection);
    params.set("period", afterSelection);

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Comparar informações entre períodos</h2>
          <p className="mt-1 text-sm text-slate-600">
            Selecione dois períodos (mês/ano) para analisar mudanças de grupo e indicadores.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Período antes
          <select
            value={beforeSelection}
            onChange={(event) => setBeforeSelection(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-200 transition focus:ring"
          >
            {periods.map((period) => (
              <option key={period.key} value={period.key}>
                {period.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Período depois
          <select
            value={afterSelection}
            onChange={(event) => setAfterSelection(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-200 transition focus:ring"
          >
            {periods.map((period) => (
              <option key={period.key} value={period.key}>
                {period.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={applyPeriodSelection}
          disabled={isPending}
          className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isPending ? "Sincronizando..." : "Aplicar"}
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Comparando: <strong>{beforePeriodLabel}</strong> x <strong>{afterPeriodLabel}</strong>
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-2 py-2">Produtor</th>
              <th className="px-2 py-2">Grupo (antes)</th>
              <th className="px-2 py-2">Grupo (depois)</th>
              <th className="px-2 py-2">Delta pontuação</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isSelected = selectedRow?.producerId === row.producerId;

              return (
                <tr
                  key={row.producerId}
                  className={`cursor-pointer border-b border-slate-100 ${
                    isSelected ? "bg-emerald-50" : "hover:bg-slate-50"
                  }`}
                  onClick={() => setSelectedProducerId(row.producerId)}
                >
                  <td className="px-2 py-2 font-medium text-slate-800">{row.producerName}</td>
                  <td className="px-2 py-2">{toGroupLabel(row.groupBefore)}</td>
                  <td className="px-2 py-2">{toGroupLabel(row.groupAfter)}</td>
                  <td
                    className={`px-2 py-2 font-semibold ${
                      row.totalDelta > 0
                        ? "text-emerald-700"
                        : row.totalDelta < 0
                          ? "text-rose-700"
                          : "text-slate-700"
                    }`}
                  >
                    {formatDelta(row.totalDelta)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedRow ? (
        <div className="mt-5 space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{selectedRow.producerName}</h3>
              <p className="text-xs text-slate-600">
                ID {selectedRow.producerId} | Pontuação: {selectedRow.totalBefore.toFixed(1)} para{" "}
                {selectedRow.totalAfter.toFixed(1)}
              </p>
            </div>
            <a
              href={selectedRow.detailHref}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Abrir diagnóstico sincronizado
            </a>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <article className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-sm font-semibold text-slate-700">Comparação por categoria (linha)</p>
              <div className="mt-2 h-72 w-full">
                <ResponsiveContainer>
                  <LineChart data={comparisonLineData} margin={{ top: 8, right: 12, left: 8, bottom: 56 }}>
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
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="antes" name="Antes" stroke="#ca8a04" strokeWidth={2} />
                    <Line type="monotone" dataKey="depois" name="Depois" stroke="#1f7a67" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-sm font-semibold text-slate-700">Mudanças mais relevantes (barra)</p>
              <div className="mt-2 h-72 w-full">
                <ResponsiveContainer>
                  <BarChart data={deltaBarData} margin={{ top: 8, right: 12, left: 8, bottom: 56 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="indicador"
                      angle={-22}
                      textAnchor="end"
                      interval={0}
                      height={98}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis />
                    <Tooltip formatter={(value) => `${String(value)}%`} />
                    <Bar dataKey="delta" radius={[6, 6, 0, 0]}>
                      {deltaBarData.map((entry) => (
                        <Cell
                          key={`${entry.indicador}-${entry.delta}`}
                          fill={entry.delta >= 0 ? "#1f7a67" : "#b42318"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-sm font-semibold text-slate-700">Conformidade média (antes)</p>
              <div className="mt-2 h-56 w-full">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData.before}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={76}
                      paddingAngle={4}
                    >
                      <Cell fill="#ca8a04" />
                      <Cell fill="#f97316" />
                    </Pie>
                    <Tooltip formatter={(value) => `${String(value)}%`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-sm font-semibold text-slate-700">Conformidade média (depois)</p>
              <div className="mt-2 h-56 w-full">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData.after}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={76}
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
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-sm font-semibold text-slate-700">
              Ações provavelmente aplicadas (inferidas)
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-slate-700">
              {selectedRow.inferredActions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}

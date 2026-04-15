"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export interface GroupDistributionItem {
  group: "G1" | "G2" | "G3";
  value: number;
}

export interface GroupProducerItem {
  producerId: string;
  producerName: string;
  detailHref: string;
}

export interface GroupDetailsItem {
  group: "G1" | "G2" | "G3";
  producers: GroupProducerItem[];
  actions: string[];
}

interface GroupDonutChartProps {
  data: GroupDistributionItem[];
  details: GroupDetailsItem[];
  periodLabel: string;
}

const GROUP_COLORS: Record<GroupDistributionItem["group"], string> = {
  G1: "#1f7a67",
  G2: "#ca8a04",
  G3: "#b42318",
};

export function GroupDonutChart({ data, details, periodLabel }: GroupDonutChartProps) {
  const initialGroup = data[0]?.group ?? "G1";
  const [selectedGroup, setSelectedGroup] = useState<"G1" | "G2" | "G3">(initialGroup);

  const selectedDetails = useMemo(
    () => details.find((item) => item.group === selectedGroup),
    [details, selectedGroup],
  );

  return (
    <section className="card avoid-break p-5">
      <h2 className="section-title">Distribuição por Grupo</h2>
      <p className="mt-1 text-sm text-slate-600">
        Percentual de produtores em G1, G2 e G3 no período {periodLabel}. Clique em um grupo para
        detalhar produtores e ações recomendadas.
      </p>

      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="group"
              innerRadius={62}
              outerRadius={100}
              paddingAngle={4}
              onClick={(_, index) => {
                const clicked = data[index];
                if (clicked) {
                  setSelectedGroup(clicked.group);
                }
              }}
            >
              {data.map((item) => (
                <Cell key={item.group} fill={GROUP_COLORS[item.group]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <p className="text-sm font-semibold text-slate-700">
            Produtores do grupo {selectedGroup} ({selectedDetails?.producers.length ?? 0})
          </p>
          <div className="mt-2 max-h-48 overflow-y-auto pr-1">
            {selectedDetails?.producers.length ? (
              <ul className="space-y-2 text-sm text-slate-700">
                {selectedDetails.producers.map((producer) => (
                  <li key={`${selectedGroup}-${producer.producerId}`}>
                    <Link
                      href={producer.detailHref}
                      className="font-medium text-emerald-700 underline-offset-2 hover:underline"
                    >
                      {producer.producerName}
                    </Link>
                    <span className="ml-2 text-xs text-slate-500">ID {producer.producerId}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-600">Não há produtores neste grupo no período selecionado.</p>
            )}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <p className="text-sm font-semibold text-slate-700">
            Ações possíveis para o grupo {selectedGroup}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Catálogo de medidas oficiais que podem ser aplicadas conforme diagnóstico individual.
          </p>
          <div className="mt-2 max-h-48 overflow-y-auto pr-1">
            {selectedDetails?.actions.length ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                {selectedDetails.actions.map((action) => (
                  <li key={`${selectedGroup}-${action}`}>{action}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-600">Não foram mapeadas ações para este grupo.</p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}

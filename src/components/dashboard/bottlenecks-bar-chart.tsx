"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface BottleneckItem {
  category: string;
  score: number;
}

interface BottlenecksBarChartProps {
  data: BottleneckItem[];
}

export function BottlenecksBarChart({ data }: BottlenecksBarChartProps) {
  return (
    <section className="card avoid-break p-5">
      <h2 className="section-title">Gargalos do BPA</h2>
      <p className="mt-1 text-sm text-slate-600">
        Menores notas médias por categoria oficial de Boas Práticas Agropecuárias.
      </p>

      <div className="mt-4 h-80 w-full">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 56 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="category"
              angle={-25}
              textAnchor="end"
              interval={0}
              height={110}
              tick={{ fontSize: 11 }}
            />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="score" fill="#1f7a67" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

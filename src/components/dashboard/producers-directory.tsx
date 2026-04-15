"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ProducerGroup } from "@/lib/pqfl";

export interface ProducersDirectoryItem {
  producerId: string;
  producerName: string;
  totalScore: number;
  group: ProducerGroup;
  inPAE: boolean;
  periodLabel: string;
  detailHref: string;
}

interface ProducersDirectoryProps {
  items: ProducersDirectoryItem[];
}

export function ProducersDirectory({ items }: ProducersDirectoryProps) {
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<"ALL" | ProducerGroup>("ALL");

  const orderedItems = useMemo(
    () =>
      [...items].sort((a, b) =>
        a.producerName.localeCompare(b.producerName, "pt-BR", { sensitivity: "base" }),
      ),
    [items],
  );

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return orderedItems.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        item.producerName.toLowerCase().includes(normalizedSearch) ||
        item.producerId.toLowerCase().includes(normalizedSearch);

      const matchesGroup = groupFilter === "ALL" || item.group === groupFilter;
      return matchesSearch && matchesGroup;
    });
  }, [orderedItems, search, groupFilter]);

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title">Produtores avaliados (ordem alfabética)</h2>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          {filteredItems.length} / {orderedItems.length}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[2fr_1fr]">
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Buscar por nome ou ID
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ex.: Fazenda, P001"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-200 transition focus:ring"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Filtrar por grupo
          <select
            value={groupFilter}
            onChange={(event) => setGroupFilter(event.target.value as "ALL" | ProducerGroup)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-200 transition focus:ring"
          >
            <option value="ALL">Todos</option>
            <option value="G1">G1</option>
            <option value="G2">G2</option>
            <option value="G3">G3</option>
          </select>
        </label>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <div className="max-h-128 overflow-y-auto overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="sticky top-0 bg-white px-2 py-2">Produtor</th>
                <th className="sticky top-0 bg-white px-2 py-2">ID</th>
                <th className="sticky top-0 bg-white px-2 py-2">Pontuação</th>
                <th className="sticky top-0 bg-white px-2 py-2">Grupo</th>
                <th className="sticky top-0 bg-white px-2 py-2">PAE</th>
                <th className="sticky top-0 bg-white px-2 py-2">Período</th>
                <th className="sticky top-0 bg-white px-2 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr
                  key={`${item.producerId}-${item.periodLabel}-${item.detailHref}`}
                  className="border-b border-slate-100"
                >
                  <td className="px-2 py-2 font-medium text-slate-800">{item.producerName}</td>
                  <td className="px-2 py-2 text-slate-600">{item.producerId}</td>
                  <td className="px-2 py-2">{item.totalScore.toFixed(1)}</td>
                  <td className="px-2 py-2">{item.group}</td>
                  <td className="px-2 py-2">{item.inPAE ? "Sim" : "Não"}</td>
                  <td className="px-2 py-2">{item.periodLabel}</td>
                  <td className="px-2 py-2">
                    <Link
                      className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      href={item.detailHref}
                    >
                      Ver diagnóstico
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

"use client";

import { BottlenecksBarChart, type BottleneckItem } from "@/components/dashboard/bottlenecks-bar-chart";
import {
  type GroupDetailsItem,
  GroupDonutChart,
  type GroupDistributionItem,
} from "@/components/dashboard/group-donut-chart";

interface DashboardChartsPanelProps {
  groupDistribution: GroupDistributionItem[];
  groupDetails: GroupDetailsItem[];
  periodLabel: string;
  bottlenecks: BottleneckItem[];
}

export function DashboardChartsPanel({
  groupDistribution,
  groupDetails,
  periodLabel,
  bottlenecks,
}: DashboardChartsPanelProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <GroupDonutChart data={groupDistribution} details={groupDetails} periodLabel={periodLabel} />
      <BottlenecksBarChart data={bottlenecks} />
    </section>
  );
}

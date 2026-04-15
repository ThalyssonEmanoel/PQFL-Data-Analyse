import "server-only";
import { unstable_noStore as noStore } from "next/cache";

import { loadProducerCache, refreshProducerCache } from "@/lib/pqfl/cache-store";
import type { ProducerDataSourceResult, ProducerRefreshResult } from "@/lib/pqfl/domain/types";

export async function getProducerPayloads(): Promise<ProducerDataSourceResult> {
  noStore();
  return loadProducerCache();
}

export async function refreshProducerPayloads(): Promise<ProducerRefreshResult> {
  return refreshProducerCache();
}

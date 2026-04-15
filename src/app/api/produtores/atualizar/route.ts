import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { refreshProducerPayloads } from "@/lib/pqfl";

export async function POST() {
  const result = await refreshProducerPayloads();

  // Garante que dashboard e diagnósticos leiam o cache atualizado no próximo refresh.
  revalidatePath("/");
  revalidatePath("/produtores/[id]", "page");

  const statusCode = result.ok
    ? 200
    : result.status === "blocked-budget"
      ? 429
      : result.status === "missing-endpoint"
        ? 400
        : 502;

  return NextResponse.json(result, { status: statusCode });
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ProducerCacheMeta } from "@/lib/pqfl";

interface RefreshProducersButtonProps {
  meta: ProducerCacheMeta;
}

interface RefreshApiResponse {
  ok: boolean;
  message: string;
}

export function RefreshProducersButton({ meta }: RefreshProducersButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string>("");

  const hasBudget = meta.remainingRequests > 0;

  function handleRefreshClick() {
    setFeedback("");

    startTransition(async () => {
      try {
        const response = await fetch("/api/produtores/atualizar", {
          method: "POST",
        });

        const payload = (await response.json()) as RefreshApiResponse;
        setFeedback(payload.message || "Atualização concluída.");

        if (response.ok && payload.ok) {
          router.refresh();
        }
      } catch {
        setFeedback("Não foi possível atualizar agora. Tente novamente.");
      }
    });
  }

  return (
    <div className="no-print flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleRefreshClick}
        disabled={isPending || !meta.endpointConfigured || !hasBudget}
        className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isPending ? "Atualizando produtores..." : "Atualizar produtores"}
      </button>

      <p className="text-xs text-slate-600">
        Requisições usadas: {meta.remoteRequestCount}/{meta.requestBudget}
      </p>

      {!meta.endpointConfigured ? (
        <p className="text-xs font-semibold text-amber-700">
          Defina COLETUM_FULL_URL para habilitar atualização remota.
        </p>
      ) : null}

      {!hasBudget ? (
        <p className="text-xs font-semibold text-red-700">
          Limite de requisições do cache atingido. Ajuste COLETUM_REQUEST_BUDGET se necessário.
        </p>
      ) : null}

      {feedback ? <p className="max-w-sm text-right text-xs text-slate-700">{feedback}</p> : null}
    </div>
  );
}

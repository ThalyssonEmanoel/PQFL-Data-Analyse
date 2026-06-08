<script setup>
import { ref, computed, onMounted } from "vue";
import suppliersService from "@/services/suppliersService.js";
import { extractApiError } from "@/services/http.js";
import { buildDashboardStats, extractPaeList } from "@/utils/aggregations.js";
import { groupMeta } from "@/constants/bpa.js";
import { formatNumber, formatScore } from "@/utils/format.js";
import { useAuthStore } from "@/stores/auth.js";
import { useToast } from "@/composables/useToast.js";

import BaseCard from "@/components/ui/BaseCard.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import BaseSpinner from "@/components/ui/BaseSpinner.vue";
import EmptyState from "@/components/ui/EmptyState.vue";
import SummaryCard from "@/components/dashboard/SummaryCard.vue";
import PaeAlertPanel from "@/components/dashboard/PaeAlertPanel.vue";
import DonutChart from "@/components/charts/DonutChart.vue";
import BarChart from "@/components/charts/BarChart.vue";

const auth = useAuthStore();
const toast = useToast();

const loading = ref(true);
const recalculating = ref(false);
const error = ref("");
const items = ref([]);
const lastCalculatedAt = ref(null);

const stats = computed(() => buildDashboardStats(items.value));
const paeList = computed(() => extractPaeList(items.value));

// Segmentos do donut (distribuicao por grupo).
const donutSegments = computed(() =>
  stats.value.groupDistribution.map((g) => ({
    label: groupMeta(g.group).short,
    value: g.count,
    color: groupMeta(g.group).color,
  }))
);

// Barras de media por categoria (0..100%).
const categoryBars = computed(() =>
  stats.value.categoryAverages.map((c) => ({
    label: c.label,
    value: c.averagePercent,
    display: c.averagePercent.toFixed(0),
    suffix: "%",
    color: c.averagePercent >= 80 ? "#16a34a" : c.averagePercent >= 50 ? "#f59e0b" : "#ef4444",
  }))
);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const res = await suppliersService.listAllCalculated({ pageSize: 500 });
    items.value = res.data || [];
    lastCalculatedAt.value = items.value.reduce((latest, it) => {
      const t = it.calculatedAt ? new Date(it.calculatedAt).getTime() : 0;
      return t > latest ? t : latest;
    }, 0);
  } catch (e) {
    error.value = extractApiError(e).message;
  } finally {
    loading.value = false;
  }
}

async function recalculate() {
  recalculating.value = true;
  try {
    const res = await suppliersService.calculateAll();
    const processed = res?.result?.processed ?? 0;
    toast.success(`Cálculo concluído: ${processed} produtores processados.`);
    await load();
  } catch (e) {
    toast.error(extractApiError(e).message);
  } finally {
    recalculating.value = false;
  }
}

const lastLabel = computed(() => {
  if (!lastCalculatedAt.value) return "";
  return new Date(lastCalculatedAt.value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
});
</script>

<template>
  <div class="dash">
    <div class="dash__head">
      <div>
        <h2>Visão Geral</h2>
        <p class="muted">
          Panorama dos fornecedores avaliados no PQFL.
          <span v-if="lastLabel"> Última atualização do cálculo: <strong>{{ lastLabel }}</strong>.</span>
        </p>
      </div>
      <div class="flex gap-sm">
        <BaseButton variant="ghost" @click="load">Atualizar</BaseButton>
        <BaseButton v-if="auth.isAdmin" :loading="recalculating" @click="recalculate">
          Recalcular pontuações
        </BaseButton>
      </div>
    </div>

    <BaseSpinner v-if="loading" label="Carregando indicadores..." />

    <EmptyState
      v-else-if="error"
      title="Não foi possível carregar"
      :message="error"
    >
      <BaseButton variant="subtle" @click="load">Tentar novamente</BaseButton>
    </EmptyState>

    <EmptyState
      v-else-if="!stats.total"
      title="Nenhum produtor calculado"
      message="Ainda não há fornecedores calculados. Um administrador precisa executar o cálculo de pontuações."
    >
      <BaseButton v-if="auth.isAdmin" :loading="recalculating" @click="recalculate">Calcular agora</BaseButton>
    </EmptyState>

    <template v-else>
      <!-- KPIs -->
      <div class="grid grid-cards">
        <SummaryCard label="Produtores avaliados" :value="formatNumber(stats.total)" icon="users" hint="Total no banco calculado" />
        <SummaryCard
          label="Pontuação média"
          :value="formatScore(stats.averageScore)"
          icon="chart"
          hint="Escala de 0 a 100"
          accent="#275f30"
          accentSoft="rgba(39,95,48,0.1)"
        />
        <SummaryCard
          label="Em G1 (Excelência)"
          :value="formatNumber(stats.groupCounts.G1)"
          icon="trophy"
          :hint="`${((stats.groupCounts.G1 / stats.total) * 100).toFixed(0)}% do total`"
          accent="#16a34a"
          accentSoft="rgba(22,163,74,0.12)"
        />
        <SummaryCard
          label="Em PAE"
          :value="formatNumber(stats.inPAE)"
          icon="alert"
          :hint="`${stats.paePercent.toFixed(0)}% — ação emergencial`"
          accent="#ef4444"
          accentSoft="rgba(239,68,68,0.12)"
        />
      </div>

      <!-- Distribuicao + categorias -->
      <div class="grid grid-2">
        <BaseCard title="Distribuição por grupo" subtitle="Classificação G1 / G2 / G3">
          <div class="dist">
            <DonutChart :segments="donutSegments" :center-value="formatNumber(stats.total)" center-label="produtores" />
            <ul class="legend">
              <li v-for="g in stats.groupDistribution" :key="g.group">
                <span class="legend__dot" :style="{ background: groupMeta(g.group).color }"></span>
                <div class="legend__text">
                  <strong>{{ groupMeta(g.group).label }}</strong>
                  <small class="muted">{{ groupMeta(g.group).description }}</small>
                </div>
                <span class="legend__val mono">
                  {{ g.count }} <small class="muted">({{ g.percent.toFixed(0) }}%)</small>
                </span>
              </li>
            </ul>
          </div>
        </BaseCard>

        <BaseCard title="Conformidade média por categoria BPA" subtitle="Média do rawScore (%) entre todos os produtores">
          <BarChart :items="categoryBars" :max="100" />
        </BaseCard>
      </div>

      <!-- PAE -->
      <BaseCard
        title="Produtores em PAE (Plano de Ação Emergencial)"
        :subtitle="`${paeList.length} produtor(es) — CPP acima de 300.000 ou presença de resíduos`"
      >
        <template #actions>
          <span class="pill" style="background: rgba(239,68,68,0.12); color:#ef4444">{{ paeList.length }} alertas</span>
        </template>
        <PaeAlertPanel :items="paeList" />
      </BaseCard>
    </template>
  </div>
</template>

<style scoped>
.dash {
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.dash__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.dash__head h2 {
  font-size: 1.45rem;
}
.dash__head p {
  margin-top: 4px;
  font-size: 0.9rem;
}
.dist {
  display: flex;
  align-items: center;
  gap: 28px;
  flex-wrap: wrap;
}
.legend {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.legend li {
  display: flex;
  align-items: center;
  gap: 12px;
}
.legend__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}
.legend__text {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.legend__text strong {
  font-size: 0.9rem;
}
.legend__text small {
  font-size: 0.76rem;
}
.legend__val {
  font-weight: 700;
  font-size: 0.95rem;
}
</style>

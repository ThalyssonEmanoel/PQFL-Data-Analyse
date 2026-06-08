<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import suppliersService from "@/services/suppliersService.js";
import { extractApiError } from "@/services/http.js";
import { BPA_CATEGORIES, groupMeta, CPP_LIMIT } from "@/constants/bpa.js";
import { formatNumber, formatScore, formatPercent, formatDateTime } from "@/utils/format.js";

import BaseCard from "@/components/ui/BaseCard.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import BaseSpinner from "@/components/ui/BaseSpinner.vue";
import EmptyState from "@/components/ui/EmptyState.vue";
import GroupBadge from "@/components/ui/GroupBadge.vue";
import ScoreGauge from "@/components/charts/ScoreGauge.vue";
import BarChart from "@/components/charts/BarChart.vue";

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref("");
const producer = ref(null);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const res = await suppliersService.listCalculated({ id: route.params.id, pageSize: 1 });
    producer.value = (res.data || [])[0] || null;
    if (!producer.value) error.value = "Produtor não encontrado.";
  } catch (e) {
    error.value = extractApiError(e).message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);

const meta = computed(() => groupMeta(producer.value?.group));

// Categorias ordenadas conforme a regra de negocio (peso), com o score salvo.
const categories = computed(() => {
  const scores = producer.value?.categoryScores || {};
  return BPA_CATEGORIES.map((cat) => {
    const cs = scores[cat.key] || {};
    return {
      key: cat.key,
      label: cat.label,
      weight: cat.weight,
      rawScore: cs.rawScore ?? 0,
      weightedScore: cs.weightedScore ?? 0,
      questionCount: cs.questionCount ?? 0,
    };
  });
});

const categoryBars = computed(() =>
  categories.value.map((c) => ({
    label: c.label,
    value: c.rawScore * 100,
    display: (c.rawScore * 100).toFixed(0),
    suffix: "%",
    color: c.rawScore >= 0.8 ? "#16a34a" : c.rawScore >= 0.5 ? "#f59e0b" : "#ef4444",
  }))
);

const actions = computed(() => producer.value?.actions || {});
const metrics = computed(() => producer.value?.metrics || {});
const cppHigh = computed(() => metrics.value.cpp != null && metrics.value.cpp > CPP_LIMIT);

// Diagnostico oficial: categorias com falhas, ordenadas por conformidade (pior primeiro).
const diagnostics = computed(() =>
  (actions.value.factorDiagnostics || [])
    .slice()
    .sort((a, b) => a.conformity - b.conformity)
);
</script>

<template>
  <div class="detail">
    <button class="back" @click="router.back()">← Voltar</button>

    <BaseSpinner v-if="loading" label="Carregando produtor..." />

    <EmptyState v-else-if="error" title="Não foi possível abrir" :message="error">
      <BaseButton variant="subtle" @click="$router.push({ name: 'producers' })">Ver lista de produtores</BaseButton>
    </EmptyState>

    <template v-else-if="producer">
      <!-- Cabecalho -->
      <BaseCard padded>
        <div class="hero">
          <div class="hero__id">
            <div class="flex items-center gap-sm wrap">
              <h2>{{ producer.producerName || "Produtor sem nome" }}</h2>
              <GroupBadge :group="producer.group" with-label />
            </div>
            <p class="muted mono">ID: {{ producer.producerId || "—" }} · doc {{ producer._id }}</p>
            <p class="muted">Calculado em {{ formatDateTime(producer.calculatedAt) }}</p>

            <div class="hero__metrics">
              <div class="metric" :class="{ 'metric--bad': cppHigh }">
                <span class="metric__label">CPP (Contagem Padrão em Placas)</span>
                <strong class="mono">{{ metrics.cpp != null ? formatNumber(metrics.cpp) : "—" }}</strong>
                <small v-if="cppHigh" class="metric__warn">Acima do limite de {{ formatNumber(CPP_LIMIT) }}</small>
                <small v-else class="muted">Limite PAE: {{ formatNumber(CPP_LIMIT) }}</small>
              </div>
              <div class="metric" :class="{ 'metric--bad': metrics.hasResidue }">
                <span class="metric__label">Presença de resíduos</span>
                <strong>{{ metrics.hasResidue ? "Detectada" : "Não detectada" }}</strong>
                <small :class="metrics.hasResidue ? 'metric__warn' : 'muted'">
                  {{ metrics.hasResidue ? "Dispara PAE Grupo 2" : "Conforme" }}
                </small>
              </div>
              <div class="metric">
                <span class="metric__label">Situação</span>
                <strong>
                  <span v-if="actions.inPAE" style="color:#ef4444">Em PAE</span>
                  <span v-else-if="actions.pbpaCategories?.length" style="color:#b45309">Em PBPA</span>
                  <span v-else style="color:#16a34a">Regular</span>
                </strong>
                <small class="muted">Plano de ação vigente</small>
              </div>
            </div>
          </div>

          <div class="hero__score">
            <ScoreGauge :score="producer.totalScore" :group="producer.group" :size="170" />
            <p class="muted text-center" style="max-width: 200px">{{ meta.description }}</p>
          </div>
        </div>
      </BaseCard>

      <!-- Alertas PAE -->
      <BaseCard v-if="actions.inPAE" title="Plano de Ação Emergencial (PAE)" subtitle="Não conformidades críticas detectadas">
        <template #actions>
          <span class="pill" style="background: rgba(239,68,68,0.12); color:#ef4444">Crítico</span>
        </template>
        <ul class="reasons">
          <li v-for="(r, i) in actions.paeReasons" :key="i">{{ r }}</li>
        </ul>
        <div v-if="actions.paeActions?.length" class="actions-block">
          <h4>Ações recomendadas</h4>
          <ul class="checklist">
            <li v-for="(a, i) in actions.paeActions" :key="i">{{ a }}</li>
          </ul>
        </div>
      </BaseCard>

      <!-- Categorias -->
      <div class="grid grid-2">
        <BaseCard title="Conformidade por categoria" subtitle="rawScore (%) de cada categoria BPA">
          <BarChart :items="categoryBars" :max="100" />
        </BaseCard>

        <BaseCard title="Detalhamento da pontuação" subtitle="Contribuição de cada categoria (peso e pontos)">
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Peso</th>
                  <th>Conformidade</th>
                  <th>Pontos</th>
                  <th>Itens</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in categories" :key="c.key">
                  <td><strong class="cat-name">{{ c.label }}</strong></td>
                  <td class="mono muted">{{ c.weight }}</td>
                  <td class="mono">{{ formatPercent(c.rawScore) }}</td>
                  <td class="mono"><strong>{{ formatScore(c.weightedScore) }}</strong> / {{ c.weight }}</td>
                  <td class="mono muted">{{ c.questionCount }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3"><strong>Pontuação total</strong></td>
                  <td class="mono"><strong :style="{ color: meta.color }">{{ formatScore(producer.totalScore) }}</strong> / 100</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </BaseCard>
      </div>

      <!-- PBPA -->
      <BaseCard
        v-if="actions.pbpaActions?.length"
        title="Plano de Boas Práticas Agropecuárias (PBPA)"
        :subtitle="`${actions.pbpaCategories?.length || 0} categoria(s) abaixo do nível de conformidade`"
      >
        <template #actions>
          <span class="pill" style="background: rgba(245,158,11,0.14); color:#b45309">Melhoria contínua</span>
        </template>
        <ul class="checklist">
          <li v-for="(a, i) in actions.pbpaActions" :key="i">{{ a }}</li>
        </ul>
      </BaseCard>

      <!-- Diagnostico oficial -->
      <BaseCard title="Diagnóstico de fatores" subtitle="Itens oficiais verificados por categoria (menor conformidade primeiro)">
        <div class="diag">
          <div v-for="d in diagnostics" :key="d.key" class="diag__item">
            <div class="diag__head">
              <strong>{{ d.label }}</strong>
              <span
                class="pill"
                :style="{
                  background: d.conformity >= 0.8 ? 'rgba(22,163,74,0.12)' : d.conformity >= 0.5 ? 'rgba(245,158,11,0.14)' : 'rgba(239,68,68,0.12)',
                  color: d.conformity >= 0.8 ? '#16a34a' : d.conformity >= 0.5 ? '#b45309' : '#ef4444',
                }"
              >
                {{ formatPercent(d.conformity) }} conforme
              </span>
            </div>
            <div v-if="d.failedFieldLabels?.length" class="diag__failed">
              <small class="muted">Pendências:</small>
              <span v-for="(f, i) in d.failedFieldLabels" :key="i" class="chip">{{ f }}</span>
            </div>
            <small v-else class="muted">Todos os itens verificados estão conformes.</small>
          </div>
        </div>
      </BaseCard>
    </template>
  </div>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.back {
  align-self: flex-start;
  background: none;
  border: none;
  color: var(--c-primary-dark);
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0;
}
.hero {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  flex-wrap: wrap;
}
.hero__id {
  flex: 1;
  min-width: 280px;
}
.hero__id h2 {
  font-size: 1.5rem;
}
.hero__id > p {
  margin-top: 4px;
  font-size: 0.82rem;
}
.hero__metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  margin-top: 20px;
}
.metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px;
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
  border-radius: 12px;
}
.metric--bad {
  background: rgba(239, 68, 68, 0.06);
  border-color: rgba(239, 68, 68, 0.25);
}
.metric__label {
  font-size: 0.74rem;
  color: var(--c-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.metric strong {
  font-size: 1.2rem;
}
.metric__warn {
  color: var(--c-danger);
  font-weight: 600;
  font-size: 0.74rem;
}
.hero__score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.reasons {
  margin: 0;
  padding-left: 20px;
  color: var(--c-text-soft);
  line-height: 1.7;
}
.actions-block {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--c-border);
}
.actions-block h4 {
  font-size: 0.92rem;
  margin-bottom: 10px;
}
.checklist {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.checklist li {
  position: relative;
  padding-left: 26px;
  color: var(--c-text-soft);
  font-size: 0.9rem;
  line-height: 1.5;
}
.checklist li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 3px;
  width: 16px;
  height: 16px;
  border-radius: 5px;
  background: var(--c-primary-soft);
  border: 1.5px solid var(--c-primary);
}
.table-wrap {
  overflow-x: auto;
}
.cat-name {
  color: var(--c-text);
  font-weight: 600;
  font-size: 0.86rem;
}
.table tfoot td {
  border-bottom: none;
  border-top: 2px solid var(--c-border);
  padding-top: 14px;
}
.diag {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
}
.diag__item {
  border: 1px solid var(--c-border);
  border-radius: 12px;
  padding: 14px;
}
.diag__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}
.diag__head strong {
  font-size: 0.88rem;
}
.diag__failed {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.chip {
  background: rgba(239, 68, 68, 0.08);
  color: #b91c1c;
  border-radius: 7px;
  padding: 3px 9px;
  font-size: 0.76rem;
  font-weight: 500;
}
</style>

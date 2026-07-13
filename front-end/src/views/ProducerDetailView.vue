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
import BaseModal from "@/components/ui/BaseModal.vue";
import EmptyState from "@/components/ui/EmptyState.vue";
import GroupBadge from "@/components/ui/GroupBadge.vue";
import ScoreGauge from "@/components/charts/ScoreGauge.vue";
import BarChart from "@/components/charts/BarChart.vue";
import PeriodComparisonPanel from "@/components/produtor/PeriodComparisonPanel.vue";

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref("");
const producer = ref(null);
const periodHistory = ref(null);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const res = await suppliersService.listCalculated({ id: route.params.id, pageSize: 1 });
    producer.value = (res.data || [])[0] || null;
    if (!producer.value) {
      error.value = "Produtor não encontrado.";
    } else {
      // Busca o historico de periodos; a comparacao so aparece se o back-end suportar (2+ periodos).
      loadPeriods(producer.value.producerId);
    }
  } catch (e) {
    error.value = extractApiError(e).message;
  } finally {
    loading.value = false;
  }
}

// Carrega o historico de periodos em segundo plano (nao bloqueia o restante da tela).
async function loadPeriods(producerId) {
  periodHistory.value = null;
  if (!producerId) return;
  try {
    const data = await suppliersService.getProducerPeriods(producerId);
    periodHistory.value = data?.supported ? data : null;
  } catch {
    periodHistory.value = null; // falha aqui nao deve quebrar a tela do produtor
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

// Lookup key -> diagnostico (para abrir os campos de uma categoria no modal).
const diagnosticByKey = computed(() => {
  const map = {};
  for (const d of actions.value.factorDiagnostics || []) map[d.key] = d;
  return map;
});

// Categoria selecionada para detalhar os campos (modal).
const selectedCategoryKey = ref(null);
const categoryModalOpen = ref(false);

const selectedDiagnostic = computed(() =>
  selectedCategoryKey.value ? diagnosticByKey.value[selectedCategoryKey.value] || null : null
);

// Campos da categoria selecionada, conformes primeiro? Mantemos a ordem do checklist
// e separamos contagem de conformes para o resumo do modal.
const selectedFields = computed(() => selectedDiagnostic.value?.fields || []);
const selectedConformingCount = computed(
  () => selectedFields.value.filter((f) => f.conforming).length
);

function openCategory(key) {
  // So abre se houver campos oficiais mapeados para a categoria.
  const diag = diagnosticByKey.value[key];
  if (!diag || !(diag.definedCount > 0)) return;
  selectedCategoryKey.value = key;
  categoryModalOpen.value = true;
}
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

        <BaseCard title="Detalhamento da pontuação" subtitle="Clique em uma categoria para ver seus campos e o que está conforme">
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
                <tr
                  v-for="c in categories"
                  :key="c.key"
                  class="row-click"
                  role="button"
                  tabindex="0"
                  :title="`Ver campos de ${c.label}`"
                  @click="openCategory(c.key)"
                  @keydown.enter.prevent="openCategory(c.key)"
                  @keydown.space.prevent="openCategory(c.key)"
                >
                  <td>
                    <strong class="cat-name">{{ c.label }}</strong>
                    <span class="cat-chevron" aria-hidden="true">›</span>
                  </td>
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

      <!-- Comparacao por periodo (so quando o back-end tem 2+ periodos registrados) -->
      <BaseCard
        v-if="periodHistory"
        title="Comparação por período"
        subtitle="Compare o último período registrado com períodos anteriores"
      >
        <PeriodComparisonPanel
          :periods="periodHistory.periods"
          :snapshots="periodHistory.snapshots"
          :latest-period-key="periodHistory.latestPeriodKey"
        />
      </BaseCard>

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

      <!-- Modal: campos de uma categoria e sua conformidade -->
      <BaseModal
        v-model="categoryModalOpen"
        :title="selectedDiagnostic?.label || 'Campos da categoria'"
        :subtitle="selectedDiagnostic
          ? `${selectedConformingCount} de ${selectedFields.length} item(ns) conforme(s) · ${formatPercent(selectedDiagnostic.conformity)} de conformidade`
          : ''"
      >
        <template v-if="selectedFields.length">
          <ul class="fields">
            <li v-for="(f, i) in selectedFields" :key="i" class="fields__item" :class="{ 'fields__item--ok': f.conforming }">
              <span class="fields__icon" :class="f.conforming ? 'fields__icon--ok' : 'fields__icon--bad'" aria-hidden="true">
                {{ f.conforming ? "✓" : "✕" }}
              </span>
              <div class="fields__text">
                <span class="fields__label">{{ f.label }}</span>
                <span class="fields__tags">
                  <span v-if="f.imprescindivel" class="tag tag--impr">Imprescindível</span>
                  <span v-if="!f.found" class="tag tag--missing">Não encontrado no Coletum</span>
                  <span class="tag" :class="f.conforming ? 'tag--ok' : 'tag--bad'">
                    {{ f.conforming ? "Conforme" : "Não conforme" }}
                  </span>
                </span>
              </div>
            </li>
          </ul>
          <p class="fields__note muted">
            Os itens acima são os campos oficiais (checklist MAPA) avaliados nesta categoria. A conformidade da
            categoria é a proporção de itens conformes.
          </p>
        </template>
        <EmptyState
          v-else
          title="Sem detalhamento de campos"
          message="Este produtor foi calculado antes da atualização. Recalcule as pontuações (admin) para ver os campos por categoria."
        />
      </BaseModal>
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
.row-click {
  cursor: pointer;
  transition: background 0.15s ease;
}
.row-click:hover {
  background: var(--c-surface-2, rgba(148, 163, 184, 0.1));
}
.row-click:focus-visible {
  outline: 2px solid var(--c-primary, #275f30);
  outline-offset: -2px;
}
.cat-chevron {
  color: var(--c-text-muted);
  font-weight: 700;
  margin-left: 6px;
  opacity: 0;
  transition: opacity 0.15s ease;
}
.row-click:hover .cat-chevron,
.row-click:focus-visible .cat-chevron {
  opacity: 1;
}
/* Lista de campos no modal de categoria */
.fields {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.fields__item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 14px;
  border: 1px solid var(--c-border);
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.05);
}
.fields__item--ok {
  background: rgba(22, 163, 74, 0.06);
}
.fields__icon {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 800;
  color: #fff;
}
.fields__icon--ok {
  background: #16a34a;
}
.fields__icon--bad {
  background: #ef4444;
}
.fields__text {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.fields__label {
  font-size: 0.86rem;
  line-height: 1.4;
  color: var(--c-text);
}
.fields__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tag {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
}
.tag--ok {
  background: rgba(22, 163, 74, 0.12);
  color: #16a34a;
}
.tag--bad {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}
.tag--impr {
  background: rgba(37, 95, 48, 0.12);
  color: #275f30;
}
.tag--missing {
  background: rgba(148, 163, 184, 0.18);
  color: #475569;
}
.fields__note {
  margin-top: 14px;
  font-size: 0.78rem;
  line-height: 1.4;
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

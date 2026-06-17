<script setup>
import { ref, computed, watch } from "vue";
import { BPA_CATEGORIES, groupMeta, CPP_LIMIT } from "@/constants/bpa.js";
import { formatNumber, formatScore, formatPercent } from "@/utils/format.js";
import GroupBadge from "@/components/ui/GroupBadge.vue";

// Compara o periodo mais recente do produtor com um periodo anterior selecionavel.
// Recebe a resposta de GET /suppliers-calculated/periods.
const props = defineProps({
  periods: { type: Array, required: true }, // [{ key, label, sortOrder }] desc
  snapshots: { type: Object, required: true }, // { [periodKey]: snapshot }
  latestPeriodKey: { type: String, default: null },
});

// Periodo "atual" (fixo): o mais recente registrado.
const afterKey = computed(() => props.latestPeriodKey ?? props.periods[0]?.key ?? null);

// Periodos disponiveis para comparacao (todos, menos o atual).
const comparablePeriods = computed(() =>
  props.periods.filter((p) => p.key !== afterKey.value)
);

// Periodo anterior selecionado (default: o segundo mais recente).
const beforeKey = ref(comparablePeriods.value[0]?.key ?? null);
watch(comparablePeriods, (list) => {
  if (!list.some((p) => p.key === beforeKey.value)) {
    beforeKey.value = list[0]?.key ?? null;
  }
});

const after = computed(() => (afterKey.value ? props.snapshots[afterKey.value] : null));
const before = computed(() => (beforeKey.value ? props.snapshots[beforeKey.value] : null));

const afterLabel = computed(() => props.periods.find((p) => p.key === afterKey.value)?.label ?? "—");
const beforeLabel = computed(() => props.periods.find((p) => p.key === beforeKey.value)?.label ?? "—");

function rawScore(snapshot, key) {
  return snapshot?.categoryScores?.[key]?.rawScore ?? 0;
}

// Linhas de comparacao por categoria (antes / depois / variacao).
const categoryRows = computed(() =>
  BPA_CATEGORIES.map((cat) => {
    const beforeScore = rawScore(before.value, cat.key);
    const afterScore = rawScore(after.value, cat.key);
    return {
      key: cat.key,
      label: cat.label,
      beforeScore,
      afterScore,
      delta: afterScore - beforeScore,
    };
  })
);

const totalDelta = computed(() => (after.value?.totalScore ?? 0) - (before.value?.totalScore ?? 0));
const cppDelta = computed(() => {
  const a = after.value?.metrics?.cpp;
  const b = before.value?.metrics?.cpp;
  if (a == null || b == null) return null;
  return a - b;
});

function deltaClass(delta, { invert = false } = {}) {
  if (!delta) return "delta--flat";
  const positive = invert ? delta < 0 : delta > 0;
  return positive ? "delta--up" : "delta--down";
}

function signed(value, decimals = 1) {
  if (value === null || value === undefined) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${Number(value).toFixed(decimals)}`;
}
</script>

<template>
  <div class="cmp">
    <div class="cmp__controls">
      <div class="period period--after">
        <span class="period__tag">Período atual</span>
        <strong>{{ afterLabel }}</strong>
      </div>
      <span class="cmp__vs">vs</span>
      <label class="period period--before">
        <span class="period__tag">Comparar com</span>
        <select v-model="beforeKey" class="period__select">
          <option v-for="p in comparablePeriods" :key="p.key" :value="p.key">{{ p.label }}</option>
        </select>
      </label>
    </div>

    <!-- Resumo (pontuacao / grupo / CPP) -->
    <div class="summary">
      <div class="summary__item">
        <span class="summary__label">Pontuação total</span>
        <div class="summary__values">
          <span class="mono muted">{{ formatScore(before?.totalScore) }}</span>
          <span class="arrow">→</span>
          <span class="mono"><strong>{{ formatScore(after?.totalScore) }}</strong></span>
          <span class="delta" :class="deltaClass(totalDelta)">{{ signed(totalDelta) }}</span>
        </div>
      </div>

      <div class="summary__item">
        <span class="summary__label">Classificação</span>
        <div class="summary__values">
          <GroupBadge v-if="before?.group" :group="before.group" />
          <span v-else class="muted">—</span>
          <span class="arrow">→</span>
          <GroupBadge v-if="after?.group" :group="after.group" />
          <span v-else class="muted">—</span>
        </div>
      </div>

      <div class="summary__item">
        <span class="summary__label">CPP</span>
        <div class="summary__values">
          <span class="mono muted">{{ before?.metrics?.cpp != null ? formatNumber(before.metrics.cpp) : "—" }}</span>
          <span class="arrow">→</span>
          <span class="mono" :class="{ 'cpp-high': after?.metrics?.cpp > CPP_LIMIT }">
            <strong>{{ after?.metrics?.cpp != null ? formatNumber(after.metrics.cpp) : "—" }}</strong>
          </span>
          <span v-if="cppDelta !== null" class="delta" :class="deltaClass(cppDelta, { invert: true })">
            {{ signed(cppDelta, 0) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Comparacao por categoria -->
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Categoria</th>
            <th class="num">{{ beforeLabel }}</th>
            <th class="num">{{ afterLabel }}</th>
            <th class="num">Variação</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in categoryRows" :key="row.key">
            <td><strong class="cat-name">{{ row.label }}</strong></td>
            <td class="num mono muted">{{ formatPercent(row.beforeScore) }}</td>
            <td class="num mono">{{ formatPercent(row.afterScore) }}</td>
            <td class="num">
              <span class="delta" :class="deltaClass(row.delta)">{{ signed(row.delta * 100, 0) }} pp</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.cmp {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.cmp__controls {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  flex-wrap: wrap;
}
.period {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.period__tag {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--c-text-muted);
}
.period--after strong {
  font-size: 1.05rem;
}
.period__select {
  padding: 8px 12px;
  border: 1.5px solid var(--c-border);
  border-radius: 10px;
  background: var(--c-surface);
  color: var(--c-text);
  font-size: 0.9rem;
  font-weight: 600;
}
.cmp__vs {
  color: var(--c-text-muted);
  font-weight: 600;
  padding-bottom: 8px;
}
.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}
.summary__item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
  border-radius: 12px;
}
.summary__label {
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--c-text-muted);
}
.summary__values {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.arrow {
  color: var(--c-text-muted);
}
.delta {
  font-size: 0.8rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
}
.delta--up {
  background: rgba(22, 163, 74, 0.12);
  color: #16a34a;
}
.delta--down {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}
.delta--flat {
  background: var(--c-surface-2);
  color: var(--c-text-muted);
}
.cpp-high {
  color: var(--c-danger);
}
.table-wrap {
  overflow-x: auto;
}
.table .num {
  text-align: right;
  white-space: nowrap;
}
.cat-name {
  color: var(--c-text);
  font-weight: 600;
  font-size: 0.86rem;
}
</style>

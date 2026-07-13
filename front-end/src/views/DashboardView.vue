<script setup>
import { ref, computed, onMounted } from "vue";
import suppliersService from "@/services/suppliersService.js";
import { extractApiError } from "@/services/http.js";
import { buildDashboardStats, extractPaeList } from "@/utils/aggregations.js";
import { groupMeta, buildGroupActionCatalog } from "@/constants/bpa.js";
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
    group: g.group,
    label: groupMeta(g.group).short,
    value: g.count,
    color: groupMeta(g.group).color,
  }))
);

// Grupo selecionado (clique no grafico/legenda) para exibir o catalogo de acoes padrao.
const selectedGroup = ref(null);

// Indice do segmento selecionado no donut (para destaque visual).
const selectedGroupIndex = computed(() =>
  selectedGroup.value ? donutSegments.value.findIndex((s) => s.group === selectedGroup.value) : -1
);

// Catalogo de acoes padrao do grupo selecionado, agrupado por categoria.
const groupCatalog = computed(() =>
  selectedGroup.value ? buildGroupActionCatalog(selectedGroup.value, items.value) : null
);

// Alterna a selecao do grupo (clicar novamente fecha o catalogo).
function selectGroup(group) {
  selectedGroup.value = selectedGroup.value === group ? null : group;
}

function onDonutSelect({ segment }) {
  if (segment?.group) selectGroup(segment.group);
}

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

// Carrega os indicadores automaticamente ao entrar na tela (sem exigir clique em "Atualizar").
onMounted(load);
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
        <BaseCard title="Distribuição por grupo" subtitle="Clique em um grupo para ver as ações padrão (G1 / G2 / G3)">
          <div class="dist">
            <DonutChart
              :segments="donutSegments"
              :center-value="formatNumber(stats.total)"
              center-label="produtores"
              clickable
              :active-index="selectedGroupIndex"
              @select="onDonutSelect"
            />
            <ul class="legend">
              <li
                v-for="g in stats.groupDistribution"
                :key="g.group"
                class="legend__item"
                :class="{ 'legend__item--active': selectedGroup === g.group }"
                role="button"
                tabindex="0"
                :aria-pressed="selectedGroup === g.group"
                @click="selectGroup(g.group)"
                @keydown.enter.prevent="selectGroup(g.group)"
                @keydown.space.prevent="selectGroup(g.group)"
              >
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

          <!-- Catalogo de acoes padrao do grupo selecionado -->
          <div v-if="groupCatalog" class="catalog">
            <div class="catalog__head">
              <div>
                <strong class="catalog__title">
                  Todas as ações padrões por categoria —
                  <span :style="{ color: groupMeta(selectedGroup).color }">{{ groupMeta(selectedGroup).label }}</span>
                </strong>
                <small class="muted catalog__note">
                  Visão geral de todas as atividades possíveis para este grupo. Cada produtor recebe apenas
                  o subconjunto correspondente aos seus cenários específicos.
                </small>
              </div>
              <button type="button" class="catalog__close" aria-label="Fechar" @click="selectedGroup = null">×</button>
            </div>

            <div class="catalog__grid">
              <div v-for="cat in groupCatalog.categories" :key="cat.key" class="catalog__cat">
                <span class="catalog__cat-label">{{ cat.label }}</span>
                <ul class="catalog__actions">
                  <li v-for="(a, i) in cat.actions" :key="i">{{ a }}</li>
                </ul>
              </div>
            </div>

            <div v-if="groupCatalog.paeActions.length" class="catalog__extra">
              <span class="catalog__cat-label catalog__cat-label--pae">Ações emergenciais (PAE)</span>
              <ul class="catalog__actions">
                <li v-for="(a, i) in groupCatalog.paeActions" :key="i">{{ a }}</li>
              </ul>
            </div>

            <div v-if="groupCatalog.extraActions.length" class="catalog__extra">
              <span class="catalog__cat-label catalog__cat-label--g1">Ações preventivas (G1)</span>
              <ul class="catalog__actions">
                <li v-for="(a, i) in groupCatalog.extraActions" :key="i">{{ a }}</li>
              </ul>
            </div>
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
.legend__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  margin: -8px -10px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.legend__item:hover {
  background: var(--c-surface-2, rgba(148, 163, 184, 0.1));
}
.legend__item--active {
  background: var(--c-surface-2, rgba(148, 163, 184, 0.12));
  border-color: var(--c-border);
}
.legend__item:focus-visible {
  outline: 2px solid var(--c-primary, #275f30);
  outline-offset: 2px;
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

/* Catalogo de acoes padrao por grupo */
.catalog {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid var(--c-border);
}
.catalog__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.catalog__title {
  font-size: 0.98rem;
  display: block;
}
.catalog__note {
  display: block;
  margin-top: 4px;
  font-size: 0.78rem;
  line-height: 1.4;
  max-width: 60ch;
}
.catalog__close {
  border: none;
  background: transparent;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  color: var(--c-text-muted);
  padding: 2px 8px;
  border-radius: 8px;
}
.catalog__close:hover {
  background: var(--c-surface-2, rgba(148, 163, 184, 0.12));
  color: var(--c-text);
}
.catalog__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}
.catalog__cat {
  background: var(--c-surface-2, rgba(148, 163, 184, 0.08));
  border: 1px solid var(--c-border);
  border-radius: 12px;
  padding: 12px 14px;
}
.catalog__cat-label {
  font-weight: 700;
  font-size: 0.86rem;
  display: block;
  margin-bottom: 8px;
}
.catalog__cat-label--pae {
  color: #ef4444;
}
.catalog__cat-label--g1 {
  color: #16a34a;
}
.catalog__actions {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.catalog__actions li {
  position: relative;
  padding-left: 18px;
  font-size: 0.82rem;
  line-height: 1.4;
  color: var(--c-text);
}
.catalog__actions li::before {
  content: "✓";
  position: absolute;
  left: 0;
  top: 0;
  color: var(--c-primary, #275f30);
  font-weight: 700;
}
.catalog__extra {
  margin-top: 14px;
}
</style>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import suppliersService from "@/services/suppliersService.js";
import { extractApiError } from "@/services/http.js";
import { GROUP_ORDER, groupMeta, CPP_LIMIT } from "@/constants/bpa.js";
import { formatNumber, formatScore } from "@/utils/format.js";

import BaseCard from "@/components/ui/BaseCard.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import BaseSpinner from "@/components/ui/BaseSpinner.vue";
import EmptyState from "@/components/ui/EmptyState.vue";
import GroupBadge from "@/components/ui/GroupBadge.vue";

const router = useRouter();

const loading = ref(true);
const error = ref("");
const all = ref([]);

const search = ref("");
const groupFilter = ref("ALL");
const sortDir = ref("desc"); // desc | asc (por pontuacao)
const onlyPae = ref(false);

const page = ref(1);
const pageSize = 12;

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const res = await suppliersService.listAllCalculated({ pageSize: 500 });
    all.value = res.data || [];
  } catch (e) {
    error.value = extractApiError(e).message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);

// Filtragem + ordenacao no cliente (busca instantanea).
const filtered = computed(() => {
  const term = search.value.trim().toLowerCase();
  let list = all.value.filter((it) => {
    if (groupFilter.value !== "ALL" && it.group !== groupFilter.value) return false;
    if (onlyPae.value && !it.actions?.inPAE) return false;
    if (term) {
      const name = (it.producerName || "").toLowerCase();
      const id = (it.producerId || "").toLowerCase();
      const oid = String(it._id || "").toLowerCase();
      if (!name.includes(term) && !id.includes(term) && !oid.includes(term)) return false;
    }
    return true;
  });
  list = list.slice().sort((a, b) => {
    const diff = (a.totalScore || 0) - (b.totalScore || 0);
    return sortDir.value === "asc" ? diff : -diff;
  });
  return list;
});

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)));
const paged = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filtered.value.slice(start, start + pageSize);
});

// Reseta a pagina ao mudar filtros.
watch([search, groupFilter, onlyPae, sortDir], () => {
  page.value = 1;
});

const groupTabs = computed(() => [
  { key: "ALL", label: "Todos", count: all.value.length, color: "var(--c-text-soft)" },
  ...GROUP_ORDER.map((g) => ({
    key: g,
    label: groupMeta(g).short,
    count: all.value.filter((it) => it.group === g).length,
    color: groupMeta(g).color,
  })),
]);

function openDetail(it) {
  router.push({ name: "producer-detail", params: { id: it._id } });
}
</script>

<template>
  <div class="producers">
    <div class="producers__head">
      <div>
        <h2>Produtores</h2>
        <p class="muted">{{ formatNumber(filtered.length) }} de {{ formatNumber(all.length) }} fornecedores</p>
      </div>
      <BaseButton variant="ghost" @click="load">Atualizar</BaseButton>
    </div>

    <BaseCard padded>
      <!-- Filtros -->
      <div class="filters">
        <div class="search grow">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input v-model="search" class="input" placeholder="Buscar por nome ou ID do produtor..." />
        </div>

        <div class="tabs">
          <button
            v-for="t in groupTabs"
            :key="t.key"
            class="tab"
            :class="{ 'tab--active': groupFilter === t.key }"
            :style="groupFilter === t.key ? { borderColor: t.color, color: t.color } : {}"
            @click="groupFilter = t.key"
          >
            {{ t.label }}<span class="tab__count">{{ t.count }}</span>
          </button>
        </div>
      </div>

      <div class="subfilters">
        <label class="check">
          <input type="checkbox" v-model="onlyPae" />
          Somente em PAE
        </label>
        <button class="sort" @click="sortDir = sortDir === 'asc' ? 'desc' : 'asc'">
          Pontuação
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path v-if="sortDir === 'desc'" d="M12 5v14M19 12l-7 7-7-7" />
            <path v-else d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>

      <BaseSpinner v-if="loading" label="Carregando produtores..." />

      <EmptyState v-else-if="error" title="Erro ao carregar" :message="error">
        <BaseButton variant="subtle" @click="load">Tentar novamente</BaseButton>
      </EmptyState>

      <EmptyState v-else-if="!filtered.length" title="Nenhum produtor encontrado" message="Ajuste os filtros ou a busca." />

      <template v-else>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Produtor</th>
                <th>ID</th>
                <th>Grupo</th>
                <th>Pontuação</th>
                <th>CPP</th>
                <th>Situação</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="it in paged" :key="it._id" class="clickable" @click="openDetail(it)">
                <td><strong class="name">{{ it.producerName || "Produtor sem nome" }}</strong></td>
                <td class="mono muted">{{ it.producerId || "—" }}</td>
                <td><GroupBadge :group="it.group" /></td>
                <td>
                  <span class="score mono" :style="{ color: groupMeta(it.group).color }">
                    {{ formatScore(it.totalScore) }}
                  </span>
                </td>
                <td class="mono" :class="{ 'cpp-high': it.metrics?.cpp > CPP_LIMIT }">
                  {{ it.metrics?.cpp != null ? formatNumber(it.metrics.cpp) : "—" }}
                </td>
                <td>
                  <span v-if="it.actions?.inPAE" class="pill pill--pae">PAE</span>
                  <span v-else-if="it.actions?.pbpaCategories?.length" class="pill pill--pbpa">PBPA</span>
                  <span v-else class="muted">—</span>
                </td>
                <td class="text-center">
                  <span class="go">›</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginacao -->
        <div class="pager">
          <span class="muted">Página {{ page }} de {{ totalPages }}</span>
          <div class="flex gap-sm">
            <BaseButton variant="ghost" :disabled="page <= 1" @click="page--">Anterior</BaseButton>
            <BaseButton variant="ghost" :disabled="page >= totalPages" @click="page++">Próxima</BaseButton>
          </div>
        </div>
      </template>
    </BaseCard>
  </div>
</template>

<style scoped>
.producers {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.producers__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.producers__head h2 {
  font-size: 1.45rem;
}
.filters {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 14px;
}
.tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 13px;
  border: 1.5px solid var(--c-border);
  background: var(--c-surface);
  border-radius: 999px;
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--c-text-soft);
  transition: all 0.15s ease;
}
.tab--active {
  background: var(--c-surface-2);
}
.tab__count {
  background: var(--c-surface-2);
  border-radius: 999px;
  padding: 1px 7px;
  font-size: 0.74rem;
  color: var(--c-text-muted);
}
.subfilters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--c-text-soft);
  cursor: pointer;
}
.sort {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--c-text-soft);
}
.table-wrap {
  overflow-x: auto;
  margin: 0 -20px;
}
.table {
  min-width: 720px;
}
.table th:first-child,
.table td:first-child {
  padding-left: 20px;
}
.name {
  color: var(--c-text);
}
.score {
  font-weight: 800;
  font-size: 0.95rem;
}
.cpp-high {
  color: var(--c-danger);
  font-weight: 700;
}
.pill--pae {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}
.pill--pbpa {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
}
.go {
  font-size: 1.3rem;
  color: var(--c-text-muted);
  font-weight: 700;
}
.pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
  font-size: 0.86rem;
}
</style>

<script setup>
import { useRouter } from "vue-router";
import GroupBadge from "@/components/ui/GroupBadge.vue";
import EmptyState from "@/components/ui/EmptyState.vue";
import { formatNumber } from "@/utils/format.js";

// Painel de produtores em PAE (Plano de Acao Emergencial).
defineProps({
  items: { type: Array, default: () => [] },
});

const router = useRouter();
function open(id) {
  router.push({ name: "producer-detail", params: { id } });
}
</script>

<template>
  <div>
    <EmptyState
      v-if="!items.length"
      title="Nenhum produtor em PAE"
      message="Nenhum fornecedor disparou Plano de Ação Emergencial (CPP acima do limite ou presença de resíduos)."
    />

    <ul v-else class="pae-list">
      <li v-for="p in items" :key="p.id" class="pae-item" @click="open(p.id)">
        <div class="pae-item__head">
          <div class="flex items-center gap-sm">
            <GroupBadge :group="p.group" />
            <strong>{{ p.name }}</strong>
          </div>
          <span class="pae-item__score mono">{{ formatNumber(p.totalScore, 1) }} pts</span>
        </div>
        <ul class="pae-reasons">
          <li v-for="(r, i) in p.reasons" :key="i">{{ r }}</li>
        </ul>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.pae-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 380px;
  overflow-y: auto;
}
.pae-item {
  border: 1px solid var(--c-border);
  border-left: 4px solid var(--c-danger);
  border-radius: 10px;
  padding: 12px 14px;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.05s ease;
}
.pae-item:hover {
  background: var(--c-surface-2);
}
.pae-item:active {
  transform: translateY(1px);
}
.pae-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.pae-item__score {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--c-danger);
}
.pae-reasons {
  margin: 8px 0 0;
  padding-left: 18px;
  color: var(--c-text-soft);
  font-size: 0.82rem;
  line-height: 1.5;
}
</style>

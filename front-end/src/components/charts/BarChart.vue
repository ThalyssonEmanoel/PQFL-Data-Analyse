<script setup>
import { computed } from "vue";

// Barras horizontais em HTML/CSS (acessivel e leve). Cada item:
//   { label, value, max?, color?, suffix? }
const props = defineProps({
  items: { type: Array, required: true },
  max: { type: Number, default: 100 },
  suffix: { type: String, default: "" },
});

const rows = computed(() =>
  props.items.map((it) => {
    const max = it.max ?? props.max;
    const pct = max ? Math.max(0, Math.min(100, ((it.value || 0) / max) * 100)) : 0;
    return { ...it, pct };
  })
);
</script>

<template>
  <ul class="bars">
    <li v-for="(row, i) in rows" :key="i" class="bar-row">
      <div class="bar-row__head">
        <span class="bar-row__label" :title="row.label">{{ row.label }}</span>
        <span class="bar-row__value mono">{{ row.display ?? row.value }}{{ row.suffix ?? suffix }}</span>
      </div>
      <div class="bar-track">
        <div
          class="bar-fill"
          :style="{ width: row.pct + '%', background: row.color || 'var(--c-primary)', animationDelay: i * 40 + 'ms' }"
        ></div>
      </div>
    </li>
  </ul>
</template>

<style scoped>
.bars {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.bar-row__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 6px;
}
.bar-row__label {
  font-size: 0.85rem;
  color: var(--c-text-soft);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bar-row__value {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--c-text);
  flex-shrink: 0;
}
.bar-track {
  height: 9px;
  background: var(--c-surface-2);
  border-radius: 999px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 999px;
  transform-origin: left;
  animation: grow 0.6s ease both;
}
@keyframes grow {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}
</style>

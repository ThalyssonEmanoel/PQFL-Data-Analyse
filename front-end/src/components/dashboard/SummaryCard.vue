<script setup>
// Cartao de metrica (KPI) com icone, valor e legenda.
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  hint: { type: String, default: "" },
  icon: { type: String, default: "chart" },
  accent: { type: String, default: "var(--c-primary)" },
  accentSoft: { type: String, default: "var(--c-primary-soft)" },
});

const icons = {
  chart: "M3 3v18h18M7 14l3-3 3 3 5-5",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  alert: "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01",
  trophy: "M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4zM5 4H3v2a3 3 0 0 0 3 3M19 4h2v2a3 3 0 0 1-3 3",
  drop: "M12 2.7s6 6.5 6 10.3a6 6 0 0 1-12 0c0-3.8 6-10.3 6-10.3z",
};
</script>

<template>
  <div class="summary fade-up">
    <span class="summary__icon" :style="{ background: accentSoft, color: accent }">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path :d="icons[icon] || icons.chart" />
      </svg>
    </span>
    <div class="summary__body">
      <span class="summary__label">{{ label }}</span>
      <strong class="summary__value mono">{{ value }}</strong>
      <small v-if="hint" class="summary__hint">{{ hint }}</small>
    </div>
  </div>
</template>

<style scoped>
.summary {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}
.summary__icon {
  display: grid;
  place-items: center;
  width: 50px;
  height: 50px;
  border-radius: 13px;
  flex-shrink: 0;
}
.summary__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.summary__label {
  font-size: 0.8rem;
  color: var(--c-text-muted);
  font-weight: 500;
}
.summary__value {
  font-size: 1.7rem;
  font-weight: 800;
  line-height: 1.1;
}
.summary__hint {
  font-size: 0.76rem;
  color: var(--c-text-muted);
}
</style>

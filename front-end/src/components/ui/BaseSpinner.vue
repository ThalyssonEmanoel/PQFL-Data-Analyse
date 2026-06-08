<script setup>
defineProps({
  label: { type: String, default: "Carregando..." },
  size: { type: Number, default: 28 },
});
</script>

<template>
  <div class="spinner-wrap">
    <span class="spinner" :style="{ width: size + 'px', height: size + 'px' }" aria-hidden="true"></span>
    <span v-if="label" class="spinner-label">{{ label }}</span>
  </div>
</template>

<style scoped>
.spinner-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 36px;
  color: var(--c-text-muted);
}
.spinner {
  border: 3px solid var(--c-border);
  border-top-color: var(--c-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.spinner-label {
  font-size: 0.85rem;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

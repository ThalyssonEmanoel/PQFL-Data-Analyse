<script setup>
defineProps({
  title: { type: String, default: "Nada por aqui" },
  message: { type: String, default: "" },
});
</script>

<template>
  <div class="empty">
    <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-3H5a2 2 0 0 0-2 3z" />
    </svg>
    <h4>{{ title }}</h4>
    <p v-if="message">{{ message }}</p>
    <slot />
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px 24px;
  color: var(--c-text-muted);
  text-align: center;
}
.empty h4 {
  color: var(--c-text-soft);
  font-size: 1rem;
}
.empty p {
  font-size: 0.88rem;
  max-width: 360px;
}
</style>

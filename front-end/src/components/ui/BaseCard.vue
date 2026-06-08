<script setup>
// Cartao base com cabecalho opcional (titulo, subtitulo e slot de acoes).
defineProps({
  title: { type: String, default: "" },
  subtitle: { type: String, default: "" },
  padded: { type: Boolean, default: true },
});
</script>

<template>
  <section class="card fade-up">
    <header v-if="title || $slots.actions || $slots.header" class="card__head">
      <div v-if="title || subtitle">
        <h3 class="card__title">{{ title }}</h3>
        <p v-if="subtitle" class="card__subtitle">{{ subtitle }}</p>
      </div>
      <slot name="header" />
      <div v-if="$slots.actions" class="card__actions">
        <slot name="actions" />
      </div>
    </header>
    <div :class="['card__body', { 'card__body--padded': padded }]">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.card {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--c-border);
}
.card__title {
  font-size: 1rem;
}
.card__subtitle {
  margin-top: 3px;
  font-size: 0.82rem;
  color: var(--c-text-muted);
}
.card__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.card__body--padded {
  padding: 20px;
}
</style>

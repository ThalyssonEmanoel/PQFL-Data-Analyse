<script setup>
// Botao reutilizavel com variantes e estado de carregamento.
defineProps({
  variant: { type: String, default: "primary" }, // primary | ghost | danger | subtle
  type: { type: String, default: "button" },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
});
</script>

<template>
  <button
    :type="type"
    class="btn"
    :class="[`btn--${variant}`, { 'btn--block': block, 'btn--loading': loading }]"
    :disabled="disabled || loading"
  >
    <span v-if="loading" class="btn__spinner" aria-hidden="true"></span>
    <slot v-else name="icon" />
    <span class="btn__label"><slot /></span>
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid transparent;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1;
  transition: transform 0.05s ease, background 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
  white-space: nowrap;
}
.btn:active {
  transform: translateY(1px);
}
.btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.btn--block {
  width: 100%;
}
.btn--primary {
  background: var(--c-primary);
  color: #fff;
  box-shadow: 0 6px 16px rgba(39, 95, 48, 0.28);
}
.btn--primary:hover:not(:disabled) {
  background: var(--c-primary-dark);
}
.btn--danger {
  background: var(--c-danger);
  color: #fff;
}
.btn--danger:hover:not(:disabled) {
  filter: brightness(0.95);
}
.btn--ghost {
  background: var(--c-surface);
  border-color: var(--c-border);
  color: var(--c-text-soft);
}
.btn--ghost:hover:not(:disabled) {
  background: var(--c-surface-2);
  color: var(--c-text);
}
.btn--subtle {
  background: var(--c-primary-soft);
  color: var(--c-primary-dark);
}
.btn--subtle:hover:not(:disabled) {
  background: rgba(39, 95, 48, 0.16);
}
.btn__spinner {
  width: 15px;
  height: 15px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: btnspin 0.7s linear infinite;
}
@keyframes btnspin {
  to {
    transform: rotate(360deg);
  }
}
</style>

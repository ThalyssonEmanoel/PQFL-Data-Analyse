<script setup>
import { useToast } from "@/composables/useToast.js";

const toast = useToast();

const icons = {
  success: "M20 6L9 17l-5-5",
  error: "M18 6L6 18M6 6l12 12",
  warning: "M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
  info: "M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z",
};
</script>

<template>
  <div class="toast-host">
    <transition-group name="toast">
      <div v-for="t in toast.items" :key="t.id" class="toast" :class="`toast--${t.type}`">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path :d="icons[t.type] || icons.info" />
        </svg>
        <span class="toast__msg">{{ t.message }}</span>
        <button class="toast__close" aria-label="Fechar" @click="toast.remove(t.id)">×</button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: min(380px, calc(100vw - 40px));
}
.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-left-width: 4px;
  border-radius: 10px;
  box-shadow: var(--shadow);
  font-size: 0.88rem;
  color: var(--c-text);
}
.toast--success {
  border-left-color: var(--c-success);
  color: #166534;
}
.toast--error {
  border-left-color: var(--c-danger);
  color: #991b1b;
}
.toast--warning {
  border-left-color: var(--c-warning);
  color: #92400e;
}
.toast--info {
  border-left-color: var(--c-primary);
  color: var(--c-primary-dark);
}
.toast__msg {
  flex: 1;
}
.toast__close {
  background: none;
  border: none;
  font-size: 1.3rem;
  line-height: 1;
  color: var(--c-text-muted);
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>

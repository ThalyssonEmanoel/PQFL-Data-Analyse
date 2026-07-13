<script setup>
// Modal base reutilizavel: Teleport para o body, fecha no ESC, no backdrop e no X.
import { watch, onBeforeUnmount } from "vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: "" },
  subtitle: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue"]);

function close() {
  emit("update:modelValue", false);
}

function onKeydown(e) {
  if (e.key === "Escape") close();
}

// Bloqueia o scroll do fundo e escuta ESC enquanto o modal estiver aberto.
watch(
  () => props.modelValue,
  (open) => {
    if (typeof document === "undefined") return;
    if (open) {
      document.addEventListener("keydown", onKeydown);
      document.body.style.overflow = "hidden";
    } else {
      document.removeEventListener("keydown", onKeydown);
      document.body.style.overflow = "";
    }
  }
);

onBeforeUnmount(() => {
  if (typeof document === "undefined") return;
  document.removeEventListener("keydown", onKeydown);
  document.body.style.overflow = "";
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal" @click.self="close">
        <div class="modal__box" role="dialog" aria-modal="true">
          <header class="modal__head">
            <div>
              <h3 v-if="title" class="modal__title">{{ title }}</h3>
              <p v-if="subtitle" class="modal__subtitle">{{ subtitle }}</p>
              <slot name="header" />
            </div>
            <button type="button" class="modal__close" aria-label="Fechar" @click="close">×</button>
          </header>
          <div class="modal__body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="modal__foot">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(2px);
}
.modal__box {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius, 14px);
  box-shadow: var(--shadow-lg, 0 20px 50px rgba(0, 0, 0, 0.25));
  width: 100%;
  max-width: 640px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.modal__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--c-border);
}
.modal__title {
  font-size: 1.05rem;
}
.modal__subtitle {
  margin-top: 3px;
  font-size: 0.82rem;
  color: var(--c-text-muted);
}
.modal__close {
  border: none;
  background: transparent;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: var(--c-text-muted);
  padding: 2px 8px;
  border-radius: 8px;
}
.modal__close:hover {
  background: var(--c-surface-2, rgba(148, 163, 184, 0.12));
  color: var(--c-text);
}
.modal__body {
  padding: 20px;
  overflow-y: auto;
}
.modal__foot {
  padding: 14px 20px;
  border-top: 1px solid var(--c-border);
}
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .modal__box,
.modal-leave-active .modal__box {
  transition: transform 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal__box,
.modal-leave-to .modal__box {
  transform: translateY(12px) scale(0.98);
}
</style>

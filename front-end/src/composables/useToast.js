import { reactive } from "vue";

// Pequeno barramento de notificacoes (toasts), compartilhado por toda a app.
// Renderizado pelo componente ToastHost.vue.

let seq = 0;
const state = reactive({ items: [] });

function push(type, message, timeout = 4000) {
  const id = ++seq;
  state.items.push({ id, type, message });
  if (timeout) {
    setTimeout(() => remove(id), timeout);
  }
  return id;
}

function remove(id) {
  const idx = state.items.findIndex((t) => t.id === id);
  if (idx !== -1) state.items.splice(idx, 1);
}

export function useToast() {
  return {
    items: state.items,
    success: (msg, t) => push("success", msg, t),
    error: (msg, t) => push("error", msg, t ?? 6000),
    info: (msg, t) => push("info", msg, t),
    warning: (msg, t) => push("warning", msg, t),
    remove,
  };
}

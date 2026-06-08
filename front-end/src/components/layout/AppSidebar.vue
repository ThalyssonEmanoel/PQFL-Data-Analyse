<script setup>
import { computed } from "vue";
import { useAuthStore } from "@/stores/auth.js";

defineProps({ open: { type: Boolean, default: false } });
defineEmits(["close"]);

const auth = useAuthStore();

const nav = computed(() => [
  { to: "/dashboard", label: "Visão Geral", icon: "grid" },
  { to: "/produtores", label: "Produtores", icon: "users" },
  ...(auth.isAdmin ? [{ to: "/administracao", label: "Administração", icon: "settings" }] : []),
]);

const icons = {
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
};
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar--open': open }">
    <div class="sidebar__brand">
      <span class="sidebar__logo">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
          <path d="M7 3h10l-1 4H8L7 3z" />
          <path d="M8 8h8v10a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3V8z" opacity="0.85" />
        </svg>
      </span>
      <div>
        <strong>PQFL</strong>
        <small>Dashboard</small>
      </div>
    </div>

    <nav class="sidebar__nav">
      <router-link
        v-for="item in nav"
        :key="item.to"
        :to="item.to"
        class="nav-link"
        active-class="nav-link--active"
        @click="$emit('close')"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path :d="icons[item.icon]" />
        </svg>
        {{ item.label }}
      </router-link>
    </nav>

    <div class="sidebar__foot">
      <p class="muted">Plano de Qualificação de<br />Fornecedores de Leite</p>
      <small class="muted">v1.0.0</small>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-w);
  background: linear-gradient(180deg, #0f172a, #11203b);
  color: #cbd5e1;
  display: flex;
  flex-direction: column;
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 50;
}
.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  height: var(--header-h);
}
.sidebar__logo {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: linear-gradient(135deg, var(--c-primary), var(--c-secondary));
}
.sidebar__brand strong {
  display: block;
  color: #fff;
  font-size: 1.05rem;
  letter-spacing: 0.04em;
}
.sidebar__brand small {
  color: #7d8aa3;
  font-size: 0.74rem;
}
.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 12px;
  flex: 1;
}
.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: 10px;
  font-size: 0.92rem;
  font-weight: 500;
  color: #aebacd;
  transition: background 0.15s ease, color 0.15s ease;
}
.nav-link:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
}
.nav-link--active {
  background: linear-gradient(135deg, var(--c-primary), var(--c-primary-dark));
  color: #fff;
  box-shadow: 0 8px 18px rgba(39, 95, 48, 0.32);
}
.sidebar__foot {
  padding: 18px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sidebar__foot .muted {
  color: #6b7890;
  font-size: 0.76rem;
  line-height: 1.4;
}

@media (max-width: 900px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    box-shadow: var(--shadow-lg);
  }
  .sidebar--open {
    transform: translateX(0);
  }
}
</style>

<script setup>
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.js";
import { useToast } from "@/composables/useToast.js";

defineEmits(["toggle-sidebar"]);

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toast = useToast();

const menuOpen = ref(false);
const title = computed(() => route.meta.title || "PQFL Dashboard");

async function logout() {
  await auth.logout();
  toast.info("Sessão encerrada.");
  router.push({ name: "login" });
}
</script>

<template>
  <header class="topbar">
    <div class="topbar__left">
      <button class="burger" aria-label="Menu" @click="$emit('toggle-sidebar')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>
      <h1 class="topbar__title">{{ title }}</h1>
    </div>

    <div class="topbar__right">
      <div class="user" @click="menuOpen = !menuOpen" tabindex="0" @blur="menuOpen = false">
        <span class="avatar">{{ auth.userInitials }}</span>
        <div class="user__info">
          <strong>{{ auth.user?.email }}</strong>
          <small :class="['role', auth.isAdmin ? 'role--admin' : 'role--member']">
            {{ auth.isAdmin ? "Administrador" : "Membro" }}
          </small>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>

        <transition name="route">
          <ul v-if="menuOpen" class="dropdown" @mousedown.prevent>
            <li class="dropdown__email">{{ auth.user?.email }}</li>
            <li><button @click="logout">Sair</button></li>
          </ul>
        </transition>
      </div>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  height: var(--header-h);
  background: var(--c-surface);
  border-bottom: 1px solid var(--c-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 40;
}
.topbar__left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.topbar__title {
  font-size: 1.15rem;
}
.burger {
  display: none;
  background: none;
  border: none;
  color: var(--c-text-soft);
  padding: 4px;
}
.user {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 12px;
  cursor: pointer;
  outline: none;
  transition: background 0.15s ease;
}
.user:hover {
  background: var(--c-surface-2);
}
.avatar {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--c-primary), var(--c-secondary));
  color: #fff;
  font-weight: 700;
  font-size: 0.82rem;
}
.user__info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.user__info strong {
  font-size: 0.85rem;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.role {
  font-size: 0.72rem;
  font-weight: 600;
}
.role--admin {
  color: var(--c-primary-dark);
}
.role--member {
  color: var(--c-text-muted);
}
.dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 200px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  box-shadow: var(--shadow);
  list-style: none;
  margin: 0;
  padding: 6px;
  z-index: 60;
}
.dropdown__email {
  padding: 8px 12px;
  font-size: 0.78rem;
  color: var(--c-text-muted);
  border-bottom: 1px solid var(--c-border);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dropdown button {
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: 9px 12px;
  border-radius: 8px;
  font-size: 0.88rem;
  color: var(--c-danger);
  font-weight: 600;
}
.dropdown button:hover {
  background: rgba(239, 68, 68, 0.08);
}

@media (max-width: 900px) {
  .burger {
    display: block;
  }
  .user__info {
    display: none;
  }
}
</style>

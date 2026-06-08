<script setup>
import { ref } from "vue";
import AppSidebar from "./AppSidebar.vue";
import AppHeader from "./AppHeader.vue";

// Layout autenticado: sidebar fixa + header + area de conteudo (slot).
const sidebarOpen = ref(false);
</script>

<template>
  <div class="shell">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <!-- Overlay para fechar a sidebar no mobile -->
    <div v-if="sidebarOpen" class="overlay" @click="sidebarOpen = false"></div>

    <div class="shell__main">
      <AppHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
}
.shell__main {
  margin-left: var(--sidebar-w);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.content {
  padding: 28px;
  flex: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  z-index: 45;
}
@media (max-width: 900px) {
  .shell__main {
    margin-left: 0;
  }
  .content {
    padding: 18px;
  }
}
</style>

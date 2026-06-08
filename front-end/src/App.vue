<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import AppLayout from "@/components/layout/AppLayout.vue";
import ToastHost from "@/components/ui/ToastHost.vue";

const route = useRoute();
// Rotas publicas (login, reset, 404...) usam layout "blank"; as demais usam a sidebar.
const isBlank = computed(() => route.meta.layout === "blank");
</script>

<template>
  <ToastHost />

  <AppLayout v-if="!isBlank">
    <router-view v-slot="{ Component }">
      <transition name="route" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </AppLayout>

  <router-view v-else v-slot="{ Component }">
    <transition name="route" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

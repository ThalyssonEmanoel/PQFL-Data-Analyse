<script setup>
import { computed } from "vue";
import { groupMeta } from "@/constants/bpa.js";

// Selo colorido do grupo (G1/G2/G3) com cor coerente com a regra de negocio.
const props = defineProps({
  group: { type: String, required: true },
  withLabel: { type: Boolean, default: false },
});

const meta = computed(() => groupMeta(props.group));
</script>

<template>
  <span class="pill" :style="{ background: meta.soft, color: meta.color }">
    <span class="dot" :style="{ background: meta.color }"></span>
    {{ withLabel ? meta.label : meta.short }}
  </span>
</template>

<style scoped>
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>

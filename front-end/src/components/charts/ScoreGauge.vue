<script setup>
import { computed } from "vue";
import { groupMeta } from "@/constants/bpa.js";

// Medidor circular (0-100) da pontuacao total, colorido pelo grupo do produtor.
const props = defineProps({
  score: { type: Number, default: 0 },
  group: { type: String, default: "" },
  size: { type: Number, default: 150 },
});

const thickness = 14;
const radius = computed(() => (props.size - thickness) / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const meta = computed(() => groupMeta(props.group));
const clamped = computed(() => Math.max(0, Math.min(100, props.score || 0)));
const dash = computed(() => (clamped.value / 100) * circumference.value);
const cx = computed(() => props.size / 2);
</script>

<template>
  <div class="gauge" :style="{ width: size + 'px' }">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
      <g :transform="`rotate(-90 ${cx} ${cx})`">
        <circle :cx="cx" :cy="cx" :r="radius" fill="none" stroke="var(--c-border)" :stroke-width="thickness" />
        <circle
          :cx="cx"
          :cy="cx"
          :r="radius"
          fill="none"
          :stroke="meta.color"
          :stroke-width="thickness"
          :stroke-dasharray="`${dash} ${circumference}`"
          stroke-linecap="round"
          class="gauge__arc"
        />
      </g>
      <text :x="cx" :y="cx - 1" text-anchor="middle" class="gauge__value" :style="{ fill: meta.color }">
        {{ clamped.toFixed(1) }}
      </text>
      <text :x="cx" :y="cx + 18" text-anchor="middle" class="gauge__unit">de 100</text>
    </svg>
  </div>
</template>

<style scoped>
.gauge {
  display: flex;
  justify-content: center;
}
.gauge__arc {
  transition: stroke-dasharray 0.7s ease;
}
.gauge__value {
  font-size: 1.7rem;
  font-weight: 800;
}
.gauge__unit {
  font-size: 0.7rem;
  fill: var(--c-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>

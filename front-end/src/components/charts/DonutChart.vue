<script setup>
import { computed } from "vue";

// Grafico de rosca (donut) em SVG puro — sem dependencias externas.
// Recebe segmentos { label, value, color } e desenha arcos proporcionais.
const props = defineProps({
  segments: { type: Array, required: true }, // [{ label, value, color }]
  size: { type: Number, default: 190 },
  thickness: { type: Number, default: 26 },
  centerLabel: { type: String, default: "" },
  centerValue: { type: [String, Number], default: "" },
  // Quando true, os arcos ficam clicaveis e emitem "select" com o indice/segmento.
  clickable: { type: Boolean, default: false },
  // Indice do segmento atualmente selecionado (-1 = nenhum), para destaque visual.
  activeIndex: { type: Number, default: -1 },
});

const emit = defineEmits(["select"]);

function onSegmentClick(index) {
  if (!props.clickable) return;
  emit("select", { index, segment: props.segments[index] });
}

// Fracao minima de arco para que segmentos pequenos (ex.: G1 com 1%) continuem visiveis.
const MIN_VISIBLE_FRACTION = 0.05;

const total = computed(() => props.segments.reduce((s, x) => s + (x.value || 0), 0));
const radius = computed(() => (props.size - props.thickness) / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);

// Pre-calcula o dash/offset de cada arco a partir da fracao acumulada.
// Segmentos pequenos recebem uma fracao minima de desenho para nao "sumirem" no anel;
// os valores reais sao preservados para a legenda (que usa props.segments diretamente).
const arcs = computed(() => {
  const c = circumference.value;
  const segments = props.segments;
  if (!total.value) return [];

  const rawFractions = segments.map((seg) => (seg.value || 0) / total.value);
  const boosted = rawFractions.map((f) => (f > 0 ? Math.max(f, MIN_VISIBLE_FRACTION) : 0));
  const boostedTotal = boosted.reduce((s, f) => s + f, 0) || 1;

  let acc = 0;
  return segments.map((seg, i) => {
    const fraction = boosted[i] / boostedTotal; // renormaliza para o anel fechar em 100%
    const dash = fraction * c;
    const arc = {
      ...seg,
      fraction,
      realFraction: rawFractions[i],
      dashArray: `${dash} ${c - dash}`,
      dashOffset: -acc * c,
    };
    acc += fraction;
    return arc;
  });
});

const cx = computed(() => props.size / 2);
</script>

<template>
  <div class="donut" :style="{ width: size + 'px' }">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
      <g :transform="`rotate(-90 ${cx} ${cx})`">
        <circle :cx="cx" :cy="cx" :r="radius" fill="none" :stroke="'var(--c-border)'" :stroke-width="thickness" />
        <circle
          v-for="(arc, i) in arcs"
          :key="i"
          :cx="cx"
          :cy="cx"
          :r="radius"
          fill="none"
          :stroke="arc.color"
          :stroke-width="activeIndex === i ? thickness + 6 : thickness"
          :stroke-dasharray="arc.dashArray"
          :stroke-dashoffset="arc.dashOffset"
          stroke-linecap="butt"
          class="arc"
          :class="{ 'arc--clickable': clickable, 'arc--dim': activeIndex >= 0 && activeIndex !== i }"
          @click="onSegmentClick(i)"
        >
          <title v-if="clickable">{{ arc.label }}</title>
        </circle>
      </g>
      <text v-if="centerValue !== ''" :x="cx" :y="cx - 2" text-anchor="middle" class="donut__value">{{ centerValue }}</text>
      <text v-if="centerLabel" :x="cx" :y="cx + 16" text-anchor="middle" class="donut__label">{{ centerLabel }}</text>
    </svg>
  </div>
</template>

<style scoped>
.donut {
  display: flex;
  justify-content: center;
}
.arc {
  transition: stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease, stroke-width 0.2s ease, opacity 0.2s ease;
}
.arc--clickable {
  cursor: pointer;
}
.arc--dim {
  opacity: 0.4;
}
.donut__value {
  font-size: 1.6rem;
  font-weight: 800;
  fill: var(--c-text);
}
.donut__label {
  font-size: 0.72rem;
  fill: var(--c-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>

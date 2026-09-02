<script setup lang="ts">
import { computed, ref } from "vue";

import type { DrillWeeklyAccuracy } from "../types";

const props = defineProps<{ weeks: DrillWeeklyAccuracy[] }>();

const CHART_H = 80;
const BAR_GAP = 6;

const selectedIndex = ref(props.weeks.length - 1);

function formatWeekLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

const bars = computed(() => {
  const n = props.weeks.length;
  if (n === 0) return [];
  const barW = 100 / n;
  return props.weeks.map((w, i) => {
    const hasData = w.total > 0;
    const pct = w.accuracy_pct ?? 0;
    const height = hasData ? Math.max(3, (pct / 100) * CHART_H) : 0;
    return {
      x: i * barW + BAR_GAP / 2,
      width: Math.max(1, barW - BAR_GAP),
      height,
      y: CHART_H - height,
      hasData,
      pct,
      total: w.total,
      weekStart: w.week_start,
      label: formatWeekLabel(w.week_start),
    };
  });
});

const selected = computed(() => bars.value[selectedIndex.value] ?? null);
</script>

<template>
  <div v-if="bars.length" class="drill-trend">
    <p class="drill-trend-summary">
      <template v-if="selected">
        <template v-if="selected.hasData">
          Неделя с {{ selected.label }}: <strong>{{ selected.pct }}%</strong> ({{ selected.total }}
          вопр.)
        </template>
        <template v-else> Неделя с {{ selected.label }}: нет попыток </template>
      </template>
    </p>

    <svg
      :viewBox="`0 0 100 ${CHART_H + 2}`"
      preserveAspectRatio="none"
      class="drill-trend-svg"
      role="img"
      aria-label="Точность в Интенсиве по неделям"
    >
      <line
        x1="0"
        :y1="CHART_H + 1"
        x2="100"
        :y2="CHART_H + 1"
        stroke="var(--tg-hint-color)"
        stroke-width="0.5"
        opacity="0.3"
      />
      <template v-for="(bar, i) in bars" :key="bar.weekStart">
        <rect
          v-if="bar.hasData"
          :x="bar.x"
          :y="bar.y"
          :width="bar.width"
          :height="bar.height"
          rx="1.5"
          :fill="i === selectedIndex ? 'var(--tg-button-color)' : 'var(--tg-link-color)'"
          :opacity="i === selectedIndex ? 1 : 0.55"
          style="cursor: pointer"
          @click="selectedIndex = i"
        />
        <rect
          v-else
          :x="bar.x + bar.width * 0.3"
          :y="CHART_H - 1.5"
          :width="bar.width * 0.4"
          height="1.5"
          fill="var(--tg-hint-color)"
          opacity="0.4"
          style="cursor: pointer"
          @click="selectedIndex = i"
        />
        <!-- full-height invisible hit target so short/empty bars stay tappable -->
        <rect
          :x="bar.x"
          y="0"
          :width="bar.width"
          :height="CHART_H"
          fill="transparent"
          style="cursor: pointer"
          @click="selectedIndex = i"
        />
      </template>
    </svg>

    <div class="drill-trend-labels">
      <span v-for="bar in bars" :key="bar.weekStart">{{ bar.label }}</span>
    </div>
  </div>
</template>

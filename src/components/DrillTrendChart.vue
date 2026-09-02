<script setup lang="ts">
import { computed } from "vue";

import type { DrillWeeklyAccuracy } from "../types";

const props = defineProps<{ weeks: DrillWeeklyAccuracy[] }>();

function formatWeekLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

// Newest week on top, like the exam history list on the same screen.
const rows = computed(() =>
  [...props.weeks].reverse().map((w) => ({
    weekStart: w.week_start,
    label: formatWeekLabel(w.week_start),
    hasData: w.total > 0,
    pct: w.accuracy_pct ?? 0,
    total: w.total,
  })),
);
</script>

<template>
  <div v-if="rows.length" class="drill-trend">
    <div v-for="row in rows" :key="row.weekStart" class="drill-trend-row">
      <span class="drill-trend-row-label">{{ row.label }}</span>
      <div class="drill-trend-row-track">
        <div v-if="row.hasData" class="drill-trend-row-fill" :style="{ width: `${row.pct}%` }" />
        <div v-else class="drill-trend-row-empty-tick" />
      </div>
      <span class="drill-trend-row-value" :class="{ 'drill-trend-row-value-empty': !row.hasData }">
        <template v-if="row.hasData">{{ row.pct }}% <span class="drill-trend-row-count">· {{ row.total }}</span></template>
        <template v-else>—</template>
      </span>
    </div>
  </div>
</template>

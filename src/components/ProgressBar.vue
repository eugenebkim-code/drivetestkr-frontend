<script setup lang="ts">
defineProps<{ current: number; total: number }>();
</script>

<template>
  <div>
    <div class="progress-bar">
      <div class="progress-bar-fill" :style="{ width: `${(current / total) * 100}%` }" />
    </div>
    <p style="font-size: 12px; color: var(--tg-hint-color); margin-top: 4px">{{ current }} / {{ total }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ canPrev: boolean; canNext: boolean }>();
const emit = defineEmits<{ (e: "prev"): void; (e: "next"): void }>();
</script>

<template>
  <button
    v-if="canPrev"
    type="button"
    class="nav-arrow nav-arrow-left"
    aria-label="Предыдущий вопрос"
    @click="emit('prev')"
  >
    ‹
  </button>
  <button
    v-if="canNext"
    type="button"
    class="nav-arrow nav-arrow-right"
    aria-label="Следующий вопрос"
    @click="emit('next')"
  >
    ›
  </button>
</template>

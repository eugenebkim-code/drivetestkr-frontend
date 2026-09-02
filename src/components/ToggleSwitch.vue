<script setup lang="ts">
defineProps<{ modelValue: boolean; label?: string }>();
const emit = defineEmits<{ (e: "update:modelValue", value: boolean): void }>();
</script>

<template>
  <label class="toggle-switch">
    <span v-if="label" class="toggle-switch-label">{{ label }}</span>
    <button
      type="button"
      class="toggle-switch-track"
      :class="{ on: modelValue }"
      role="switch"
      :aria-checked="modelValue"
      @click="emit('update:modelValue', !modelValue)"
    >
      <span class="toggle-switch-knob" />
    </button>
  </label>
</template>

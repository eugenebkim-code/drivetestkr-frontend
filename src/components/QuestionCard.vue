<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { imageUrl } from "../api/client";
import { language } from "../store/language";
import type { QuestionBase } from "../types";
import ImageZoom from "./ImageZoom.vue";

const props = defineProps<{
  question: QuestionBase;
  selected: string[];
  revealed: boolean;
  correctLetters: string[] | null;
  disabled: boolean;
}>();

const emit = defineEmits<{ (e: "select", letter: string): void }>();

const zoomOpen = ref(false);
watch(
  () => props.question.id,
  () => {
    zoomOpen.value = false;
  },
);

const letters = computed(() => {
  const ls = ["A", "B", "C", "D"];
  if (props.question.option_e_en || props.question.option_e_ru) ls.push("E");
  return ls;
});

const questionText = computed(() =>
  language.state.lang === "ru" ? props.question.question_ru : props.question.question_en,
);

function optionText(letter: string): string | null {
  const key = `option_${letter.toLowerCase()}_${language.state.lang}` as keyof QuestionBase;
  return (props.question[key] as string | null) ?? null;
}

function optionClass(letter: string) {
  if (!props.revealed) return {};
  const isCorrect = props.correctLetters?.includes(letter) ?? false;
  const isSelected = props.selected.includes(letter);
  return {
    "is-correct": isCorrect,
    "is-wrong": isSelected && !isCorrect,
  };
}
</script>

<template>
  <div class="card glass">
    <p class="question-text">{{ questionText }}</p>
  </div>

  <video
    v-if="question.video_url"
    :src="imageUrl(question.video_url)!"
    controls
    playsinline
    class="question-video"
  />
  <div v-else-if="question.image_url" class="question-image-wrap" @click="zoomOpen = true">
    <img :src="imageUrl(question.image_url)!" alt="" class="question-image" />
    <span class="question-image-zoom-hint">🔍</span>
  </div>
  <ImageZoom :open="zoomOpen" :src="imageUrl(question.image_url) || ''" @close="zoomOpen = false" />

  <div class="options">
    <button
      v-for="letter in letters"
      :key="letter"
      type="button"
      class="option"
      :class="optionClass(letter)"
      :aria-pressed="selected.includes(letter)"
      :disabled="disabled"
      @click="emit('select', letter)"
    >
      <span class="option-letter">{{ letter }}</span>
      <span class="option-text">{{ optionText(letter) }}</span>
    </button>
  </div>
</template>

<style scoped>
.question-image-wrap {
  position: relative;
  cursor: zoom-in;
}

.question-image {
  width: 100%;
  border-radius: var(--radius-md);
  display: block;
}

.question-video {
  width: 100%;
  border-radius: var(--radius-md);
  display: block;
  background: #000;
}

.question-image-zoom-hint {
  position: absolute;
  right: 10px;
  bottom: 10px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

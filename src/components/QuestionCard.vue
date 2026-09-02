<script setup lang="ts">
import { computed } from "vue";

import { imageUrl } from "../api/client";
import { language } from "../store/language";
import type { QuestionBase } from "../types";

const props = defineProps<{
  question: QuestionBase;
  selected: string[];
  revealed: boolean;
  correctLetters: string[] | null;
  disabled: boolean;
}>();

const emit = defineEmits<{ (e: "select", letter: string): void }>();

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

  <img
    v-if="question.image_url"
    :src="imageUrl(question.image_url)!"
    alt=""
    style="width: 100%; border-radius: var(--radius-md); display: block"
  />

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

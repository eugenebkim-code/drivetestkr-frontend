<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";

import LanguageToggle from "../components/LanguageToggle.vue";
import { useBackToHome } from "../composables/useBackToHome";
import { examResultStore } from "../store/examResult";
import { language } from "../store/language";

useBackToHome();
const router = useRouter();

const result = computed(() => examResultStore.state.result);
const questionsById = computed(() => examResultStore.state.questionsById);

if (!result.value) {
  router.replace({ name: "home" });
}

function questionPreview(questionId: string): string {
  const q = questionsById.value[questionId];
  if (!q) return "";
  const text = language.state.lang === "ru" ? q.question_ru : q.question_en;
  return text.length > 40 ? `${text.slice(0, 40)}…` : text;
}
</script>

<template>
  <div v-if="result" class="screen">
    <div class="score-circle" :class="{ failed: !result.passed }">
      <span class="score-value">{{ result.score_points }}</span>
      <span style="font-size: 12px; color: var(--tg-hint-color)">из 100</span>
    </div>

    <h2 style="text-align: center">{{ result.passed ? "✅ Сдано" : "❌ Не сдано" }}</h2>
    <p style="text-align: center; color: var(--tg-hint-color)">
      Правильно: {{ result.correct_count }} из {{ result.total_count }}
    </p>

    <LanguageToggle />

    <div class="card glass">
      <div v-for="r in result.results" :key="r.question_id" class="result-row">
        <span>{{ r.is_correct ? "✅" : "❌" }}</span>
        <span>{{ r.question_id }}</span>
        <span style="margin-left: auto; color: var(--tg-hint-color); font-size: 12px">
          {{ questionPreview(r.question_id) }}
        </span>
      </div>
    </div>

    <button class="btn" type="button" @click="router.replace({ name: 'home' })">На главную</button>
  </div>
</template>

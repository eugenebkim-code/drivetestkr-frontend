<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import { api } from "../api/client";
import LanguageToggle from "../components/LanguageToggle.vue";
import ProgressBar from "../components/ProgressBar.vue";
import QuestionCard from "../components/QuestionCard.vue";
import { useBackToHome } from "../composables/useBackToHome";
import { examResultStore } from "../store/examResult";
import type { ExamAnswerIn, QuestionExam } from "../types";

useBackToHome();
const router = useRouter();

const loading = ref(true);
const locked = ref(false);
const questions = ref<QuestionExam[]>([]);
const examAttemptId = ref<number | null>(null);
const idx = ref(0);
const selected = ref<string[]>([]);
const answers = ref<ExamAnswerIn[]>([]);
const finishing = ref(false);

const current = computed<QuestionExam | null>(() => questions.value[idx.value] ?? null);
const total = computed(() => questions.value.length);

onMounted(async () => {
  try {
    const res = await api.examStart();
    locked.value = res.locked;
    questions.value = res.questions;
    examAttemptId.value = res.exam_attempt_id;
  } finally {
    loading.value = false;
  }
});

function recordAnswer(letters: string[]) {
  if (!current.value) return;
  answers.value.push({ question_id: current.value.id, selected_letters: letters });
  selected.value = [];
  if (idx.value < questions.value.length - 1) {
    idx.value += 1;
  } else {
    finish();
  }
}

function selectLetter(letter: string) {
  if (!current.value) return;
  if (current.value.is_multi) {
    const s = selected.value.includes(letter)
      ? selected.value.filter((l) => l !== letter)
      : [...selected.value, letter].slice(-2);
    selected.value = s;
    if (s.length === 2) recordAnswer(s);
  } else {
    recordAnswer([letter]);
  }
}

async function finish() {
  if (examAttemptId.value === null) return;
  finishing.value = true;
  try {
    const result = await api.examFinish({
      exam_attempt_id: examAttemptId.value,
      answers: answers.value,
    });
    examResultStore.set(result, questions.value);
    router.replace({ name: "exam-result" });
  } finally {
    finishing.value = false;
  }
}
</script>

<template>
  <div class="screen">
    <div v-if="loading">Загрузка…</div>

    <div
      v-else-if="locked"
      class="card glass paywall"
      style="display: flex; flex-direction: column; align-items: center"
    >
      <h2>Бесплатный экзамен уже использован</h2>
      <p style="color: var(--tg-hint-color)">Оформите доступ, чтобы проходить экзамен без ограничений.</p>
      <RouterLink class="btn" style="width: 100%" :to="{ name: 'redeem' }">Ввести код доступа</RouterLink>
    </div>

    <div v-else-if="finishing">Подсчёт результата…</div>

    <template v-else-if="current">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: var(--space-3)">
        <ProgressBar :current="idx + 1" :total="total" style="flex: 1" />
        <LanguageToggle />
      </div>
      <QuestionCard
        :question="current"
        :selected="selected"
        :revealed="false"
        :correct-letters="null"
        :disabled="false"
        @select="selectLetter"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
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

const intro = ref(true);
const loading = ref(false);
const locked = ref(false);
const questions = ref<QuestionExam[]>([]);
const examAttemptId = ref<number | null>(null);
const idx = ref(0);
// Keyed by question_id rather than an append-only list, so navigating back
// to an already-answered question shows (and lets you change) what you
// picked, instead of only ever seeing a blank card.
const answersByQid = ref<Record<string, string[]>>({});
const finishing = ref(false);

const current = computed<QuestionExam | null>(() => questions.value[idx.value] ?? null);
const total = computed(() => questions.value.length);
const selected = computed<string[]>(() => (current.value ? answersByQid.value[current.value.id] ?? [] : []));

// Deadline is a fixed wall-clock timestamp (server start time + fixed
// duration), not a locally-decremented counter — so it stays correct even
// if the Telegram app was backgrounded and resumed well past the limit.
const deadline = ref<number | null>(null);
const remainingSeconds = ref<number | null>(null);
let timerHandle: ReturnType<typeof setInterval> | null = null;

const timeIsUp = computed(() => remainingSeconds.value !== null && remainingSeconds.value <= 0);
const timeLow = computed(() => remainingSeconds.value !== null && remainingSeconds.value <= 300);

const formattedTime = computed(() => {
  if (remainingSeconds.value === null) return "";
  const m = Math.floor(remainingSeconds.value / 60);
  const s = remainingSeconds.value % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
});

function tick() {
  if (deadline.value === null) return;
  const remaining = Math.max(0, Math.round((deadline.value - Date.now()) / 1000));
  remainingSeconds.value = remaining;
  if (remaining <= 0 && !finishing.value && examAttemptId.value !== null) {
    stopTimer();
    // Korean-exam rule: time's up stops the exam and grades answers exactly
    // as they stand — unanswered questions are simply missing from
    // `answers`, and exam_finish already scores a missing answer as wrong.
    finish();
  }
}

function stopTimer() {
  if (timerHandle !== null) {
    clearInterval(timerHandle);
    timerHandle = null;
  }
}

onBeforeUnmount(stopTimer);

async function startExam() {
  loading.value = true;
  try {
    const res = await api.examStart();
    locked.value = res.locked;
    questions.value = res.questions;
    examAttemptId.value = res.exam_attempt_id;
    if (res.started_at && res.duration_seconds) {
      deadline.value = new Date(res.started_at).getTime() + res.duration_seconds * 1000;
      tick();
      timerHandle = setInterval(tick, 1000);
    }
    intro.value = false;
  } finally {
    loading.value = false;
  }
}

function goPrev() {
  if (idx.value > 0) idx.value -= 1;
}

function goNext() {
  if (idx.value < questions.value.length - 1) idx.value += 1;
}

function selectLetter(letter: string) {
  if (!current.value) return;
  if (current.value.is_multi) {
    const s = selected.value.includes(letter)
      ? selected.value.filter((l) => l !== letter)
      : [...selected.value, letter].slice(-2);
    answersByQid.value[current.value.id] = s;
    if (s.length === 2) goNext();
  } else {
    answersByQid.value[current.value.id] = [letter];
    goNext();
  }
}

async function finish() {
  if (examAttemptId.value === null) return;
  stopTimer();
  finishing.value = true;
  try {
    const answers: ExamAnswerIn[] = Object.entries(answersByQid.value).map(
      ([question_id, selected_letters]) => ({ question_id, selected_letters }),
    );
    const result = await api.examFinish({
      exam_attempt_id: examAttemptId.value,
      answers,
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
    <div v-if="intro" class="card glass exam-intro">
      <p class="exam-intro-greeting">Здравствуйте! 👋</p>
      <p>
        Вы выбрали пробный письменный экзамен на водительские права в Корее. Экзамен максимально
        приближён к настоящему: 40 вопросов — 21 простой, 7 с фотографиями, 7 с иллюстрациями и 5
        на знаки. На прохождение даётся 40 минут.
      </p>
      <p>
        Кнопки под вопросом позволяют вернуться назад и исправить ответ. Переключатель языка
        сверху показывает вопрос на русском или английском — но помните: настоящий экзамен
        принимают только на английском или корейском языке.
      </p>
      <p>
        Проходной балл — 60. Если наберёте его 6–7 раз подряд здесь — смело идите сдавать
        настоящий, шанс успеха близок к 100%.
      </p>
      <p class="exam-intro-wish">Удачи вам! 🍀</p>
      <button type="button" class="btn" style="width: 100%" :disabled="loading" @click="startExam">
        {{ loading ? "Загрузка…" : "Начать экзамен" }}
      </button>
    </div>

    <div v-else-if="loading">Загрузка…</div>

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
        <span v-if="remainingSeconds !== null" class="exam-timer" :class="{ 'exam-timer-warning': timeLow }">
          ⏱ {{ formattedTime }}
        </span>
        <LanguageToggle />
      </div>
      <QuestionCard
        :question="current"
        :selected="selected"
        :revealed="false"
        :correct-letters="null"
        :disabled="timeIsUp"
        @select="selectLetter"
      />

      <div class="nav-row">
        <button type="button" class="btn btn-secondary" :disabled="idx === 0" @click="goPrev">← Назад</button>
        <button
          v-if="idx < total - 1"
          type="button"
          class="btn btn-secondary"
          @click="goNext"
        >
          Далее →
        </button>
        <button v-else type="button" class="btn" :disabled="timeIsUp" @click="finish">Завершить экзамен</button>
      </div>
    </template>
  </div>
</template>

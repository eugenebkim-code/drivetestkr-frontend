<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { api } from "../api/client";
import DrillTrendChart from "../components/DrillTrendChart.vue";
import { useBackToHome } from "../composables/useBackToHome";
import type { ProfileOut } from "../types";

useBackToHome();

const loading = ref(true);
const profile = ref<ProfileOut | null>(null);
const checkingIn = ref(false);
const customGoal = ref("");

const goalOptions = [20, 30, 100];

const goalProgressPct = computed(() => {
  if (!profile.value?.daily_goal) return 0;
  return Math.min(100, Math.round((profile.value.today_progress / profile.value.daily_goal) * 100));
});

async function load() {
  loading.value = true;
  try {
    profile.value = await api.profile();
  } finally {
    loading.value = false;
  }
}

async function checkin() {
  checkingIn.value = true;
  try {
    const res = await api.profileCheckin();
    if (profile.value) {
      profile.value.streak_days = res.streak_days;
      profile.value.checked_in_today = res.checked_in_today;
    }
  } finally {
    checkingIn.value = false;
  }
}

async function setGoal(value: number) {
  await api.profileSetGoal(value);
  if (profile.value) profile.value.daily_goal = value;
}

async function setCustomGoal() {
  const num = parseInt(customGoal.value, 10);
  if (Number.isNaN(num) || num <= 0) return;
  await setGoal(num);
  customGoal.value = "";
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

onMounted(load);
</script>

<template>
  <div class="screen">
    <div v-if="loading">Загрузка…</div>

    <template v-else-if="profile">
      <div class="profile-hero">
        <div class="profile-hero-glow" />
        <p class="home-hero-eyebrow">Личный кабинет</p>
        <div class="profile-hero-streak">
          <span class="profile-hero-fire">🔥</span>
          <span class="profile-hero-number">{{ profile.streak_days }}</span>
        </div>
        <p class="profile-hero-caption">
          {{ profile.streak_days === 1 ? "день подряд" : "дней подряд" }}
        </p>
        <button
          class="btn profile-checkin-btn"
          type="button"
          :disabled="profile.checked_in_today || checkingIn"
          @click="checkin"
        >
          {{ profile.checked_in_today ? "✅ Отмечено сегодня" : "Отметиться сегодня" }}
        </button>
      </div>

      <section>
        <p class="section-label">Дневная цель</p>
        <div class="card glass">
          <div class="goal-picker">
            <button
              v-for="opt in goalOptions"
              :key="opt"
              type="button"
              class="goal-option"
              :class="{ active: profile.daily_goal === opt }"
              @click="setGoal(opt)"
            >
              {{ opt }}
            </button>
          </div>
          <div class="nav-row goal-custom-row">
            <input v-model="customGoal" type="number" placeholder="Своё число" class="goal-input" />
            <button class="btn btn-secondary" type="button" @click="setCustomGoal">Установить</button>
          </div>

          <template v-if="profile.daily_goal">
            <div class="progress-bar" style="margin-top: var(--space-3)">
              <div class="progress-bar-fill" :style="{ width: `${goalProgressPct}%` }" />
            </div>
            <p class="goal-progress-caption">Сегодня: {{ profile.today_progress }} / {{ profile.daily_goal }}</p>
          </template>
        </div>
      </section>

      <section>
        <p class="section-label">Интенсив: точность ваших ответов на вопросы, по неделям</p>
        <div class="card glass">
          <DrillTrendChart v-if="profile.drill_weekly_accuracy.length" :weeks="profile.drill_weekly_accuracy" />
          <p v-else class="empty-hint">Пройдите несколько вопросов в «Интенсиве», чтобы увидеть статистику</p>
        </div>
      </section>

      <section>
        <p class="section-label">История экзаменов</p>
        <p v-if="profile.exam_history.length === 0" class="empty-hint">Пока нет завершённых попыток</p>
        <div v-else class="mode-list">
          <div v-for="a in profile.exam_history" :key="a.id" class="mode-row exam-row">
            <span
              class="mode-icon"
              :style="{
                background: `color-mix(in srgb, ${a.passed ? 'var(--correct-color)' : 'var(--wrong-color)'} 22%, transparent)`,
              }"
              >{{ a.passed ? "✅" : "❌" }}</span
            >
            <span class="mode-row-text">
              <span class="mode-row-title">{{ a.score_points }}/100</span>
              <span class="mode-row-subtitle">{{ a.passed ? "Сдан" : "Не сдан" }}</span>
            </span>
            <span class="exam-row-date">{{ formatDate(a.finished_at) }}</span>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

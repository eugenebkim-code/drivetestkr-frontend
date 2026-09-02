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
    <h2>Личный кабинет</h2>

    <div v-if="loading">Загрузка…</div>

    <template v-else-if="profile">
      <div class="card glass" style="text-align: center">
        <p style="font-size: 32px; font-weight: 700">🔥 {{ profile.streak_days }}</p>
        <p style="color: var(--tg-hint-color); font-size: 13px">
          {{ profile.streak_days === 1 ? "день подряд" : "дней подряд" }}
        </p>
        <button
          class="btn"
          type="button"
          style="width: 100%; margin-top: var(--space-3)"
          :disabled="profile.checked_in_today || checkingIn"
          @click="checkin"
        >
          {{ profile.checked_in_today ? "✅ Отмечено сегодня" : "Отметиться сегодня" }}
        </button>
      </div>

      <div class="card glass">
        <p style="font-weight: 600; margin-bottom: var(--space-2)">Дневная цель</p>
        <div class="nav-row" style="margin-bottom: var(--space-2)">
          <button
            v-for="opt in goalOptions"
            :key="opt"
            type="button"
            class="btn"
            :class="{ 'btn-secondary': profile.daily_goal !== opt }"
            style="flex: 1"
            @click="setGoal(opt)"
          >
            {{ opt }}
          </button>
        </div>
        <div class="nav-row">
          <input
            v-model="customGoal"
            type="number"
            placeholder="Своё число"
            style="
              flex: 1;
              padding: var(--space-2);
              border-radius: var(--radius-md);
              border: 1px solid var(--tg-hint-color);
            "
          />
          <button class="btn btn-secondary" type="button" @click="setCustomGoal">Установить</button>
        </div>

        <template v-if="profile.daily_goal">
          <div class="progress-bar" style="margin-top: var(--space-3)">
            <div class="progress-bar-fill" :style="{ width: `${goalProgressPct}%` }" />
          </div>
          <p style="font-size: 12px; color: var(--tg-hint-color); margin-top: 4px">
            Сегодня: {{ profile.today_progress }} / {{ profile.daily_goal }}
          </p>
        </template>
      </div>

      <div class="card glass">
        <p style="font-weight: 600; margin-bottom: var(--space-2)">Интенсив: точность по неделям</p>
        <DrillTrendChart v-if="profile.drill_weekly_accuracy.length" :weeks="profile.drill_weekly_accuracy" />
        <p v-else style="color: var(--tg-hint-color); font-size: 13px">
          Пройдите несколько вопросов в «Интенсиве», чтобы увидеть статистику
        </p>
      </div>

      <div class="card glass">
        <p style="font-weight: 600; margin-bottom: var(--space-2)">История экзаменов</p>
        <p v-if="profile.exam_history.length === 0" style="color: var(--tg-hint-color); font-size: 13px">
          Пока нет завершённых попыток
        </p>
        <div v-for="a in profile.exam_history" :key="a.id" class="result-row">
          <span>{{ a.passed ? "✅" : "❌" }}</span>
          <span>{{ a.score_points }}/100</span>
          <span style="margin-left: auto; color: var(--tg-hint-color); font-size: 12px">
            {{ formatDate(a.finished_at) }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

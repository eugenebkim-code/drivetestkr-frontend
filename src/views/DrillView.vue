<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useMainButton } from "vue-tg/7.0";

import { api } from "../api/client";
import LanguageToggle from "../components/LanguageToggle.vue";
import NavArrows from "../components/NavArrows.vue";
import ProgressBar from "../components/ProgressBar.vue";
import QuestionCard from "../components/QuestionCard.vue";
import ToggleSwitch from "../components/ToggleSwitch.vue";
import { useBackToHome } from "../composables/useBackToHome";
import { useSwipeNav } from "../composables/useSwipeNav";
import { anchorsPref } from "../store/anchorsPref";
import { language } from "../store/language";
import type { QuestionPublic } from "../types";

useBackToHome();

const loading = ref(true);
const locked = ref(false);
const questions = ref<QuestionPublic[]>([]);
const idx = ref(0);
const selected = ref<string[]>([]);
const revealed = ref(false);
const questionAreaRef = ref<HTMLElement | null>(null);

const current = computed<QuestionPublic | null>(() => questions.value[idx.value] ?? null);
const anchors = computed(() => {
  const q = current.value;
  if (!q) return null;
  return language.state.lang === "ru"
    ? { anchors: q.anchors_ru, correctAnchors: q.correct_anchors_ru }
    : { anchors: q.anchors_en, correctAnchors: q.correct_anchors_en };
});
const hasAnchors = computed(
  () => anchorsPref.state.enabled && !!(anchors.value?.anchors || anchors.value?.correctAnchors),
);
const qNumber = computed(() => current.value?.id.replace(/^Q/, "") ?? "");

const mainButton = useMainButton();
useSwipeNav(questionAreaRef, { onSwipeLeft: () => goNext(), onSwipeRight: () => goPrev() });

onMounted(async () => {
  loading.value = true;
  try {
    const res = await api.drillSession();
    locked.value = res.locked;
    questions.value = res.questions;
    idx.value = 0;
  } finally {
    loading.value = false;
  }
  mainButton.setParams({ text: "Следующий вопрос →" });
  mainButton.onClick(goNext);
});

onUnmounted(() => {
  mainButton.hide();
});

watch(current, (q) => {
  selected.value = [];
  revealed.value = false;
  if (q) mainButton.show();
  else mainButton.hide();
});

function selectLetter(letter: string) {
  if (!current.value) return;
  if (current.value.is_multi) {
    const s = selected.value.includes(letter)
      ? selected.value.filter((l) => l !== letter)
      : [...selected.value, letter].slice(-2);
    selected.value = s;
    revealed.value = s.length === 2;
    if (revealed.value) recordAnswer(current.value.id, s);
  } else {
    selected.value = [letter];
    revealed.value = true;
    recordAnswer(current.value.id, [letter]);
  }
}

function recordAnswer(questionId: string, letters: string[]) {
  api.drillAnswer(questionId, letters).catch(() => {});
}

function goNext() {
  idx.value = idx.value < questions.value.length - 1 ? idx.value + 1 : 0;
}

function goPrev() {
  idx.value = idx.value > 0 ? idx.value - 1 : questions.value.length - 1;
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
      <h2>Интенсив доступен только с подпиской</h2>
      <p style="color: var(--tg-hint-color)">Оформите доступ, чтобы тренироваться на 200 случайных вопросах.</p>
      <RouterLink class="btn" style="width: 100%" :to="{ name: 'redeem' }">Ввести код доступа</RouterLink>
    </div>

    <template v-else-if="current">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: var(--space-3)">
        <div style="flex: 1">
          <ProgressBar :current="idx + 1" :total="questions.length" />
        </div>
        <span class="badge badge-trial">№{{ qNumber }}</span>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; gap: var(--space-3)">
        <LanguageToggle />
        <RouterLink :to="{ name: 'home' }" class="home-link">🏠 На главную</RouterLink>
        <ToggleSwitch
          :model-value="anchorsPref.state.enabled"
          label="Якоря"
          @update:model-value="anchorsPref.set"
        />
      </div>

      <div ref="questionAreaRef" class="question-nav-wrap">
        <NavArrows :can-prev="true" :can-next="true" @prev="goPrev" @next="goNext" />
        <QuestionCard
          :question="current"
          :selected="selected"
          :revealed="revealed"
          :correct-letters="current.correct_letters"
          :disabled="false"
          @select="selectLetter"
        />
      </div>

      <div v-if="hasAnchors" class="card glass anchors">
        <p v-if="anchors?.anchors">{{ anchors.anchors }}</p>
        <p v-if="anchors?.correctAnchors">✅ {{ anchors.correctAnchors }}</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import { api } from "../api/client";
import { useBackToHome } from "../composables/useBackToHome";
import type {
  AdminDailyStatsOut,
  AdminExamStatsOut,
  AdminStatsOut,
  AdminUserOut,
  SectionVisitOut,
} from "../types";

useBackToHome();
const router = useRouter();

const SECTION_LABELS: Record<string, string> = {
  menu: "🏠 Меню",
  learn: "📖 Обучение",
  drill: "🎯 Интенсив",
  exam: "📝 Экзамен",
  profile: "👤 Профиль",
  chat: "💬 Чат",
  about: "ℹ️ О нас",
  redeem: "🎟️ Промокод",
};

function sectionLabel(section: string | null): string {
  if (!section) return "—";
  return SECTION_LABELS[section] ?? section;
}

function pct(n: number, total: number): string {
  return total > 0 ? String(Math.round((n / total) * 100)) : "0";
}

const loading = ref(true);
const forbidden = ref(false);
const stats = ref<AdminStatsOut | null>(null);
const users = ref<AdminUserOut[]>([]);
const examStats = ref<AdminExamStatsOut | null>(null);

const openActivityFor = ref<number | null>(null);
const activityLoading = ref<number | null>(null);
const activityCache = ref<Map<number, SectionVisitOut[]>>(new Map());

async function toggleActivity(userId: number) {
  if (openActivityFor.value === userId) {
    openActivityFor.value = null;
    return;
  }
  openActivityFor.value = userId;
  if (activityCache.value.has(userId)) return;
  activityLoading.value = userId;
  try {
    activityCache.value.set(userId, await api.adminUserActivity(userId));
  } finally {
    activityLoading.value = null;
  }
}

const activeTab = ref<"overview" | "visits">("overview");
const dailyStats = ref<AdminDailyStatsOut | null>(null);
const dailyLoading = ref(false);

async function openVisitsTab() {
  activeTab.value = "visits";
  if (dailyStats.value || dailyLoading.value) return;
  dailyLoading.value = true;
  try {
    dailyStats.value = await api.adminDailyStats();
  } finally {
    dailyLoading.value = false;
  }
}

function formatDay(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    weekday: "short",
  });
}

const broadcastText = ref("");
const broadcastSending = ref(false);
const broadcastResult = ref<string | null>(null);

const openMessageFor = ref<number | null>(null);
const messageText = ref("");
const messageSending = ref(false);

async function load() {
  loading.value = true;
  try {
    const [s, u, ex] = await Promise.all([
      api.adminStats(),
      api.adminUsers(),
      api.adminExamStats(),
    ]);
    stats.value = s;
    users.value = u;
    examStats.value = ex;
  } catch (e) {
    if (e instanceof Error && e.message.includes("403")) {
      forbidden.value = true;
    } else {
      throw e;
    }
  } finally {
    loading.value = false;
  }
}

async function sendBroadcast() {
  if (!broadcastText.value.trim()) return;
  broadcastSending.value = true;
  broadcastResult.value = null;
  try {
    const res = await api.adminBroadcast(broadcastText.value.trim());
    broadcastResult.value = `Отправляется ${res.recipient_count} пользователям…`;
    broadcastText.value = "";
  } finally {
    broadcastSending.value = false;
  }
}

function toggleMessageBox(userId: number) {
  openMessageFor.value = openMessageFor.value === userId ? null : userId;
  messageText.value = "";
}

async function sendMessage(userId: number) {
  if (!messageText.value.trim()) return;
  messageSending.value = true;
  try {
    await api.adminMessageUser(userId, messageText.value.trim());
    openMessageFor.value = null;
    messageText.value = "";
  } finally {
    messageSending.value = false;
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

onMounted(load);
</script>

<template>
  <div class="screen">
    <h2>Админка</h2>

    <div v-if="loading">Загрузка…</div>

    <div v-else-if="forbidden" class="card glass" style="text-align: center">
      <p>Доступ только для владельца бота.</p>
      <button class="btn" type="button" style="margin-top: var(--space-3)" @click="router.replace({ name: 'home' })">
        На главную
      </button>
    </div>

    <template v-else-if="stats">
      <div class="lang-toggle" role="group" aria-label="Раздел админки">
        <button
          type="button"
          class="lang-toggle-option"
          :class="{ active: activeTab === 'overview' }"
          @click="activeTab = 'overview'"
        >
          Обзор
        </button>
        <button
          type="button"
          class="lang-toggle-option"
          :class="{ active: activeTab === 'visits' }"
          @click="openVisitsTab"
        >
          Посещения
        </button>
      </div>

      <template v-if="activeTab === 'visits'">
        <div v-if="dailyLoading">Загрузка…</div>
        <template v-else-if="dailyStats">
          <div class="mode-grid" style="grid-template-columns: repeat(2, 1fr)">
            <div class="card glass" style="text-align: center">
              <p style="font-size: 22px; font-weight: 700">{{ dailyStats.today_visits }}</p>
              <p style="font-size: 12px; color: var(--tg-hint-color)">Сегодня</p>
            </div>
            <div class="card glass" style="text-align: center">
              <p style="font-size: 22px; font-weight: 700">{{ dailyStats.yesterday_visits }}</p>
              <p style="font-size: 12px; color: var(--tg-hint-color)">Вчера</p>
            </div>
          </div>

          <div class="card glass">
            <p style="font-weight: 600; margin-bottom: var(--space-2)">
              История по дням <span style="color: var(--tg-hint-color); font-weight: 400">(без вас)</span>
            </p>
            <p v-if="dailyStats.days.length === 0" style="color: var(--tg-hint-color)">Пока нет данных</p>
            <div v-for="d in dailyStats.days" :key="d.date" class="result-row">
              <span>{{ formatDay(d.date) }}</span>
              <span style="margin-left: auto; font-size: 13px; color: var(--tg-hint-color)">
                {{ d.visits }} посещ. · +{{ d.new_users }} нов.
              </span>
            </div>
          </div>
        </template>
      </template>

      <template v-else>
      <div class="mode-grid" style="grid-template-columns: repeat(3, 1fr)">
        <div class="card glass" style="text-align: center">
          <p style="font-size: 22px; font-weight: 700">{{ stats.total_users }}</p>
          <p style="font-size: 12px; color: var(--tg-hint-color)">Пользователей</p>
        </div>
        <div class="card glass" style="text-align: center">
          <p style="font-size: 22px; font-weight: 700">{{ stats.paying_users }}</p>
          <p style="font-size: 12px; color: var(--tg-hint-color)">Платных</p>
        </div>
        <div class="card glass" style="text-align: center">
          <p style="font-size: 22px; font-weight: 700">{{ stats.total_visits }}</p>
          <p style="font-size: 12px; color: var(--tg-hint-color)">Визитов</p>
        </div>
      </div>

      <div v-if="examStats" class="card glass">
        <p style="font-weight: 600; margin-bottom: var(--space-2)">
          Экзамены <span style="color: var(--tg-hint-color); font-weight: 400">(без вас)</span>
        </p>
        <div class="result-row">
          <span>Начато</span>
          <span style="margin-left: auto; font-size: 13px; color: var(--tg-hint-color)">
            {{ examStats.started }}
          </span>
        </div>
        <div class="result-row">
          <span>Завершено</span>
          <span style="margin-left: auto; font-size: 13px; color: var(--tg-hint-color)">
            {{ examStats.finished }} ({{ pct(examStats.finished, examStats.started) }}%)
          </span>
        </div>
        <div class="result-row">
          <span>Сдали</span>
          <span style="margin-left: auto; font-size: 13px; color: var(--tg-hint-color)">
            {{ examStats.passed }} ({{ pct(examStats.passed, examStats.finished) }}%)
          </span>
        </div>
        <div class="result-row">
          <span>Бросили на середине</span>
          <span style="margin-left: auto; font-size: 13px; color: var(--tg-hint-color)">
            {{ examStats.abandoned }} ({{ pct(examStats.abandoned, examStats.started) }}%)
          </span>
        </div>
        <div class="result-row">
          <span>Средний балл</span>
          <span style="margin-left: auto; font-size: 13px; color: var(--tg-hint-color)">
            {{ examStats.avg_score ?? "—" }}
          </span>
        </div>
      </div>

      <div class="card glass">
        <p style="font-weight: 600; margin-bottom: var(--space-2)">Рассылка всем пользователям</p>
        <textarea
          v-model="broadcastText"
          rows="3"
          placeholder="Текст сообщения…"
          style="
            width: 100%;
            padding: var(--space-2);
            border-radius: var(--radius-md);
            border: 1px solid var(--tg-hint-color);
            font: inherit;
            resize: vertical;
          "
        />
        <button
          class="btn"
          type="button"
          style="width: 100%; margin-top: var(--space-2)"
          :disabled="broadcastSending"
          @click="sendBroadcast"
        >
          {{ broadcastSending ? "Отправка…" : "Отправить всем" }}
        </button>
        <p v-if="broadcastResult" style="font-size: 13px; color: var(--tg-hint-color); margin-top: var(--space-2)">
          {{ broadcastResult }}
        </p>
      </div>

      <div class="card glass">
        <p style="font-weight: 600; margin-bottom: var(--space-2)">Пользователи</p>
        <div v-for="u in users" :key="u.user_id">
          <div class="result-row">
            <span>
              <span v-if="u.subscription_active" class="badge badge-active">₩</span>
              {{ u.first_name || "—" }}
              <span style="color: var(--tg-hint-color)">@{{ u.username || "—" }}</span>
            </span>
            <span style="margin-left: auto; font-size: 12px; color: var(--tg-hint-color)">
              {{ u.user_id }} · {{ formatDate(u.last_seen_at) }} · {{ u.visit_count }} вх.
            </span>
            <button
              type="button"
              class="btn-secondary"
              style="border-radius: 50%; width: 28px; height: 28px; flex-shrink: 0"
              @click="toggleMessageBox(u.user_id)"
            >
              ✉️
            </button>
          </div>
          <button
            type="button"
            class="btn-secondary"
            style="
              font-size: 12px;
              padding: 2px 8px;
              border-radius: var(--radius-md);
              margin: 2px 0 var(--space-2);
            "
            @click="toggleActivity(u.user_id)"
          >
            {{ sectionLabel(u.last_section) }} · {{ formatDate(u.last_section_at) }}
          </button>
          <div v-if="openActivityFor === u.user_id" style="margin-bottom: var(--space-2)">
            <p v-if="activityLoading === u.user_id" style="font-size: 12px; color: var(--tg-hint-color)">
              Загрузка…
            </p>
            <template v-else>
              <p
                v-if="(activityCache.get(u.user_id) ?? []).length === 0"
                style="font-size: 12px; color: var(--tg-hint-color)"
              >
                Нет истории переходов
              </p>
              <div
                v-for="(a, i) in activityCache.get(u.user_id)"
                :key="i"
                style="display: flex; justify-content: space-between; font-size: 12px; padding: 2px 0"
              >
                <span>{{ sectionLabel(a.section) }}</span>
                <span style="color: var(--tg-hint-color)">{{ formatDate(a.visited_at) }}</span>
              </div>
            </template>
          </div>
          <div v-if="openMessageFor === u.user_id" class="nav-row" style="margin: var(--space-2) 0">
            <input
              v-model="messageText"
              type="text"
              placeholder="Текст сообщения…"
              style="
                flex: 1;
                padding: var(--space-2);
                border-radius: var(--radius-md);
                border: 1px solid var(--tg-hint-color);
              "
            />
            <button
              class="btn btn-secondary"
              type="button"
              :disabled="messageSending"
              @click="sendMessage(u.user_id)"
            >
              Отправить
            </button>
          </div>
        </div>
      </div>
      </template>
    </template>
  </div>
</template>

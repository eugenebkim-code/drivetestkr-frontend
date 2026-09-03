<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useMiniApp } from "vue-tg/7.0";

import { session } from "../store/session";

const router = useRouter();
const miniApp = useMiniApp();

onMounted(() => {
  session.refresh();
});

const me = computed(() => session.state.me);

function daysLeft(iso: string | null): number {
  if (!iso) return 0;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

const greeting = computed(() => {
  const m = me.value;
  if (m?.username) return `Привет, @${m.username} 👋`;
  if (m?.first_name) return `Привет, ${m.first_name} 👋`;
  return "С возвращением 👋";
});

const status = computed(() => {
  const m = me.value;
  if (!m) return null;
  if (m.full_access_reason === "subscription") {
    return {
      icon: "💎",
      title: "Подписка активна",
      subtitle: `Осталось ${daysLeft(m.subscription_expires_at)} дн. полного доступа`,
    };
  }
  if (m.full_access_reason === "new_user_trial") {
    return {
      icon: "🎁",
      title: "Полный доступ открыт",
      subtitle: `Пробный период — осталось ${daysLeft(m.trial_period_expires_at)} дн.`,
    };
  }
  return {
    icon: "⏳",
    title: "Бесплатный доступ",
    subtitle: `Сегодня: ${m.trial.total_today - m.trial.answered_count} из ${m.trial.total_today} вопросов`,
  };
});

const modes = computed(() => {
  const m = me.value;
  if (!m) return [];
  return [
    {
      name: "learn",
      icon: "📘",
      color: "#3b82f6",
      title: "Обучение",
      subtitle:
        "Все вопросы из базы с ответами и якорными фразами для более быстрого заучивания на русском и английском языках",
    },
    {
      name: "drill",
      icon: "🔥",
      color: "#f97316",
      title: "Интенсив",
      subtitle: "200 случайных вопросов для более динамичного обучения",
    },
    {
      name: "exam",
      icon: "📝",
      color: "#10b981",
      title: "Пробный экзамен",
      subtitle: "Симуляция реального экзамена на права",
    },
  ];
});

function contactDeveloper() {
  miniApp.openTelegramLink("https://t.me/luv2win");
}
</script>

<template>
  <div class="screen">
    <div class="home-hero">
      <div class="home-hero-glow" />
      <p class="home-hero-eyebrow">Права в Корее</p>
      <h1 class="home-hero-title">{{ greeting }}</h1>
    </div>

    <div v-if="session.state.loading && !me">Загрузка…</div>

    <template v-else-if="me && status">
      <div class="status-card">
        <span class="status-icon">{{ status.icon }}</span>
        <span class="status-text">
          <span class="status-title">{{ status.title }}</span>
          <span class="status-subtitle">{{ status.subtitle }}</span>
        </span>
        <RouterLink v-if="!me.full_access" :to="{ name: 'redeem' }" class="status-cta">Код</RouterLink>
      </div>

      <button
        v-if="me.full_access_reason === 'new_user_trial'"
        type="button"
        class="btn btn-secondary"
        style="width: 100%"
        @click="router.push({ name: 'redeem' })"
      >
        Активировать код доступа
      </button>

      <div class="promo-card">
        <p>
          Полноценный полный доступ можно приобрести у разработчика приложения
          «Права в Корее». Крайне приветствуются любые ваши отзывы и предложения.
        </p>
        <button type="button" class="btn btn-secondary" style="width: 100%" @click="contactDeveloper">
          Написать разработчику · @luv2win
        </button>
      </div>

      <section>
        <p class="section-label">Режимы</p>
        <div class="mode-list">
          <button
            v-for="mode in modes"
            :key="mode.name"
            type="button"
            class="mode-row"
            @click="router.push({ name: mode.name })"
          >
            <span
              class="mode-icon"
              :style="{ background: `color-mix(in srgb, ${mode.color} 22%, transparent)` }"
              >{{ mode.icon }}</span
            >
            <span class="mode-row-text">
              <span class="mode-row-title">{{ mode.title }}</span>
              <span class="mode-row-subtitle">{{ mode.subtitle }}</span>
            </span>
            <span class="mode-row-chevron">›</span>
          </button>
        </div>
      </section>

      <section>
        <p class="section-label">Аккаунт</p>
        <div class="mode-list">
          <button type="button" class="mode-row" @click="router.push({ name: 'profile' })">
            <span class="mode-icon" style="background: color-mix(in srgb, #06b6d4 22%, transparent)">🙋</span>
            <span class="mode-row-text">
              <span class="mode-row-title">Ваш личный кабинет</span>
            </span>
            <span class="mode-row-chevron">›</span>
          </button>

          <button type="button" class="mode-row" @click="router.push({ name: 'chat' })">
            <span class="mode-icon" style="background: color-mix(in srgb, #22c55e 22%, transparent); position: relative">
              💬
              <span v-if="me.chat_unread" class="chat-unread-dot">!</span>
            </span>
            <span class="mode-row-text">
              <span class="mode-row-title">Общий чат</span>
              <span class="mode-row-subtitle"
                >Задайте вопрос разработчику, пообщайтесь с другими или поделитесь опытом</span
              >
            </span>
            <span class="mode-row-chevron">›</span>
          </button>

          <button type="button" class="mode-row" @click="router.push({ name: 'about' })">
            <span class="mode-icon" style="background: color-mix(in srgb, #8b5cf6 22%, transparent)">ℹ️</span>
            <span class="mode-row-text">
              <span class="mode-row-title">О приложении «Права в Корее»</span>
            </span>
            <span class="mode-row-chevron">›</span>
          </button>

          <button v-if="me.is_admin" type="button" class="mode-row" @click="router.push({ name: 'admin' })">
            <span class="mode-icon" style="background: color-mix(in srgb, #64748b 22%, transparent)">🛠</span>
            <span class="mode-row-text">
              <span class="mode-row-title">Админка</span>
              <span class="mode-row-subtitle">Статистика, пользователи, рассылка</span>
            </span>
            <span class="mode-row-chevron">›</span>
          </button>
        </div>
      </section>
    </template>

    <p v-else-if="session.state.error" style="color: var(--wrong-color)">{{ session.state.error }}</p>

    <p class="home-footer">
      Сделано командой <a href="https://mirae.team" target="_blank" rel="noopener noreferrer">mirae.team</a>. Корея, 2026.
    </p>
  </div>
</template>

<style scoped>
.home-footer {
  margin-top: 8px;
  padding-bottom: 8px;
  text-align: center;
  font-size: 12px;
  color: var(--tg-hint-color);
}

.home-footer a {
  color: var(--tg-hint-color);
  text-decoration: underline;
}

.chat-unread-dot {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--wrong-color, #ff3b30);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
  box-shadow: 0 0 0 2px var(--tg-bg-color, #fff);
}
</style>

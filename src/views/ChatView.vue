<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";

import { api, ApiError } from "../api/client";
import { useBackToHome } from "../composables/useBackToHome";
import { session } from "../store/session";
import type { ChatMessage } from "../types";

useBackToHome();

const POLL_INTERVAL_MS = 3000;
// Matches the backend's RECENT_LIMIT — a page shorter than this means
// there's nothing older left to load.
const PAGE_SIZE = 50;
// How close to the top of the scroll container triggers loading an older
// page, in pixels.
const LOAD_MORE_THRESHOLD_PX = 60;

const loading = ref(true);
const loadingOlder = ref(false);
const hasMore = ref(true);
const messages = ref<ChatMessage[]>([]);
const draft = ref("");
const sending = ref(false);
const sendError = ref<string | null>(null);
const listEl = ref<HTMLElement | null>(null);

let pollHandle: ReturnType<typeof setInterval> | null = null;
let lastId = 0;
let firstId: number | null = null;

const myUserId = computed(() => session.state.me?.user_id ?? null);

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function displayName(m: ChatMessage): string {
  if (m.username) return `@${m.username}`;
  return m.first_name ?? "Гость";
}

async function scrollToBottom() {
  await nextTick();
  if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight;
}

async function poll() {
  try {
    const fresh = await api.chatMessages({ afterId: lastId });
    if (fresh.length) {
      messages.value.push(...fresh);
      lastId = fresh[fresh.length - 1].id;
      await scrollToBottom();
    }
  } catch {
    // Silent — a single missed poll tick isn't worth surfacing to the user,
    // the next tick just retries.
  }
}

async function loadOlder() {
  if (loadingOlder.value || !hasMore.value || firstId === null) return;
  loadingOlder.value = true;
  const el = listEl.value;
  const prevScrollHeight = el?.scrollHeight ?? 0;
  const prevScrollTop = el?.scrollTop ?? 0;
  try {
    const older = await api.chatMessages({ beforeId: firstId });
    if (older.length) {
      messages.value.unshift(...older);
      firstId = older[0].id;
    }
    if (older.length < PAGE_SIZE) hasMore.value = false;
    // Prepending content above the viewport shifts everything down — restore
    // the same visual scroll position instead of jumping to the very top.
    await nextTick();
    if (el) el.scrollTop = el.scrollHeight - prevScrollHeight + prevScrollTop;
  } catch {
    // Leave hasMore as-is so scrolling up again just retries.
  } finally {
    loadingOlder.value = false;
  }
}

function onListScroll() {
  if (listEl.value && listEl.value.scrollTop < LOAD_MORE_THRESHOLD_PX) {
    loadOlder();
  }
}

async function send() {
  const text = draft.value.trim();
  if (!text || sending.value) return;
  sending.value = true;
  sendError.value = null;
  try {
    const created = await api.chatSend(text);
    draft.value = "";
    messages.value.push(created);
    lastId = created.id;
    await scrollToBottom();
  } catch (e) {
    sendError.value =
      e instanceof ApiError && e.status === 429
        ? "Слишком часто — подождите пару секунд"
        : "Не удалось отправить сообщение";
  } finally {
    sending.value = false;
  }
}

onMounted(async () => {
  if (!session.state.me) await session.refresh();
  try {
    const initial = await api.chatMessages();
    messages.value = initial;
    if (initial.length) {
      lastId = initial[initial.length - 1].id;
      firstId = initial[0].id;
    }
    if (initial.length < PAGE_SIZE) hasMore.value = false;
  } finally {
    loading.value = false;
  }
  await scrollToBottom();
  pollHandle = setInterval(poll, POLL_INTERVAL_MS);
});

onBeforeUnmount(() => {
  if (pollHandle !== null) clearInterval(pollHandle);
});
</script>

<template>
  <div class="screen chat-screen">
    <div class="chat-intro">
      <p class="home-hero-eyebrow">Общий чат</p>
      <p class="chat-intro-caption">
        Задайте вопрос разработчику, пообщайтесь с другими или поделитесь опытом
      </p>
    </div>

    <div v-if="loading" class="empty-hint">Загрузка…</div>

    <div v-else ref="listEl" class="chat-list" @scroll="onListScroll">
      <p v-if="messages.length === 0" class="empty-hint" style="text-align: center">
        Сообщений пока нет — напишите первым
      </p>
      <p v-else-if="loadingOlder" class="chat-history-hint">Загрузка истории…</p>
      <p v-else-if="!hasMore" class="chat-history-hint">Начало истории</p>
      <div
        v-for="m in messages"
        :key="m.id"
        class="chat-bubble-row"
        :class="{ 'chat-bubble-row-own': m.user_id === myUserId }"
      >
        <div class="chat-bubble" :class="{ 'chat-bubble-own': m.user_id === myUserId }">
          <div class="chat-bubble-meta">
            <span class="chat-bubble-name">{{ displayName(m) }}</span>
            <span v-if="m.is_admin" class="badge badge-active">Разработчик</span>
          </div>
          <p class="chat-bubble-text">{{ m.text }}</p>
          <span class="chat-bubble-time">{{ formatTime(m.created_at) }}</span>
        </div>
      </div>
    </div>

    <p v-if="sendError" class="chat-send-error">{{ sendError }}</p>

    <form class="chat-input-row" @submit.prevent="send">
      <input
        v-model="draft"
        type="text"
        class="chat-input"
        placeholder="Написать сообщение…"
        maxlength="500"
        :disabled="sending"
      />
      <button type="submit" class="btn chat-send-btn" :disabled="sending || !draft.trim()">Отправить</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";

import { api, ApiError, imageUrl } from "../api/client";
import ImageZoom from "../components/ImageZoom.vue";
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
const pinned = ref<ChatMessage[]>([]);
const pinning = ref<number | null>(null);
const pinError = ref<string | null>(null);
const MAX_PINNED = 3;

const fileInput = ref<HTMLInputElement | null>(null);
const pendingImage = ref<{ previewUrl: string; uploadedUrl: string | null; uploading: boolean } | null>(
  null,
);
const zoomSrc = ref<string | null>(null);

const editingId = ref<number | null>(null);
const editDraft = ref("");
const editSaving = ref(false);
const editError = ref<string | null>(null);

const deleting = ref<number | null>(null);
const deleteError = ref<string | null>(null);

// Fixed palette, mirrors the backend's ALLOWED_REACTIONS (app/routers/chat.py)
// — a mix of positive and negative so a reaction can express disagreement,
// not just approval.
const REACTIONS = ["👍", "❤️", "😂", "🔥", "👎", "😢"];
const reacting = ref<number | null>(null);

let pollHandle: ReturnType<typeof setInterval> | null = null;
let lastId = 0;
let firstId: number | null = null;

const myUserId = computed(() => session.state.me?.user_id ?? null);
const isAdmin = computed(() => session.state.me?.is_admin ?? false);

async function markRead() {
  try {
    await api.chatMarkRead();
    if (session.state.me) session.state.me.chat_unread = false;
  } catch {
    // Not worth surfacing — the unread dot just stays until the next successful call.
  }
}

async function togglePin(m: ChatMessage) {
  if (pinning.value !== null) return;
  pinning.value = m.id;
  pinError.value = null;
  try {
    if (m.is_pinned) {
      await api.chatUnpin(m.id);
      pinned.value = pinned.value.filter((p) => p.id !== m.id);
    } else {
      const result = await api.chatPin(m.id);
      pinned.value = [...pinned.value, result];
    }
    messages.value = messages.value.map((msg) =>
      msg.id === m.id ? { ...msg, is_pinned: !m.is_pinned } : msg,
    );
  } catch (e) {
    pinError.value =
      e instanceof ApiError && e.status === 400
        ? `Можно закрепить не больше ${MAX_PINNED} сообщений`
        : "Не удалось изменить закрепление";
  } finally {
    pinning.value = null;
  }
}

function pickImage() {
  fileInput.value?.click();
}

async function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0] ?? null;
  input.value = ""; // allow picking the same file again later
  if (!file) return;

  clearPendingImage();
  const previewUrl = URL.createObjectURL(file);
  pendingImage.value = { previewUrl, uploadedUrl: null, uploading: true };
  sendError.value = null;
  try {
    const result = await api.chatUploadImage(file);
    if (pendingImage.value) {
      pendingImage.value.uploadedUrl = result.image_url;
      pendingImage.value.uploading = false;
    }
  } catch (err) {
    sendError.value =
      err instanceof ApiError ? err.message : "Не удалось загрузить фото";
    clearPendingImage();
  }
}

function clearPendingImage() {
  if (pendingImage.value) URL.revokeObjectURL(pendingImage.value.previewUrl);
  pendingImage.value = null;
}

function startEdit(m: ChatMessage) {
  editingId.value = m.id;
  editDraft.value = m.text;
  editError.value = null;
}

function cancelEdit() {
  editingId.value = null;
  editError.value = null;
}

async function saveEdit(m: ChatMessage) {
  const text = editDraft.value.trim();
  if (!text && !m.image_url) {
    editError.value = "Сообщение не может быть пустым";
    return;
  }
  editSaving.value = true;
  editError.value = null;
  try {
    const updated = await api.chatEdit(m.id, text);
    messages.value = messages.value.map((msg) => (msg.id === m.id ? updated : msg));
    editingId.value = null;
  } catch {
    editError.value = "Не удалось сохранить изменения";
  } finally {
    editSaving.value = false;
  }
}

async function deleteMessage(m: ChatMessage) {
  if (deleting.value !== null) return;
  if (!window.confirm("Удалить это сообщение? Действие необратимо.")) return;
  deleting.value = m.id;
  deleteError.value = null;
  try {
    await api.chatDelete(m.id);
    messages.value = messages.value.filter((msg) => msg.id !== m.id);
    pinned.value = pinned.value.filter((p) => p.id !== m.id);
  } catch {
    deleteError.value = "Не удалось удалить сообщение";
  } finally {
    deleting.value = null;
  }
}

async function toggleReaction(m: ChatMessage, emoji: string) {
  if (reacting.value !== null) return;
  reacting.value = m.id;
  try {
    const updated = await api.chatReact(m.id, emoji);
    messages.value = messages.value.map((msg) => (msg.id === m.id ? updated : msg));
  } catch {
    // Low-stakes action — a failed tap just leaves the reaction as it was,
    // not worth a dedicated error message.
  } finally {
    reacting.value = null;
  }
}

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
      await markRead();
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

const canSend = computed(() => {
  if (sending.value) return false;
  if (draft.value.trim()) return true;
  return !!pendingImage.value?.uploadedUrl && !pendingImage.value.uploading;
});

async function send() {
  if (!canSend.value) return;
  const text = draft.value.trim();
  const imageToSend = pendingImage.value?.uploadedUrl ?? null;
  sending.value = true;
  sendError.value = null;
  try {
    const created = await api.chatSend(text, imageToSend);
    draft.value = "";
    clearPendingImage();
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
  await markRead();
  api.chatPinned().then((list) => (pinned.value = list)).catch(() => {});
  pollHandle = setInterval(poll, POLL_INTERVAL_MS);
});

onBeforeUnmount(() => {
  if (pollHandle !== null) clearInterval(pollHandle);
  clearPendingImage();
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

    <div v-if="pinned.length" class="chat-pinned-list">
      <div v-for="p in pinned" :key="p.id" class="chat-pinned">
        <span class="chat-pinned-icon">📌</span>
        <span class="chat-pinned-body">
          <span class="chat-pinned-name">{{ displayName(p) }}</span>
          <span class="chat-pinned-text">{{ p.text }}</span>
        </span>
        <button
          v-if="isAdmin"
          type="button"
          class="chat-pinned-unpin"
          :disabled="pinning === p.id"
          @click="togglePin(p)"
        >
          Открепить
        </button>
      </div>
    </div>

    <p v-if="pinError" class="chat-send-error">{{ pinError }}</p>

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
            <span v-if="m.is_pinned" class="chat-bubble-pin-mark">📌</span>
            <button
              v-if="m.user_id === myUserId && editingId !== m.id"
              type="button"
              class="chat-bubble-pin-btn"
              @click="startEdit(m)"
            >
              Изменить
            </button>
            <button
              v-if="isAdmin"
              type="button"
              class="chat-bubble-pin-btn"
              :disabled="pinning === m.id || (!m.is_pinned && pinned.length >= MAX_PINNED)"
              @click="togglePin(m)"
            >
              {{ m.is_pinned ? "Открепить" : "Закрепить" }}
            </button>
            <button
              v-if="isAdmin"
              type="button"
              class="chat-bubble-delete-btn"
              :disabled="deleting === m.id"
              @click="deleteMessage(m)"
            >
              Удалить
            </button>
          </div>

          <img
            v-if="m.image_url"
            :src="imageUrl(m.image_url)!"
            alt=""
            class="chat-bubble-image"
            @click="zoomSrc = imageUrl(m.image_url)"
          />

          <template v-if="editingId === m.id">
            <textarea
              v-model="editDraft"
              class="chat-edit-textarea"
              maxlength="500"
              rows="2"
              :disabled="editSaving"
            />
            <p v-if="editError" class="chat-send-error">{{ editError }}</p>
            <div class="chat-edit-actions">
              <button type="button" class="btn btn-secondary" :disabled="editSaving" @click="cancelEdit">
                Отмена
              </button>
              <button type="button" class="btn" :disabled="editSaving" @click="saveEdit(m)">Сохранить</button>
            </div>
          </template>
          <p v-else-if="m.text" class="chat-bubble-text">{{ m.text }}</p>

          <div class="chat-reactions">
            <button
              v-for="emoji in REACTIONS"
              :key="emoji"
              type="button"
              class="chat-reaction-chip"
              :class="{ active: m.my_reaction === emoji, 'has-count': !!m.reactions[emoji] }"
              :disabled="reacting === m.id"
              @click="toggleReaction(m, emoji)"
            >
              {{ emoji }}
              <span v-if="m.reactions[emoji]" class="chat-reaction-count">{{ m.reactions[emoji] }}</span>
            </button>
          </div>

          <span class="chat-bubble-time">
            {{ formatTime(m.created_at) }}
            <template v-if="m.edited_at">· изменено</template>
          </span>
        </div>
      </div>
    </div>

    <p v-if="sendError" class="chat-send-error">{{ sendError }}</p>
    <p v-if="deleteError" class="chat-send-error">{{ deleteError }}</p>

    <div v-if="pendingImage" class="chat-pending-image">
      <div class="chat-pending-image-thumb">
        <img :src="pendingImage.previewUrl" alt="" />
        <span v-if="pendingImage.uploading" class="chat-pending-image-uploading">Загрузка…</span>
      </div>
      <button type="button" class="chat-pending-image-remove" @click="clearPendingImage">✕</button>
    </div>

    <form class="chat-input-row" @submit.prevent="send">
      <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="onFileSelected" />
      <button
        type="button"
        class="chat-attach-btn"
        :disabled="sending || pendingImage?.uploading"
        @click="pickImage"
      >
        📎
      </button>
      <input
        v-model="draft"
        type="text"
        class="chat-input"
        placeholder="Написать сообщение…"
        maxlength="500"
        :disabled="sending"
      />
      <button type="submit" class="btn chat-send-btn" :disabled="!canSend">Отправить</button>
    </form>

    <ImageZoom :open="!!zoomSrc" :src="zoomSrc || ''" @close="zoomSrc = null" />
  </div>
</template>

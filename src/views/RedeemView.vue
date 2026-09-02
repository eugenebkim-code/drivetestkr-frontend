<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

import { api } from "../api/client";
import { useBackToHome } from "../composables/useBackToHome";
import { session } from "../store/session";

useBackToHome();
const router = useRouter();

const key = ref("");
const submitting = ref(false);
const error = ref<string | null>(null);
const success = ref(false);

function errorText(code: string | null): string {
  switch (code) {
    case "key_not_found":
      return "Такой код не найден";
    case "key_revoked":
      return "Этот код отозван";
    case "key_already_used":
      return "Этот код уже использован";
    default:
      return "Не удалось активировать код";
  }
}

async function submit() {
  if (!key.value.trim()) return;
  submitting.value = true;
  error.value = null;
  try {
    const res = await api.licenseRedeem(key.value.trim());
    if (res.ok) {
      success.value = true;
      await session.refresh();
    } else {
      error.value = errorText(res.error);
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="screen">
    <h2>Ввести код доступа</h2>

    <div v-if="success" class="card glass" style="text-align: center">
      <p>✅ Доступ активирован!</p>
      <button
        class="btn"
        type="button"
        style="width: 100%; margin-top: var(--space-3)"
        @click="router.replace({ name: 'home' })"
      >
        На главную
      </button>
    </div>

    <template v-else>
      <input
        v-model="key"
        type="text"
        placeholder="KR-XXXX-XXXX-XXXX"
        style="
          padding: var(--space-3);
          border-radius: var(--radius-md);
          border: 1px solid var(--tg-hint-color);
          font-size: 16px;
        "
      />
      <p v-if="error" style="color: var(--wrong-color)">{{ error }}</p>
      <button class="btn" type="button" :disabled="submitting" @click="submit">
        {{ submitting ? "Проверяем…" : "Активировать" }}
      </button>
    </template>
  </div>
</template>

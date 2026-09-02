<script setup lang="ts">
import { onMounted, watchEffect } from "vue";
import { useMiniApp, useTheme, useViewport } from "vue-tg/7.0";

const miniApp = useMiniApp();
const theme = useTheme();
const viewport = useViewport();

onMounted(() => {
  miniApp.ready();
  viewport.expand();
});

// Reflect Telegram's live theme onto CSS custom properties so every
// component automatically follows the user's Telegram light/dark setting —
// the prior vue-tg app never did this.
watchEffect(() => {
  const params = theme.themeParams.value;
  const root = document.documentElement;
  root.style.setProperty("--tg-bg-color", params.bg_color ?? "#ffffff");
  root.style.setProperty("--tg-text-color", params.text_color ?? "#111111");
  root.style.setProperty("--tg-hint-color", params.hint_color ?? "#999999");
  root.style.setProperty("--tg-link-color", params.link_color ?? "#2481cc");
  root.style.setProperty("--tg-button-color", params.button_color ?? "#2481cc");
  root.style.setProperty("--tg-button-text-color", params.button_text_color ?? "#ffffff");
  root.style.setProperty("--tg-secondary-bg-color", params.secondary_bg_color ?? "#f0f0f0");
  root.dataset.colorScheme = theme.colorScheme.value;
});
</script>

<template>
  <RouterView />
</template>

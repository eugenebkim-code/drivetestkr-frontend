<script setup lang="ts">
import { onMounted } from "vue";
import { useMiniApp, useViewport } from "vue-tg/7.0";

const miniApp = useMiniApp();
const viewport = useViewport();

// Deliberately does NOT follow Telegram's live theme — the app always uses
// its own fixed light palette (the :root defaults in base.css), regardless
// of the user's Telegram light/dark setting.
onMounted(() => {
  miniApp.ready();
  viewport.expand();
});
</script>

<template>
  <RouterView />
</template>

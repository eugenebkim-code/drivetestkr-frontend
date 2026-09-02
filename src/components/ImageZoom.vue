<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{ src: string; open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const scale = ref(1);
const tx = ref(0);
const ty = ref(0);

let startDist = 0;
let startScale = 1;
let panStart: { x: number; y: number } | null = null;
let panOrigin = { x: 0, y: 0 };
let lastTapTime = 0;

function reset() {
  scale.value = 1;
  tx.value = 0;
  ty.value = 0;
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) reset();
  },
);

function touchDist(a: Touch, b: Touch) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 2) {
    startDist = touchDist(e.touches[0], e.touches[1]);
    startScale = scale.value;
    panStart = null;
  } else if (e.touches.length === 1) {
    const now = Date.now();
    if (now - lastTapTime < 300) {
      scale.value > 1 ? reset() : (scale.value = 2.5);
      panStart = null;
    } else if (scale.value > 1) {
      panStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panOrigin = { x: tx.value, y: ty.value };
    }
    lastTapTime = now;
  }
}

function onTouchMove(e: TouchEvent) {
  if (e.touches.length === 2) {
    e.preventDefault();
    const d = touchDist(e.touches[0], e.touches[1]);
    if (startDist > 0) {
      const next = Math.min(5, Math.max(1, startScale * (d / startDist)));
      scale.value = next;
      if (next <= 1) {
        tx.value = 0;
        ty.value = 0;
      }
    }
  } else if (e.touches.length === 1 && panStart) {
    e.preventDefault();
    tx.value = panOrigin.x + (e.touches[0].clientX - panStart.x);
    ty.value = panOrigin.y + (e.touches[0].clientY - panStart.y);
  }
}

function onTouchEnd(e: TouchEvent) {
  if (e.touches.length < 2) startDist = 0;
  if (e.touches.length === 0) panStart = null;
  if (scale.value < 1.02) reset();
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="zoom-overlay" @click.self="emit('close')">
      <button type="button" class="zoom-close" @click="emit('close')" aria-label="Закрыть">✕</button>
      <img
        :src="src"
        class="zoom-img"
        :style="{ transform: `translate(${tx}px, ${ty}px) scale(${scale})` }"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        @touchcancel="onTouchEnd"
      />
    </div>
  </Teleport>
</template>

<style scoped>
.zoom-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  overflow: hidden;
}

.zoom-img {
  max-width: 100%;
  max-height: 100%;
  touch-action: none;
  user-select: none;
  -webkit-user-drag: none;
}

.zoom-close {
  position: absolute;
  top: max(16px, env(safe-area-inset-top));
  right: 16px;
  z-index: 1001;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 20px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

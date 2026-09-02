import { watch } from "vue";
import type { Ref } from "vue";

const SWIPE_MIN_DISTANCE = 60;
const SWIPE_MAX_OFF_AXIS = 80;
const SWIPE_MAX_DURATION = 600;

/** Horizontal swipe-to-navigate on the given element: swipe left -> next
 * question, swipe right -> previous (like flipping through a book).
 *
 * `target` is watched (not just read once in onMounted) because the element
 * it points to only exists once the question has loaded — it's behind a
 * `v-else-if` in the caller, so it isn't there yet when onMounted first
 * fires and never appears via a *new* mount after that. */
export function useSwipeNav(
  target: Ref<HTMLElement | null>,
  handlers: { onSwipeLeft: () => void; onSwipeRight: () => void },
) {
  let startX = 0;
  let startY = 0;
  let startTime = 0;

  function onTouchStart(e: TouchEvent) {
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    startTime = Date.now();
  }

  function onTouchEnd(e: TouchEvent) {
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    const dt = Date.now() - startTime;

    if (Math.abs(dx) >= SWIPE_MIN_DISTANCE && Math.abs(dy) < SWIPE_MAX_OFF_AXIS && dt < SWIPE_MAX_DURATION) {
      if (dx < 0) handlers.onSwipeLeft();
      else handlers.onSwipeRight();
    }
  }

  watch(
    target,
    (el, prevEl) => {
      prevEl?.removeEventListener("touchstart", onTouchStart);
      prevEl?.removeEventListener("touchend", onTouchEnd);
      el?.addEventListener("touchstart", onTouchStart, { passive: true });
      el?.addEventListener("touchend", onTouchEnd, { passive: true });
    },
    { immediate: true },
  );
}

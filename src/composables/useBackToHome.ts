import { onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useBackButton } from "vue-tg/7.0";

/** Shows Telegram's native BackButton for the lifetime of the calling view,
 * navigating to Home on tap. Event subscription cleanup is automatic (vue-tg
 * manages it unless `manual: true` is passed) — we only need to hide the
 * button ourselves on unmount. */
export function useBackToHome() {
  const backButton = useBackButton();
  const router = useRouter();

  // Must run at setup time, NOT inside onMounted: vue-tg's onClick registers
  // its listener via its own internal onMounted/onUnmounted, which only
  // wires up correctly while a component instance is synchronously active
  // (getCurrentInstance() must resolve) — nesting it inside this composable's
  // own onMounted callback registers that internal hook too late to ever
  // fire, so the button showed but silently did nothing on tap.
  backButton.onClick(() => router.push({ name: "home" }));

  onMounted(() => {
    backButton.show();
  });

  onUnmounted(() => {
    backButton.hide();
  });
}

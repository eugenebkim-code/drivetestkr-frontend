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

  onMounted(() => {
    backButton.show();
    backButton.onClick(() => router.push({ name: "home" }));
  });

  onUnmounted(() => {
    backButton.hide();
  });
}

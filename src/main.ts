import { createApp } from "vue";

import App from "./App.vue";
import router from "./router";
import "./styles/base.css";
import "./styles/ui.css";

// Tells index.html's timeout-based check whether execution got past all of
// this module's own imports at all (a throw during any dependency's
// top-level evaluation would prevent this line from ever running).
(window as unknown as Record<string, unknown>).__mainTsStarted = true;

// iOS double-tap-zoom prevention (same snippet the prior vue-tg app used).
let lastTouchEnd = 0;
document.addEventListener(
  "touchend",
  (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  },
  { passive: false },
);

// A blank/black screen with no clue why is worse than an ugly error message —
// this surfaces whatever actually broke instead of failing silently, since
// there's no way to attach devtools to a user's real Telegram session.
// (index.html has its own copy of this that runs even earlier — this one is
// a second line of defense in case something re-registers/clears it.)
function showFatalError(message: string) {
  const el = document.getElementById("app");
  if (!el) return;
  el.innerHTML =
    '<div style="padding:16px;background:#fff;color:#c00;font-family:monospace;font-size:13px;white-space:pre-wrap;word-break:break-word;">' +
    "Ошибка запуска приложения:\n\n" +
    message.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] as string) +
    "</div>";
}

window.addEventListener("error", (e) => showFatalError(e.message + "\n" + (e.error?.stack ?? "")));
window.addEventListener("unhandledrejection", (e) => showFatalError(String(e.reason)));

try {
  const app = createApp(App);
  app.config.errorHandler = (err, _instance, info) => {
    console.error("Vue error:", err, info);
    showFatalError(`${err}\ninfo: ${info}`);
  };
  app.use(router).mount("#app");
  (window as unknown as Record<string, unknown>).__appMounted = true;
} catch (err) {
  showFatalError(String(err));
}

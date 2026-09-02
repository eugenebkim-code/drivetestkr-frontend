import { createApp } from "vue";

import App from "./App.vue";
import router from "./router";
import "./styles/base.css";
import "./styles/ui.css";

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
} catch (err) {
  showFatalError(String(err));
}

import { createApp } from "vue";

import "./styles/base.css";
import "./styles/ui.css";
import App from "./App.vue";
import router from "./router";

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

// A route's lazy-loaded JS chunk 404s if the app was already open in a tab
// when a new version deployed (the old build's hashed filenames no longer
// exist on the server). Vite fires this event for exactly that case — a
// hard reload fetches the current index.html and current chunk hashes,
// instead of crashing the router mid-navigation.
window.addEventListener("vite:preloadError", () => {
  window.location.reload();
});

const app = createApp(App);
app.config.errorHandler = (err, _instance, info) => {
  console.error("Vue error:", err, info);
  showFatalError(`${err}\ninfo: ${info}`);
};
app.use(router).mount("#app");

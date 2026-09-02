import { createApp, h } from "vue";

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

// TEMPORARY diagnostic: ?bare=1 mounts plain Vue with NO vue-tg/router import
// at all (dynamic import, so vue-tg's own module code never even loads in
// this mode) — isolates "does Vue itself mount here" from "does vue-tg (or
// something it does on import/setup) break here".
const bareMode = new URLSearchParams(location.search).get("bare") === "1";

async function start() {
  if (bareMode) {
    createApp({ render: () => h("div", { style: "padding:20px;background:#0f0;color:#000" }, "BARE VUE MOUNTED OK") }).mount(
      "#app",
    );
  } else {
    const [{ default: App }, { default: router }] = await Promise.all([import("./App.vue"), import("./router")]);
    const app = createApp(App);
    app.config.errorHandler = (err, _instance, info) => {
      console.error("Vue error:", err, info);
      showFatalError(`${err}\ninfo: ${info}`);
    };
    app.use(router).mount("#app");
  }
  (window as unknown as Record<string, unknown>).__appMounted = true;
}

start().catch((err) => showFatalError(String(err)));

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

createApp(App).use(router).mount("#app");

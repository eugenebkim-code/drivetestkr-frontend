import { createApp, h, onMounted, watchEffect } from "vue";

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

/* eslint-disable no-console */

// TEMPORARY diagnostic ladder, selected via ?bare=N — each level adds one
// more thing on top of the last, so whichever level first goes black tells
// us exactly what broke it. All vue-tg imports are dynamic so a level that
// doesn't need vue-tg never even loads its module code.
const bareLevel = new URLSearchParams(location.search).get("bare");

function mountText(text: string, bg = "#0f0") {
  createApp({ render: () => h("div", { style: `padding:20px;background:${bg};color:#000` }, text) }).mount("#app");
}

async function start() {
  if (bareLevel === "1") {
    // No vue-tg at all.
    mountText("BARE 1: plain Vue, no vue-tg — OK");
  } else if (bareLevel === "2") {
    // Import vue-tg, call nothing.
    await import("vue-tg/7.0");
    mountText("BARE 2: vue-tg imported, nothing called — OK");
  } else if (bareLevel === "3") {
    // Call useMiniApp().ready() only.
    const { useMiniApp } = await import("vue-tg/7.0");
    mountText("BARE 3: about to call useMiniApp()...", "#ff0");
    const miniApp = useMiniApp();
    mountText("BARE 3: useMiniApp() returned, calling ready()...", "#ff0");
    miniApp.ready();
    mountText("BARE 3: useMiniApp().ready() called — OK");
  } else if (bareLevel === "4") {
    // Add useTheme() + reading themeParams (no expand, no writing to DOM).
    const { useMiniApp, useTheme } = await import("vue-tg/7.0");
    const miniApp = useMiniApp();
    miniApp.ready();
    mountText("BARE 4: calling useTheme()...", "#ff0");
    const theme = useTheme();
    mountText("BARE 4: useTheme() returned, reading themeParams...", "#ff0");
    const params = theme.themeParams.value;
    mountText("BARE 4: themeParams = " + JSON.stringify(params));
  } else if (bareLevel === "5") {
    // Add useViewport().expand() — the one call debug.html never made.
    const { useMiniApp, useViewport } = await import("vue-tg/7.0");
    const miniApp = useMiniApp();
    miniApp.ready();
    mountText("BARE 5: calling useViewport()...", "#ff0");
    const viewport = useViewport();
    mountText("BARE 5: useViewport() returned, calling expand()...", "#ff0");
    viewport.expand();
    mountText("BARE 5: expand() called — OK");
  } else if (bareLevel === "6") {
    // Full App.vue + router, but through this same instrumented path.
    const [{ default: App }, { default: router }] = await Promise.all([import("./App.vue"), import("./router")]);
    const app = createApp(App);
    app.config.errorHandler = (err, _instance, info) => {
      console.error("Vue error:", err, info);
      showFatalError(`${err}\ninfo: ${info}`);
    };
    app.use(router).mount("#app");
  } else if (bareLevel === "7") {
    // Real App.vue (all 3 composables + the theme watchEffect) + a real
    // vue-router, but routed to a placeholder with NO HomeView, NO session
    // store, NO fetch to the backend at all — isolates "does App.vue's own
    // combination + router infra survive" from "does HomeView/the API call".
    const [{ default: App }, { createRouter, createWebHashHistory }] = await Promise.all([
      import("./App.vue"),
      import("vue-router"),
    ]);
    const router = createRouter({
      history: createWebHashHistory(),
      routes: [{ path: "/", component: { render: () => h("div", { style: "padding:20px" }, "BARE 7: App.vue + router, placeholder route — OK") } }],
    });
    const app = createApp(App);
    app.config.errorHandler = (err, _instance, info) => {
      console.error("Vue error:", err, info);
      showFatalError(`${err}\ninfo: ${info}`);
    };
    app.use(router).mount("#app");
  } else if (bareLevel === "8") {
    // Real everything (App.vue + real router + real HomeView), but with
    // api.client's fetch call wrapped so a hang/throw there can't silently
    // blank the screen — logs progress into #app instead of calling
    // session.refresh()'s own (HomeView-internal) error path.
    const [{ default: App }, { default: router }, { api }] = await Promise.all([
      import("./App.vue"),
      import("./router"),
      import("./api/client"),
    ]);
    mountText("BARE 8: calling api.me()...", "#ff0");
    try {
      const me = await api.me();
      mountText("BARE 8: api.me() OK: " + JSON.stringify(me).slice(0, 200));
    } catch (e) {
      mountText("BARE 8: api.me() THREW: " + String(e), "#f88");
    }
    await new Promise((r) => setTimeout(r, 2000));
    const app = createApp(App);
    app.config.errorHandler = (err, _instance, info) => {
      console.error("Vue error:", err, info);
      showFatalError(`${err}\ninfo: ${info}`);
    };
    app.use(router).mount("#app");
  } else if (bareLevel === "9") {
    // Reproduce App.vue's EXACT sequence step by step, outside any SFC, with
    // a visible mountText after each step — pinpoints which single call
    // inside App.vue is the one that kills the screen. Order matches App.vue
    // precisely: all 3 composables created up front, then themeParams read,
    // then colorScheme read (never isolated before), THEN ready()+expand()
    // (App.vue defers these to onMounted, i.e. AFTER the theme reads, unlike
    // levels 3-5 which always called ready() first).
    const { useMiniApp, useTheme, useViewport } = await import("vue-tg/7.0");
    mountText("BARE 9: step1 - creating all 3 composables...", "#ff0");
    const miniApp = useMiniApp();
    const theme = useTheme();
    const viewport = useViewport();
    mountText("BARE 9: step2 - composables created OK, reading themeParams...", "#ff0");
    const params = theme.themeParams.value;
    mountText("BARE 9: step3 - themeParams OK: " + JSON.stringify(params).slice(0, 150), "#ff0");
    const scheme = theme.colorScheme.value;
    mountText("BARE 9: step4 - colorScheme OK: " + String(scheme), "#ff0");
    document.documentElement.dataset.colorScheme = scheme;
    mountText("BARE 9: step5 - dataset.colorScheme set OK, calling ready()...", "#ff0");
    miniApp.ready();
    mountText("BARE 9: step6 - ready() OK, calling expand()...", "#ff0");
    viewport.expand();
    mountText("BARE 9: step7 - expand() OK — ALL STEPS PASSED");
  } else if (bareLevel === "10") {
    // Level 9's exact logic (proven OK on real Telegram), but this time as a
    // real Vue component — mounted via a real router, rendering RouterView —
    // to isolate "the composable calls themselves" (level 9, passed) from
    // "the same calls made inside a component that gets mounted through the
    // router" (levels 6/7, both went black). Also adds the 7 setProperty
    // calls App.vue makes that level 9 never did.
    const { useMiniApp, useTheme, useViewport } = await import("vue-tg/7.0");
    const { defineComponent } = await import("vue");
    const { createRouter, createWebHashHistory, RouterView } = await import("vue-router");
    const TestApp = defineComponent({
      setup() {
        const miniApp = useMiniApp();
        const theme = useTheme();
        const viewport = useViewport();
        onMounted(() => {
          miniApp.ready();
          viewport.expand();
        });
        watchEffect(() => {
          const params = theme.themeParams.value;
          const root = document.documentElement;
          root.style.setProperty("--tg-bg-color", params.bg_color ?? "#ffffff");
          root.style.setProperty("--tg-text-color", params.text_color ?? "#111111");
          root.style.setProperty("--tg-hint-color", params.hint_color ?? "#999999");
          root.style.setProperty("--tg-link-color", params.link_color ?? "#2481cc");
          root.style.setProperty("--tg-button-color", params.button_color ?? "#2481cc");
          root.style.setProperty("--tg-button-text-color", params.button_text_color ?? "#ffffff");
          root.style.setProperty("--tg-secondary-bg-color", params.secondary_bg_color ?? "#f0f0f0");
          root.dataset.colorScheme = theme.colorScheme.value;
        });
        return () => h(RouterView);
      },
    });
    const router = createRouter({
      history: createWebHashHistory(),
      routes: [{ path: "/", component: { render: () => h("div", { style: "padding:20px" }, "BARE 10: inline component + router, RouterView — OK") } }],
    });
    const app = createApp(TestApp);
    app.config.errorHandler = (err, _instance, info) => {
      console.error("Vue error:", err, info);
      showFatalError(`${err}\ninfo: ${info}`);
    };
    app.use(router).mount("#app");
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

start().catch((err) => showFatalError(String(err) + "\n" + (err instanceof Error ? err.stack : "")));

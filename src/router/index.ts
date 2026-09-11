import { createRouter, createWebHistory } from "vue-router";

import { api } from "../api/client";
import HomeView from "../views/HomeView.vue";

// Real (path-based) history, NOT hash history — Telegram launches Mini Apps
// with its own launch params in the URL hash (#tgWebAppData=...), and hash
// history reads/writes that same location.hash for routing, so the two fight
// over it: the router tries to match Telegram's data blob as a route path,
// fails, and RouterView renders nothing (a real-Telegram-only black screen
// that never reproduces in a plain browser, since nothing appends that hash
// there). Path-based history only looks at location.pathname, leaving
// Telegram's hash alone.
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: HomeView },
    { path: "/learn", name: "learn", component: () => import("../views/LearnView.vue") },
    { path: "/drill", name: "drill", component: () => import("../views/DrillView.vue") },
    { path: "/exam", name: "exam", component: () => import("../views/ExamView.vue") },
    {
      path: "/exam/result",
      name: "exam-result",
      component: () => import("../views/ExamResultView.vue"),
    },
    { path: "/redeem", name: "redeem", component: () => import("../views/RedeemView.vue") },
    { path: "/profile", name: "profile", component: () => import("../views/ProfileView.vue") },
    { path: "/about", name: "about", component: () => import("../views/AboutView.vue") },
    { path: "/chat", name: "chat", component: () => import("../views/ChatView.vue") },
    { path: "/admin", name: "admin", component: () => import("../views/AdminView.vue") },
  ],
});

// Route name → app "section" as understood by the backend's
// section_visit_log (app/routers/me.py's ALLOWED_SECTIONS — keep in sync).
// "admin" is deliberately absent: the admin's own poking-around isn't a
// user-activity signal worth logging, same reasoning as excluding the
// admin's own visits from the analytics counters elsewhere.
const ROUTE_SECTION: Record<string, string> = {
  home: "menu",
  learn: "learn",
  drill: "drill",
  exam: "exam",
  "exam-result": "exam",
  redeem: "redeem",
  profile: "profile",
  about: "about",
  chat: "chat",
};

let lastTrackedSection: string | null = null;

router.afterEach((to) => {
  const section = ROUTE_SECTION[to.name as string];
  if (!section || section === lastTrackedSection) return;
  lastTrackedSection = section;
  // Fire-and-forget — a failed/slow tracking call must never block or
  // affect navigation.
  api.trackSection(section).catch(() => {});
});

export default router;

import { createRouter, createWebHistory } from "vue-router";

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
    { path: "/admin", name: "admin", component: () => import("../views/AdminView.vue") },
  ],
});

export default router;

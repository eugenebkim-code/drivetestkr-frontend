import { createRouter, createWebHashHistory } from "vue-router";

import HomeView from "../views/HomeView.vue";

// Hash history — same choice the prior vue-tg Mini App made, avoids
// Telegram's in-app browser back-navigation quirks with real history entries.
const router = createRouter({
  history: createWebHashHistory(),
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
    { path: "/admin", name: "admin", component: () => import("../views/AdminView.vue") },
  ],
});

export default router;

import { useMiniApp } from "vue-tg/7.0";

import type {
  AdminStatsOut,
  AdminUserOut,
  CheckinOut,
  DrillSessionOut,
  ExamFinishIn,
  ExamFinishOut,
  ExamStartOut,
  LearnSessionOut,
  LicenseRedeemOut,
  MeOut,
  ProfileOut,
} from "../types";

// Frontend and backend are separate Railway services/repos — set at build
// time (Vite bakes VITE_* vars in at `npm run build`, so this must be set
// in the frontend service's build environment, not just at runtime). Empty
// in local dev, where vite.config.ts's proxy forwards /api and /images to
// localhost:8000 instead.
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export function imageUrl(path: string | null): string | null {
  return path ? `${API_BASE}${path}` : null;
}

function authHeader(): Record<string, string> {
  const { initData } = useMiniApp();
  return { Authorization: `tma ${initData}` };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${path} failed: ${res.status} ${body}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  me: () => request<MeOut>("/api/me"),
  learnSession: () => request<LearnSessionOut>("/api/learn/session"),
  learnExhaust: () => request<{ ok: boolean }>("/api/learn/exhaust", { method: "POST" }),
  learnProgress: (questionId: string) =>
    request<{ ok: boolean }>("/api/learn/progress", {
      method: "POST",
      body: JSON.stringify({ question_id: questionId }),
    }),
  drillSession: () => request<DrillSessionOut>("/api/drill/session"),
  drillAnswer: (questionId: string, selectedLetters: string[]) =>
    request<{ ok: boolean }>("/api/drill/answer", {
      method: "POST",
      body: JSON.stringify({ question_id: questionId, selected_letters: selectedLetters }),
    }),
  examStart: () => request<ExamStartOut>("/api/exam/start", { method: "POST" }),
  examFinish: (body: ExamFinishIn) =>
    request<ExamFinishOut>("/api/exam/finish", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  licenseRedeem: (key: string) =>
    request<LicenseRedeemOut>("/api/license/redeem", {
      method: "POST",
      body: JSON.stringify({ key }),
    }),
  profile: () => request<ProfileOut>("/api/profile"),
  profileCheckin: () => request<CheckinOut>("/api/profile/checkin", { method: "POST" }),
  profileSetGoal: (dailyGoal: number) =>
    request<{ ok: boolean }>("/api/profile/goal", {
      method: "POST",
      body: JSON.stringify({ daily_goal: dailyGoal }),
    }),
  adminStats: () => request<AdminStatsOut>("/api/admin/stats"),
  adminUsers: () => request<AdminUserOut[]>("/api/admin/users"),
  adminMessageUser: (userId: number, text: string) =>
    request<{ ok: boolean }>(`/api/admin/users/${userId}/message`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  adminBroadcast: (text: string) =>
    request<{ ok: boolean; recipient_count: number }>("/api/admin/broadcast", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
};

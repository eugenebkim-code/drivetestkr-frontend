import { reactive } from "vue";

export type QuestionLang = "en" | "ru";

const STORAGE_KEY = "drivetestkr:question_lang";

function loadInitial(): QuestionLang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "ru") return stored;
  } catch {
    // localStorage unavailable (private mode, etc.) — fall back to default.
  }
  return "ru";
}

const state = reactive<{ lang: QuestionLang }>({ lang: loadInitial() });

function set(lang: QuestionLang) {
  state.lang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore — per-viewer convenience only, not critical state.
  }
}

function toggle() {
  set(state.lang === "ru" ? "en" : "ru");
}

export const language = { state, set, toggle };

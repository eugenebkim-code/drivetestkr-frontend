import { reactive } from "vue";

const STORAGE_KEY = "drivetestkr:anchors_enabled";

function loadInitial(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === "1";
  } catch {
    // localStorage unavailable — fall back to default.
  }
  return true;
}

const state = reactive<{ enabled: boolean }>({ enabled: loadInitial() });

function set(enabled: boolean) {
  state.enabled = enabled;
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // ignore — per-viewer convenience only.
  }
}

export const anchorsPref = { state, set };

import { reactive } from "vue";

import { api } from "../api/client";
import type { MeOut } from "../types";

// Module-level reactive singleton (same pattern as the old vue-tg app's cart
// store) — no Pinia needed for this small a surface.
const state = reactive<{
  me: MeOut | null;
  loading: boolean;
  error: string | null;
}>({
  me: null,
  loading: false,
  error: null,
});

async function refresh(): Promise<void> {
  state.loading = true;
  state.error = null;
  try {
    state.me = await api.me();
  } catch (e) {
    state.error = e instanceof Error ? e.message : String(e);
  } finally {
    state.loading = false;
  }
}

export const session = {
  state,
  refresh,
};

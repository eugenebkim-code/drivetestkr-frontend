import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  base: "/",
  server: {
    // Local dev only: forwards /api/* to the FastAPI dev server so `npm run
    // dev` doesn't need CORS. Production serves both from one origin (see
    // backend/app/main.py's StaticFiles mount).
    proxy: {
      "/api": "http://localhost:8000",
      "/images": "http://localhost:8000",
    },
  },
});

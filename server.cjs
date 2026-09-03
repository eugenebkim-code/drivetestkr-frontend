// Minimal production static server for the built SPA — same shape as the
// prior vue-tg app's server.cjs (proven Railway pattern): serves dist/,
// falls back to index.html for client-side routes, respects $PORT, binds
// 0.0.0.0, and exposes /health for Railway's health check.
const express = require("express");
const path = require("path");

const app = express();
const distDir = path.join(__dirname, "dist");

app.get("/health", (_req, res) => res.send("ok"));

// Hashed filenames under assets/ are immutable and safe to cache forever;
// index.html is not (it's what points at the current hashes) — force
// revalidation on every load so a stale cached shell can't reference JS
// chunks a later deploy has already removed (causes a hard client crash
// mid-navigation: "Cannot read properties of null (reading 'insertBefore')").
app.use(
  express.static(distDir, {
    index: false,
    setHeaders: (res, filePath) => {
      if (path.basename(filePath) === "index.html") {
        res.setHeader("Cache-Control", "no-store");
      }
    },
  }),
);

app.get("*", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.sendFile(path.join(distDir, "index.html"));
});

const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log(`serving ${distDir} on port ${port}`);
});

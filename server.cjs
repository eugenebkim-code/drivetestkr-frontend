// Minimal production static server for the built SPA — same shape as the
// prior vue-tg app's server.cjs (proven Railway pattern): serves dist/,
// falls back to index.html for client-side routes, respects $PORT, binds
// 0.0.0.0, and exposes /health for Railway's health check.
const express = require("express");
const path = require("path");

const app = express();
const distDir = path.join(__dirname, "dist");

app.get("/health", (_req, res) => res.send("ok"));

app.use(express.static(distDir));

app.get("*", (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log(`serving ${distDir} on port ${port}`);
});

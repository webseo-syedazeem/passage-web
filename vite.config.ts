import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

// Audit PR-1: a production build must FAIL loudly when the API origin is
// missing or obviously wrong, instead of succeeding and shipping a blank page
// (the runtime guard in src/lib/config.ts is the second line of defence).
function assertProductionApiBase(mode: string, value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(
      "VITE_API_BASE_URL is required for a build. Set it (e.g. in .env.production) to your backend origin.",
    );
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(`VITE_API_BASE_URL is not a valid URL: "${trimmed}"`);
  }
  if (mode === "production") {
    if (url.protocol !== "https:") {
      throw new Error(`VITE_API_BASE_URL must use https in production, got "${trimmed}".`);
    }
    if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(url.hostname)) {
      throw new Error(`VITE_API_BASE_URL must not point at localhost in production, got "${trimmed}".`);
    }
  }
}

export default defineConfig(({ command, mode }) => {
  if (command === "build") {
    const env = loadEnv(mode, process.cwd(), "");
    assertProductionApiBase(mode, env.VITE_API_BASE_URL);
  }
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    server: { port: 5000, strictPort: true },
  };
});

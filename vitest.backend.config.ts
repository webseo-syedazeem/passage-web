import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: {
    alias: {
      vitest: fileURLToPath(
        new URL("./node_modules/vitest/dist/index.js", import.meta.url),
      ),
    },
  },
  test: {
    include: ["../Backend local/tests/admin-refinement.test.ts"],
    fileParallelism: false,
    testTimeout: 15000,
  },
});

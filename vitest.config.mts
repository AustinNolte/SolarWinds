import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // Import shared from source so tests do not need `shared` built first.
      shared: path.resolve(import.meta.dirname, "shared/src/index.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["test/shared/**/*.test.ts", "test/server/**/*.test.ts"],
  },
});

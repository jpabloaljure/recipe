import { defineConfig } from "vitest/config";

// Two projects (ADR 0007):
// - unit: `pnpm test`, no database needed.
// - db: `pnpm test:db`, runs *.db.test.ts against a real Postgres. A global
//   setup builds a template database from the migrations, and every test file
//   gets its own copy (src/lib/db/test/).
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: ["**/node_modules/**", "**/*.db.test.ts"],
        },
      },
      {
        test: {
          name: "db",
          environment: "node",
          include: ["src/**/*.db.test.ts"],
          globalSetup: ["src/lib/db/test/global-setup.ts"],
          testTimeout: 30_000,
          hookTimeout: 30_000,
        },
      },
    ],
  },
});

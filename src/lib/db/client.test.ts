import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createAppDb, createDirectDb } from "./client";

// No database needed: these only check the settings are read and validated.
describe("database client settings", () => {
  const saved = { app: process.env.DATABASE_URL, direct: process.env.DATABASE_URL_DIRECT };

  beforeEach(() => {
    delete process.env.DATABASE_URL;
    delete process.env.DATABASE_URL_DIRECT;
  });

  afterEach(() => {
    if (saved.app === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = saved.app;
    if (saved.direct === undefined) delete process.env.DATABASE_URL_DIRECT;
    else process.env.DATABASE_URL_DIRECT = saved.direct;
  });

  test("the app client needs DATABASE_URL", () => {
    expect(() => createAppDb()).toThrow(/DATABASE_URL is not set/);
  });

  test("the direct client needs DATABASE_URL_DIRECT, not DATABASE_URL", () => {
    process.env.DATABASE_URL = "postgres://app_readonly@localhost/x";
    expect(() => createDirectDb()).toThrow(/DATABASE_URL_DIRECT is not set/);
  });

  test("an explicit URL is used instead of the environment", async () => {
    const client = createAppDb("postgres://app_readonly:x@localhost:1/none");
    await client.close();
  });

  test("getAppDb keeps one client across module reloads (hot reload in dev)", async () => {
    process.env.DATABASE_URL = "postgres://app_readonly:x@localhost:1/none"; // the pool connects lazily
    const global = globalThis as unknown as { appDbClient?: { close(): Promise<void> } };
    try {
      const first = (await import("./client")).getAppDb();
      vi.resetModules(); // what Next.js does on every hot reload
      const second = (await import("./client")).getAppDb();
      expect(second).toBe(first);
    } finally {
      await global.appDbClient?.close();
      delete global.appDbClient;
    }
  });
});

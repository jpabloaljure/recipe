import { afterEach, beforeEach, describe, expect, test } from "vitest";
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
});

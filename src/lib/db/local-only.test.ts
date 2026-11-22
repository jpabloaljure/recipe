import { afterEach, describe, expect, test } from "vitest";
import { ALLOW_NON_LOCAL, assertLocalDatabase } from "../../../scripts/db/local-only.mts";

// The guard that keeps the dev-only role password and the create/drop-database
// steps away from a real Postgres such as Neon.
describe("local database guard", () => {
  const saved = process.env[ALLOW_NON_LOCAL];

  afterEach(() => {
    if (saved === undefined) delete process.env[ALLOW_NON_LOCAL];
    else process.env[ALLOW_NON_LOCAL] = saved;
  });

  test.each([
    "postgres://postgres:postgres@localhost:54329/postgres",
    "postgres://postgres:postgres@127.0.0.1:5432/postgres",
    "postgres://postgres:postgres@[::1]:5432/postgres",
  ])("allows %s", (url) => {
    delete process.env[ALLOW_NON_LOCAL];
    expect(() => assertLocalDatabase(url, "TEST_DATABASE_URL")).not.toThrow();
  });

  test.each([
    "postgres://owner:secret@ep-cool-name-123456.eu-central-1.aws.neon.tech/neondb",
    "postgres://owner:secret@db.example.com:5432/app",
    "postgres://owner:secret@192.168.0.26:5432/app",
  ])("refuses %s", (url) => {
    delete process.env[ALLOW_NON_LOCAL];
    expect(() => assertLocalDatabase(url, "DATABASE_URL_DIRECT")).toThrow(/not this machine/);
  });

  test(`${ALLOW_NON_LOCAL}=1 allows a remote host on purpose`, () => {
    process.env[ALLOW_NON_LOCAL] = "1";
    expect(() => assertLocalDatabase("postgres://u:p@db.example.com/x", "TEST_DATABASE_URL")).not.toThrow();
  });
});

// A database of its own for one test file, copied from the template that the
// global setup built (ADR 0007).
import { Client } from "pg";
import { afterAll, beforeAll, inject } from "vitest";
import {
  READONLY_PASSWORD,
  READONLY_ROLE,
  UNREACHABLE_MESSAGE,
  adminUrl,
  fileDbName,
  templateName,
  urlAsRole,
  urlWithDatabase,
} from "./config";
import "./provided";

export type TestDatabase = {
  name: string;
  ownerUrl: string;
  readonlyUrl: string;
  /** A client connected as the owner (the role that runs the migrations). */
  connectOwner(): Promise<Client>;
  /** A client connected as `app_readonly`, the app's role. */
  connectReadonly(): Promise<Client>;
  /** Closes every client and drops the database. */
  drop(): Promise<void>;
};

export async function createTestDatabase(): Promise<TestDatabase> {
  const runId = inject("testRunId");
  const name = fileDbName(runId);
  const admin = new Client({ connectionString: adminUrl() });
  try {
    await admin.connect();
  } catch {
    throw new Error(UNREACHABLE_MESSAGE);
  }
  try {
    await admin.query(`CREATE DATABASE "${name}" TEMPLATE "${templateName(runId)}"`);
  } finally {
    await admin.end();
  }

  const ownerUrl = urlWithDatabase(adminUrl(), name);
  const readonlyUrl = urlAsRole(adminUrl(), READONLY_ROLE, READONLY_PASSWORD, name);
  const open: Client[] = [];

  const connect = async (connectionString: string): Promise<Client> => {
    const client = new Client({ connectionString });
    await client.connect();
    open.push(client);
    return client;
  };

  return {
    name,
    ownerUrl,
    readonlyUrl,
    connectOwner: () => connect(ownerUrl),
    connectReadonly: () => connect(readonlyUrl),
    async drop() {
      await Promise.all(open.map((client) => client.end().catch(() => {})));
      const cleaner = new Client({ connectionString: adminUrl() });
      await cleaner.connect();
      try {
        await cleaner.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
      } finally {
        await cleaner.end();
      }
    },
  };
}

/**
 * Gives the calling test file a database of its own: created before its tests
 * and dropped after them. Call it once at the top of the file and read the
 * database through the returned function inside hooks and tests.
 */
export function useTestDatabase(): () => TestDatabase {
  let current: TestDatabase | undefined;

  beforeAll(async () => {
    current = await createTestDatabase();
  });

  afterAll(async () => {
    await current?.drop();
  });

  return () => {
    if (!current) throw new Error("The test database is not ready yet: use it inside a hook or a test.");
    return current;
  };
}

// A database of its own for one test file, copied from the template that the
// global setup built (ADR 0007).
import { randomBytes } from "node:crypto";
import { Client } from "pg";
import {
  READONLY_PASSWORD,
  READONLY_ROLE,
  TEMPLATE_DB,
  TEST_DB_PREFIX,
  UNREACHABLE_MESSAGE,
  adminUrl,
  urlAsRole,
  urlWithDatabase,
} from "./config";

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
  const name = `${TEST_DB_PREFIX}${randomBytes(6).toString("hex")}`;
  const admin = new Client({ connectionString: adminUrl() });
  try {
    await admin.connect();
  } catch {
    throw new Error(UNREACHABLE_MESSAGE);
  }
  try {
    await admin.query(`CREATE DATABASE "${name}" TEMPLATE ${TEMPLATE_DB}`);
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

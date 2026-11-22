// What the two harness test files check: each file has a database of its own.
import { expect, test } from "vitest";
import { useTestDatabase } from "./test-database";

export function defineIsolationTests(label: string): void {
  const database = useTestDatabase();

  test(`harness › Each test file has its own database › ${label} sees only its own rows`, async () => {
    const client = await database().connectOwner();
    await client.query("CREATE TABLE probe (owner_label text NOT NULL)");
    await client.query("INSERT INTO probe VALUES ($1)", [label]);
    // The other file runs at the same time and writes its own label into a
    // table of the same name: a shared database would show two rows here.
    await new Promise((resolve) => setTimeout(resolve, 300));
    const { rows } = await client.query<{ owner_label: string }>("SELECT owner_label FROM probe");
    expect(rows).toEqual([{ owner_label: label }]);
  });

  test(`harness › The app's read-only role exists › ${label} can connect as app_readonly`, async () => {
    const client = await database().connectReadonly();
    const { rows } = await client.query<{ current_user: string }>("SELECT current_user");
    expect(rows[0].current_user).toBe("app_readonly");
  });
}

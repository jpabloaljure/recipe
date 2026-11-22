// Safety guard for the scripts and tests that create roles with the dev-only
// password or create and drop databases: they must only ever run against a
// local (or CI service) Postgres, never a real one such as Neon.
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export const ALLOW_NON_LOCAL = "ALLOW_NON_LOCAL_DATABASE";

/** Throws unless `url` points at this machine, or the override variable is set to 1. */
export function assertLocalDatabase(url: string, what: string): void {
  if (process.env[ALLOW_NON_LOCAL] === "1") return;
  const host = new URL(url).hostname;
  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(
      `${what} points at "${host}", which is not this machine. This step creates roles with a ` +
        "dev-only password and creates and drops databases, so it only runs against a local " +
        `Postgres (pnpm db:up). Set ${ALLOW_NON_LOCAL}=1 only if you are sure.`,
    );
  }
}

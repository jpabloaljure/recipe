// Values the global setup hands to every test file (vitest `provide` / `inject`).
declare module "vitest" {
  export interface ProvidedContext {
    /** Identifies one `pnpm test:db` run, so two runs on one cluster never share names. */
    testRunId: string;
  }
}

export {};

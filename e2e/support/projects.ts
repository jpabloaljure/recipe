import { test } from "./test";

/** Playwright projects (playwright.config.ts). All run Chromium (ADR 0006). */
export const PROJECTS = ["phone-portrait", "phone-landscape", "desktop"] as const;
export type ProjectName = (typeof PROJECTS)[number];

/**
 * Limits the current test to the projects its scenario applies to
 * (AGENTS.md E2E rule 8). Call it first thing in the test body.
 */
export function onlyOn(...projects: ProjectName[]): void {
  const current = test.info().project.name as ProjectName;
  test.skip(!projects.includes(current), `Scenario applies only to: ${projects.join(", ")}`);
}

import { expect, test } from "../support/test";

// Throwaway: deliberately fails to check that CI blocks the merge and uploads
// the Playwright report (OpenSpec add-e2e-testing task 5.1). Never merge.
test("ci check › deliberate failure › fails", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("This title does not exist");
});

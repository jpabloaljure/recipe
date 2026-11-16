import { describe, expect, it } from "vitest";
import { pageTitle, SITE_NAME } from "./site";

describe("pageTitle", () => {
  it("returns the site name when no page is given", () => {
    expect(pageTitle()).toBe(SITE_NAME);
  });

  it("prefixes the page name", () => {
    expect(pageTitle("Favorites")).toBe("Favorites · Easy Recipes");
  });

  it("ignores a blank page name", () => {
    expect(pageTitle("   ")).toBe(SITE_NAME);
  });
});

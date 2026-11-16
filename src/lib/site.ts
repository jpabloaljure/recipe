export const SITE_NAME = "Easy Recipes";

/** Browser tab title: the site name, optionally prefixed by a page name. */
export function pageTitle(page?: string): string {
  const name = page?.trim();
  return name ? `${name} · ${SITE_NAME}` : SITE_NAME;
}

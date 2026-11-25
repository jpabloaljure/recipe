import { catalog, openFeed, recipe, scrollToSlide, videosWithRecipes } from "../support/feed";
import { activeVideoId } from "../support/player";
import { onlyOn } from "../support/projects";
import { expect, test } from "../support/test";

const withRoom = () => onlyOn("desktop", "phone-landscape");

test("recipe-panel › The panel shows the recipe's content › The recipe is shown", async ({ page }) => {
  withRoom();

  await openFeed(page, catalog(videosWithRecipes(3), 3));

  // The feed shuffles each page, so the first video is not always video1.
  const number = (await activeVideoId(page)).replace("video", "");
  const panel = page.getByTestId("recipe-panel");
  await expect(panel.getByText("Servings: 4")).toBeVisible();
  await expect(panel.getByRole("list").first().getByRole("listitem")).toHaveText(["2 cups flour", "1 cup water", "salt"]);
  await expect(panel.getByRole("list").nth(1).getByRole("listitem")).toHaveText([
    `Recipe of video ${number}.`,
    "Rest the dough for ten minutes.",
    "Cook until golden.",
  ]);
});

test("recipe-panel › The panel shows the recipe's content › No extra request", async ({ page }) => {
  withRoom();
  await openFeed(page, catalog(videosWithRecipes(3), 3));
  const requests: string[] = [];
  page.on("request", (request) => requests.push(new URL(request.url()).pathname));

  await scrollToSlide(page, 1);

  await expect(page.getByTestId("recipe-body")).toHaveAttribute("data-youtube-id", await activeVideoId(page));
  expect(requests.filter((path) => path.startsWith("/api/"))).toEqual([]);
});

test("recipe-panel › The panel shows the recipe's content › A missing serving size or quantity", async ({ page }) => {
  withRoom();
  const missing = recipe({
    servings: null,
    ingredients: [
      { name: "salt", quantity: null, unit: null },
      { name: "eggs", quantity: "2", unit: null },
      { name: "flour", quantity: null, unit: "cups" },
    ],
  });

  await openFeed(page, catalog(videosWithRecipes(3, () => missing), 3));

  const panel = page.getByTestId("recipe-panel");
  await expect(panel.getByText("Servings")).toHaveCount(0);
  await expect(panel.getByRole("list").first().getByRole("listitem")).toHaveText(["salt", "2 eggs", "cups flour"]);
});

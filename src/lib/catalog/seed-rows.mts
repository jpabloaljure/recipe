// Fixture videos for local development and CI (REC-002, design D7). The pure
// part of `scripts/db/seed.mts`: it only builds rows, so a unit test can check
// them without a database. The IDs are made up and never real YouTube videos.
//
// A group is inserted in ONE transaction, so its videos share the same
// feed-entry time (the database sets it from the transaction's clock): that is
// how the seed makes ties. Separate groups are separate transactions, so they
// get increasing times: that is how the seed makes an order.

export type SeedStatus = "ready" | "needs_recipe" | "not_easy" | "unavailable" | "rejected";

export type SeedRecipe = {
  servings: string | null;
  ingredients: { name: string; quantity: string | null; unit: string | null }[];
  steps: string[];
  source: "description" | "comment" | "captions";
  ingredientCount: number;
  estimatedActiveMinutes: number;
  specialEquipment: string[];
};

export type SeedVideo = {
  youtubeId: string;
  title: string;
  channelId: string;
  channelName: string;
  durationSeconds: number;
  embeddable: boolean;
  language: string;
  status: SeedStatus;
  /** Only `ready` videos have a recipe. */
  recipe?: SeedRecipe;
};

/** Videos inserted together in one transaction (same feed-entry time). */
export type SeedGroup = SeedVideo[];

const pancakeRecipe: SeedRecipe = {
  servings: "2",
  ingredients: [
    { name: "banana", quantity: "1", unit: null },
    { name: "egg", quantity: "2", unit: null },
  ],
  steps: ["Mash the banana.", "Whisk in the eggs.", "Fry small rounds until golden."],
  source: "description",
  ingredientCount: 2,
  estimatedActiveMinutes: 10,
  specialEquipment: [],
};

function video(n: number, status: SeedStatus, recipe?: SeedRecipe): SeedVideo {
  const label = String(n).padStart(2, "0");
  return {
    youtubeId: `SEEDVIDEO${label}`,
    title: `Seed ${status} video ${label}`,
    channelId: `UCseedchannel${label}`,
    channelName: `Seed Channel ${label}`,
    durationSeconds: 45,
    embeddable: true,
    language: "en",
    status,
    ...(recipe ? { recipe } : {}),
  };
}

/**
 * 11 feed videos (two pages of 10): a tied group of three `needs_recipe`, a
 * tied group of two `ready` with recipes, six singles, and one video of each
 * status outside the feed.
 */
export function buildSeedGroups(): SeedGroup[] {
  return [
    [video(1, "needs_recipe"), video(2, "needs_recipe"), video(3, "needs_recipe")],
    [video(4, "ready", pancakeRecipe), video(5, "ready", pancakeRecipe)],
    [video(6, "needs_recipe")],
    [video(7, "ready", pancakeRecipe)],
    [video(8, "needs_recipe")],
    [video(9, "needs_recipe")],
    [video(10, "ready", pancakeRecipe)],
    [video(11, "needs_recipe")],
    [video(12, "not_easy")],
    [video(13, "unavailable")],
    [video(14, "rejected")],
  ];
}

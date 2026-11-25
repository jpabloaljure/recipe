import type { Recipe } from "../../lib/feed/types";
import { ingredientLine, servingsText, sourceLabel, videoUrl } from "../../lib/feed/recipe-text";
import styles from "./RecipePanel.module.css";

type Props = {
  /** The active video's YouTube ID, or `null` while no video is active. */
  youtubeId: string | null;
  /** The active video's recipe; `null` for a title-only video. */
  recipe: Recipe | null;
};

/**
 * The recipe panel (REC-006, change add-recipe-panel). One panel next to the
 * feed's scroll container, not one per slide, so a wheel or touch over it can
 * only scroll the panel (design Decision 1). Where it is shown is a CSS rule on
 * the room beside the video (Decision 2); here it only holds the content. The
 * body is keyed by the video, so a new active video mounts a new body, scrolled
 * to the top, in the same render as `data-active` (Decision 4).
 */
export function RecipePanel({ youtubeId, recipe }: Props) {
  const servings = recipe ? servingsText(recipe.servings) : null;
  return (
    <aside className={styles.panel} aria-label="Recipe" data-testid="recipe-panel" hidden={recipe === null || youtubeId === null}>
      {recipe && youtubeId && (
        <div key={youtubeId} className={styles.body} data-testid="recipe-body" data-youtube-id={youtubeId}>
          {servings && <p className={styles.servings}>{servings}</p>}
          <h2 className={styles.heading}>Ingredients</h2>
          <ul className={styles.list}>
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index}>{ingredientLine(ingredient)}</li>
            ))}
          </ul>
          <h2 className={styles.heading}>Steps</h2>
          <ol className={styles.list}>
            {recipe.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
          <p className={styles.source}>
            {sourceLabel(recipe.source)} ·{" "}
            <a href={videoUrl(youtubeId)} target="_blank" rel="noopener noreferrer">
              Open on YouTube
            </a>
          </p>
        </div>
      )}
    </aside>
  );
}

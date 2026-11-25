import type { Recipe } from "../../lib/feed/types";
import { ingredientLine, servingsText, sourceLabel, videoUrl } from "../../lib/feed/recipe-text";
import styles from "./RecipeContent.module.css";

/**
 * The recipe's content, shared by the panel (REC-006) and the sheet (REC-022,
 * change add-recipe-sheet, design Decision 5): servings, ingredients, numbered
 * steps, and the source label with a link to the original video. A missing
 * serving size, quantity or unit is left out (`recipe-text.ts`).
 */
export function RecipeContent({ recipe, youtubeId }: { recipe: Recipe; youtubeId: string }) {
  const servings = servingsText(recipe.servings);
  return (
    <>
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
    </>
  );
}

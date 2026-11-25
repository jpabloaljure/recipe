import type { Recipe } from "../../lib/feed/types";
import { RecipeContent } from "./RecipeContent";
import styles from "./RecipeSheet.module.css";

type Props = {
  open: boolean;
  /** The active video's YouTube ID, or `null` while no video is active. */
  youtubeId: string | null;
  /** The active video's recipe; `null` for a title-only video. */
  recipe: Recipe | null;
  onClose: () => void;
};

/**
 * The recipe sheet (REC-022, change add-recipe-sheet). Like the panel it is next
 * to the feed's scroll container, not inside a slide, so a swipe on it can only
 * scroll the sheet and never chain to the feed (design Decision 1). It is only
 * rendered while open, so each opening mounts a new body, scrolled to the top
 * (Decision 4). CSS places it over the video, between the player's control
 * zones, and hides it where the panel is shown (Decisions 2 and 3).
 */
export function RecipeSheet({ open, youtubeId, recipe, onClose }: Props) {
  if (!open || !recipe || !youtubeId) return null;
  return (
    <section className={styles.sheet} aria-label="Recipe" data-testid="recipe-sheet">
      <button type="button" className={styles.close} aria-label="Close recipe" data-testid="recipe-sheet-close" onClick={onClose}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
          <path fill="currentColor" d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6z" />
        </svg>
      </button>
      <div className={styles.body} data-testid="recipe-sheet-body" data-youtube-id={youtubeId}>
        <RecipeContent recipe={recipe} youtubeId={youtubeId} />
      </div>
    </section>
  );
}

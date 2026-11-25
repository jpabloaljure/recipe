import type { Recipe } from "../../lib/feed/types";
import { RecipeContent } from "./RecipeContent";
import styles from "./RecipePanel.module.css";

type Props = {
  /** The active slide's key (cycle plus video), so a repeated video still resets the scroll. */
  slideKey: string | null;
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
 * body is keyed by the slide, so a new active slide mounts a new body, scrolled
 * to the top, in the same render as `data-active` (Decision 4).
 */
export function RecipePanel({ slideKey, youtubeId, recipe }: Props) {
  return (
    <aside className={styles.panel} aria-label="Recipe" data-testid="recipe-panel" hidden={recipe === null || youtubeId === null || slideKey === null}>
      {recipe && youtubeId && slideKey && (
        <div key={slideKey} className={styles.body} data-testid="recipe-body" data-youtube-id={youtubeId}>
          <RecipeContent recipe={recipe} youtubeId={youtubeId} />
        </div>
      )}
    </aside>
  );
}

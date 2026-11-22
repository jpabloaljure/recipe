-- The database alone decides when a video entered the feed (REC-019,
-- docs/architecture/data-model.md Rule 2, spec: video-catalog). The rules hold
-- for every writer: the ingestion job, a script, or a maintainer in the console.
--
--   in the feed  = status is 'ready' or 'needs_recipe'
--   INSERT       entered_feed_at := now() for a video inserted into the feed,
--                NULL otherwise; any value the writer sent is overwritten.
--   UPDATE       a video that moves into the feed from outside it gets
--                now(), whatever the update sent; any other change to
--                entered_feed_at, including clearing it, is rejected.
--   `rejected`   is only for first-time candidates: it can be set on insert,
--                and no update may change a status to or from it.
CREATE FUNCTION video_feed_rules() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  was_in_feed boolean;
  now_in_feed boolean := NEW.status IN ('ready', 'needs_recipe');
  -- Truncated, not rounded, to the column's millisecond precision, so a stored
  -- time is never ahead of the clock.
  feed_time timestamptz := date_trunc('milliseconds', now());
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.entered_feed_at := CASE WHEN now_in_feed THEN feed_time ELSE NULL END;
    RETURN NEW;
  END IF;

  IF (OLD.status = 'rejected') <> (NEW.status = 'rejected') THEN
    RAISE EXCEPTION 'A video cannot change status to or from rejected (video %)', OLD.id;
  END IF;

  was_in_feed := OLD.status IN ('ready', 'needs_recipe');
  IF NOT was_in_feed AND now_in_feed THEN
    NEW.entered_feed_at := feed_time;
  ELSIF NEW.entered_feed_at IS DISTINCT FROM OLD.entered_feed_at THEN
    RAISE EXCEPTION 'entered_feed_at is set by the database and cannot be changed (video %)', OLD.id;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER video_feed_rules BEFORE INSERT OR UPDATE ON video
  FOR EACH ROW EXECUTE FUNCTION video_feed_rules();
--> statement-breakpoint
-- A video in the feed always has its time. The trigger above runs first, so
-- this only fails if the trigger is missing or bypassed.
ALTER TABLE video ADD CONSTRAINT video_feed_time_required
  CHECK (status NOT IN ('ready', 'needs_recipe') OR entered_feed_at IS NOT NULL);

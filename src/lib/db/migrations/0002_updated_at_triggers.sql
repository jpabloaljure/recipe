-- The database keeps `updated_at` on every update of a video or a recipe,
-- however the update is made (the app, a script, or a maintainer in the
-- console), and ignores any value the writer sends for it (REC-019, spec:
-- video-catalog). `created_at` is the column default (now()).
CREATE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER video_updated_at BEFORE UPDATE ON video
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER recipe_updated_at BEFORE UPDATE ON recipe
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

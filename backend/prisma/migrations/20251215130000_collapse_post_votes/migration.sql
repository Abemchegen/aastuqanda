-- Collapse upvotes/downvotes into single votes column
-- 1) Add new column
ALTER TABLE "Post" ADD COLUMN "votes" INTEGER NOT NULL DEFAULT 0;

-- 2) Backfill from existing columns if they exist
-- Note: If columns don't exist (fresh DB), this UPDATE will still run but have no effect
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Post' AND column_name = 'upvotes'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Post' AND column_name = 'downvotes'
  ) THEN
    EXECUTE 'UPDATE "Post" SET "votes" = COALESCE("upvotes",0) - COALESCE("downvotes",0)';
  END IF;
END $$;

-- 3) Drop old columns if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Post' AND column_name = 'upvotes'
  ) THEN
    EXECUTE 'ALTER TABLE "Post" DROP COLUMN "upvotes"';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Post' AND column_name = 'downvotes'
  ) THEN
    EXECUTE 'ALTER TABLE "Post" DROP COLUMN "downvotes"';
  END IF;
END $$;

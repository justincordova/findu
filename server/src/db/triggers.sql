-- Function to handle cleanup when a block is created
CREATE OR REPLACE FUNCTION handle_block()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete likes in both directions
  DELETE FROM likes
  WHERE (from_user = NEW.blocker_id AND to_user = NEW.blocked_id)
     OR (from_user = NEW.blocked_id AND to_user = NEW.blocker_id);

  -- Delete match if exists
  -- We check both permutations to be safe, though matches usually enforce order
  DELETE FROM matches
  WHERE (user1 = NEW.blocker_id AND user2 = NEW.blocked_id)
     OR (user1 = NEW.blocked_id AND user2 = NEW.blocker_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- SPLIT --

-- Trigger for blocks
DROP TRIGGER IF EXISTS on_block_cleanup ON blocks;
CREATE TRIGGER on_block_cleanup
AFTER INSERT ON blocks
FOR EACH ROW EXECUTE FUNCTION handle_block();

-- SPLIT --

-- Function to create match on mutual like
CREATE OR REPLACE FUNCTION create_match_on_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's a mutual like
  IF EXISTS (
    SELECT 1 FROM likes
    WHERE from_user = NEW.to_user
    AND to_user = NEW.from_user
  ) THEN
    -- Create match (ensuring user1 < user2)
    -- We use gen_random_uuid() for ID since Prisma's CUID is client-side
    INSERT INTO matches (id, user1, user2, matched_at, created_at, updated_at)
    VALUES (
      gen_random_uuid()::text,
      LEAST(NEW.from_user, NEW.to_user),
      GREATEST(NEW.from_user, NEW.to_user),
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- SPLIT --

-- Trigger for likes
DROP TRIGGER IF EXISTS on_like_create_match ON likes;
CREATE TRIGGER on_like_create_match
AFTER INSERT ON likes
FOR EACH ROW EXECUTE FUNCTION create_match_on_mutual_like();

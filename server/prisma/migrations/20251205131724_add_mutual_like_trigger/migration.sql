-- Create function
CREATE OR REPLACE FUNCTION create_match_on_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if reciprocal like exists
  IF EXISTS (
    SELECT 1 FROM likes
    WHERE from_user = NEW.to_user
    AND to_user = NEW.from_user
    AND id != NEW.id
  ) THEN
    -- Insert match if not exists
    INSERT INTO matches (user1, user2, matched_at, created_at, updated_at)
    VALUES (
      LEAST(NEW.from_user, NEW.to_user),
      GREATEST(NEW.from_user, NEW.to_user),
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (user1, user2) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER on_mutual_like_trigger
AFTER INSERT ON likes
FOR EACH ROW
EXECUTE FUNCTION create_match_on_mutual_like();
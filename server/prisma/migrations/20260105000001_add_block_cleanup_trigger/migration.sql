-- Create function to clean up likes and matches when a user is blocked
CREATE OR REPLACE FUNCTION on_block_cleanup()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete mutual likes between blocked users
  DELETE FROM likes
  WHERE (from_user = NEW.blocker_id AND to_user = NEW.blocked_id)
     OR (from_user = NEW.blocked_id AND to_user = NEW.blocker_id);

  -- Delete match record between blocked users
  DELETE FROM matches
  WHERE (user1 = NEW.blocker_id AND user2 = NEW.blocked_id)
     OR (user1 = NEW.blocked_id AND user2 = NEW.blocker_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to execute on block creation
CREATE TRIGGER on_block_cleanup_trigger
AFTER INSERT ON blocks
FOR EACH ROW
EXECUTE FUNCTION on_block_cleanup();

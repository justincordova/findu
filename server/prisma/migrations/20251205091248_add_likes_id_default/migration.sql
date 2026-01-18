-- Add DEFAULT to likes.id column
ALTER TABLE likes
ALTER COLUMN id SET DEFAULT gen_random_uuid();

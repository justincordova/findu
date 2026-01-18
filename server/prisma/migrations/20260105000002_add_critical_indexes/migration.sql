-- Add critical indexes on high-query fields in profiles table
-- These are heavily used in discovery queries and should be indexed for O(1) lookup
CREATE INDEX idx_profiles_university_id ON profiles(university_id);
CREATE INDEX idx_profiles_campus_id ON profiles(campus_id);

-- Add separate indexes on match user fields for efficient user lookups
-- Currently only have unique constraint, but separate indexes improve query performance
CREATE INDEX idx_matches_user1 ON matches(user1);
CREATE INDEX idx_matches_user2 ON matches(user2);

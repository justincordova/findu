-- Migration to rename user_profiles to profiles and add username field

-- Step 1: Add username column to user_profiles table
ALTER TABLE user_profiles ADD COLUMN username TEXT UNIQUE;

-- Step 2: Rename user_profiles table to profiles
ALTER TABLE user_profiles RENAME TO profiles;

-- Step 3: Update all foreign key references
-- (These will be handled by RLS policies since we're using Supabase Auth)

-- Step 4: Update indexes (if any exist)
-- Note: Index names might need to be updated depending on your current setup 
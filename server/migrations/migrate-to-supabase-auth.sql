-- Migration script to switch from custom users table to Supabase Auth
-- Run this script after backing up your data

-- Step 1: Drop foreign key constraints that reference the custom users table
ALTER TABLE blocks DROP CONSTRAINT IF EXISTS blocks_blocker_id_fkey;
ALTER TABLE blocks DROP CONSTRAINT IF EXISTS blocks_blocked_id_fkey;

ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_from_user_fkey;
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_to_user_fkey;

ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_user1_fkey;
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_user2_fkey;

ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;

ALTER TABLE donations DROP CONSTRAINT IF EXISTS donations_user_id_fkey;

ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_sender_id_fkey;

-- Step 2: Drop the custom users table
DROP TABLE IF EXISTS users CASCADE;

-- Step 3: Add foreign key constraints that reference Supabase's auth.users table
-- Note: These will be enforced by Supabase RLS policies rather than database constraints
-- since auth.users is in a different schema

-- Step 4: Create RLS policies for Supabase Auth integration
-- (These will be created in the next step via Supabase dashboard or API)

-- Step 5: Update any remaining references to use auth.users
-- The user_id fields will now reference auth.users.id instead of the custom users.id 
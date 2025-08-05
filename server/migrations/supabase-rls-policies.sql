-- Supabase RLS Policies for FindU
-- Run this after setting up Supabase Auth

-- Enable RLS on all tables
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Blocks Policies
CREATE POLICY "Users can view blocks they created" ON blocks
  FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create blocks" ON blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks" ON blocks
  FOR DELETE USING (auth.uid() = blocker_id);

-- Likes Policies
CREATE POLICY "Users can view their own likes" ON likes
  FOR SELECT USING (auth.uid() = from_user);

CREATE POLICY "Users can view likes they received" ON likes
  FOR SELECT USING (auth.uid() = to_user);

CREATE POLICY "Users can create likes" ON likes
  FOR INSERT WITH CHECK (auth.uid() = from_user);

CREATE POLICY "Users can delete their own likes" ON likes
  FOR DELETE USING (auth.uid() = from_user);

-- Matches Policies
CREATE POLICY "Users can view their matches" ON matches
  FOR SELECT USING (auth.uid() = user1 OR auth.uid() = user2);

CREATE POLICY "System can create matches" ON matches
  FOR INSERT WITH CHECK (true);

-- Chats Policies
CREATE POLICY "Users can view chats in their matches" ON chats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = chats.match_id 
      AND (matches.user1 = auth.uid() OR matches.user2 = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their matches" ON chats
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = chats.match_id 
      AND (matches.user1 = auth.uid() OR matches.user2 = auth.uid())
    )
  );

-- Subscriptions Policies
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Donations Policies
CREATE POLICY "Users can view their own donations" ON donations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own donations" ON donations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Campuses Policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view campuses" ON campuses
  FOR SELECT USING (auth.role() = 'authenticated'); 
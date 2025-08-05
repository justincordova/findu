# Migration Guide: Custom Users → Supabase Auth

## Overview

This guide will help you migrate from your custom users table to Supabase Auth while maintaining your OTP email verification flow.

## Prerequisites

1. Backup your current database
2. Ensure Supabase is properly configured
3. Have your Supabase URL and anon key ready

## Step 1: Backup Current Data

```sql
-- Create backup of current users and their profiles
CREATE TABLE users_backup AS SELECT * FROM users;
CREATE TABLE user_profiles_backup AS SELECT * FROM user_profiles;
```

## Step 2: Run Database Migration

Execute the migration script:

```bash
psql -d your_database -f migrations/migrate-to-supabase-auth.sql
```

## Step 3: Apply RLS Policies

Execute the RLS policies:

```bash
psql -d your_database -f migrations/supabase-rls-policies.sql
```

## Step 4: Update Environment Variables

Add these to your `.env` files:

### Server (.env)

```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FRONTEND_URL=http://localhost:3000
```

### Client (.env)

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Step 5: Update Supabase Configuration

1. Go to your Supabase dashboard
2. Navigate to Authentication > Settings
3. Configure email templates for OTP
4. Set up redirect URLs for password reset

## Step 6: Test the Migration

1. Test OTP signup flow
2. Test login flow
3. Test protected routes
4. Verify user profiles are created correctly

## Step 7: Clean Up (After Testing)

```sql
-- Only run after confirming everything works
DROP TABLE users_backup;
DROP TABLE user_profiles_backup;
```

## Key Changes Made

### Database Schema

- Removed custom `users` table
- Updated foreign key references to use `auth.users`
- Added RLS policies for security

### Authentication Flow

- OTP verification now uses Supabase Auth
- Login uses Supabase Auth instead of custom JWT
- Session management handled by Supabase

### API Changes

- `/auth/login` now returns Supabase session
- `/auth/signup` creates user profile after OTP verification
- All protected routes use Supabase session tokens

### Client Changes

- Auth store now manages Supabase sessions
- API calls include Supabase access tokens
- User type updated to use Supabase User

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**: Ensure policies are applied correctly
2. **Session Validation**: Check that tokens are being passed correctly
3. **Profile Creation**: Verify user_id matches auth.users.id

### Debug Steps

1. Check Supabase logs for auth errors
2. Verify RLS policies are working
3. Test with Supabase dashboard
4. Check network requests in browser dev tools

## Rollback Plan

If issues arise, you can rollback by:

1. Restoring the backup tables
2. Reverting the schema changes
3. Switching back to custom auth controllers

# Auth Configuration

This document describes the authentication configuration options available in the FindU app.

## Environment Variables

Create a `.env` file in the client directory with the following variables:

### Required Variables
```bash
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3000

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Optional Auth Configuration
```bash
# Token Expiration Settings (in seconds)
EXPO_PUBLIC_ACCESS_TOKEN_EXPIRY=3600      # 1 hour (default)
EXPO_PUBLIC_REFRESH_TOKEN_EXPIRY=604800   # 7 days (default)
EXPO_PUBLIC_SESSION_EXPIRY=2592000        # 30 days (default)

# Auto-refresh Settings
EXPO_PUBLIC_AUTO_REFRESH_THRESHOLD=300    # 5 minutes (default)
EXPO_PUBLIC_AUTO_REFRESH_ENABLED=true     # true (default)

# Security Settings
EXPO_PUBLIC_CLEAR_TOKENS_ON_BACKGROUND=true  # true (default)
EXPO_PUBLIC_REQUIRE_BIOMETRIC=false          # false (default)
```

## Configuration Details

### Token Expiration
- **ACCESS_TOKEN_EXPIRY**: How long the access token is valid before it needs to be refreshed
- **REFRESH_TOKEN_EXPIRY**: How long the refresh token is valid before the user needs to log in again
- **SESSION_EXPIRY**: Maximum lifetime of the entire session

### Auto-refresh
- **AUTO_REFRESH_THRESHOLD**: How many seconds before expiration to automatically refresh the token
- **AUTO_REFRESH_ENABLED**: Whether to enable automatic token refresh

### Security
- **CLEAR_TOKENS_ON_BACKGROUND**: Whether to clear sensitive data when the app goes to background
- **REQUIRE_BIOMETRIC**: Whether to require biometric authentication for sensitive operations

## Usage Examples

### Basic Configuration
```bash
# Minimal configuration with defaults
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Custom Token Expiration
```bash
# Custom token expiration times
EXPO_PUBLIC_ACCESS_TOKEN_EXPIRY=1800      # 30 minutes
EXPO_PUBLIC_REFRESH_TOKEN_EXPIRY=2592000  # 30 days
EXPO_PUBLIC_SESSION_EXPIRY=7776000        # 90 days
```

### High Security Configuration
```bash
# High security settings
EXPO_PUBLIC_ACCESS_TOKEN_EXPIRY=900       # 15 minutes
EXPO_PUBLIC_AUTO_REFRESH_THRESHOLD=60     # 1 minute warning
EXPO_PUBLIC_CLEAR_TOKENS_ON_BACKGROUND=true
EXPO_PUBLIC_REQUIRE_BIOMETRIC=true
```

## Implementation Notes

- All expiration times are in seconds
- The app automatically handles token refresh when enabled
- Secure storage is used for all sensitive data
- App state changes are monitored for security
- Failed token refresh results in automatic logout
